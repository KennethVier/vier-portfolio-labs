/**
 * NavLink
 * Individual navigation link with active state styling
 */
export default function NavLink({ label, href, isActive = false, className = "" }) {
  const baseClasses = "font-label-caps text-label-caps transition-colors duration-300";
  const activeClasses = isActive 
    ? "text-primary border-b-2 border-primary pb-1"
    : "text-on-surface-variant hover:text-on-surface";

  return (
    <a href={href} className={`${baseClasses} ${activeClasses} ${className}`}>
      {label}
    </a>
  );
}
