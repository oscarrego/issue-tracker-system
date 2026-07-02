const express = require("express");
const router = express.Router();
const {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  getIssueActivities,
} = require("../controllers/issueController");
const { getComments, addComment, deleteComment, editComment } = require("../controllers/commentController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getIssues).post(createIssue);

router.route("/:id").get(getIssueById).put(updateIssue).delete(deleteIssue);

router.route("/:id/comments").get(getComments).post(addComment);
router.delete("/:id/comments/:commentId", deleteComment);
router.patch("/:id/comments/:commentId", editComment);
router.route("/:id/activities").get(getIssueActivities);

module.exports = router;
