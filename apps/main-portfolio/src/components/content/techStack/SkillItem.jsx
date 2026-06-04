/**
 * SkillItem
 * Individual skill item in skill list with dot indicator
 */
export default function SkillItem({ label, dotColor = "bg-primary" }) {
  return (
    <li className="flex items-center gap-2 group cursor-default">
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor} group-hover:scale-150 transition-transform`}>
      </div> 
      {label}
    </li>
  );
}
