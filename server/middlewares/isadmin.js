import User from "../models/usermodel.js"

const isadmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("isAdmin")

    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" })
    }

    next()
  } catch (error) {
    return res.status(403).json({ message: `Admin middleware error ${error.message}` })
  }
}

export default isadmin
