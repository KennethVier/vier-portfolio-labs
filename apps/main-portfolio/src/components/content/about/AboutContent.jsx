import SectionHeader from '../../ui/SectionHeader';
import AboutDescription from './AboutDescription';

/**
 * AboutContent
 * Right side content of about section with description and stats
 */
export default function AboutContent() {
    return (
        <div className="space-y-7">
            <div>
                <SectionHeader label="ABOUT KENNETH" title="Engineer first. Always learning beyond the stack." />
            </div>

            <AboutDescription />

            <div className="flex flex-wrap gap-3 border-t border-outline-variant/20 pt-6 font-label-code text-xs text-tertiary sm:text-sm">
                <span>BS Information Technology</span>
                <span aria-hidden="true">/</span>
                <span>Cum Laude</span>
                <span aria-hidden="true">/</span>
                <span>Polytechnic University of the Philippines</span>
            </div>
        </div>
    );
}
