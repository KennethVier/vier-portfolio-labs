/**
 * ProjectHeader
 * Project card header with title and icon
 */
export default function ProjectHeader({ title, icon }) {
  return (
    <div className="flex justify-between items-start">
      <h3 className="font-headline-section text-2xl text-primary">{title}</h3>
      <span className="material-symbols-outlined text-tertiary group-hover:rotate-45 transition-transform duration-300">
        {icon}
      </span>
    </div>
  );
}
