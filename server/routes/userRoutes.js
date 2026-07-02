const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Issue = require("../models/Issue");
const Invite = require("../models/Invite");
const { protect } = require("../middleware/auth");

const getTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;

  const nodemailer = require("nodemailer");
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_PORT) === "465",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find().select("name email avatar createdAt").sort({ name: 1 });
    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
});

router.put("/me/avatar", protect, async (req, res) => {
  try {
    const avatar = String(req.body.avatar || "");
    if (avatar && !/^data:image\/(png|jpe?g|webp);base64,/.test(avatar)) {
      return res.status(400).json({ message: "Use a PNG, JPG, or WebP image." });
    }

    req.user.avatar = avatar;
    await req.user.save();

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update avatar error:", error);
    res.status(500).json({ message: "Server error updating avatar" });
  }
});

router.put("/me/name", protect, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Name cannot be empty." });
    }
    if (name.length > 60) {
      return res.status(400).json({ message: "Name cannot exceed 60 characters." });
    }

    req.user.name = name;
    await req.user.save();

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update name error:", error);
    res.status(500).json({ message: "Server error updating name" });
  }
});

router.post("/invite", protect, async (req, res) => {
  try {
    const emails = Array.isArray(req.body.emails) ? req.body.emails : [];
    const cleanEmails = [...new Set(
      emails
        .map((email) => String(email || "").trim().toLowerCase())
        .filter((email) => /^\S+@\S+\.\S+$/.test(email))
    )];

    if (cleanEmails.length === 0) {
      return res.status(400).json({ message: "Add at least one valid email." });
    }

    const existingUsers = await User.find({ email: { $in: cleanEmails } }).select("email");
    const existingEmails = new Set(existingUsers.map((user) => user.email));
    const inviteEmails = cleanEmails.filter((email) => !existingEmails.has(email));

    const transport = getTransport();
    const from = process.env.INVITE_FROM || process.env.SMTP_USER;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const results = [];

    for (const email of inviteEmails) {
      const invite = await Invite.create({
        email,
        invitedBy: req.user._id,
        status: transport ? "pending" : "failed",
        error: transport ? "" : "SMTP is not configured on the server.",
      });

      if (transport) {
        try {
          await transport.sendMail({
            from,
            to: email,
            subject: `${req.user.name} invited you to IssueTracker`,
            text: `You have been invited to IssueTracker. Open ${clientUrl}/register to join.`,
            html: `<p>${req.user.name} invited you to IssueTracker.</p><p><a href="${clientUrl}/register">Create your account</a></p>`,
          });
          invite.status = "sent";
          invite.sentAt = new Date();
          await invite.save();
        } catch (error) {
          invite.status = "failed";
          invite.error = error.message;
          await invite.save();
        }
      }

      results.push(invite);
    }

    res.status(201).json({
      message: transport
        ? "Invites processed."
        : "Invites saved, but SMTP is not configured so emails were not sent.",
      skippedExisting: [...existingEmails],
      invites: results,
      emailConfigured: Boolean(transport),
    });
  } catch (error) {
    console.error("Invite users error:", error);
    res.status(500).json({ message: "Server error sending invites" });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: "You cannot remove yourself." });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Member not found" });
    }

    await Issue.updateMany({ assignedTo: user._id }, { $unset: { assignedTo: "" } });
    await User.deleteOne({ _id: user._id });

    res.json({ message: "Member removed." });
  } catch (error) {
    console.error("Remove user error:", error);
    res.status(500).json({ message: "Server error removing member" });
  }
});

router.get("/github", protect, (req, res) => {
  const configured = Boolean(process.env.GITHUB_CLIENT_ID);
  const redirectUri = process.env.GITHUB_REDIRECT_URI || "http://localhost:5000/api/users/github/callback";
  const scope = encodeURIComponent("read:user user:email repo");
  const url = configured
    ? `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`
    : "https://github.com/settings/applications";

  res.json({
    configured,
    url,
    
  });
});

module.exports = router;
