import type { Metadata } from 'next';
import Link from 'next/link';
import { getSite } from '@/lib/api';
import { paragraphs } from '@/lib/format';
import { Photo } from '@/components/site/Photo';
import { Eyebrow, Note, firstName } from '@/components/site/Bits';

export const metadata: Metadata = { title: 'About', description: 'Outdoor spaces, shaped around the way you live — the business, the working philosophy and how a project could unfold.' };

export default async function AboutPage() {
  const { settings: s, steps, principles, images } = await getSite();
  const notes = s.showReviewNotes;
  const owner = s.contactName;
  const body = paragraphs(s.aboutBody);
  return (
    <div className="pad-top">
      <section className="wrap about-intro">
        <div>
          <p className="eyebrow enter">About</p>
          <h1 className="h1 enter" style={{ ['--d' as string]: '80ms' }}>
            Outdoor spaces, shaped around the way you live.
          </h1>
          {s.aboutLead && (
            <p className="lead enter" style={{ ['--d' as string]: '160ms' }}>
              {s.aboutLead}
            </p>
          )}
          <Note show={notes} style={{ marginTop: 20 }}>
            Draft copy — for client review
          </Note>
        </div>
        <Photo img={images['about-hero']} className="ratio-34 enter-mask" eager alt="quiet garden corner with mature planting" brief="Quiet garden corner — mature planting, natural light" />
      </section>

      <section aria-labelledby="h-owner" className="wrap owner">
        <div>
          <Eyebrow>The business</Eyebrow>
          <h2 id="h-owner" className="h2">
            {owner ? `Meet ${owner}.` : `About ${s.businessName}.`}
          </h2>
          {body.map((p, i) => (
            <p key={i} className="body-l">
              {p}
            </p>
          ))}
          <Note show={notes} style={{ marginTop: 28 }}>
            Add {owner ? `${firstName(owner)}’s` : 'the owner’s'} own story and background once confirmed
          </Note>
        </div>
        <Photo img={images['about-owner']} reveal="mask" className="ratio-54" alt={owner ? `${owner}` : 'the business'} brief={`Owner photograph${owner ? ` of ${owner}` : ''} — use only if supplied; otherwise a landscape image`} />
      </section>

      {principles.length > 0 && (
        <section aria-labelledby="h-philosophy" className="sandbg">
          <div className="wrap" style={{ paddingTop: 'clamp(80px,10vw,140px)', paddingBottom: 'clamp(80px,10vw,140px)' }}>
            <Eyebrow>Working philosophy</Eyebrow>
            <h2 id="h-philosophy" className="h2" style={{ maxWidth: 720, marginBottom: 'clamp(40px,5vw,64px)' }}>
              {principles.length === 3 ? 'Three principles behind every project.' : 'The principles behind every project.'}
            </h2>
            <ol className="principles">
              {principles.map((pr, i) => (
                <li key={pr.id} data-reveal="up">
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <h3>{pr.title}</h3>
                  <p>{pr.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section aria-labelledby="h-about-process" className="wrap timeline-sec">
          <div>
            <Eyebrow>Understanding your requirements</Eyebrow>
            <h2 id="h-about-process" className="h2" style={{ marginBottom: 24 }}>
              How a project could unfold.
            </h2>
            <p className="body-l" style={{ maxWidth: 440, marginBottom: 20 }}>
              A simple, transparent sequence that keeps you informed at each stage.
            </p>
            <Note show={notes}>Suggested workflow — confirm with {firstName(owner)}</Note>
          </div>
          <ol className="vtl">
            {steps.map((st, i) => (
              <li key={st.id} data-reveal="up">
                <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3>{st.title}</h3>
                <p>{st.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="deep">
        <div className="wrap band">
          <div>
            <h2 className="h2">Let’s talk about your space.</h2>
            <p>Share a few details and photos, and we will take it from there.</p>
          </div>
          <Link href="/contact" className="btn btn--sand btn--lg">
            Request an Estimate
          </Link>
        </div>
      </section>
    </div>
  );
}
