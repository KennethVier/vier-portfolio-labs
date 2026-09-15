import SectionHeader from '../../ui/SectionHeader';
import ProjectCard from './ProjectCard';
import { ADDITIONAL_PROJECTS, FEATURED_PROJECTS } from './constants';

export default function Projects() {
  return (
    <section className="py-section-v-lg reveal-section" id="projects">
      <div className="mb-12 max-w-3xl">
        <SectionHeader label="SELECTED ENGINEERING WORK" title="Flagship Case Studies" />
        <p className="mt-5 font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
          A closer look at the systems that best represent how I approach architecture,
          backend reliability, product engineering, AI integration, and maintainable delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {FEATURED_PROJECTS.map((project, index) => (
          <div
            key={project.id}
            className={index === 0 ? "xl:col-span-2" : ""}
          >
            <ProjectCard {...project} />
          </div>
        ))}
      </div>

      <div className="mt-20 mb-10">
        <SectionHeader label="MORE BUILDS" title="Additional Product Work" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {ADDITIONAL_PROJECTS.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>
    </section>
  );
}
