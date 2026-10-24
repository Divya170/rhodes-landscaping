export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

/** Design deep links: /services/<slug> (anchor), /projects/<slug> (filter), /contact/<slug> (project type). */
export const serviceHref = (slug: string) => `/services#${slug}`;
export const projectsHref = (slug?: string) => (slug ? `/projects/${slug}` : '/projects');
export const contactHref = (slug?: string) => (slug ? `/contact/${slug}` : '/contact');
