'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Design reveals: [data-reveal="up"] fades/rises 22px over 650ms, [data-reveal="mask"] wipes
 * top-down over 900ms; [data-delay] staggers. Only elements BELOW the fold are hidden first —
 * content already in view is never hidden. Off with prefers-reduced-motion; without JS nothing is hidden.
 */
export function Reveal() {
  const pathname = usePathname();
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          el.classList.remove('rv-hidden', 'rv-mask-hidden');
          io.unobserve(el);
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    const raf = requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        if (el.dataset.rv) return;
        el.dataset.rv = '1';
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        const mask = el.dataset.reveal === 'mask';
        el.style.transitionDelay = `${Number(el.dataset.delay) || 0}ms`;
        el.classList.add(mask ? 'rv-mask' : 'rv-anim', mask ? 'rv-mask-hidden' : 'rv-hidden');
        io.observe(el);
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [pathname]);
  return null;
}
