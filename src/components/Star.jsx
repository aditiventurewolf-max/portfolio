// Chunky 12-point burst used for badges. Black stroke so it reads as a sticker.
export default function Star({ className = '', fill = 'var(--yellow)' }) {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const r = i % 2 === 0 ? 48 : 36;
    const a = (Math.PI / 12) * i - Math.PI / 2;
    pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
  }
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <polygon points={pts.join(' ')} fill={fill} stroke="#000" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}
