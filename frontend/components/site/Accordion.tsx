'use client';

import { useState } from 'react';

/** Design "What this may include" accordion (aria-expanded, animated height). */
export function Accordion({ id, title, items }: { id: string; title: string; items: string[] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return (
    <div className="acc">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          {title}
          <span aria-hidden="true">+</span>
        </button>
      </h3>
      <div id={id} className={`acc__panel${open ? ' is-open' : ''}`}>
        <div>
          <ul>
            {items.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
