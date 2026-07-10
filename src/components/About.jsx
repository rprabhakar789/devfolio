import React from 'react';
import { motion } from 'framer-motion';
import '../styles/About.css';

function About() {
  return (
    <section id="about" className="about">
      <div className="about-container">
        <motion.div
          className="about-content"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2>About Me</h2>
          <div className="about-text">
            <p>
              I'm a Software Engineer II at Microsoft with 4+ years of experience building scalable systems and innovative solutions. My passion lies in architecting elegant solutions to complex problems and driving development velocity through automation and AI.
            </p>
            <p>
              At Arcesium, I led critical initiatives that reduced costs by 60% and optimized database performance by 70%. Currently at Microsoft, I'm spearheading AI agent-driven development initiatives and architecting deployment-free client onboarding systems.
            </p>
            <p>
              When I'm not coding, I enjoy mentoring junior developers, contributing to open-source, and exploring the intersection of AI and software engineering.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="about-stats"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {[
            { label: 'Years Experience', value: '4+' },
            { label: 'Companies', value: '4' },
            { label: 'Projects Built', value: '25+' },
            { label: 'Team Members Mentored', value: '10+' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="stat-card"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default About;
