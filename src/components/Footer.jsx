import React from 'react';
import { motion } from 'framer-motion';
import '../styles/Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      className="footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <div className="footer-content">
        <div className="footer-text">
          <p>&copy; {currentYear} Rahul Prabhakar. All rights reserved.</p>
          <p>Designed & Built with <span className="heart">💜</span> using React + Framer Motion</p>
        </div>
        <div className="footer-links">
          <a href="https://github.com/rprabhakar789" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href="https://linkedin.com/in/rp789" target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a href="mailto:prabh.rahul98@gmail.com">
            Email
          </a>
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;
