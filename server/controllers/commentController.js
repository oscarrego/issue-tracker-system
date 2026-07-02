const Comment = require("../models/Comment");
const Issue = require("../models/Issue");
const Activity = require("../models/Activity");

const getComments = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const comments = await Comment.find({ issue: req.params.id })
      .populate("user", "name email avatar")
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Issue not found" });
    }
    console.error("Get comments error:", error);
    res.status(500).json({ message: "Server error fetching comments" });
  }
};

const addComment = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const newComment = await Comment.create({
      issue: req.params.id,
      user: req.user._id,
      comment: comment.trim(),
    });

    await newComment.populate("user", "name email avatar");
    await Activity.create({
      issue: req.params.id,
      user: req.user._id,
      type: "comment_added",
      message: `${req.user.name} added a comment`,
      comment: newComment._id,
    });

    res.status(201).json({ comment: newComment });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Issue not found" });
    }
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Server error adding comment" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (String(comment.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    // Remove the activity entry linked to this comment
    await Activity.deleteOne({ comment: comment._id });
    await comment.deleteOne();

    res.json({ message: "Comment deleted" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Comment not found" });
    }
    console.error("Delete comment error:", error);
    res.status(500).json({ message: "Server error deleting comment" });
  }
};

const editComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (String(comment.user) !== String(req.user._id)) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    const { comment: text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    comment.comment = text.trim();
    await comment.save();

    // Update the linked activity message so timeline reflects the edit
    await Activity.updateOne(
      { comment: comment._id },
      { message: `${req.user.name} added a comment (edited)` }
    );

    res.json({ comment });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Comment not found" });
    }
    console.error("Edit comment error:", error);
    res.status(500).json({ message: "Server error editing comment" });
  }
};

module.exports = { getComments, addComment, deleteComment, editComment };
