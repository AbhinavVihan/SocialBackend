const express = require("express");
const postController = require("../controllers/postController");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

router
  .route("/create")
  .post(postController.upload.single("image"), postController.createPost);
router
  .route("/getFollowingPosts")
  .get(authenticateToken, postController.getFollowingPosts);

router
  .route("/getUserPosts")
  .get(authenticateToken, postController.getUserPosts);

router
  .route("/getPostsByUserId")
  .get(authenticateToken, postController.getPostsByUserId);

router.route("/addComment").post(authenticateToken, postController.addComment);

router.route("/like").get(authenticateToken, postController.likePost);
router.route("/unlike").get(authenticateToken, postController.unlikePost);

module.exports = router;
