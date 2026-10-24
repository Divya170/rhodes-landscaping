import Link from 'next/link';
import type { PublicSettings, Service } from '@/lib/types';
import { NAV, serviceHref } from '@/lib/links';
import { Wordmark } from './Bits';

export function Footer({ s, services }: { s: PublicSettings; services: Service[] }) {
  return (
    <footer className="ftr">
      <div className="wrap ftr__in">
        <div className="ftr__grid">
          <div className="ftr__brand">
            <Link href="/" className="logo" style={{ color: 'var(--ivory)' }}>
              <Wordmark name={s.businessName} />
            </Link>
            {s.tagline && <p>{s.tagline}</p>}
            <Link href="/contact" className="btn btn--sand btn--md" style={{ marginTop: s.tagline ? 0 : 24 }}>
              Request an Estimate
            </Link>
          </div>
          <nav aria-label="Footer" style={{ flex: '1 1 140px' }}>
            <p className="ftr__h">Explore</p>
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          {services.length > 0 && (
            <div style={{ flex: '1 1 180px' }}>
              <p className="ftr__h">Services</p>
              <ul>
                {services.map((v) => (
                  <li key={v.slug}>
                    <Link href={serviceHref(v.slug)}>{v.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ flex: '1.2 1 240px' }}>
            <p className="ftr__h">Contact</p>
            <address>
              {s.address && (
                <span>
                  {s.addressLine1}
                  {s.addressLine2 && (
                    <>
                      <br />
                      {s.addressLine2}
                    </>
                  )}
                </span>
              )}
              {s.mailHref && <a href={s.mailHref}>{s.email}</a>}
              {s.telHref && <a href={s.telHref}>{s.phone}</a>}
            </address>
          </div>
        </div>
        <div className="ftr__bot">
          <span>
            © {new Date().getFullYear()} {s.businessName}
          </span>
          {s.showReviewNotes && <span>Content subject to client approval</span>}
          <span className="flex-wrap" style={{ gap: '8px 20px' }}>
            <Link href="/privacy">Privacy</Link>
            <a href="/admin" rel="nofollow">
              Staff sign-in
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
