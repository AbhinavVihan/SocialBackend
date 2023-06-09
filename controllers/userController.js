const User = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const mongoose = require("mongoose");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

exports.singup = async function signUp(req, res) {
  try {
    const { userName, email, password } = req.body;

    // Check if the username already exists
    const existingUser = await User.findOne({ userName });
    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    let imageUrl;
    if (req.file) {
      imageUrl = req.file.path; // Use the file path from multer
    }

    // Create a new user
    const newUser = new User({
      userName,
      password,
      email,
      imageUrl,
    });

    // Save the user to the database
    await newUser.save();
    if (imageUrl) {
      newUser.imageUrl = imageUrl;
    }
    const token = signToken(newUser._id);

    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
      },
      message: "User created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while signing up" });
  }
};

exports.login = async function login(req, res) {
  try {
    const { userName, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ userName }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate a JWT
    const token = signToken(user._id);

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        userName: user.userName,
        imageUrl: user.imageUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while logging in" });
  }
};

exports.protect = async (req, res, next) => {
  // 1) getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "You are not logged in.Please login to get Access",
    });
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "the user belonging to this token does no longer exists",
        401
      )
    );
  }

  // grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = async (req, res, next) => {
  let query = User.findById(req.params.id);
  const doc = await query;

  res.status(200).json({
    status: "success",
    user: doc,
  });
};

exports.followUser = async function (req, res) {
  try {
    const { userIdToFollow } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId).select("following");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Check if the user is already following the target user
    if (user.following.includes(userIdToFollow)) {
      return res.status(400).json({ error: "User is already being followed" });
    }

    // Update the following field of the user document
    user.following.push(userIdToFollow);
    await user.save();

    res.status(200).json({ message: "User followed successfully" });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while following user" });
  }
};

exports.unfollowUser = async function (req, res) {
  try {
    const { userIdToUnFollow } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId).select("following");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Check if the user is already following the target user
    if (!user.following.includes(userIdToUnFollow)) {
      return res.status(400).json({ error: "You don't follow them already" });
    }

    const userIdToUnfollowObj = mongoose.Types.ObjectId(userIdToUnFollow);

    // Remove the userIdToUnFollow from the following array
    user.following = user.following.filter(
      (id) => id.toString() !== userIdToUnfollowObj.toString()
    );
    await user.save();

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Error occurred while unfollowing user:", error);
    res.status(500).json({ error: "An error occurred while unfollowing user" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error occurred while retrieving users:", error);
    res.status(500).json({ error: "An error occurred while retrieving users" });
  }
};

exports.getUserById = async function (req, res) {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId).populate({
      path: "posts",
      populate: {
        path: "comments",
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the array of user IDs from the 'following' field
    const postsIds = user.posts.map((user) => user._id);

    // Find posts where the 'user' field is in the array of following IDs

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error occurred while fetching user:", error);
    res.status(500).json({ error: "An error occurred while fetching user" });
  }
};
