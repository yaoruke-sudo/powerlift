import { useEffect } from 'react';

const MicroFeedback = () => {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest('button, a, input[type="range"], [data-haptic]');

      if (!interactive || !('vibrate' in navigator)) return;
      if (interactive.closest('nav, [data-haptic="off"]')) return;

      const pulse = interactive instanceof HTMLInputElement && interactive.type === 'range' ? 4 : 8;
      navigator.vibrate(pulse);
    };

    window.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
    };
  }, []);

  return null;
};

export default MicroFeedback;
