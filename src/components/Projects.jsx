import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiGithub, FiExternalLink } from 'react-icons/fi';
import '../styles/Projects.css';

function Projects() {
  const [filter, setFilter] = useState('all');

  const projects = [
    {
      id: 1,
      title: 'TinyUrl',
      description: 'A URL shortener application with analytics and custom URLs',
      tags: ['Java', 'Spring Boot', 'Redis'],
      category: 'backend',
      github: 'https://github.com/rprabhakar789/TinyUrl'
    },
    {
      id: 2,
      title: 'FileManager',
      description: 'In-memory file manager system with CRUD operations',
      tags: ['Java', 'Data Structures'],
      category: 'backend',
      github: 'https://github.com/rprabhakar789/FileManager'
    },
    {
      id: 3,
      title: 'Splitwise LLD',
      description: 'Low-level design of a bill-splitting application',
      tags: ['System Design', 'Java'],
      category: 'system-design',
      github: 'https://github.com/rprabhakar789/Splitwise'
    },
    {
      id: 4,
      title: 'KnowYourTools',
      description: 'Curated collection of essential commands and configurations',
      tags: ['Documentation', 'DevOps'],
      category: 'tools',
      github: 'https://github.com/rprabhakar789/KnowYourTools'
    },
    {
      id: 5,
      title: 'Stocker',
      description: 'Full-stack app displaying stock information from dummy API',
      tags: ['React', 'Node.js', 'APIs'],
      category: 'fullstack',
      github: 'https://github.com/rprabhakar789/stocker'
    },
    {
      id: 6,
      title: 'Todo CLI',
      description: 'C++ command-line task management application',
      tags: ['C++', 'CLI'],
      category: 'tools',
      github: 'https://github.com/rprabhakar789/Todo-CLI'
    }
  ];

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'backend', label: 'Backend' },
    { id: 'fullstack', label: 'Full Stack' },
    { id: 'system-design', label: 'System Design' },
    { id: 'tools', label: 'Tools' }
  ];

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
              <h3>{project.title}</h3>
              <p className="description">{project.description}</p>

              <div className="tags">
                {project.tags.map((tag, i) => (
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
                <motion.a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiGithub size={20} /> GitHub
                </motion.a>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default Projects;
