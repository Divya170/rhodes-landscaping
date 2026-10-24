'use client';

import Link from 'next/link';

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="state" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="h1">This page didn’t load.</h1>
      <p>Please try again. You can still request an estimate from the Contact page.</p>
      <div className="btns">
        <button type="button" className="btn btn--line btn--md" onClick={reset}>
          Try again
        </button>
        <Link href="/contact" className="btn btn--primary btn--md">
          Request an Estimate
        </Link>
      </div>
    </section>
  );
}
