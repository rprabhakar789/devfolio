import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaMicrosoft } from 'react-icons/fa';
import { HiOfficeBuilding } from 'react-icons/hi';
import { SiSamsung, SiWellsfargo } from 'react-icons/si';
import { experiences } from '../data/profile';
import '../styles/Experience.css';

function CompanyLogo({ company, logo }) {
  switch (logo) {
    case 'microsoft':
      return <FaMicrosoft aria-label={`${company} logo`} />;
    case 'samsung':
      return <SiSamsung aria-label={`${company} logo`} />;
    case 'wells-fargo':
      return <SiWellsfargo aria-label={`${company} logo`} />;
    case 'arcesium':
      return <span className="company-monogram" aria-label={`${company} logo`}>A</span>;
    case 'enliven':
      return <span className="company-monogram" aria-label={`${company} logo`}>E</span>;
    default:
      return <HiOfficeBuilding aria-label={`${company} logo`} />;
  }
}

function Experience() {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section id="experience" className="experience">
      <h2>Experience</h2>
      <div className="timeline">
        {experiences.map((exp, index) => (
          <motion.div
            key={exp.id}
            className="timeline-item"
            style={{
              '--company-accent': exp.theme.accent,
              '--company-accent-soft': exp.theme.accentSoft,
              '--company-surface-from': exp.theme.surfaceFrom,
              '--company-surface-to': exp.theme.surfaceTo,
              '--company-border': exp.theme.border,
              '--company-glow': exp.theme.glow
            }}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="timeline-marker"></div>

            <motion.div
              className={`experience-card ${expandedId === exp.id ? 'expanded' : ''}`}
              onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="experience-header">
                <div className="company-brand">
                  <div className="company-logo">
                    <CompanyLogo company={exp.company} logo={exp.logo} />
                  </div>
                  <div>
                    <p className="company">{exp.company}</p>
                    {exp.engagement && <p className="company-engagement">{exp.engagement}</p>}
                    <h3>{exp.position}</h3>
                  </div>
                </div>
                <div className="period-wrapper">
                  <div className="period">{exp.period}</div>
                </div>
              </div>

              <motion.div
                className="experience-details"
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: expandedId === exp.id ? 1 : 0,
                  height: expandedId === exp.id ? 'auto' : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <p className="location">📍 {exp.location}</p>
                <ul className="highlights">
                  {exp.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default Experience;
