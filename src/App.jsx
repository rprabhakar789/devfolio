import React, { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Journey from './components/Journey';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { useTheme } from './hooks/useTheme';

const Chatbot = lazy(() => import('./components/Chatbot'));

function App() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app">
      <Header scrollPosition={scrollPosition} theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <Hero />
        <About />
        <Journey />
        <Skills />
        <Projects />
        <Contact />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>
    </div>
  );
}

export default App;
