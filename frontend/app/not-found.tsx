import Link from 'next/link';

export const metadata = { title: 'Page not found', robots: { index: false, follow: false } };

export default function NotFound() {
  return (
    <main id="main" className="state">
      <p className="eyebrow">Page not found</p>
      <h1 className="h1">This path doesn’t lead anywhere.</h1>
      <p>The page may have moved. Start from the home page, or tell us about your outdoor project.</p>
      <div className="btns">
        <Link href="/" className="btn btn--line btn--md">
          Back to Home
        </Link>
        <Link href="/contact" className="btn btn--primary btn--md">
          Request an Estimate
        </Link>
      </div>
    </main>
  );
}
