import { Request } from 'express';

/**
 * Safely extract a route parameter as a string.
 * Express v5 types define params as string | string[],
 * but in practice route params are always strings.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] : value;
}
