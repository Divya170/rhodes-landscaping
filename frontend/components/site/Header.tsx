'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NAV } from '@/lib/links';
import { Wordmark } from './Bits';

const isCurrent = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));

/** Header: transparent over the full-bleed home hero, then solid; sage scroll-progress bar; mobile menu dialog below 900px. */
export function Header({ name, heroStyle, phone, telHref, email, mailHref, address }: { name: string; heroStyle: string; phone: string | null; telHref: string | null; email: string | null; mailHref: string | null; address: string }) {
  const path = usePathname() || '/';
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const openBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 40);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
    };
  }, [path]);

  const close = useCallback(() => {
    setMenu(false);
    setTimeout(() => openBtn.current?.focus(), 20);
  }, []);

  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    if (!menu) return;
    closeBtn.current?.focus();
    const o = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && menuRef.current) {
        const els = Array.from(menuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'));
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onResize = () => window.innerWidth >= 900 && setMenu(false);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = o;
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menu, close]);

  const clear = path === '/' && heroStyle !== 'split' && !scrolled && !menu;

  return (
    <>
      <header className={`hdr${clear ? ' is-clear' : ''}`}>
        <div className="wrap hdr__in">
          <Link href="/" className="logo" aria-label={`${name}, home`}>
            <Wordmark name={name} />
          </Link>
          <nav aria-label="Primary" className="nav">
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} aria-current={isCurrent(path, n.href) ? 'page' : undefined}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/contact" className="hdr__cta">
              Request an Estimate
            </Link>
          </nav>
          <div className="hdr__m">
            <Link href="/contact" className="hdr__cta">
              Get an Estimate
            </Link>
            <button ref={openBtn} type="button" className="burger" aria-expanded={menu} aria-controls="mnav" aria-label="Open menu" onClick={() => setMenu(true)}>
              <span />
              <span />
            </button>
          </div>
        </div>
        <div ref={bar} className="pbar" aria-hidden="true" />
      </header>
      {menu && (
        <div id="mnav" ref={menuRef} role="dialog" aria-modal="true" aria-label="Site menu" className="mnav">
          <div className="mnav__top">
            <Link href="/" className="logo" onClick={() => setMenu(false)}>
              <Wordmark name={name} />
            </Link>
            <button ref={closeBtn} type="button" className="mnav__close" aria-label="Close menu" onClick={close}>
              <span />
              <span />
            </button>
          </div>
          <nav aria-label="Mobile">
            <ul>
              {NAV.map((n) => {
                const cur = isCurrent(path, n.href);
                return (
                  <li key={n.href}>
                    <Link href={n.href} aria-current={cur ? 'page' : undefined} onClick={() => setMenu(false)}>
                      {n.label}
                      <span aria-hidden="true">{cur ? 'Current' : ''}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Link href="/contact" className="btn btn--sand mnav__cta" onClick={() => setMenu(false)}>
            Request an Estimate
          </Link>
          <div className="mnav__contact">
            {mailHref && <a href={mailHref}>{email}</a>}
            {telHref && <a href={telHref}>{phone}</a>}
            {address && <span>{address}</span>}
          </div>
        </div>
      )}
    </>
  );
}
