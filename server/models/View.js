const mongoose = require("mongoose");

const viewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "View name is required"],
      trim: true,
      maxlength: [120, "View name cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    search: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["", "Open", "In Progress", "Closed"], default: "" },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    priority: { type: String, enum: ["", "Low", "Medium", "High", "Urgent"], default: "" },
    labels: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("View", viewSchema);
