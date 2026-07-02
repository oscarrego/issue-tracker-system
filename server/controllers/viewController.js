const View = require("../models/View");
const Issue = require("../models/Issue");
const { buildIssueFilter } = require("./issueController");

const cleanLabels = (labels) => {
  if (!labels) return [];
  const list = Array.isArray(labels) ? labels : String(labels).split(",");
  return [...new Set(list.map((label) => String(label).trim().toLowerCase()).filter(Boolean))];
};

const viewFilter = (view) => ({
  search: view.search,
  status: view.status,
  assignedTo: view.assignee,
  project: view.project,
  priority: view.priority,
  labels: view.labels,
});

const matchingCount = (view) => Issue.countDocuments(buildIssueFilter(viewFilter(view)));

const formatView = async (view) => ({
  ...view.toObject(),
  matchingIssues: await matchingCount(view),
});

const getViews = async (req, res) => {
  try {
    const views = await View.find({ createdBy: req.user._id })
      .populate("assignee", "name email avatar")
      .populate("project", "name status")
      .sort({ createdAt: -1 });
    res.json({ views: await Promise.all(views.map(formatView)) });
  } catch (error) {
    console.error("Get views error:", error);
    res.status(500).json({ message: "Server error fetching views" });
  }
};

const getViewById = async (req, res) => {
  try {
    const view = await View.findOne({ _id: req.params.id, createdBy: req.user._id })
      .populate("assignee", "name email avatar")
      .populate("project", "name status");
    if (!view) return res.status(404).json({ message: "View not found" });

    const issues = await Issue.find(buildIssueFilter(viewFilter(view)))
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("project", "name status")
      .sort({ createdAt: -1 });

    res.json({ view: await formatView(view), issues });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(404).json({ message: "View not found" });
    console.error("Get view error:", error);
    res.status(500).json({ message: "Server error fetching view" });
  }
};

const viewPayload = (body, userId) => ({
  name: body.name?.trim(),
  description: body.description ? body.description.trim() : "",
  createdBy: userId,
  search: body.search ? body.search.trim() : "",
  status: body.status || "",
  assignee: body.assignee || null,
  project: body.project || null,
  priority: body.priority || "",
  labels: cleanLabels(body.labels),
});

const createView = async (req, res) => {
  try {
    const payload = viewPayload(req.body, req.user._id);
    if (!payload.name) return res.status(400).json({ message: "View name is required" });

    const view = await View.create(payload);
    await view.populate("assignee", "name email avatar");
    await view.populate("project", "name status");
    res.status(201).json({ view: await formatView(view) });
  } catch (error) {
    console.error("Create view error:", error);
    res.status(500).json({ message: "Server error creating view" });
  }
};

const updateView = async (req, res) => {
  try {
    const view = await View.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!view) return res.status(404).json({ message: "View not found" });

    const payload = viewPayload(req.body, req.user._id);
    if (!payload.name) return res.status(400).json({ message: "View name is required" });

    Object.assign(view, payload);
    await view.save();
    await view.populate("assignee", "name email avatar");
    await view.populate("project", "name status");
    res.json({ view: await formatView(view) });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(404).json({ message: "View not found" });
    console.error("Update view error:", error);
    res.status(500).json({ message: "Server error updating view" });
  }
};

const deleteView = async (req, res) => {
  try {
    const view = await View.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!view) return res.status(404).json({ message: "View not found" });
    await view.deleteOne();
    res.json({ message: "View deleted." });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(404).json({ message: "View not found" });
    console.error("Delete view error:", error);
    res.status(500).json({ message: "Server error deleting view" });
  }
};

module.exports = {
  getViews,
  getViewById,
  createView,
  updateView,
  deleteView,
};
