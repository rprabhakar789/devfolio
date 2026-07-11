import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { portfolioContent } from '../content/loadContent';
import '../styles/Skills.css';

function Skills() {
  const [filter, setFilter] = useState('all');
  const categories = [
    { id: 'all', label: 'All' },
    ...portfolioContent.skills.map((category) => ({
      id: category.id,
      label: category.category
    }))
  ];

  const getDisplaySkills = () => {
    if (filter === 'all') {
      return portfolioContent.skills.flatMap((category) => category.items);
    }
    return portfolioContent.skills.find((category) => category.id === filter)?.items || [];
  };

  return (
    <section id="skills" className="skills">
      <h2>Skills & Expertise</h2>

      <div className="category-filter">
        {categories.map((cat) => (
          <motion.button
            key={cat.id}
            className={`filter-btn ${filter === cat.id ? 'active' : ''}`}
            onClick={() => setFilter(cat.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {cat.label}
          </motion.button>
        ))}
      </div>

      <motion.div
        className="skills-grid"
        layout
      >
        {getDisplaySkills().map((skill, index) => (
          <motion.div
            key={`${filter}-${skill.name}`}
            className="skill-card"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -5 }}
          >
            <div className="skill-info">
              <h4>{skill.name}</h4>
              <div className="skill-bar">
                <motion.div
                  className="skill-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level ?? 0}%` }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                >
                  {typeof skill.level === 'number' && <span className="skill-level">{skill.level}%</span>}
                </motion.div>
              </div>
              {skill.notes && <p className="skill-note">{skill.notes}</p>}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default Skills;
