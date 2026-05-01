
import jwt from "jsonwebtoken"

const isauth = async (req, res, next) => {
  try {
    const { token } = req.cookies
    if (!token) {
      return res.status(401).json({ message: "User is not authenticated" })
    }

    const verifytoken = jwt.verify(token, process.env.JWT_SECRET)
    if (!verifytoken?.userId) {
      return res.status(401).json({ message: "Invalid token" })
    }

    req.userId = verifytoken.userId
    next()
  } catch (error) {
    return res.status(401).json({ message: `Auth middleware error ${error.message}` })
  }
}

export default isauth
