/**
 * HireButton
 * "Hire Me" button in header with primary styling and glow effect
 */
export default function HireButton() {
  return (
    <button className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-caps text-label-caps hover:scale-105 active:scale-95 transition-all duration-300 hover:shadow-[0_0_20px_rgba(191,194,255,0.4)]">
      Hire Me
    </button>
  );
}
