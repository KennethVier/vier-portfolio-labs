import HeroContent from './HeroContent';
import CodeSnippetPanel from './CodeSnippetPanel';
import CodePlaceholderPanel from './CodePlaceholderPanel';

export default function Hero() {
  return (
    <section id="top" className="hero-grid reveal-section grid items-center gap-12 py-16 md:py-24 lg:min-h-[calc(100svh-72px)] lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
      <HeroContent />
      <div className="relative hidden lg:block" aria-hidden="true">
        <CodeSnippetPanel />
        <CodePlaceholderPanel />
      </div>
    </section>
  );
}
