/**
 * NavLink
 * Individual navigation link with active state styling
 */
export default function NavLink({ label, href, className = "", onClick }) {
  const baseClasses = "inline-flex min-h-11 items-center font-label-caps text-label-caps text-on-surface-variant transition-colors duration-200 hover:text-tertiary";

  return (
    <a href={href} className={`${baseClasses} ${className}`} onClick={onClick}>
      {label}
    </a>
  );
}
