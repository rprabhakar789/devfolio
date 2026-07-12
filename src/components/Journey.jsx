import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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

function getEducationBrandColor(institution = '', index = 0) {
  const normalized = institution.toLowerCase();
  if (normalized.includes('nit') || normalized.includes('warangal')) {
    return '#003366';
  }
  if (normalized.includes('kdhs') || normalized.includes('fulkaha')) {
    return '#1d4f91';
  }
  return index % 2 === 0 ? '#1d4f91' : '#374151';
}

function getExperienceBrandColor(entry) {
  if (entry?.theme?.accent) {
    return entry.theme.accent;
  }
  const logo = (entry?.logo || '').toLowerCase();
  if (logo === 'microsoft') {
    return '#0078D4';
  }
  if (logo === 'samsung') {
    return '#1428A0';
  }
  if (logo === 'wells-fargo') {
    return '#C40404';
  }
  if (logo === 'arcesium') {
    return '#144186';
  }
  return '#2563eb';
}

function StopIcon({ stop }) {
  const baseUrl = import.meta.env.BASE_URL ?? '/';
  if (stop.kind === 'education') {
    const normalized = stop.title.toLowerCase();
    if (normalized.includes('nit') || normalized.includes('warangal')) {
      return (
        <img
          className="journey-stop-logo-image journey-stop-logo-contain"
          src={`${baseUrl}logos/nit-warangal.png`}
          alt={`${stop.title} logo`}
        />
      );
    }
    return <FiBookOpen className="journey-stop-icon" aria-label={`${stop.title} education`} />;
  }

  switch (stop.logo) {
    case 'microsoft':
      return <FaMicrosoft className="journey-stop-icon" aria-label={`${stop.title} logo`} />;
    case 'samsung':
      return <SiSamsung className="journey-stop-icon" aria-label={`${stop.title} logo`} />;
    case 'wells-fargo':
      return <SiWellsfargo className="journey-stop-icon" aria-label={`${stop.title} logo`} />;
    case 'arcesium':
      return <img className="journey-stop-logo-image" src={`${baseUrl}logos/arcesium.svg`} alt={`${stop.title} logo`} />;
    case 'enliven':
      return <span className="journey-stop-monogram">R</span>;
    default:
      return <HiOfficeBuilding className="journey-stop-icon" aria-label={`${stop.title} logo`} />;
  }
}

function Journey() {
  const reduceMotion = useReducedMotion();
  const rowRefs = useRef([]);
  const pinRefs = useRef([]);
  const flowRef = useRef(null);
  const panelStateRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0 });
  const [railMetrics, setRailMetrics] = useState({ top: 0, left: 0, height: 0 });

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
      brandColor: getEducationBrandColor(entry.institution, index),
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
      brandColor: getExperienceBrandColor(entry),
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
      const flowRect = flowRef.current?.getBoundingClientRect();
      const pinCenters = pinRefs.current
        .map((pin) => {
          if (!pin) {
            return null;
          }
          const rect = pin.getBoundingClientRect();
          return rect.top + rect.height / 2;
        })
        .filter((center) => center !== null);

      if (!pinCenters.length) {
        return;
      }

      let progress = 0;
      let panelIndex = panelStateRef.current;

      if (viewportCenter <= pinCenters[0]) {
        progress = 0;
        panelIndex = 0;
      } else if (viewportCenter >= pinCenters[pinCenters.length - 1]) {
        progress = pinCenters.length - 1;
        const lastCenter = pinCenters[pinCenters.length - 1];
        const previousCenter = pinCenters[pinCenters.length - 2] ?? lastCenter - 320;
        const spacing = Math.max(240, lastCenter - previousCenter);
        panelIndex = viewportCenter > lastCenter + spacing * 0.45 ? -1 : pinCenters.length - 1;
      } else {
        let segmentIndex = 0;
        for (let index = 0; index < pinCenters.length - 1; index += 1) {
          if (viewportCenter >= pinCenters[index] && viewportCenter < pinCenters[index + 1]) {
            segmentIndex = index;
            break;
          }
        }

        const start = pinCenters[segmentIndex];
        const end = pinCenters[segmentIndex + 1];
        const ratio = (viewportCenter - start) / (end - start);
        progress = segmentIndex + ratio;
        const previousPanel = panelStateRef.current;

        if (previousPanel === segmentIndex) {
          panelIndex = ratio > 0.58 ? -1 : segmentIndex;
        } else if (previousPanel === segmentIndex + 1) {
          panelIndex = ratio < 0.84 ? -1 : segmentIndex + 1;
        } else {
          if (ratio < 0.42) {
            panelIndex = segmentIndex;
          } else if (ratio > 0.94) {
            panelIndex = segmentIndex + 1;
          } else {
            panelIndex = -1;
          }
        }
      }

      panelStateRef.current = panelIndex;
      setActiveIndex((current) => (current === panelIndex ? current : panelIndex));

      const lowerIndex = Math.floor(progress);
      const upperIndex = Math.min(lowerIndex + 1, pinCenters.length - 1);
      const ratio = progress - lowerIndex;
      const lowerPin = pinRefs.current[lowerIndex];
      const upperPin = pinRefs.current[upperIndex];

      if (flowRect && lowerPin && upperPin) {
        const lowerRect = lowerPin.getBoundingClientRect();
        const upperRect = upperPin.getBoundingClientRect();
        const lowerTop = lowerRect.top - flowRect.top + lowerRect.height / 2;
        const upperTop = upperRect.top - flowRect.top + upperRect.height / 2;
        const lowerLeft = lowerRect.left - flowRect.left + lowerRect.width / 2;
        const upperLeft = upperRect.left - flowRect.left + upperRect.width / 2;

        const top = lowerTop + (upperTop - lowerTop) * ratio;
        const left = lowerLeft + (upperLeft - lowerLeft) * ratio;
        setArrowPosition({ top, left });
      }

      const firstPin = pinRefs.current[0];
      const lastPin = pinRefs.current[pinRefs.current.length - 1];
      if (flowRect && firstPin && lastPin) {
        const firstRect = firstPin.getBoundingClientRect();
        const lastRect = lastPin.getBoundingClientRect();
        const top = firstRect.top - flowRect.top + firstRect.height / 2;
        const bottom = lastRect.top - flowRect.top + lastRect.height / 2;
        const left = firstRect.left - flowRect.left + firstRect.width / 2;
        setRailMetrics({ top, left, height: Math.max(0, bottom - top) });
      }
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

      <div className="journey-flow" ref={flowRef}>
        <span
          className="journey-rail"
          style={{ top: `${railMetrics.top}px`, left: `${railMetrics.left}px`, height: `${railMetrics.height}px` }}
          aria-hidden="true"
        >
          <span
            className="journey-rail-progress"
            style={{ height: `${Math.max(0, Math.min(railMetrics.height, arrowPosition.top - railMetrics.top))}px` }}
          />
        </span>
        <span
          className="journey-floating-arrow"
          style={{ top: `${arrowPosition.top}px`, left: `${arrowPosition.left}px` }}
          aria-hidden="true"
        />
        {journeyStops.map((stop, index) => {
          const isActive = index === activeIndex;
          const highlights = stop.achievements.slice(0, 5);

          return (
            <article
              key={stop.id}
              className={`journey-row ${isActive ? 'active' : ''}`}
              style={{ '--journey-brand': stop.brandColor }}
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
                <span
                  className={`journey-stop-pin ${isActive ? 'active' : ''}`}
                  ref={(element) => {
                    pinRefs.current[index] = element;
                  }}
                >
                  <StopIcon stop={stop} />
                </span>
              </div>

              <div className="journey-detail-slot">
                <AnimatePresence initial={false}>
                  {isActive && (
                    <motion.div
                      key={stop.id}
                      className={`journey-detail-card expanded ${index === 0 ? 'journey-detail-first' : 'journey-detail-raised'}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
                      animate={reduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
                      exit={reduceMotion ? {} : { opacity: 0, y: -10, scale: 0.985 }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 210, damping: 24, mass: 0.65 }
                      }
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

                      <div className="journey-detail-body">
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
                  )}
                </AnimatePresence>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Journey;
