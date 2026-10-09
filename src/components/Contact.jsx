import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Copy, Linkedin, FileText, Github, Mail } from 'lucide-react';
import { contact } from '../data/site.js';

export default function Contact() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  return (
    <section id="contact" className="section bg-red contact">
      <span className="section-num" aria-hidden="true">05</span>
      <div className="wrap">
        <h2 className="h-display">Got a problem<br /><span className="tag-box">worth solving?</span></h2>

        <a href={`mailto:${contact.email}`} className="email-big">{contact.email}</a>
        <AnimatePresence>
          {copied && (
            <motion.span className="copied" initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: -3 }} exit={{ scale: 0 }}>
              Copied!
            </motion.span>
          )}
        </AnimatePresence>

        <div className="contact-row">
          <a className="btn primary" href={contact.resume}><Mail size={18} /> Get my resume</a>
          <button className="btn" onClick={copy}><Copy size={18} /> Copy email</button>
          <a className="btn" href={contact.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin size={18} /> LinkedIn</a>
          <a className="btn" href={contact.github} target="_blank" rel="noopener noreferrer"><Github size={18} /> GitHub</a>
          <a className="btn" href="/learnings"><FileText size={18} /> 1-page summary</a>
        </div>
      </div>
    </section>
  );
}
