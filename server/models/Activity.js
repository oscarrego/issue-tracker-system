const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "created",
        "updated",
        "title_changed",
        "description_changed",
        "status_changed",
        "priority_changed",
        "assignee_changed",
        "project_changed",
        "labels_added",
        "labels_removed",
        "due_date_changed",
        "comment_added",
      ],
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    from: { type: String, default: "" },
    to: { type: String, default: "" },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
