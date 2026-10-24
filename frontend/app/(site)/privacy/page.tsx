import type { Metadata } from 'next';
import { getSite } from '@/lib/api';
import { paragraphs } from '@/lib/format';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default async function PrivacyPage() {
  const { settings: s } = await getSite();
  const paras = paragraphs(s.privacyPolicy);
  return (
    <section className="wrap pad-top" style={{ paddingBottom: 'clamp(88px,10vw,140px)' }}>
      <div style={{ paddingTop: 'clamp(56px,8vw,112px)' }}>
        <p className="eyebrow">Privacy</p>
        <h1 className="h1" style={{ marginBottom: 32 }}>
          Privacy policy.
        </h1>
        <div className="legal">
          {paras.length ? (
            paras.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <p>
              The privacy policy is being finalized and will be published here once approved. Details and photos sent through the estimate form are used only to respond to your request.
              {s.mailHref && (
                <>
                  {' '}
                  Questions can be sent to <a href={s.mailHref}>{s.email}</a>.
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
