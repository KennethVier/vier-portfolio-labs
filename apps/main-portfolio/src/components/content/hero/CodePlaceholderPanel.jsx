/**
 * CodePlaceholderPanel
 * Floating placeholder panel below code snippet
 */
export default function CodePlaceholderPanel() {
  return (
    <div className="absolute -bottom-10 -right-10 glass-panel w-72 h-48 rounded-2xl p-6 border-primary/30 shadow-2xl animate-float-delayed">
      <div className="h-2 w-20 bg-primary/20 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-surface-variant rounded-sm"></div>
        <div className="h-4 w-4/5 bg-surface-variant rounded-sm"></div>
        <div className="h-4 w-3/4 bg-surface-variant rounded-sm"></div>
      </div>
    </div>
  );
}
