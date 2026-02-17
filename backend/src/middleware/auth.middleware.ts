import { Request, Response,  NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.ts";
import { errorResponse } from "../utils/response.ts";

export function authenticate(req: Request, res: Response, next: NextFunction){
  const authHeader = req.headers.authorization;

  if(!authHeader || !authHeader.startsWith("Bearer ")){
    return errorResponse(res, 'Access token required', 401)
  }

  const token = authHeader.split(' ')[1]

  try{
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    req.role = payload.role;

    next();
  } catch (error) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    next();
  };
}
