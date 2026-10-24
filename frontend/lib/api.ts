/**
 * Server-side data access for public pages (React Server Components).
 * Uncached so admin edits appear immediately.
 */
import type { EstimateOptions, SiteData } from './types';

const BACKEND = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND}/api${path}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
  } catch {
    throw new ApiError(503, 'The site service is unavailable. Please try again shortly.');
  }
  if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

/** Business details, services, projects, steps, principles, form options and page photos. */
export const getSite = () => get<SiteData>('/site');

/** Whether the estimate form (and photo uploads) are open. */
export const getEstimateOptions = () => get<EstimateOptions>('/estimate-requests/options');
