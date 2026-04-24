export function animateCount(
  to: number,
  duration: number,
  onUpdate: (v: number) => void,
): void {
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    onUpdate(Math.round(eased * to));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
