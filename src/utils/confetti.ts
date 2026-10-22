import confetti from 'canvas-confetti';
import { sound } from './audio';

/**
 * Robust, high-impact multi-stage confetti celebration
 */
export function triggerFinishCelebration() {
  sound.playVictory();

  try {
    // 1. Center burst
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#10b981', '#f59e0b', '#c084fc', '#eab308'],
    });

    // 2. Left cannon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e'],
      });
    }, 150);

    // 3. Right cannon
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e'],
      });
    }, 300);
  } catch (err) {
    console.error('Confetti trigger failed:', err);
  }
}
