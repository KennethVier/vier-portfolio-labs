import SocialLink from './SocialLink';
import { SOCIAL_LINKS } from './constants';

export default function Footer() {
    return (
        <footer className="w-full max-w-container-max mx-auto px-gutter flex flex-col md:flex-row justify-between items-center gap-stack-gap border-t border-outline-variant/10 py-section-v-sm bg-surface-container-lowest">
            <div className="font-headline-section-mobile text-headline-section-mobile text-primary">VIER.OS</div>
            <p className="font-body-md text-body-md text-on-surface-variant">© 2026 VIER.OS. Engineered for performance.</p>
            <div className="flex gap-6">
                {SOCIAL_LINKS.map((link) => (
                    <SocialLink key={link.label} label={link.label} href={link.href} isExternal={link.isExternal} />
                ))}
            </div>
        </footer>
    )
}

