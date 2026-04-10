import Reveal from './Reveal.jsx';

export default function Contact() {
  return (
    <section id="contact">
      <div className="container">
        <Reveal className="contact-inner">
          <h2>Have a problem<br />worth solving?</h2>
          <p>Whether it's growth strategy, a research deep-dive, content that converts, or an AI agent to automate your workflow — I'm interested.</p>
          <a href="mailto:aditi.agrawali23@iimranchi.ac.in" className="contact-email">
            aditi.agrawali23@iimranchi.ac.in
          </a>
          <div className="contact-links">
            <a href="https://linkedin.com/in/aditi-agrawal" target="_blank" rel="noopener">LinkedIn</a>
            <span>·</span>
            <a href="https://iimranchi.ac.in/its-okay-to-not-be-okay/" target="_blank" rel="noopener">Blog</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
