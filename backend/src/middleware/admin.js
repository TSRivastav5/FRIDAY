import User from "../models/User.js";

export const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    return res.status(403).json({ error: "Admin access required" });
  }
};
