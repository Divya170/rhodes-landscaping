'use client';
/* eslint-disable @next/next/no-img-element */

import { RequestDetail, tel } from '@/components/admin/RequestDetail';
import { fmtSize } from '@/lib/format';
import type { Lead } from '@/lib/types';

export default function LeadDetailPage() {
  return (
    <RequestDetail<Lead>
      kind="estimate-requests"
      base="/admin/leads"
      backLabel="All estimate requests"
      noun="estimate request"
      mailSubject={(x) => `Your estimate request ${x.publicRef} — ${x.projectTypeLabel}`}
      fields={(x) => [
        ['Phone', <a key="p" href={tel(x.phone)}>{x.phone}</a>],
        ['Email', <a key="e" href={`mailto:${x.email}`}>{x.email}</a>],
        ['Project type', x.projectTypeLabel],
        ['Approximate outdoor area', x.area || 'Not given'],
        ['Property location', x.location],
        ['Desired timeline', x.timeline],
        ['Project details', x.details, true],
      ]}
      extra={(x) => (
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--a-row-line)' }}>
          <h2 className="h-card" style={{ marginBottom: 12 }}>
            Inspiration photographs {x.images?.length ? `(${x.images.length})` : ''}
          </h2>
          {x.images?.length ? (
            <div className="photos">
              {x.images.map((im) => (
                <a key={im.id} href={im.url} target="_blank" rel="noreferrer">
                  <img src={im.url} alt={`Photo from ${x.name}: ${im.name}`} loading="lazy" />
                  <span>
                    {im.name} · {fmtSize(im.size)}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="help">No photos were attached.</p>
          )}
          <p className="help" style={{ marginTop: 10 }}>
            Photos are stored privately with location data (EXIF) removed and are only visible to signed-in staff. Deleting this request deletes them.
          </p>
        </div>
      )}
    />
  );
}
