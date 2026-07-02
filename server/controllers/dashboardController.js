const Issue = require("../models/Issue");

const getDashboard = async (req, res) => {
  try {
    const [total, open, inProgress, closed, recentIssues] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: "Open" }),
      Issue.countDocuments({ status: "In Progress" }),
      Issue.countDocuments({ status: "Closed" }),
      Issue.find()
        .populate("assignedTo", "name email avatar")
        .populate("createdBy", "name email avatar")
        .populate("project", "name status")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.json({
      stats: {
        total,
        open,
        inProgress,
        closed,
      },
      recentIssues,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error fetching dashboard data" });
  }
};

module.exports = { getDashboard };
