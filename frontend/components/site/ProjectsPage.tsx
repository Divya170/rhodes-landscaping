import Link from 'next/link';
import { getSite } from '@/lib/api';
import { ProjectBrowser } from './Gallery';

/** Shared by /projects and /projects/<slug> (design: slug sets the gallery filter). */
export async function ProjectsPage({ initial }: { initial: string }) {
  const { settings: s, services, projects } = await getSite();
  return (
    <div className="pad-top">
      <section className="wrap" style={{ paddingTop: 'clamp(56px,8vw,112px)' }}>
        <div className="intro intro--projects" style={{ padding: 0 }}>
          <div>
            <p className="eyebrow enter">Projects</p>
            <h1 className="h1 enter" style={{ ['--d' as string]: '80ms' }}>
              Outdoor Spaces, <em>Reimagined.</em>
            </h1>
          </div>
          <p className="body-l enter" style={{ ['--d' as string]: '160ms' }}>
            A look at the kinds of gardens, planting, and outdoor improvements {s.businessName} can help bring to life.
          </p>
        </div>
        {projects.some((p) => p.illustrative) && (
          <div role="note" className="info" style={{ marginTop: 40 }}>
            <span aria-hidden="true">i</span>
            <p>
              <strong>Illustrative content.</strong> Projects labelled “Illustrative concept” are sample garden concepts, not completed {s.businessName} projects. They will be replaced with approved project photography.
            </p>
          </div>
        )}
      </section>
      <ProjectBrowser projects={projects} services={services} initial={initial} notes={s.showReviewNotes} />
      <section className="deep">
        <div className="wrap band">
          <h2 className="h2">Picture something like this at your place?</h2>
          <Link href="/contact" className="btn btn--sand btn--lg">
            Request an Estimate
          </Link>
        </div>
      </section>
    </div>
  );
}
