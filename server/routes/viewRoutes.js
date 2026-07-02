const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getViews,
  getViewById,
  createView,
  updateView,
  deleteView,
} = require("../controllers/viewController");

router.use(protect);

router.route("/").get(getViews).post(createView);
router.route("/:id").get(getViewById).put(updateView).delete(deleteView);

module.exports = router;
