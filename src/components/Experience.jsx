import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/Experience.css';

function Experience() {
  const [expandedId, setExpandedId] = useState(null);

  const experiences = [
    {
      id: 1,
      company: 'Microsoft',
      position: 'Software Engineer II',
      period: 'May 2025 – Current',
      location: 'Hyderabad',
      highlights: [
        'Re-architected application for seamless, deployment-free client onboarding',
        'Spearheaded AI agent-driven development initiatives with automated test generation',
        'Integrated AI agents with GitHub for end-to-end autonomous task execution',
        'Implemented bulk file upload supporting 20k records per batch'
      ]
    },
    {
      id: 2,
      company: 'Arcesium',
      position: 'Senior Software Engineer',
      period: 'May 2022 – May 2025',
      location: 'Hyderabad',
      highlights: [
        'Led development of secure encrypted storage application serving 10+ clients',
        'Migrated to event-driven architecture, reducing costs by 60%',
        'Enabled real-time search on 10M+ PII records using Lucene Index',
        'Optimized database performance, achieving 70% faster queries'
      ]
    },
    {
      id: 3,
      company: 'Wells Fargo',
      position: 'Software Engineer',
      period: 'Jan 2021 – Apr 2022',
      location: 'Hyderabad',
      highlights: [
        'Delivered Java Spring application for foreign exchange trade reporting',
        'Automated batch job failure monitoring, saving 2 hours daily',
        'Improved security with Spring Security, resolved severity-2 vulnerability',
        'Built React web application for CMaaS'
      ]
    }
  ];

  return (
    <section id="experience" className="experience">
      <h2>Experience</h2>
      <div className="timeline">
        {experiences.map((exp, index) => (
          <motion.div
            key={exp.id}
            className="timeline-item"
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
                <div>
                  <h3>{exp.position}</h3>
                  <p className="company">{exp.company}</p>
                </div>
                <div className="period">{exp.period}</div>
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
