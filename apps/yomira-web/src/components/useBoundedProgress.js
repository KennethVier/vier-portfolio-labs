import { useEffect, useState } from "react";

export default function useBoundedProgress(active) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) return undefined;

    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 95) return 95;
        const increment = Math.max(1, Math.ceil((95 - current) * 0.08));
        return Math.min(95, current + increment);
      });
    }, 450);

    return () => window.clearInterval(timer);
  }, [active]);

  return [progress, setProgress];
}
