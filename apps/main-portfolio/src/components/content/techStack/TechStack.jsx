import SectionHeader from '../../ui/SectionHeader';
import SkillCategory from './SkillCategory';
import { SKILL_CATEGORIES } from './constants';

export default function TechStack() {
    return (
        <section className="py-section-v-lg reveal-section" id="skills">
            <SectionHeader label="TOOLKIT" title="Technical Expertise" centered={true} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {SKILL_CATEGORIES.map((category) => (
                    <SkillCategory
                        key={category.id}
                        title={category.title}
                        icon={category.icon}
                        borderColor={category.borderColor}
                        iconColor={category.iconColor}
                        dotColor={category.dotColor}
                        skills={category.skills}
                    />
                ))}
            </div>
        </section>
    )
}
