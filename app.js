const express = require("express");
const morgan = require("morgan");
const userRouter = require("./routes/userRoutes");
const app = express();
const cors = require("cors");
const authenticateToken = require("./middleware/authenticateToken");
const postRouter = require("./routes/postRoutes");

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
// development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log("development");
}

// production logging
if (process.env.NODE_ENV === "production") {
  console.log("production");
}

app.use("/user", userRouter);
app.use("/posts", authenticateToken, postRouter);

app.all("*", (req, res, next) => {
  next();
  return res.json(`can't find ${req.originalUrl} on this server`);
});

// 2) Routes
module.exports = app;
