'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, ClientApiError } from '@/lib/client-api';
import { DELIVERY, fmtStamp, STATUSES } from '@/lib/format';
import type { HistoryEvent } from '@/lib/types';
import { useAdmin } from './AdminContext';
import { ConfirmDialog, ErrorBox } from './ui';
import { Skeleton } from './ListParts';
import { RecordSide } from './RecordSide';

type Base = {
  id: number;
  publicRef: string | null;
  name: string;
  email: string;
  phone: string;
  status: string;
  statusLabel: string;
  notes: string;
  createdAt: string;
  notificationState: string;
  acknowledgementState: string;
  history?: HistoryEvent[];
};

const tel = (p: string) => `tel:${p.replace(/[^\d+]/g, '')}`;

/** Shared detail view: fields, status + notes, status history, email delivery state, delete. */
export function RequestDetail<T extends Base>({
  kind,
  base,
  backLabel,
  extra,
  noun,
  fields,
  mailSubject,
}: {
  kind: string;
  base: string;
  backLabel: string;
  extra?: (x: T) => React.ReactNode;
  noun: string;
  fields: (x: T) => [string, React.ReactNode, boolean?][];
  mailSubject: (x: T) => string;
}) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast, refreshCounts } = useAdmin();
  const [x, setX] = useState<T | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const [del, setDel] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setError('');
    api<T>(`/admin/${kind}/${encodeURIComponent(id)}`, { admin: true })
      .then(setX)
      .catch((e: ClientApiError) => (e.status === 404 || e.status === 400 ? setMissing(true) : setError(e.message)));
  }, [id, kind]);
  useEffect(load, [load]);

  const save = async (body: { status?: string; notes?: string }) => {
    try {
      const r = await api<T>(`/admin/${kind}/${x!.id}`, { method: 'PATCH', body, admin: true });
      setX(r);
      refreshCounts();
      if (body.notes !== undefined) toast('Notes saved.');
      return `Status updated to ${r.statusLabel}.`;
    } catch (e) {
      toast((e as ClientApiError).message, true);
    }
  };

  const resend = async () => {
    setSending(true);
    try {
      setX(await api<T>(`/admin/${kind}/${x!.id}/notify`, { method: 'POST', admin: true }));
      toast('Email sent again.');
    } catch (e) {
      toast((e as ClientApiError).message, true);
    } finally {
      setSending(false);
    }
  };

  const back = base;
  const label = noun.charAt(0).toUpperCase() + noun.slice(1);

  return (
    <div>
      <Link href={back} className="backlink">
        ← {backLabel}
      </Link>
      {missing && (
        <div className="adm-panel" style={{ marginTop: 12, padding: 32 }}>
          <h1 className="adm-h1" style={{ fontSize: 24 }}>
            {label} not found
          </h1>
          <p style={{ margin: '8px 0 0' }}>It may have been deleted. Return to the list to continue.</p>
        </div>
      )}
      {error && <ErrorBox message={error} onRetry={load} />}
      {!x && !missing && !error && <Skeleton label={`Loading ${noun}`} />}
      {x && (
        <div className="detail">
          <div className="detail__main">
            <div className="detail__head">
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>
                  {x.publicRef} · received {fmtStamp(x.createdAt)} ET
                </p>
                <h1>{x.name}</h1>
              </div>
              <span className={`st st--${x.status}`}>{x.statusLabel}</span>
            </div>
            <dl className="dfields">
              {fields(x).map(([k, v, span]) => (
                <div key={k} className={span ? 'span' : ''}>
                  <dt>{k}</dt>
                  <dd>{v || '—'}</dd>
                </div>
              ))}
            </dl>
            {extra && extra(x)}
            <div style={{ padding: '20px 24px' }}>
              <h2 className="h-card" style={{ marginBottom: 8 }}>
                Status history
              </h2>
              <ol className="hist">
                {(x.history || []).map((h, i) => (
                  <li key={i}>
                    <strong>{h.label}</strong>
                    <span>
                      {fmtStamp(h.at)} · {h.by}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="detail__side">
            <RecordSide key={`${x.id}-${x.status}`} status={x.status} statuses={STATUSES} notes={x.notes} onSave={save} />
            <div className="sidebox">
              <h2 className="h-card">Email notifications</h2>
              <div className="deliv">
                <span>Owner notification: {DELIVERY[x.notificationState] || x.notificationState}</span>
                <span>Customer acknowledgement: {DELIVERY[x.acknowledgementState] || x.acknowledgementState}</span>
              </div>
              {(x.notificationState === 'failed' || x.acknowledgementState === 'failed') && (
                <button type="button" className="abtn abtn--line abtn--sm" disabled={sending} onClick={resend}>
                  {sending ? 'Sending…' : 'Retry failed email'}
                </button>
              )}
              <p className="fine">Changing the status does not email the customer. Contact them directly to confirm.</p>
            </div>
            <div className="adm-actions">
              {x.email && (
                <a href={`mailto:${x.email}?subject=${encodeURIComponent(mailSubject(x))}`} className="abtn">
                  Email
                </a>
              )}
              {x.phone && (
                <a href={tel(x.phone)} className="abtn abtn--line">
                  Call
                </a>
              )}
              <button type="button" className="abtn abtn--danger" onClick={() => setDel(true)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {del && x && (
        <ConfirmDialog
          title={`Delete this ${noun}?`}
          message={`${x.publicRef} from ${x.name} and its status history will be permanently removed. This can’t be undone.`}
          onCancel={() => setDel(false)}
          onConfirm={async () => {
            try {
              await api(`/admin/${kind}/${x.id}`, { method: 'DELETE', admin: true });
              toast(`${label} deleted.`);
              refreshCounts();
              router.replace(back);
            } catch (e) {
              toast((e as ClientApiError).message, true);
              setDel(false);
            }
          }}
        />
      )}
    </div>
  );
}

export { tel };
