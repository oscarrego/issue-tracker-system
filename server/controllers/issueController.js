const Issue = require("../models/Issue");
const User = require("../models/User");
const Project = require("../models/Project");
const Activity = require("../models/Activity");

const populateIssue = (query) =>
  query
    .populate("assignedTo", "name email avatar")
    .populate("createdBy", "name email avatar")
    .populate("project", "name status");

const populateIssueDoc = (issue) =>
  issue.populate([
    { path: "assignedTo", select: "name email avatar" },
    { path: "createdBy", select: "name email avatar" },
    { path: "project", select: "name status" },
  ]);

const normalizeLabels = (labels) => {
  if (!labels) return [];
  const list = Array.isArray(labels) ? labels : String(labels).split(",");
  return [...new Set(list.map((label) => String(label).trim().toLowerCase()).filter(Boolean))];
};

const buildIssueFilter = (query) => {
  const { status, assignedTo, assignee, createdBy, search, priority, project, labels } = query;
  const filter = {};

  if (status) filter.status = status;
  if (assignedTo || assignee) filter.assignedTo = assignedTo || assignee;
  if (createdBy) filter.createdBy = createdBy;
  if (priority) filter.priority = priority;
  if (project === "none") filter.project = null;
  else if (project) filter.project = project;

  const cleanLabels = normalizeLabels(labels);
  if (cleanLabels.length > 0) filter.labels = { $all: cleanLabels };

  if (search) {
    const term = String(search).trim();
    filter.$or = [
      { title: { $regex: term, $options: "i" } },
      { description: { $regex: term, $options: "i" } },
      { labels: { $regex: term, $options: "i" } },
    ];
  }

  return filter;
};

const addActivity = async ({ issue, user, type, message, from = "", to = "", comment = null }) => {
  await Activity.create({ issue, user, type, message, from, to, comment });
};

const labelDiff = (before = [], after = []) => {
  const oldSet = new Set(before);
  const newSet = new Set(after);
  return {
    added: [...newSet].filter((label) => !oldSet.has(label)),
    removed: [...oldSet].filter((label) => !newSet.has(label)),
  };
};

const dateLabel = (date) => date ? new Date(date).toISOString().slice(0, 10) : "No due date";

const validateReferences = async ({ assignedTo, project }) => {
  if (assignedTo) {
    const assignee = await User.findById(assignedTo);
    if (!assignee) return "Assigned user not found";
  }
  if (project) {
    const existingProject = await Project.findById(project);
    if (!existingProject) return "Project not found";
  }
  return "";
};

const getIssues = async (req, res) => {
  try {
    const issues = await populateIssue(Issue.find(buildIssueFilter(req.query))).sort({ createdAt: -1 });
    res.json({ issues });
  } catch (error) {
    console.error("Get issues error:", error);
    res.status(500).json({ message: "Server error fetching issues" });
  }
};

const getIssueById = async (req, res) => {
  try {
    const issue = await populateIssue(Issue.findById(req.params.id));

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json({ issue });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Issue not found" });
    }
    console.error("Get issue error:", error);
    res.status(500).json({ message: "Server error fetching issue" });
  }
};

const createIssue = async (req, res) => {
  try {
    const { title, description, status, assignedTo, priority, labels, dueDate, project } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const referenceError = await validateReferences({ assignedTo, project });
    if (referenceError) return res.status(400).json({ message: referenceError });

    const issue = await Issue.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      status: status || "Open",
      priority: priority || "Medium",
      labels: normalizeLabels(labels),
      dueDate: dueDate || null,
      project: project || null,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
    });

    await addActivity({
      issue: issue._id,
      user: req.user._id,
      type: "created",
      message: `${req.user.name} created issue`,
    });

    await populateIssueDoc(issue);
    res.status(201).json({ issue });
  } catch (error) {
    console.error("Create issue error:", error);
    res.status(500).json({ message: "Server error creating issue" });
  }
};

const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("assignedTo", "name")
      .populate("project", "name");

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const { title, description, status, assignedTo, priority, labels, dueDate, project } = req.body;
    const referenceError = await validateReferences({
      assignedTo: assignedTo === null || assignedTo === "" ? null : assignedTo,
      project: project === null || project === "" ? null : project,
    });
    if (referenceError) return res.status(400).json({ message: referenceError });

    const activities = [];

    if (title !== undefined && title.trim() !== issue.title) {
      activities.push({ type: "title_changed", message: "Title changed", from: issue.title, to: title.trim() });
      issue.title = title.trim();
    }

    if (description !== undefined && description.trim() !== issue.description) {
      activities.push({ type: "description_changed", message: "Description updated" });
      issue.description = description.trim();
    }

    if (status !== undefined && status !== issue.status) {
      if (!["Open", "In Progress", "Closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      activities.push({ type: "status_changed", message: "Status changed", from: issue.status, to: status });
      issue.status = status;
    }

    if (priority !== undefined && priority !== issue.priority) {
      if (!["Low", "Medium", "High", "Urgent"].includes(priority)) {
        return res.status(400).json({ message: "Invalid priority value" });
      }
      activities.push({ type: "priority_changed", message: "Priority changed", from: issue.priority, to: priority });
      issue.priority = priority;
    }

    if (assignedTo !== undefined) {
      const before = issue.assignedTo?.name || "Unassigned";
      issue.assignedTo = assignedTo || null;
      const nextUser = assignedTo ? await User.findById(assignedTo).select("name") : null;
      const after = nextUser?.name || "Unassigned";
      if (before !== after) {
        activities.push({ type: "assignee_changed", message: "Assignee changed", from: before, to: after });
      }
    }

    if (project !== undefined) {
      const before = issue.project?.name || "No project";
      issue.project = project || null;
      const nextProject = project ? await Project.findById(project).select("name") : null;
      const after = nextProject?.name || "No project";
      if (before !== after) {
        activities.push({ type: "project_changed", message: "Project changed", from: before, to: after });
      }
    }

    if (labels !== undefined) {
      const nextLabels = normalizeLabels(labels);
      const diff = labelDiff(issue.labels || [], nextLabels);
      issue.labels = nextLabels;
      if (diff.added.length) {
        activities.push({ type: "labels_added", message: "Labels added", to: diff.added.join(", ") });
      }
      if (diff.removed.length) {
        activities.push({ type: "labels_removed", message: "Labels removed", from: diff.removed.join(", ") });
      }
    }

    if (dueDate !== undefined) {
      const before = dateLabel(issue.dueDate);
      issue.dueDate = dueDate || null;
      const after = dateLabel(issue.dueDate);
      if (before !== after) {
        activities.push({ type: "due_date_changed", message: "Due date changed", from: before, to: after });
      }
    }

    const updatedIssue = await issue.save();
    if (activities.length > 0) {
      await Promise.all([
        ...activities.map((activity) =>
          addActivity({ issue: issue._id, user: req.user._id, ...activity })
        ),
        addActivity({
          issue: issue._id,
          user: req.user._id,
          type: "updated",
          message: `${req.user.name} edited the issue`,
        }),
      ]);
    }

    await populateIssueDoc(updatedIssue);
    res.json({ issue: updatedIssue });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Issue not found" });
    }
    console.error("Update issue error:", error);
    res.status(500).json({ message: "Server error updating issue" });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const Comment = require("../models/Comment");
    await Promise.all([
      Comment.deleteMany({ issue: req.params.id }),
      Activity.deleteMany({ issue: req.params.id }),
    ]);
    await issue.deleteOne();

    res.json({ message: "Issue deleted successfully" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Issue not found" });
    }
    console.error("Delete issue error:", error);
    res.status(500).json({ message: "Server error deleting issue" });
  }
};

const getIssueActivities = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const activities = await Activity.find({ issue: req.params.id })
      .populate("user", "name email avatar")
      .populate({
        path: "comment",
        populate: { path: "user", select: "name email avatar" },
      })
      .sort({ createdAt: 1 });

    res.json({ activities });
  } catch (error) {
    console.error("Get issue activities error:", error);
    res.status(500).json({ message: "Server error fetching activity" });
  }
};

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  getIssueActivities,
  buildIssueFilter,
};
