/**
 * SocialLink
 * Individual social media link component
 */
export default function SocialLink({ label, href }) {
  return (
    <a 
      className="font-label-code text-label-code text-on-surface-variant hover:text-tertiary transition-all duration-300"
      href={href}
    >
      {label}
    </a>
  );
}
