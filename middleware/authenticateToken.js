const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: "Invalid token" });
      }

      req.user = user; // Attach the user object to the request
      next();
    });
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = authenticateToken;
