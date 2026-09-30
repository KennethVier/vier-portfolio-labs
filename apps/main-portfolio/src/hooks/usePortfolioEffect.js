import { useEffect } from 'react';
import { trackEvent } from '../utils/analytics';

export function usePortfolioEffects() {
  useEffect(() => {
    const glow = document.getElementById('cursor-glow');
    const updateGlow = (event) => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      glow?.style.setProperty('--mouse-x', `${x}%`);
      glow?.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', updateGlow, { passive: true });
    return () => window.removeEventListener('mousemove', updateGlow);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const viewedSections = new Set();
    const sections = document.querySelectorAll('.reveal-section[id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
          return;
        }

        const sectionName = entry.target.id;
        if (!sectionName || viewedSections.has(sectionName)) {
          return;
        }

        viewedSections.add(sectionName);
        trackEvent('section_view', { section_name: sectionName });
        observer.unobserve(entry.target);
      });
    }, { threshold: [0.35] });

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
}
