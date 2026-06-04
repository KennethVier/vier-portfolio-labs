const LINK_CONFIG = {
  github: {
    label: "GitHub",
    icon: "code"
  },
  live: {
    label: "Live",
    icon: "open_in_new"
  }
};

/**
 * ProjectLinks
 * Optional project actions; hidden when no real URLs are available.
 */
export default function ProjectLinks({ links = {} }) {
  const visibleLinks = Object.entries(LINK_CONFIG)
    .map(([key, config]) => ({
      ...config,
      href: links[key]
    }))
    .filter((link) => Boolean(link.href));

  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      {visibleLinks.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/30 px-3 py-2 font-label-caps text-label-caps text-on-surface transition-all duration-300 hover:border-tertiary/60 hover:bg-surface-variant/20 hover:text-tertiary"
        >
          <span className="material-symbols-outlined text-base leading-none">
            {link.icon}
          </span>
          {link.label}
        </a>
      ))}
    </div>
  );
}
