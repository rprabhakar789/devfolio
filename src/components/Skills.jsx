import React from 'react';
import { motion } from 'framer-motion';
import { portfolioContent } from '../content/loadContent';
import '../styles/Skills.css';

function Skills() {
  return (
    <section id="skills" className="skills">
      <p className="skills-eyebrow">// skills</p>
      <h2>Tech Stack</h2>
      <p className="skills-intro">Languages, frameworks and tools I reach for to ship reliable software.</p>

      <div className="skills-grid">
        {portfolioContent.skills.map((category, index) => (
          <motion.div
            key={category.id}
            className="skill-category-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.08, 0.4) }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <h3>{category.category}</h3>
            <div className="skill-chip-row">
              {category.items.map((skill) => (
                <span key={skill.name} className="skill-chip">
                  {skill.name}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default Skills;
