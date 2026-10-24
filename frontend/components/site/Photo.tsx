/* eslint-disable @next/next/no-img-element */

/**
 * Photo slot: the approved image when one is set, otherwise the design's labelled
 * image-slot placeholder (photo brief) so missing photography stays obvious.
 */
export function Photo({
  img,
  alt,
  brief,
  tone = 'light',
  className = '',
  style,
  eager,
  reveal,
  delay,
  fit,
}: {
  img?: { url: string; alt?: string } | null;
  alt: string;
  brief: string;
  tone?: 'light' | 'dark' | 'tile' | 'sand';
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
  reveal?: 'mask' | 'up';
  delay?: number;
  fit?: 'contain';
}) {
  const cls = `ph${tone === 'light' ? '' : ` ph--${tone}`} ${className}`.trim();
  const rv = reveal ? { 'data-reveal': reveal, ...(delay ? { 'data-delay': delay } : {}) } : {};
  if (img?.url) {
    return (
      <div className={cls} style={style} {...rv}>
        <img src={img.url} alt={img.alt || alt} loading={eager ? 'eager' : 'lazy'} style={fit ? { objectFit: fit } : undefined} />
      </div>
    );
  }
  return (
    <div className={cls} style={style} role="img" aria-label={`Placeholder: ${alt}`} {...rv}>
      <div className="ph__ph">
        <span>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="1.5" />
            <circle cx="9" cy="10" r="1.8" />
            <path d="M3 17l5-5 4 4 3-3 6 6" />
          </svg>
          {brief}
        </span>
      </div>
    </div>
  );
}

/** "4/5" → class name for the gallery tile ratio. */
export const ratioClass = (r: string) => ({ '4/5': 'ratio-45', '3/2': 'ratio-32', '1/1': 'ratio-11', '5/4': 'ratio-54', '4/3': 'ratio-43' })[r] || 'ratio-45';
