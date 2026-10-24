import Link from 'next/link';
import { getSite } from '@/lib/api';
import { serviceHref } from '@/lib/links';
import { Photo } from '@/components/site/Photo';
import { Eyebrow, Note, firstName } from '@/components/site/Bits';
import { FeaturedProjects } from '@/components/site/Gallery';

const FEATURE_RATIOS = ['ratio-45', 'ratio-43', 'ratio-11', 'ratio-1610'];

export default async function HomePage() {
  const { settings: s, services, projects, steps, images } = await getSite();
  const notes = s.showReviewNotes;
  const featured = projects.filter((p) => p.featured);
  const showcase = (featured.length ? featured : projects).slice(0, 3);
  const eyebrow = `${s.businessName}${s.locationLabel ? ` · ${s.locationLabel}` : ''}`;
  const heroAlt = 'layered residential garden meeting a contemporary home';
  const heroBrief = 'Hero photograph — layered residential garden meeting a contemporary home, soft natural daylight';

  return (
    <>
      {s.heroStyle === 'split' ? (
        <section aria-label="Introduction" className="hsplit">
          <div className="hsplit__txt">
            <p className="eyebrow enter">{eyebrow}</p>
            <h1 className="enter" style={{ ['--d' as string]: '90ms' }}>
              Make Room for the <em>Outdoors.</em>
            </h1>
            <p className="enter" style={{ ['--d' as string]: '180ms' }}>
              Thoughtfully designed landscapes that bring more beauty, balance, and enjoyment to your outdoor space.
            </p>
            <div className="btns enter" style={{ ['--d' as string]: '260ms' }}>
              <Link href="/contact" className="btn btn--primary">
                Request an Estimate
              </Link>
              <Link href="/projects" className="btn btn--line">
                Explore Our Projects
              </Link>
            </div>
          </div>
          <div className="hsplit__img enter-mask">
            <Photo img={images['home-hero']} tone="dark" eager alt={heroAlt} brief={heroBrief} />
          </div>
        </section>
      ) : (
        <section aria-label="Introduction" className="hero">
          <Photo img={images['home-hero']} tone="dark" eager alt={heroAlt} brief={heroBrief} />
          <div className="hero__shade" aria-hidden="true" />
          <div className="hero__txt">
            <div className="wrap hero__row">
              <div>
                <p className="eyebrow enter">{eyebrow}</p>
                <h1 className="enter" style={{ ['--d' as string]: '90ms' }}>
                  Make Room for the <em>Outdoors.</em>
                </h1>
              </div>
              <div className="enter" style={{ ['--d' as string]: '220ms' }}>
                <p className="hero__lead">Thoughtfully designed landscapes that bring more beauty, balance, and enjoyment to your outdoor space.</p>
                <div className="btns">
                  <Link href="/contact" className="btn btn--ivory">
                    Request an Estimate
                  </Link>
                  <Link href="/projects" className="btn btn--ghost">
                    Explore Our Projects
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="h-approach" className="wrap approach">
        <div>
          <div data-reveal="up">
            <Eyebrow>Our approach</Eyebrow>
          </div>
          <h2 id="h-approach" className="h2" data-reveal="up">
            Good landscaping starts with the space you already have.
          </h2>
          <p className="body-l" data-reveal="up">
            Every property has its own light, layout, and way of being used. {s.businessName} begins by looking closely at yours — how you move through it, where you gather, and what you would like it to become.
          </p>
          <p className="body-l" data-reveal="up">
            From there, planting and improvements are planned to suit the property, so the finished space feels considered, comfortable, and genuinely yours.
          </p>
          <Link href="/about" className="tlink">
            About {s.businessName}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="approach__imgs">
          <Photo img={images['home-intro-main']} reveal="mask" className="ratio-45" alt="layered planting beds beside a garden path" brief="Layered planting beds beside a garden path, mature greenery" />
          <Photo img={images['home-intro-detail']} reveal="mask" delay={160} className="ratio-11" alt="natural stone meeting soft foliage" brief="Detail — natural stone meeting soft foliage" />
        </div>
      </section>

      {services.length > 0 && (
        <section aria-labelledby="h-services" className="wrap" style={{ paddingBottom: 'clamp(88px,12vw,160px)' }}>
          <div className="sec-head sec-head--rule">
            <div>
              <Eyebrow>Services</Eyebrow>
              <h2 id="h-services" className="h2" style={{ maxWidth: 640 }}>
                {services.length === 4 ? 'Four ways to shape your outdoor space.' : 'Ways to shape your outdoor space.'}
              </h2>
            </div>
            <p>Each service can stand on its own or work together as part of a wider plan for your property.</p>
          </div>
          <div className="features">
            {services.map((v, i) => (
              <article key={v.slug} className="feature" data-reveal="up" {...(i % 2 ? { 'data-delay': 120 } : {})}>
                <Photo img={v.homeImage ? { url: v.homeImage, alt: v.imageAlt } : null} className={FEATURE_RATIOS[i % 4]} alt={v.imageAlt} brief={`${v.name} — ${v.imageBrief.replace(/^.*?—\s*/, '')}`} />
                <div className="feature__txt">
                  <span>{v.n}</span>
                  <div>
                    <h3>{v.name}</h3>
                    <p>{v.summary}</p>
                    <Link href={serviceHref(v.slug)} className="tlink">
                      Explore Service<span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="h-featured" className="deep featured">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <Eyebrow light>Project gallery</Eyebrow>
              <h2 id="h-featured" className="h2">
                Spaces worth stepping into.
              </h2>
            </div>
            <div>
              {showcase.some((p) => p.illustrative) && <p>Illustrative garden concepts are shown while approved {s.businessName} project photography is prepared.</p>}
              <Link href="/projects" className="tlink">
                View All Projects<span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          {showcase.length > 0 ? (
            <FeaturedProjects projects={showcase} />
          ) : (
            <div className="empty-band">
              <p>Project photography is on its way. Approved {s.businessName} projects will appear here.</p>
              <Link href="/contact" className="btn btn--sand btn--md">
                Discuss Your Project
              </Link>
            </div>
          )}
        </div>
      </section>

      {steps.length > 0 && (
        <section aria-labelledby="h-process" className="wrap" style={{ paddingTop: 'clamp(88px,11vw,150px)', paddingBottom: 'clamp(88px,11vw,150px)' }}>
          <div className="sec-head">
            <div style={{ flex: '1 1 520px' }}>
              <Eyebrow>How it works</Eyebrow>
              <h2 id="h-process" className="h2" style={{ maxWidth: 760 }}>
                A clear path from first conversation to finished space.
              </h2>
            </div>
            <Note show={notes}>Suggested workflow — confirm with {firstName(s.contactName)}</Note>
          </div>
          <ol className="steps">
            {steps.map((st, i) => (
              <li key={st.id} data-reveal="up" {...(i ? { 'data-delay': i * 110 } : {})}>
                <span className="steps__n">{String(i + 1).padStart(2, '0')}</span>
                <h3>{st.title}</h3>
                <p>{st.text}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="h-cta" className="sandbg">
        <div className="wrap cta">
          <div>
            <Eyebrow>Request an estimate</Eyebrow>
            <h2 id="h-cta" data-reveal="up">
              Your Outdoor Space Starts Here.
            </h2>
            <p>Tell us what you have in mind, and let’s explore the possibilities for your property.</p>
            <div className="cta__row">
              <Link href="/contact" className="btn btn--primary btn--lg">
                Request an Estimate
              </Link>
              {s.telHref && <a href={s.telHref}>or call {s.phone}</a>}
            </div>
          </div>
          <Photo img={images['home-cta']} tone="sand" reveal="mask" className="ratio-43" alt="inviting garden seating area in late-afternoon light" brief="Inviting garden seating area in late-afternoon light" />
        </div>
      </section>
    </>
  );
}
