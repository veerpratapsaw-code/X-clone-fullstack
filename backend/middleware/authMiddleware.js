import jwt from "jsonwebtoken";

/**
 * Required Auth Middleware:
 * Protects routes by ensuring a valid JWT Bearer token is sent in the Authorization header.
 * If valid, attaches the decoded token payload (`id`, `handle`) to `req.user`.
 */
export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const secret = process.env.JWT_SECRET || "x_clone_super_secret_jwt_key_2026";
      const decoded = jwt.verify(token, secret);

      req.user = decoded;
      return next();
    } catch (error) {
      console.error("JWT Verification failed:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed verification" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

/**
 * Optional Auth Middleware:
 * If a token is provided, decodes and attaches `req.user`. If no token is provided, sets `req.user = null` and proceeds.
 */
export const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const secret = process.env.JWT_SECRET || "x_clone_super_secret_jwt_key_2026";
      req.user = jwt.verify(token, secret);
    } catch (err) {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};
