import React from 'react';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { portfolioContent } from '../content/loadContent';
import '../styles/About.css';

function About() {
  return (
    <section id="about" className="about">
      <div className="about-container">
        <motion.div
          className="about-content"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2>About Me</h2>
          <div className="about-text about-markdown">
            <Markdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                p: ({ children }) => <p>{children}</p>
              }}
            >
              {portfolioContent.about.markdown}
            </Markdown>
          </div>
        </motion.div>

        <motion.div
          className="about-stats"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {portfolioContent.aboutStats.map((stat, index) => {
            const CardTag = stat.href ? motion.a : motion.div;
            const linkProps = stat.href
              ? { href: stat.href, target: '_blank', rel: 'noopener noreferrer' }
              : {};

            return (
              <CardTag
                key={index}
                className={`stat-card ${stat.href ? 'stat-card-link' : ''}`}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                {...linkProps}
              >
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </CardTag>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default About;
