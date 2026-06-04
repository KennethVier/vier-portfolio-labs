import React from 'react';
import HeroContent from './HeroContent';
import CodeSnippetPanel from './CodeSnippetPanel';
import CodePlaceholderPanel from './CodePlaceholderPanel';

export default function Hero() {
  return (
    <section className="min-h-204.75 flex flex-col md:flex-row items-center gap-16 py-section-v-sm reveal-section">
      <HeroContent />
      <div className="flex-1 relative hidden lg:block">
        <CodeSnippetPanel />
        <CodePlaceholderPanel />
      </div>
    </section>
  );
}
