import React from 'react';
import { motion } from 'framer-motion';
import { FiBookOpen } from 'react-icons/fi';
import { portfolioContent } from '../content/loadContent';
import '../styles/Education.css';

function Education() {
  const highlights = portfolioContent.education.flatMap((entry) =>
    entry.highlights.map((highlight) => ({
      title: entry.institution,
      detail: highlight
    }))
  );

  return (
    <section id="education" className="education">
      <h2>Education</h2>

      <div className="education-grid">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <p className="education-label">Academic background</p>
          <div className="education-list">
            {portfolioContent.education.map((entry) => (
              <article key={entry.institution} className="education-card">
                <div className="education-icon">
                  <FiBookOpen size={24} />
                </div>
                <div className="education-card-content">
                  <h3>{entry.institution}</h3>
                  <p className="education-degree">{entry.degree}</p>
                  <div className="education-meta">
                    <span>{entry.period}</span>
                    {entry.location && <span>{entry.location}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="education-highlights"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <p className="education-label">Achievements</p>
          <div className="achievement-list">
            {highlights.map((highlight, index) => (
              <article key={`${highlight.title}-${index}`} className="achievement-card">
                <h3>{highlight.title}</h3>
                <p>{highlight.detail}</p>
              </article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Education;
