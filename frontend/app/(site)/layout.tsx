import { getSite } from '@/lib/api';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { Reveal } from '@/components/site/Reveal';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let site;
  try {
    site = await getSite();
  } catch {
    return (
      <main id="main" className="state" role="alert">
        <p className="eyebrow">Service unavailable</p>
        <h1 className="h1">We’ll be right back.</h1>
        <p>The website can’t load its content right now. Please try again in a moment.</p>
        <a href="" className="btn btn--primary btn--md">
          Try again
        </a>
      </main>
    );
  }
  const s = site.settings;
  const city = (s.addressLine2 || '').match(/^(.*?),\s*([A-Z]{2})\s*(\d{5})?/);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LandscapingBusiness',
    name: s.businessName,
    ...(s.contactName ? { founder: { '@type': 'Person', name: s.contactName } } : {}),
    ...(s.addressLine1 ? { address: { '@type': 'PostalAddress', streetAddress: s.addressLine1, addressLocality: city?.[1], addressRegion: city?.[2], postalCode: city?.[3], addressCountry: 'US' } } : {}),
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.email ? { email: s.email } : {}),
  };
  return (
    <div className="site">
      <a href="#main" className="skip">
        Skip to content
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <Header name={s.businessName} heroStyle={s.heroStyle} phone={s.phone} telHref={s.telHref} email={s.email} mailHref={s.mailHref} address={s.address} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer s={s} services={site.services} />
      <Reveal />
    </div>
  );
}
