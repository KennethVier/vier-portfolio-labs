import SectionHeader from '../../ui/SectionHeader';
import AboutDescription from './AboutDescription';
import StatCard from './StatCard';
import { ABOUT_STATS } from './constants';

/**
 * AboutContent
 * Right side content of about section with description and stats
 */
export default function AboutContent() {
    return (
        <div className="flex-1 space-y-8">
            <div>
                <SectionHeader label="ABOUT ME" title="Building Reliable Software Through Practical Engineering" />
            </div>

            <AboutDescription />

            <div className="grid grid-cols-2 gap-8 pt-4">
                {ABOUT_STATS.map((stat) => (
                    <StatCard
                        key={stat.id}
                        number={stat.number}
                        label={stat.label}
                        color={stat.color}
                    />
                ))}
            </div>
        </div>
    );
}
