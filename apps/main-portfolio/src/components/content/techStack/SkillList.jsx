import SkillItem from './SkillItem';

/**
 * SkillList
 * List of skills for a category
 */
export default function SkillList({ skills = [], dotColor = "bg-primary" }) {
  return (
    <ul className="space-y-4 font-label-code text-label-code text-on-surface-variant">
      {skills.map((skill) => (
        <SkillItem key={skill} label={skill} dotColor={dotColor} />
      ))}
    </ul>
  );
}
