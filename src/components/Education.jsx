import React from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiBookOpen } from 'react-icons/fi';
import { campusHighlights, education } from '../data/profile';
import '../styles/Education.css';

function Education() {
  return (
    <section id="education" className="education">
      <h2>Education</h2>

      <div className="education-grid">
        <motion.article
          className="education-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="education-icon">
            <FiBookOpen size={24} />
          </div>
          <div className="education-card-content">
            <p className="education-label">Academic background</p>
            <h3>{education.institution}</h3>
            <p className="education-degree">{education.degree}</p>
            <div className="education-meta">
              <span>{education.period}</span>
              <span>{education.scoreLabel}: {education.score}</span>
            </div>
          </div>
        </motion.article>

        <motion.div
          className="education-highlights"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <p className="education-label">College highlights</p>
          {campusHighlights.map((highlight) => (
            <article key={highlight.title} className="highlight-card">
              <div className="highlight-icon">
                <FiAward size={20} />
              </div>
              <div>
                <h3>{highlight.title}</h3>
                <p>{highlight.description}</p>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Education;
