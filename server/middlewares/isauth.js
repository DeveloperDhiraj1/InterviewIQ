
import jwt from "jsonwebtoken"

const isauth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : null
    const cookieToken = req.cookies?.token || null
    const tokens = [bearerToken, cookieToken].filter(Boolean)

    if (!tokens.length) {
      return res.status(401).json({ message: "User is not authenticated" })
    }

    // Prefer the bearer token because it is the token explicitly supplied by
    // the current client session. This also prevents a stale cookie from
    // masking a valid localStorage token after a deployment.
    for (const token of tokens) {
      try {
        const verifytoken = jwt.verify(token, process.env.JWT_SECRET)
        if (verifytoken?.userId) {
          req.userId = verifytoken.userId
          return next()
        }
      } catch {
        // Try the other credential, if one was supplied.
      }
    }

    return res.status(401).json({ message: "Invalid token" })
  } catch (error) {
    return res.status(401).json({ message: `Auth middleware error ${error.message}` })
  }
}

export default isauth
