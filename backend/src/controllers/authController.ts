import type { Request, Response } from "express";
import * as authService from "../services/authService.js";

export async function signup(req: Request, res: Response): Promise<void> {
  res.json(await authService.signup(res, req.body));
}

export async function login(req: Request, res: Response): Promise<void> {
  res.json(await authService.login(res, req.body));
}

export function logout(_req: Request, res: Response): void {
  res.json(authService.logout(res));
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json(await authService.me(req));
}

export function switchRole(req: Request, res: Response): void {
  res.json(authService.switchRole(req, res, req.body));
}
