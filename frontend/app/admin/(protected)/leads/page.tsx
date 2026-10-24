'use client';

import { RequestList } from '@/components/admin/RequestList';
import type { Lead } from '@/lib/types';

export default function LeadsPage() {
  return (
    <RequestList<Lead>
      kind="estimate-requests"
      base="/admin/leads"
      title="Estimate requests"
      searchLabel="Search name, email, phone, location, details or reference"
      noneText="No estimate requests yet. Requests from the Contact page appear here."
      serviceFilter
      filterLabel="Project type"
      columns={[
        {
          head: 'Contact',
          cell: (x) => (
            <>
              <div>{x.name}</div>
              <div className="sub">{x.email}</div>
            </>
          ),
        },
        { head: 'Project type', cell: (x) => x.projectTypeLabel },
        { head: 'Location', cell: (x) => x.location },
        { head: 'Timeline', cell: (x) => x.timeline },
        { head: 'Photos', cell: (x) => (x.imageCount ? `${x.imageCount}` : '—'), nowrap: true },
      ]}
      card={(x) => ({ title: x.name, line: `${x.projectTypeLabel} · ${x.location}`, meta: x.timeline })}
    />
  );
}
