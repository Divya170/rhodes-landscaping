import type { Metadata } from 'next';
import { ProjectsPage } from '@/components/site/ProjectsPage';

export const metadata: Metadata = { title: 'Projects', description: 'Gardens, planting and outdoor improvements, filterable by service.' };

export default function Page({ searchParams }: { searchParams: { cat?: string } }) {
  return <ProjectsPage initial={typeof searchParams.cat === 'string' ? searchParams.cat : ''} />;
}
