import SocialLink from './SocialLink';
import { SOCIAL_LINKS } from './constants';

export default function Footer() {
    return (
        <footer className="site-shell flex flex-col items-center justify-between gap-6 border-t border-outline-variant/10 py-10 text-center sm:py-12 md:flex-row md:text-left">
            <div className="font-headline-section text-xl font-semibold tracking-[-0.04em] text-primary">VIER<span className="text-tertiary">.OS</span></div>
            <p className="font-body-md text-sm text-on-surface-variant">© 2026 Kenneth Vier Cerrado. Designed and engineered with React.</p>
            <div className="flex gap-6">
                {SOCIAL_LINKS.map((link) => (
                    <SocialLink key={link.label} label={link.label} href={link.href} isExternal={link.isExternal} />
                ))}
            </div>
        </footer>
    )
}
