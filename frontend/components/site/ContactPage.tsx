import Link from 'next/link';
import { getEstimateOptions, getSite } from '@/lib/api';
import { EstimateForm } from './EstimateForm';

/** Shared by /contact and /contact/<slug> (design: slug preselects the project type). */
export async function ContactPage({ initialType }: { initialType: string }) {
  const [{ settings: s, services, options }, opts] = await Promise.all([getSite(), getEstimateOptions()]);
  const types = [...services.map((v) => ({ value: v.slug, label: v.name })), { value: 'other', label: 'Other' }];
  return (
    <div className="pad-top">
      <section className="wrap contact">
        <div className="contact__aside">
          <p className="eyebrow enter">Request an estimate</p>
          <h1 className="h1 enter" style={{ ['--d' as string]: '80ms' }}>
            Tell Us About Your Outdoor Project.
          </h1>
          <p className="body-l enter" style={{ ['--d' as string]: '140ms' }}>
            Share a few details about your space and what you would like to improve.
          </p>
          <dl className="contact__dl enter" style={{ ['--d' as string]: '200ms' }}>
            <div>
              <dt>Business</dt>
              <dd>{s.businessName}</dd>
            </div>
            {s.address && (
              <div>
                <dt>Address</dt>
                <dd>
                  {s.addressLine1}
                  {s.addressLine2 && (
                    <>
                      <br />
                      {s.addressLine2}
                    </>
                  )}
                  {s.mapHref && (
                    <>
                      <br />
                      <a href={s.mapHref} target="_blank" rel="noopener noreferrer">
                        Open in Google Maps<span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </>
                  )}
                </dd>
              </div>
            )}
            {s.mailHref && (
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={s.mailHref}>{s.email}</a>
                </dd>
              </div>
            )}
            {s.telHref && (
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={s.telHref}>{s.phone}</a>
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="contact__main">
          {opts.open ? (
            <EstimateForm
              types={types}
              areas={options.area}
              timelines={options.timeline}
              initialType={initialType}
              photosOpen={opts.photosOpen}
              businessName={s.businessName}
              phone={s.phone}
              telHref={s.telHref}
              email={s.email}
              mailHref={s.mailHref}
            />
          ) : (
            <div className="done">
              <p className="eyebrow">Online requests paused</p>
              <h2>Online estimate requests are paused right now.</h2>
              <p>Please get in touch directly{s.mailHref || s.telHref ? ' — we will be glad to hear about your project.' : '.'}</p>
              <div className="btns">
                {s.mailHref && (
                  <a href={s.mailHref} className="btn btn--primary btn--md">
                    Email {s.businessName}
                  </a>
                )}
                {s.telHref && (
                  <a href={s.telHref} className="btn btn--line btn--md">
                    Call {s.phone}
                  </a>
                )}
                <Link href="/" className="btn btn--text">
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
