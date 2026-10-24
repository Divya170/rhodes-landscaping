import Link from 'next/link';
import type { Service } from '@/lib/types';
import { contactHref, projectsHref } from '@/lib/links';
import { Photo } from './Photo';
import { Accordion } from './Accordion';

/** One numbered service section. The four design layouts (a–d) cycle by position. */
export function ServiceSection({ s, index, total, hasProjects }: { s: Service; index: number; total: number; hasProjects: boolean }) {
  const layout = (['a', 'b', 'c', 'd'] as const)[index % 4];
  const img = s.image ? { url: s.image, alt: s.imageAlt } : null;
  const d1 = s.detailImage ? { url: s.detailImage, alt: `${s.name} — detail` } : null;
  const d2 = s.detailImage2 ? { url: s.detailImage2, alt: `${s.name} — detail` } : null;

  const text = (
    <>
      <p className="svc__num">
        {s.n} / {String(total).padStart(2, '0')}
      </p>
      <h2 id={`h-${s.slug}`}>{s.name}</h2>
      <p className="svc__desc">{s.description}</p>
      {s.benefits.length > 0 && (
        <ul className="diamonds">
          {s.benefits.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      <Accordion id={`acc-${s.slug}`} title="What this may include" items={s.includes} />
      <div className="svc__ctas">
        <Link href={contactHref(s.slug)} className="btn btn--primary btn--md">
          {s.ctaLabel}
        </Link>
        {hasProjects && (
          <Link href={projectsHref(s.slug)} className="tlink">
            Related projects<span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </>
  );

  if (layout === 'c') {
    return (
      <section id={s.slug} aria-labelledby={`h-${s.slug}`} className="svc svc--c">
        <Photo img={img} tone="dark" reveal="mask" className="wide wide--9" alt={s.imageAlt} brief={s.imageBrief} />
        <div className="wrap svc__float">
          <div className="svc__card svc__txt" data-reveal="up">
            {text}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id={s.slug} aria-labelledby={`h-${s.slug}`} className={`wrap svc svc--${layout}`}>
      {layout === 'a' && <Photo img={img} reveal="mask" className="ratio-45" alt={s.imageAlt} brief={s.imageBrief} />}
      <div className="svc__txt">{text}</div>
      {layout === 'b' && (
        <div className="svc__media">
          <Photo img={img} reveal="mask" className="ratio-32" alt={s.imageAlt} brief={s.imageBrief} />
          <Photo img={d1} reveal="mask" delay={160} className="ratio-45" alt={`${s.name} detail`} brief="Detail photograph" />
        </div>
      )}
      {layout === 'd' && (
        <div className="svc__media">
          <Photo img={img} reveal="mask" className="ratio-1611" alt={s.imageAlt} brief={s.imageBrief} />
          <div className="svc__pair">
            <Photo img={d1} reveal="mask" delay={100} className="ratio-11" alt={`${s.name} detail`} brief="Detail photograph" />
            <Photo img={d2} reveal="mask" delay={180} className="ratio-11" alt={`${s.name} detail`} brief="Detail photograph" />
          </div>
        </div>
      )}
    </section>
  );
}
