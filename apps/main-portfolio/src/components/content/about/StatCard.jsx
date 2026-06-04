/**
 * StatCard
 * Stat card showing number and label (years experience, projects built)
 */
export default function StatCard({ number, label, color }) {
    return (
        <div className="group cursor-default">
            <p className={`font-display-hero text-4xl ${color} mb-1 group-hover:scale-110 transition-transform origin-left`}>
                {number}
            </p>
            <p className="font-label-caps text-label-caps text-outline">
                {label}
            </p>
        </div>
    );
}
