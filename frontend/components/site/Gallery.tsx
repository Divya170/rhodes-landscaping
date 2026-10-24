'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Project, Service } from '@/lib/types';
import { Photo, ratioClass } from './Photo';

const kicker = (p: Project) => `${p.categoryLabel}${p.illustrative ? ' · Illustrative concept' : ''}`;

/** Lightbox state shared by the home band and the gallery page. */
function useLightbox(count: number) {
  const [i, setI] = useState<number | null>(null);
  const ret = useRef<HTMLElement | null>(null);
  const open = (k: number, el: HTMLElement) => {
    ret.current = el;
    setI(k);
  };
  const close = useCallback(() => {
    setI(null);
    setTimeout(() => ret.current?.focus(), 30);
  }, []);
  const step = useCallback((d: number) => setI((x) => (x === null || !count ? x : (x + d + count) % count)), [count]);
  return { i, open, close, step };
}

/** Before/after comparison — only when a verified matching pair is supplied (Handoff). */
function BeforeAfter({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="ba" style={{ ['--pos' as string]: `${pos}%` }}>
      <img src={before} alt={`Before: ${alt}`} />
      <img src={after} alt={`After: ${alt}`} className="ba__after" />
      <span className="ba__k" style={{ left: 14 }}>
        Before
      </span>
      <span className="ba__k" style={{ right: 14 }}>
        After
      </span>
      <span className="ba__line" aria-hidden="true" />
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Compare before and after" />
    </div>
  );
}

function Lightbox({ list, i, onClose, onStep }: { list: Project[]; i: number; onClose: () => void; onStep: (d: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const p = list[i];

  useEffect(() => {
    closeRef.current?.focus();
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = o;
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inRange = e.target instanceof HTMLInputElement;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight' && !inRange) onStep(1);
      else if (e.key === 'ArrowLeft' && !inRange) onStep(-1);
      else if (e.key === 'Tab' && ref.current) {
        const els = Array.from(ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input'));
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onStep]);

  if (!p) return null;
  const pair = !!(p.beforeImage && p.afterImage);
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="lb-title" className="lb">
      <div className="lb__top">
        <p>
          {i + 1} / {list.length}
        </p>
        <button ref={closeRef} type="button" className="lb__close" aria-label="Close project viewer" onClick={onClose}>
          Close <span aria-hidden="true" style={{ fontSize: 18 }}>×</span>
        </button>
      </div>
      <div className="lb__main">
        {list.length > 1 && (
          <button type="button" className="lb__nav" aria-label="Previous project" onClick={() => onStep(-1)}>
            ←
          </button>
        )}
        <div className="lb__img">
          {pair ? <BeforeAfter before={p.beforeImage!} after={p.afterImage!} alt={p.imageAlt} /> : <Photo img={p.image ? { url: p.image, alt: p.imageAlt } : null} tone="tile" alt={p.imageAlt} brief={p.imageBrief} fit="contain" />}
        </div>
        {list.length > 1 && (
          <button type="button" className="lb__nav" aria-label="Next project" onClick={() => onStep(1)}>
            →
          </button>
        )}
      </div>
      <div className="lb__cap">
        <div>
          <p className="k">{kicker(p)}</p>
          <h2 id="lb-title">{p.title}</h2>
          {p.location && <p style={{ marginTop: 6, fontSize: 14, color: 'var(--on-dark)' }}>{p.location}</p>}
        </div>
        <p>{p.description}</p>
      </div>
    </div>
  );
}

/** Home "Spaces worth stepping into": one large + two stacked figures. */
export function FeaturedProjects({ projects }: { projects: Project[] }) {
  const list = projects.slice(0, 3);
  const lb = useLightbox(list.length);
  const fig = (p: Project, k: number, ratio: string, delay?: number) => (
    <figure key={p.id} className="fig" data-reveal="up" {...(delay ? { 'data-delay': delay } : {})}>
      <button type="button" className="fig__open" aria-label={`View ${p.title} larger`} onClick={(e) => lb.open(k, e.currentTarget)}>
        <Photo img={p.image ? { url: p.image, alt: p.imageAlt } : null} tone="tile" alt={p.imageAlt} brief={p.imageBrief} className={ratio} />
      </button>
      <figcaption>
        <p className="fig__k">{kicker(p)}</p>
        <p className="fig__t">{p.title}</p>
      </figcaption>
    </figure>
  );
  if (!list.length) return null;
  return (
    <>
      <div className="fgrid">
        {fig(list[0], 0, 'ratio-54')}
        {list.length > 1 && (
          <div>
            {list.slice(1).map((p, k) => fig(p, k + 1, 'ratio-43', 120 + k * 80))}
          </div>
        )}
      </div>
      {lb.i !== null && <Lightbox list={list} i={lb.i} onClose={lb.close} onStep={lb.step} />}
    </>
  );
}

/** Projects page: sticky service filters with a live count, masonry gallery, empty states, lightbox. */
export function ProjectBrowser({ projects, services, initial, notes }: { projects: Project[]; services: Service[]; initial: string; notes: boolean }) {
  const valid = services.some((s) => s.slug === initial) ? initial : '';
  const [filter, setFilter] = useState(valid);
  const list = filter ? projects.filter((p) => p.category === filter) : projects;
  const lb = useLightbox(list.length);
  const anyIllustrative = projects.some((p) => p.illustrative);
  const noun = anyIllustrative ? 'concept' : 'project';

  const pick = (slug: string) => {
    setFilter(slug);
    // Keep the URL shareable (design: #/projects/<slug>)
    window.history.replaceState(null, '', slug ? `/projects/${slug}` : '/projects');
  };

  return (
    <>
      <div className="filterbar">
        <div className="wrap filterbar__in">
          <div role="group" aria-label="Filter projects by service">
            <button type="button" className="chip" aria-pressed={filter === ''} onClick={() => pick('')}>
              All Projects
            </button>
            {services.map((s) => (
              <button key={s.slug} type="button" className="chip" aria-pressed={filter === s.slug} onClick={() => pick(s.slug)}>
                {s.name}
              </button>
            ))}
          </div>
          <p aria-live="polite" className="filterbar__count">
            {list.length} {list.length === 1 ? noun : `${noun}s`} shown
          </p>
        </div>
      </div>

      <section aria-label="Project gallery" className="wrap" style={{ paddingTop: 'clamp(40px,5vw,64px)', paddingBottom: 'clamp(88px,10vw,140px)' }}>
        {list.length > 0 ? (
          <div className="masonry">
            {list.map((g, k) => (
              <figure key={g.id} data-reveal="up">
                <Photo img={g.image ? { url: g.image, alt: g.imageAlt } : null} alt={g.imageAlt} brief={g.imageBrief} className={ratioClass(g.ratio)} />
                <figcaption>
                  <div className="min0">
                    <p className="k">{kicker(g)}</p>
                    <h2>{g.title}</h2>
                    <p>{g.description}</p>
                    {g.location && <p className="loc">{g.location}</p>}
                  </div>
                  <button type="button" className="round-btn" aria-label={`View ${g.title} larger`} onClick={(e) => lb.open(k, e.currentTarget)}>
                    ↗
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="empty">
            <p className="eyebrow">{projects.length ? 'Nothing here yet' : 'Gallery coming soon'}</p>
            <h2 className="h2s">{projects.length ? 'No projects in this category yet.' : 'Approved projects will appear here.'}</h2>
            <p>{projects.length ? 'Try another category, or view everything in the gallery.' : 'Project photography is being prepared. In the meantime, tell us about your space and we can discuss what is possible.'}</p>
            <div className="btns">
              {filter && projects.length > 0 && (
                <button type="button" className="btn btn--line btn--md" onClick={() => pick('')}>
                  Show all projects
                </button>
              )}
              <Link href="/contact" className="btn btn--primary btn--md">
                Discuss Your Project
              </Link>
            </div>
          </div>
        )}
        {notes && !projects.some((p) => p.beforeImage && p.afterImage) && (
          <p className="note" style={{ marginTop: 24 }}>
            Before / after slider activates only when verified matching photo pairs are supplied
          </p>
        )}
      </section>
      {lb.i !== null && <Lightbox list={list} i={lb.i} onClose={lb.close} onStep={lb.step} />}
    </>
  );
}
