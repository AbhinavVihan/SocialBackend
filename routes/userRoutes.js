const express = require("express");
const userController = require("../controllers/userController");
const authenticateToken = require("../middleware/authenticateToken");
const postController = require("../controllers/postController");
const router = express.Router();

router
  .route("/signup")
  .post(postController.upload.single("image"), userController.singup);
router.route("/login").post(userController.login);
router.route("/follow").post(authenticateToken, userController.followUser);
router.route("/unfollow").post(authenticateToken, userController.unfollowUser);

router.route("/users").get(authenticateToken, userController.getAllUsers);
router.route("/userById").get(authenticateToken, userController.getUserById);

router.get(
  "/me",
  userController.protect,
  userController.getMe,
  userController.getUser
);
module.exports = router;
