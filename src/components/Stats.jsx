import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';
import { stats } from '../data/site.js';

const COLORS = ['bg-yellow', 'bg-violet', 'bg-red', 'bg-white'];

function Counter({ value, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, { duration: 1.2, ease: 'easeOut', onUpdate: v => setN(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return <b ref={ref}>{n.toLocaleString("en-IN")}{suffix}</b>;
}

export default function Stats() {
  return (
    <section className="stats" aria-label="Numbers">
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={s.label} className={`stat ${COLORS[i]}`}>
            <Counter value={s.value} suffix={s.suffix} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
