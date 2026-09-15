import SectionHeader from '../../ui/SectionHeader';
import ExperienceCard from './ExperienceCard';
import { EXPERIENCE_ROLES } from './constants';

export default function Experience() {
    return (
        <section className="section-block reveal-section" id="experience">
            <div className="section-intro max-w-3xl">
                <SectionHeader label="PROFESSIONAL EXPERIENCE" title="Engineering in real delivery environments" />
                <p className="text-base leading-7 text-on-surface-variant sm:text-lg sm:leading-8">
                    Hands-on work across enterprise Java systems, C# automation, PostgreSQL-backed features,
                    reporting, exports, and responsive web interfaces.
                </p>
            </div>
            <div className="relative space-y-6 md:space-y-8">
                <div className="absolute left-8 top-0 bottom-0 w-px bg-outline-variant/20 hidden md:block"></div>
                {EXPERIENCE_ROLES.map((role) => (
                    <ExperienceCard
                        key={role.id}
                        title={role.title}
                        company={role.company}
                        period={role.period}
                        type={role.type}
                        description={role.description}
                        highlights={role.highlights}
                        tags={role.tags}
                        borderColor={role.borderColor}
                        dotColor={role.dotColor}
                        hoverDotColor={role.hoverDotColor}
                        dotGlow={role.dotGlow}
                        titleColor={role.titleColor}
                    />
                ))}
            </div>
        </section>
    )
}
