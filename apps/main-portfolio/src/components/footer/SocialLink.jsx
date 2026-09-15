/**
 * SocialLink
 * Individual social media link component
 */
export default function SocialLink({ label, href, isExternal = false }) {
  return (
    <a
      className="inline-flex min-h-11 items-center font-label-code text-sm text-on-surface-variant transition-colors duration-200 hover:text-tertiary"
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer' : undefined}
    >
      {label}
    </a>
  );
}
