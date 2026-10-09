import { intro, groups, resultOf } from '../data/learnings.js';

export default function Learnings() {
  return (
    <main className="lp">
      <header className="lp-head">
        <div>
          <a href="/" className="lp-name">Aditi Agrawal</a>
          <h1>What I built, and what it taught me</h1>
        </div>
        <p className="lp-contact">
          Bangalore · aditiagrawal2026@gmail.com<br />
          <a href="https://linkedin.com/in/venture-with-aditi">linkedin.com/in/venture-with-aditi</a>
        </p>
      </header>

      <p className="lp-intro">{intro}</p>

      {groups.map(g => (
        <section key={g.label} className="lp-group">
          <h2>{g.label}</h2>
          <div className="lp-grid">
            {g.items.map(item => (
              <article key={item.title} className="lp-card">
                <h3>{item.title}</h3>
                <p className="lp-did">{item.did}</p>
                <p className="lp-result">{resultOf(item)}</p>
                <p className="lp-learned"><span>Learned</span>{item.learned}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <footer className="lp-foot no-print">
        <a href="/">← Back to the full portfolio</a>
        <button type="button" onClick={() => window.print()}>Save as PDF</button>
      </footer>
    </main>
  );
}
