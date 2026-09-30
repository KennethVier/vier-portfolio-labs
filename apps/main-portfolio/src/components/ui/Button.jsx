/**
 * Button
 * Reusable button component (primary/secondary variants)
 */
export default function Button({ 
  label, 
  href = "#", 
  variant = "primary",
  className = "",
  onClick
}) {
  const baseClasses = "inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 font-label-caps text-label-caps transition-colors duration-200 sm:px-8";
  
  const variantClasses = variant === "primary"
    ? "bg-primary text-on-primary hover:bg-primary-fixed"
    : "border border-outline-variant text-on-surface hover:border-tertiary/60 hover:bg-surface-variant/20";

  return (
    <a 
      href={href}
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={onClick}
    >
      {label}
    </a>
  );
}
