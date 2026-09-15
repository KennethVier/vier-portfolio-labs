/**
 * HireButton
 * Persistent contact action in the portfolio header.
 */
export default function HireButton({ className = "" }) {
  return (
    <a
      className={`inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 font-label-caps text-label-caps text-on-primary transition-colors duration-200 hover:bg-primary-fixed ${className}`}
      href="mailto:kennethcerrado23@gmail.com?subject=Portfolio%20Inquiry%20-%20Kenneth%20Vier%20Cerrado"
    >
      Connect
    </a>
  );
}
