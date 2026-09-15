import { useEffect } from 'react';

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
}
