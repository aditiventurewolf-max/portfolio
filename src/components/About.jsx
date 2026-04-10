import Reveal from './Reveal.jsx';

export default function About() {
  return (
    <section id="about">
      <div className="container">
        <div className="about-layout">
          <Reveal className="about-text">
            <span className="eyebrow">About</span>
            <h2>Jack of all trades.<br /><em>Master of some.</em></h2>
            <p>I'm finishing my undergrad at IIM Ranchi while working on growth strategy, content marketing, and helping early-stage ventures find their voice. Curiosity is my driving force.</p>
            <p>I believe the best businesses solve real problems with obsessive execution. Lately I've been building AI tools that handle the repetitive work so I can focus on the problems that actually require thinking.</p>
            <div className="about-aside">
              <strong>Money-back guarantee.</strong> Inspired by Dominos: if I don't fit into the role and organization in a week, you get your money back.
            </div>
            <div className="about-chips">
              <span>🐱 Cat person</span>
              <span>⏰ Alarm enthusiast</span>
              <span>🥬 Anti-spinach</span>
              <span>📚 IIM Ranchi</span>
            </div>
          </Reveal>

          <Reveal className="about-visual">
            <figure className="about-portrait">
              <img
                src="/assets/images/aditi.jpg"
                alt="Aditi Agrawal"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </figure>
            <blockquote className="about-quote">
              "Knowledge is not what's in your head but what can be shared."
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
