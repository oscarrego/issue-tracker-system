const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

router.use(protect);

router.route("/").get(getProjects).post(createProject);
router.route("/:id").get(getProjectById).put(updateProject).delete(deleteProject);

module.exports = router;
