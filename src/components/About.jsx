import React from 'react';
import { motion } from 'framer-motion';
import { getExperienceYears, impactStats } from '../data/profile';
import '../styles/About.css';

function About() {
  const experienceYears = getExperienceYears();

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
              I'm a Software Engineer II at Microsoft with {experienceYears} years of experience building scalable platforms, AI-assisted engineering workflows, and high-throughput data systems.
            </p>
            <p>
              I graduated from NIT Warangal with a B.Tech in Electronics and Communication, where I also helped run the ACM Student Chapter. My journey has taken me from a Samsung R&D internship and early product work for Resolab to secure platform engineering at Arcesium and AI-driven developer productivity at Microsoft.
            </p>
            <p>
              When I'm not coding, you'll usually find me playing badminton, rewatching Game of Thrones for the nth time, or exploring AI and software engineering.
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
            { label: 'Years Experience', value: experienceYears },
            ...impactStats
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
