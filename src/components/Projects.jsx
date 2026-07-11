import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink, FiGithub } from 'react-icons/fi';
import { portfolioContent } from '../content/loadContent';
import '../styles/Projects.css';

function Projects() {
  const [filter, setFilter] = useState('all');
  const { projects, projectCategories: categories } = portfolioContent;

  const displayProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.category === filter);

  return (
    <section id="projects" className="projects">
      <h2>Featured Projects</h2>

      <div className="project-filter">
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

      <motion.div className="projects-grid" layout>
        {displayProjects.map((project, index) => (
          <motion.div
            key={project.id}
            className="project-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ y: -10 }}
          >
            <div className="project-content">
              <h3>{project.name}</h3>
              <p className="description">{project.summary}</p>

              <div className="tags">
                {project.technologies.map((tag, i) => (
                  <motion.span
                    key={i}
                    className="tag"
                    whileHover={{ scale: 1.1 }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>

              <div className="project-links">
                {project.links.github && (
                  <motion.a
                    href={project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiGithub size={20} /> GitHub
                  </motion.a>
                )}
                {project.links.demo && (
                  <motion.a
                    href={project.links.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-link"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FiExternalLink size={20} /> Live Demo
                  </motion.a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default Projects;
