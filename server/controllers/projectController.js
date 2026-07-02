const Project = require("../models/Project");
const Issue = require("../models/Issue");

const projectStats = async (projectId) => {
  const [total, open, inProgress, closed] = await Promise.all([
    Issue.countDocuments({ project: projectId }),
    Issue.countDocuments({ project: projectId, status: "Open" }),
    Issue.countDocuments({ project: projectId, status: "In Progress" }),
    Issue.countDocuments({ project: projectId, status: "Closed" }),
  ]);
  const progress = total ? Math.round((closed / total) * 100) : 0;
  return { total, open, inProgress, closed, progress };
};

const withStats = async (project) => ({
  ...project.toObject(),
  stats: await projectStats(project._id),
});

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("createdBy", "name email avatar")
      .sort({ createdAt: -1 });
    res.json({ projects: await Promise.all(projects.map(withStats)) });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: "Server error fetching projects" });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("createdBy", "name email avatar");
    if (!project) return res.status(404).json({ message: "Project not found" });

    const issues = await Issue.find({ project: project._id })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("project", "name status")
      .sort({ createdAt: -1 });

    res.json({ project: await withStats(project), issues });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(404).json({ message: "Project not found" });
    console.error("Get project error:", error);
    res.status(500).json({ message: "Server error fetching project" });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Project name is required" });

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      status: status || "Planning",
      createdBy: req.user._id,
    });
    await project.populate("createdBy", "name email avatar");
    res.status(201).json({ project: await withStats(project) });
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Server error creating project" });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const { name, description, status } = req.body;
    if (name !== undefined) project.name = name.trim();
    if (description !== undefined) project.description = description.trim();
    if (status !== undefined) project.status = status;

    await project.save();
    await project.populate("createdBy", "name email avatar");
    res.json({ project: await withStats(project) });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(404).json({ message: "Project not found" });
    console.error("Update project error:", error);
    res.status(500).json({ message: "Server error updating project" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    await Issue.updateMany({ project: project._id }, { $set: { project: null } });
    await project.deleteOne();
    res.json({ message: "Project deleted." });
  } catch (error) {
    if (error.kind === "ObjectId") return res.status(404).json({ message: "Project not found" });
    console.error("Delete project error:", error);
    res.status(500).json({ message: "Server error deleting project" });
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
