import SectionHeader from '../../ui/SectionHeader';
import ExperienceCard from './ExperienceCard';
import { EXPERIENCE_ROLES } from './constants';

export default function Experience() {
    return (
        <section className="py-section-v-lg reveal-section" id="experience">
            <SectionHeader label="JOURNEY" title="Professional Experience" />
            <div className="relative space-y-12">
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
