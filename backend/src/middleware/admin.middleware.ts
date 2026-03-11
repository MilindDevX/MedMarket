import type { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response.ts";

export function requireAdmin(req: Request, res: Response, next: NextFunction){
  if(req.role !== "admin"){
    return errorResponse(res, "Access denied. Admins only.", 403);
  }

  next();
}
