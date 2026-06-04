import SectionHeader from '../../ui/SectionHeader';
import ProjectCard from './ProjectCard';
import { PROJECTS } from './constants';

export default function Projects() {
    return (
        <section className="py-section-v-lg reveal-section" id="projects">
            <div className="flex justify-between items-end mb-16">
                <div>
                    <SectionHeader label="PORTFOLIO" title="Featured Work" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {PROJECTS.map((project) => (
                    <ProjectCard
                        key={project.id}
                        title={project.title}
                        description={project.description}
                        image={project.image}
                        alt={project.alt}
                        icon={project.icon}
                        tags={project.tags}
                        links={project.links}
                    />
                ))}
            </div>
        </section>
    )
}
