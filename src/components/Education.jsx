import React from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiBookOpen } from 'react-icons/fi';
import { achievements, campusHighlights, education } from '../data/profile';
import '../styles/Education.css';

function Education() {
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
            {education.map((entry) => (
              <article key={entry.institution} className="education-card">
                <div className="education-icon">
                  <FiBookOpen size={24} />
                </div>
                <div className="education-card-content">
                  <h3>{entry.institution}</h3>
                  <p className="education-degree">{entry.degree}</p>
                  <div className="education-meta">
                    <span>{entry.period}</span>
                    <span>{entry.scoreLabel}: {entry.score}</span>
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
            {achievements.map((achievement) => (
              <article key={achievement.title} className="achievement-card">
                <h3>{achievement.title}</h3>
                <p>{achievement.detail}</p>
              </article>
            ))}
          </div>
          <p className="education-label education-subheading">Leadership</p>
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
