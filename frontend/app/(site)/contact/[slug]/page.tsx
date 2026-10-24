import type { Metadata } from 'next';
import { ContactPage } from '@/components/site/ContactPage';

export const metadata: Metadata = { title: 'Request an Estimate', description: 'Tell us about your outdoor project — share a few details and photos of your space.' };

export default function Page({ params }: { params: { slug: string } }) {
  return <ContactPage initialType={params.slug} />;
}
