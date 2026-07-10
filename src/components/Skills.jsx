import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../styles/Skills.css';

function Skills() {
  const [filter, setFilter] = useState('all');

  const skillsByCategory = {
    languages: [
      { name: 'Java', level: 95 },
      { name: 'Python', level: 90 },
      { name: 'JavaScript', level: 90 },
      { name: 'Kotlin', level: 85 },
      { name: 'C++', level: 85 },
      { name: 'SQL', level: 92 }
    ],
    frameworks: [
      { name: 'Spring Boot', level: 95 },
      { name: 'React.js', level: 90 },
      { name: 'MyBatis', level: 88 },
      { name: 'Material UI', level: 85 }
    ],
    tools: [
      { name: 'AWS', level: 90 },
      { name: 'Docker', level: 88 },
      { name: 'Kubernetes', level: 85 },
      { name: 'GitHub', level: 95 },
      { name: 'Kafka', level: 85 },
      { name: 'ElasticSearch', level: 80 }
    ],
    specialties: [
      { name: 'Microservices', level: 92 },
      { name: 'System Design', level: 90 },
      { name: 'Database Optimization', level: 88 },
      { name: 'AI Agents', level: 85 }
    ]
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'languages', label: 'Languages' },
    { id: 'frameworks', label: 'Frameworks' },
    { id: 'tools', label: 'Tools & Tech' },
    { id: 'specialties', label: 'Specialties' }
  ];

  const getDisplaySkills = () => {
    if (filter === 'all') {
      return Object.values(skillsByCategory).flat();
    }
    return skillsByCategory[filter] || [];
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
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ y: -5 }}
          >
            <div className="skill-info">
              <h4>{skill.name}</h4>
              <div className="skill-bar">
                <motion.div
                  className="skill-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level}%` }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                >
                  <span className="skill-level">{skill.level}%</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default Skills;
