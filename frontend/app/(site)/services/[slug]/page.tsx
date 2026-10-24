import { redirect } from 'next/navigation';

/** Design deep link #/services/<slug> → the section anchor on the Services page. */
export default function ServiceDeepLink({ params }: { params: { slug: string } }) {
  redirect(`/services#${encodeURIComponent(params.slug)}`);
}
