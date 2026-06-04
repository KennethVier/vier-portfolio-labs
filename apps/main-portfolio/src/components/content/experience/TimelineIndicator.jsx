/**
 * TimelineIndicator
 * Animated dot on timeline for experience entries
 */
export default function TimelineIndicator({ dotColor, hoverDotColor, dotGlow }) {
  return (
    <div className={`absolute left-6 top-1.5 w-4 h-4 rounded-full ${dotColor} hidden md:block ${hoverDotColor} group-hover:scale-150 transition-all ${dotGlow}`}>
    </div>
  );
}
