'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError, downloadCsv } from '@/lib/client-api';
import { useDebounced } from '@/lib/hooks';
import { fmtStamp, STATUSES } from '@/lib/format';
import type { ListResult } from '@/lib/types';
import { useAdmin } from './AdminContext';
import { ErrorBox } from './ui';
import { Empty, Pager, Skeleton, StatusTabs } from './ListParts';

const PER = 10;

export interface Column<T> {
  head: string;
  cell: (x: T) => React.ReactNode;
  nowrap?: boolean;
}

/**
 * Shared admin list for requests (estimate requests): status tabs, search, filter,
 * sort, pagination, CSV export, loading / empty / error states. All filtering happens in the API.
 */
export function RequestList<T extends { id: number; publicRef: string | null; status: string; statusLabel: string; createdAt: string }>({
  kind,
  base,
  filterLabel = 'Project type',
  title,
  searchLabel,
  noneText,
  columns,
  card,
  serviceFilter,
}: {
  /** API path under /api/admin, e.g. "estimate-requests" */
  kind: string;
  /** Admin route for detail pages, e.g. "/admin/leads" */
  base: string;
  filterLabel?: string;
  title: string;
  searchLabel: string;
  noneText: string;
  columns: Column<T>[];
  card: (x: T) => { title: string; line: string; meta: string };
  serviceFilter?: boolean;
}) {
  const { toast, refreshCounts } = useAdmin();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResult<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dq = useDebounced(q, 300);

  const params = useCallback(
    (extra: Record<string, string> = {}) => {
      const p = new URLSearchParams({ q: dq, status, type, sort, ...extra });
      for (const [k, v] of Array.from(p.entries())) if (!v) p.delete(k);
      return p.toString();
    },
    [dq, status, type, sort],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api<ListResult<T>>(`/admin/${kind}?${params({ page: String(page), limit: String(PER) })}`, { admin: true })
      .then((d) => {
        setData(d);
        if (d.page !== page) setPage(d.page);
      })
      .catch((e: ClientApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [kind, params, page]);
  useEffect(load, [load]);
  useEffect(() => setPage(1), [dq, status, type, sort]);
  useEffect(() => refreshCounts(), [data, refreshCounts]);

  const filtered = !!(q || status || type);
  const items = data?.items || [];
  const href = (x: T) => `${base}/${x.id}`;

  return (
    <div>
      <div className="adm-head">
        <div>
          <h1 className="adm-h1">{title}</h1>
          <p className="adm-sub">{data ? `${data.counts.all ?? 0} total · ${data.counts.new ?? 0} new` : 'Loading…'}</p>
        </div>
        {data && <StatusTabs tabs={STATUSES} counts={data.counts} value={status} onChange={setStatus} />}
      </div>

      <div className="adm-filters">
        <div className="field wide">
          <label htmlFor="q">{searchLabel}</label>
          <input id="q" type="search" className="control" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {serviceFilter && (
          <div className="field">
            <label htmlFor="fs">{filterLabel}</label>
            <select id="fs" className="control" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All</option>
              {(data?.types || []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="so">Sort</label>
          <select id="so" className="control" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="abtn abtn--line"
            disabled={!data?.total}
            onClick={() => downloadCsv(`/admin/${kind}/export.csv?${params()}`, `rhodes-${kind}-${new Date().toISOString().slice(0, 10)}.csv`).catch((e: ClientApiError) => toast(e.message, true))}
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && <ErrorBox message={error} onRetry={load} />}
      {loading && !data && !error && <Skeleton label={`Loading ${kind}`} />}
      {data && !error && items.length === 0 && (
        <Empty
          filtered={filtered}
          none={noneText}
          onClear={() => {
            setQ('');
            setStatus('');
            setType('');
          }}
        />
      )}

      {data && items.length > 0 && (
        <div aria-busy={loading} style={{ opacity: loading ? 0.6 : 1 }}>
          <div className="ltable-wrap only-wide">
            <table className="ltable">
              <caption className="sr-only">
                {title}, {sort === 'newest' ? 'newest first' : 'oldest first'}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Received</th>
                  {columns.map((c) => (
                    <th key={c.head} scope="col">
                      {c.head}
                    </th>
                  ))}
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Link href={href(x)}>{x.publicRef || `#${x.id}`}</Link>
                      <div className="ref">{fmtStamp(x.createdAt)}</div>
                    </td>
                    {columns.map((c) => (
                      <td key={c.head} style={c.nowrap ? { whiteSpace: 'nowrap' } : undefined}>
                        {c.cell(x)}
                      </td>
                    ))}
                    <td>
                      <span className={`st st--${x.status}`}>{x.statusLabel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="lcards only-narrow">
            {items.map((x) => {
              const c = card(x);
              return (
                <li key={x.id}>
                  <Link href={href(x)} className="lcard">
                    <div className="lcard__top">
                      <span className="lcard__name">{c.title}</span>
                      <span className={`st st--${x.status}`}>{x.statusLabel}</span>
                    </div>
                    <div className="lcard__l">{c.line}</div>
                    <div className="lcard__m">
                      {x.publicRef} · {fmtStamp(x.createdAt)}
                      {c.meta ? ` · ${c.meta}` : ''}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Pager page={data.page} pages={data.pages} total={data.total} per={PER} onPage={setPage} />
        </div>
      )}
      {data && !data.notificationsConfigured && (
        <p className="help" style={{ marginTop: 16 }}>
          Email notifications are not configured, so new requests only appear here. Set SMTP_HOST in backend/.env to get notified by email and acknowledge customers.
        </p>
      )}
    </div>
  );
}
