require('dotenv').config({ path: '../.env' });

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No reseller token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'reseller') {
      return res.status(403).json({ message: "Reseller only" });
    }

    req.reseller = decoded;
    next();

  } catch (err) {
    console.error("JWT VERIFY ERROR:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
