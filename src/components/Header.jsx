import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMenu, FiMoon, FiSun, FiX } from 'react-icons/fi';
import '../styles/Header.css';

function Header({ scrollPosition, theme, onToggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const isLight = theme === 'light';

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <motion.header 
      className={`header ${scrollPosition > 50 ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="header-container">
        <motion.div 
          className="logo"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="logo-bracket">&lt;</span>
          <span className="logo-text">rp</span>
          <span className="logo-bracket">/&gt;</span>
        </motion.div>

        <button 
          className="menu-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        <nav className={`nav ${isOpen ? 'open' : ''}`}>
          {['home', 'about', 'journey', 'skills', 'projects', 'contact'].map((item) => (
            <button
              key={item}
              className="nav-link"
              onClick={() => scrollToSection(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>

        <motion.button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
          title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {isLight ? <FiMoon size={20} /> : <FiSun size={20} />}
        </motion.button>
      </div>
    </motion.header>
  );
}

export default Header;
