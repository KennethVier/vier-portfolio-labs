import { useEffect, useState } from 'react';
import NavLink from './NavLink';
import HireButton from './HireButton';

const NAV_ITEMS = [
  ["Work", "#projects"],
  ["Experience", "#experience"],
  ["Stack", "#skills"],
  ["Focus", "#capabilities"],
  ["About", "#about"],
  ["Contact", "#contact"]
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <header className="site-header fixed inset-x-0 top-0 z-50 border-b border-outline-variant/20 bg-background/85 backdrop-blur-xl">
      <div className="site-shell flex h-18 items-center justify-between">
        <a
          className="font-headline-section text-xl font-semibold tracking-[-0.04em] text-primary md:text-2xl"
          href="#top"
          aria-label="VIER.OS home"
          onClick={() => setIsOpen(false)}
        >
          VIER<span className="text-tertiary">.OS</span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8" aria-label="Primary navigation">
          {NAV_ITEMS.map(([label, href]) => (
            <NavLink key={href} label={label} href={href} />
          ))}
        </nav>

        <div className="hidden lg:block">
          <HireButton />
        </div>

        <button
          type="button"
          className="mobile-menu-button inline-flex h-11 w-11 items-center justify-center rounded-xl border border-outline-variant/40 text-on-surface lg:hidden"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {isOpen ? "close" : "menu"}
          </span>
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`mobile-navigation border-t border-outline-variant/20 bg-surface-container-lowest/95 lg:hidden ${isOpen ? "is-open" : ""}`}
      >
        <nav className="site-shell grid gap-1 py-4" aria-label="Mobile navigation">
          {NAV_ITEMS.map(([label, href]) => (
            <NavLink
              key={href}
              label={label}
              href={href}
              className="rounded-lg px-3 py-3 text-sm"
              onClick={() => setIsOpen(false)}
            />
          ))}
          <HireButton className="mt-3 justify-center" />
        </nav>
      </div>
    </header>
  );
}
