import type { Metadata } from 'next';
import Link from 'next/link';
import { getSite } from '@/lib/api';
import { Photo } from '@/components/site/Photo';
import { Note } from '@/components/site/Bits';
import { ServiceSection } from '@/components/site/ServiceSection';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Garden design, lawn care, planting and outdoor improvements — thoughtful landscaping designed around your space.',
};

export default async function ServicesPage() {
  const { settings: s, services, projects, images } = await getSite();
  return (
    <div className="pad-top">
      <section className="wrap intro">
        <div>
          <p className="eyebrow enter">Services</p>
          <h1 className="h1 enter" style={{ ['--d' as string]: '80ms' }}>
            Thoughtful Landscaping, Designed Around Your Space.
          </h1>
        </div>
        <div className="enter" style={{ ['--d' as string]: '160ms' }}>
          <p className="body-l" style={{ marginBottom: 14 }}>
            From the overall layout of a garden to the plants and finishing improvements, {s.businessName} helps property owners shape outdoor spaces that look good and work well.
          </p>
          <Note show={s.showReviewNotes}>Draft service descriptions — confirm scope</Note>
        </div>
      </section>
      <Photo img={images['services-hero']} tone="dark" eager className="wide enter-mask" alt="designed garden in context with the home" brief="Wide landscape — designed garden in context with the home" />

      {services.length > 0 ? (
        <>
          <nav aria-label="Services on this page" className="chipnav">
            <ul>
              {services.map((v) => (
                <li key={v.slug}>
                  <a href={`#${v.slug}`} className="chip">
                    <span>{v.n}</span>
                    {v.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          {services.map((v, i) => (
            <ServiceSection key={v.slug} s={v} index={i} total={services.length} hasProjects={projects.some((p) => p.category === v.slug)} />
          ))}
        </>
      ) : (
        <div className="wrap" style={{ paddingTop: 64 }}>
          <p className="info">
            <span aria-hidden="true">i</span>Service details are being updated. Tell us about your project and we will help work out the right starting point.
          </p>
        </div>
      )}

      <section aria-labelledby="h-unsure" className="wrap unsure">
        <div>
          <div>
            <h2 id="h-unsure" className="h2s">
              Not sure which service fits?
            </h2>
            <p>Describe what you have in mind and we will help work out the right starting point.</p>
          </div>
          <Link href="/contact" className="btn btn--primary">
            Request an Estimate
          </Link>
        </div>
      </section>
    </div>
  );
}
