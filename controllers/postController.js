const Post = require("../models/postModel");
const User = require("../models/userModel");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const Comment = require("../models/commentModel");

cloudinary.config({
  cloud_name: "dzrmunwn7",
  api_key: "671841619634652",
  api_secret: "PoatHbKHXddKBdr_UZCv_-LrRqI",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    resource_type: "auto",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

exports.upload = multer({ storage: storage });

exports.createPost = async function (req, res) {
  try {
    const { title, content, tags } = req.body;
    const author = req.user.id;

    let imageUrl;
    if (req.file) {
      imageUrl = req.file.path; // Use the file path from multer
    }

    const post = new Post({
      title,
      content,
      author,
      imageUrl,
      tags, // Assign the tags array from the request body to the post
    });

    const savedPost = await post.save();

    await User.findByIdAndUpdate(author, { $push: { posts: savedPost._id } });

    if (imageUrl) {
      savedPost.imageUrl = imageUrl;
    }
    savedPost.tags = tags;

    res.status(201).json({ post: savedPost });
  } catch (error) {
    console.error("Error occurred while creating a post:", error);
    res.status(500).json({ error: "An error occurred while creating a post" });
  }
};

exports.getFollowingPosts = async function (req, res) {
  try {
    const userId = req.user.id;

    // Find the user and populate the 'following' field
    const user = await User.findById(userId).populate("following");

    // Extract the array of user IDs from the 'following' field
    const followingIds = user.following.map((user) => user._id);

    // Find posts where the 'author' field is in the array of following IDs
    const posts = await Post.find({ author: { $in: followingIds } }).populate({
      path: "comments",
      populate: {
        path: "author",
        select: "userName",
      },
    });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error occurred while fetching following posts:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching following posts" });
  }
};

exports.getUserPosts = async function (req, res) {
  try {
    const userId = req.user.id;

    // Find the user and populate the 'following' field
    const user = await User.findById(userId).populate("posts");

    // Extract the array of user IDs from the 'following' field
    const postsIds = user.posts.map((user) => user._id);

    // Find posts where the 'user' field is in the array of following IDs
    const posts = await Post.find({ _id: { $in: postsIds } });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error occurred while fetching following posts:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching following posts" });
  }
};

exports.getPostsByUserId = async function (req, res) {
  try {
    const { userId } = req.query;

    // Find the user and populate the 'following' field
    const user = await User.findById(userId).populate("posts");

    // Extract the array of user IDs from the 'following' field
    const postsIds = user.posts.map((user) => user._id);

    // Find posts where the 'user' field is in the array of following IDs
    const posts = await Post.find({ _id: { $in: postsIds } });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error occurred while fetching following posts:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching following posts" });
  }
};

exports.likePost = async (req, res) => {
  const { postId } = req.query;
  const userId = req.user.id;

  try {
    // Find the post by postId
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user has already liked the post
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      return res
        .status(400)
        .json({ message: "You have already liked this post" });
    }

    // Add the userId to the likes array
    post.likes.push(userId);
    await post.save();

    return res.status(200).json({ message: "Post liked successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.unlikePost = async (req, res) => {
  const { postId } = req.query;
  const userId = req.user.id;

  try {
    // Find the post by postId
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the user has already liked the post
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Remove the userId from the likes array
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      await post.save();

      return res.status(200).json({ message: "Post unliked successfully" });
    } else {
      return res.status(400).json({ message: "You have not liked this post" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.addComment = async (req, res) => {
  const { postId, content } = req.body;

  const userId = req.user.id;
  try {
    // Find the post by postId
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create a new comment
    const comment = new Comment({
      content,
      author: userId,
      post: postId,
    });

    // Save the comment
    const savedComment = await comment.save();

    // Add the comment ID to the post's comments array
    post.comments.push(savedComment._id);
    await post.save();

    return res
      .status(200)
      .json({ message: "Comment added successfully", comment: savedComment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
