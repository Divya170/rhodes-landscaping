import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import { parseCookies, sameToken } from './cookies';

export { parseCookies, sameToken };

/**
 * Admin session: a signed session token in an HttpOnly, SameSite=Lax
 * (Secure in production) cookie, plus a CSRF token required on every mutation.
 * The CSRF token is bound to the session (stored inside the signed token) and echoed
 * to the browser in a readable cookie; mutations must send it back as X-CSRF-Token.
 */

export const SESSION_COOKIE = 'rl_session';
export const CSRF_COOKIE = 'rl_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export interface AdminSession {
  sub: number;
  email: string;
  name: string;
  csrf: string;
}

export type AuthedRequest = Request & { admin: AdminSession };

export const sessionHours = () => Math.min(72, Math.max(1, Number(process.env.SESSION_HOURS) || 8));

const secure = () => process.env.COOKIE_SECURE === 'true' || (process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production');

const base = (): CookieOptions => ({ sameSite: 'lax', secure: secure(), path: '/', maxAge: sessionHours() * 3600_000 });

export function setSessionCookies(res: Response, token: string, csrf: string) {
  res.cookie(SESSION_COOKIE, token, { ...base(), httpOnly: true });
  res.cookie(CSRF_COOKIE, csrf, { ...base(), httpOnly: false });
}

export function clearSessionCookies(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Checked on every admin route: valid session cookie, and a matching CSRF token on mutations. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[SESSION_COOKIE];
    if (!token) throw new UnauthorizedException('Sign in to continue.');
    let session: AdminSession;
    try {
      session = await this.jwt.verifyAsync<AdminSession>(token);
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }
    if (!SAFE_METHODS.has(req.method.toUpperCase())) {
      const header = String(req.headers[CSRF_HEADER] || '');
      if (!sameToken(header, session.csrf) || !sameToken(header, cookies[CSRF_COOKIE] || '')) {
        throw new ForbiddenException('Security check failed. Refresh the page and try again.');
      }
    }
    req.admin = session;
    return true;
  }
}

/**
 * Non-throwing session check for public routes that behave differently for staff: returns the admin session
 * when the request carries a valid session cookie, otherwise null.
 */
export async function readAdminSession(req: Request, jwt: JwtService): Promise<AdminSession | null> {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  try {
    return await jwt.verifyAsync<AdminSession>(token);
  } catch {
    return null;
  }
}
