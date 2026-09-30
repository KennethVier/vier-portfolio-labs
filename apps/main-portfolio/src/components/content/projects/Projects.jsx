import SectionHeader from '../../ui/SectionHeader';
import { trackEvent } from '../../../utils/analytics';
import ProjectCard from './ProjectCard';
import { ADDITIONAL_PROJECTS, FEATURED_PROJECTS } from './constants';

export default function Projects() {
  return (
    <section className="section-block reveal-section" id="projects">
      <div className="section-intro max-w-3xl">
        <SectionHeader label="SELECTED ENGINEERING WORK" title="Three systems. Three engineering problems." />
        <p className="font-body-lg text-base leading-7 text-on-surface-variant sm:text-lg sm:leading-8">
          These projects best show how I reason about architecture, data, reliability, product behavior,
          and AI integration—not only how the final interface looks.
        </p>
      </div>

      <div className="grid gap-6 lg:gap-8">
        {FEATURED_PROJECTS.map((project) => (
          <div key={project.id}>
            <ProjectCard {...project} />
          </div>
        ))}
      </div>

      <details
        className="more-work mt-10 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest/35 p-4 sm:p-6"
        onToggle={(event) => trackEvent('project_list_toggle', {
          expanded: event.currentTarget.open ? 'true' : 'false'
        })}
      >
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-4 font-headline-section text-lg text-on-surface">
          <span>Explore five additional product builds</span>
          <span className="material-symbols-outlined text-tertiary" aria-hidden="true">add</span>
        </summary>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {ADDITIONAL_PROJECTS.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>
      </details>
    </section>
  );
}
