import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FaMicrosoft } from 'react-icons/fa';
import { FiBookOpen, FiCalendar } from 'react-icons/fi';
import { HiOfficeBuilding } from 'react-icons/hi';
import { SiSamsung, SiWellsfargo } from 'react-icons/si';
import { portfolioContent } from '../content/loadContent';
import '../styles/Journey.css';

const MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
};

function getStartTimestamp(period = '') {
  const normalized = period.replace('–', '-');
  const [startPart] = normalized.split('-');
  const trimmed = startPart?.trim() || normalized.trim();
  const monthMatch = trimmed.match(/([A-Za-z]{3,9})\s+(\d{4})/);

  if (monthMatch) {
    const monthKey = monthMatch[1].slice(0, 3).toLowerCase();
    const year = Number(monthMatch[2]);
    const month = MONTH_INDEX[monthKey] ?? 0;
    return new Date(year, month, 1).getTime();
  }

  const yearMatch = trimmed.match(/(\d{4})/);
  if (yearMatch) {
    return new Date(Number(yearMatch[1]), 0, 1).getTime();
  }

  return Number.MAX_SAFE_INTEGER;
}

function StopIcon({ stop }) {
  if (stop.kind === 'education') {
    return <FiBookOpen size={18} aria-label={`${stop.title} education`} />;
  }

  switch (stop.logo) {
    case 'microsoft':
      return <FaMicrosoft size={18} aria-label={`${stop.title} logo`} />;
    case 'samsung':
      return <SiSamsung size={18} aria-label={`${stop.title} logo`} />;
    case 'wells-fargo':
      return <SiWellsfargo size={18} aria-label={`${stop.title} logo`} />;
    case 'arcesium':
      return <span className="journey-stop-monogram">A</span>;
    case 'enliven':
      return <span className="journey-stop-monogram">R</span>;
    default:
      return <HiOfficeBuilding size={18} aria-label={`${stop.title} logo`} />;
  }
}

function Journey() {
  const reduceMotion = useReducedMotion();
  const rowRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const journeyStops = useMemo(() => {
    const educationStops = portfolioContent.education.map((entry, index) => ({
      id: `education-${index}`,
      kind: 'education',
      label: 'Education',
      title: entry.institution,
      subtitle: entry.subtitle || entry.degree,
      period: entry.period,
      location: entry.location,
      achievements: entry.achievements || entry.highlights || [],
      stack: entry.stack || [],
      highlightBlock: entry.highlightBlock || '',
      logo: 'education',
      startTimestamp: getStartTimestamp(entry.period),
      orderWeight: 1
    }));

    const experienceStops = portfolioContent.experience.map((entry, index) => ({
      id: `experience-${entry.id || index}`,
      kind: 'experience',
      label: 'Work',
      title: entry.company,
      subtitle: entry.subtitle || entry.role,
      period: entry.period,
      location: entry.location,
      achievements: entry.achievements || entry.highlights || [],
      stack: entry.stack || [],
      highlightBlock: entry.highlightBlock || entry.engagement || '',
      logo: entry.logo || '',
      startTimestamp: getStartTimestamp(entry.period),
      orderWeight: 2
    }));

    return [...educationStops, ...experienceStops].sort(
      (a, b) => a.startTimestamp - b.startTimestamp || a.orderWeight - b.orderWeight
    );
  }, []);

  useEffect(() => {
    const updateActiveIndex = () => {
      const viewportCenter = window.innerHeight / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      rowRefs.current.forEach((row, index) => {
        if (!row) {
          return;
        }
        const rect = row.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex((current) => (current === closestIndex ? current : closestIndex));
    };

    updateActiveIndex();
    window.addEventListener('scroll', updateActiveIndex, { passive: true });
    window.addEventListener('resize', updateActiveIndex);

    return () => {
      window.removeEventListener('scroll', updateActiveIndex);
      window.removeEventListener('resize', updateActiveIndex);
    };
  }, []);

  return (
    <section id="journey" className="journey journey-map">
      <h2>My Journey</h2>
      <p className="journey-intro">A journey of learning, growth and impact</p>

      <div className="journey-flow">
        {journeyStops.map((stop, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          const highlights = stop.achievements.slice(0, 5);

          return (
            <article
              key={stop.id}
              className={`journey-row ${isActive ? 'active' : ''}`}
              ref={(element) => {
                rowRefs.current[index] = element;
              }}
            >
              <div className="journey-left">
                <p className={`journey-left-title ${isActive ? 'active' : ''}`}>{stop.title}</p>
                <p className="journey-left-subtitle">{stop.subtitle}</p>
                <p className="journey-left-period">{stop.period}</p>
              </div>

              <div className="journey-track" aria-hidden="true">
                {index > 0 && <span className={`journey-line journey-line-top ${isComplete ? 'complete' : ''}`} />}
                <span className={`journey-stop-pin ${isActive ? 'active' : ''}`}>
                  <StopIcon stop={stop} />
                </span>
                {isActive && <motion.span className="journey-nav-arrow" initial={false} animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} />}
                {index < journeyStops.length - 1 && (
                  <span className={`journey-line journey-line-bottom ${isComplete ? 'complete' : ''}`} />
                )}
              </div>

              <motion.div
                className={`journey-detail-card ${isActive ? 'expanded' : 'collapsed'}`}
                initial={false}
                animate={reduceMotion ? {} : { opacity: isActive ? 1 : 0.86, y: isActive ? 0 : 8 }}
                transition={{ duration: reduceMotion ? 0 : 0.32, ease: 'easeOut' }}
              >
                <div className="journey-detail-pill">{stop.label}</div>
                <h3>{stop.title}</h3>
                <p className="journey-detail-subtitle">{stop.subtitle}</p>
                <div className="journey-detail-meta">
                  <span>
                    <FiCalendar size={13} />
                    {stop.period}
                  </span>
                </div>

                <div className={`journey-detail-body ${isActive ? 'open' : 'closed'}`}>
                  <p className="journey-detail-description">
                    {stop.highlightBlock || highlights[0] || 'Built strong outcomes through this phase.'}
                  </p>
                  {highlights.length > 0 && (
                    <>
                      <h4>Highlights</h4>
                      <ul className="journey-achievements">
                        {highlights.map((achievement, achievementIndex) => (
                          <li key={`${stop.id}-achievement-${achievementIndex}`}>{achievement}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {stop.stack.length > 0 && (
                    <>
                      <h4>Key Learnings</h4>
                      <div className="journey-stack">
                        {stop.stack.slice(0, 4).map((tech, techIndex) => (
                          <span key={`${stop.id}-tech-${techIndex}`} className="journey-stack-chip">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Journey;
