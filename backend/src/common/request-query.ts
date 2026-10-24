import { Brackets, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { REQUEST_STATUSES } from './forms';
import { clampInt } from './utils';

export interface RequestQuery {
  q?: string;
  status?: string;
  type?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

/** Shared list filters for the admin (status, free-text search, sort). */
export function applyFilters<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, p: RequestQuery, searchCols: string[]) {
  if (p.status && (REQUEST_STATUSES as readonly string[]).includes(p.status)) qb.andWhere('x.status = :status', { status: p.status });
  const q = (p.q || '').trim().toLowerCase().slice(0, 100);
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const dig = q.replace(/\D/g, '');
    qb.andWhere(
      new Brackets((w) => {
        for (const col of searchCols) w.orWhere(`LOWER(COALESCE(x.${col}, '')) LIKE :like ESCAPE '\\'`, { like });
        if (dig.length >= 4) w.orWhere("REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(x.phone,' ',''),'-',''),'(',''),')',''),'+','') LIKE :dig", { dig: `%${dig}%` });
      }),
    );
  }
  const dir = p.sort === 'oldest' ? 'ASC' : 'DESC';
  return qb.orderBy('x.createdAt', dir).addOrderBy('x.id', dir);
}

export async function paginate<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, p: RequestQuery) {
  const limit = clampInt(p.limit, 1, 100, 10);
  const total = await qb.getCount();
  const pages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(clampInt(p.page, 1, 100_000, 1), pages);
  const items = await qb.skip((page - 1) * limit).take(limit).getMany();
  return { items, total, page, pages, limit };
}

export async function statusCounts<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>) {
  const raw = await qb.select('x.status', 'status').addSelect('COUNT(*)', 'n').groupBy('x.status').getRawMany<{ status: string; n: string }>();
  const out: Record<string, number> = { all: 0 };
  for (const s of REQUEST_STATUSES) out[s] = 0;
  for (const r of raw) {
    out[r.status] = Number(r.n);
    out.all += Number(r.n);
  }
  return out;
}
