import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FaMicrosoft } from 'react-icons/fa';
import { FiBookOpen } from 'react-icons/fi';
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

function buildRoutePath(stops) {
  if (stops.length === 0) {
    return '';
  }

  let path = `M ${stops[0].x} ${stops[0].y}`;
  for (let index = 1; index < stops.length; index += 1) {
    const previous = stops[index - 1];
    const current = stops[index];
    const midpoint = (previous.y + current.y) / 2;
    path += ` C ${previous.x} ${midpoint}, ${current.x} ${midpoint}, ${current.x} ${current.y}`;
  }

  return path;
}

function getStopPositions(count) {
  if (count <= 1) {
    return [{ x: 40, y: 50 }];
  }

  const baseOffsets = [-10, 8, -7, 9];
  const yStart = 10;
  const yEnd = 90;
  const step = (yEnd - yStart) / (count - 1);

  return Array.from({ length: count }, (_, index) => ({
    x: 40 + baseOffsets[index % baseOffsets.length],
    y: yStart + step * index
  }));
}

function StopIcon({ stop }) {
  if (stop.kind === 'education') {
    return <FiBookOpen size={16} aria-label={`${stop.title} education`} />;
  }

  switch (stop.logo) {
    case 'microsoft':
      return <FaMicrosoft size={16} aria-label={`${stop.title} logo`} />;
    case 'samsung':
      return <SiSamsung size={16} aria-label={`${stop.title} logo`} />;
    case 'wells-fargo':
      return <SiWellsfargo size={16} aria-label={`${stop.title} logo`} />;
    case 'arcesium':
      return (
        <span className="journey-stop-monogram" aria-label={`${stop.title} logo`}>
          A
        </span>
      );
    case 'enliven':
      return (
        <span className="journey-stop-monogram" aria-label={`${stop.title} logo`}>
          E
        </span>
      );
    default:
      return <HiOfficeBuilding size={16} aria-label={`${stop.title} logo`} />;
  }
}

function Journey() {
  const reduceMotion = useReducedMotion();
  const panelRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const journeyStops = useMemo(() => {
    const educationStops = portfolioContent.education.map((entry, index) => ({
      id: `education-${index}`,
      kind: 'education',
      label: 'Education',
      title: entry.institution,
      subtitle: entry.subtitle || entry.degree,
      secondary: entry.degree,
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
      secondary: entry.role,
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

  const stopPositions = useMemo(() => getStopPositions(journeyStops.length), [journeyStops.length]);
  const routePath = useMemo(() => buildRoutePath(stopPositions), [stopPositions]);
  const progress = journeyStops.length > 1 ? activeIndex / (journeyStops.length - 1) : 1;

  useEffect(() => {
    const updateActiveIndex = () => {
      if (!panelRefs.current.length) {
        return;
      }

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;
      const viewportCenter = window.innerHeight / 2;

      panelRefs.current.forEach((panel, index) => {
        if (!panel) {
          return;
        }
        const rect = panel.getBoundingClientRect();
        const panelCenter = rect.top + rect.height / 2;
        const distance = Math.abs(panelCenter - viewportCenter);

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
      <h2>Career Journey</h2>
      <p className="journey-intro">
        From foundational academics to production engineering ownership, each stop marks a clear step forward.
      </p>

      <div className="journey-stage">
        <aside className="journey-left-column" aria-label="Journey labels">
          <div className="journey-sticky-layout">
            {journeyStops.map((stop, index) => (
              <article
                key={`${stop.id}-label`}
                className={`journey-left-item ${index === activeIndex ? 'active' : ''}`}
                style={{ top: `${stopPositions[index]?.y ?? 50}%` }}
              >
                <p className="journey-left-title">{stop.title}</p>
                <p className="journey-left-subtitle">{stop.secondary}</p>
                <p className="journey-left-period">{stop.period}</p>
              </article>
            ))}
          </div>
        </aside>

        <div className="journey-center-column" aria-hidden="true">
          <div className="journey-sticky-layout">
            <svg viewBox="0 0 80 100" className="journey-route-svg">
              <path d={routePath} className="journey-route-base" pathLength="1" />
              <motion.path
                d={routePath}
                className="journey-route-progress"
                pathLength="1"
                initial={false}
                animate={{ pathLength: progress }}
                transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' }}
              />
            </svg>

            {journeyStops.map((stop, index) => (
              <div
                key={`${stop.id}-pin`}
                className={`journey-stop-pin ${index <= activeIndex ? 'complete' : ''} ${
                  index === activeIndex ? 'active' : ''
                }`}
                style={{
                  top: `${stopPositions[index]?.y ?? 50}%`,
                  left: `${stopPositions[index]?.x ?? 40}px`
                }}
              >
                <StopIcon stop={stop} />
              </div>
            ))}

            <motion.div
              className="journey-nav-arrow"
              initial={false}
              animate={{
                top: `calc(${stopPositions[activeIndex]?.y ?? 50}% - 11px)`,
                left: `${(stopPositions[activeIndex]?.x ?? 40) + 16}px`
              }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeInOut' }}
            />
          </div>
        </div>

        <div className="journey-right-column">
          {journeyStops.map((stop, index) => {
            const isActive = index === activeIndex;
            const highlights = stop.achievements.slice(0, 5);

            return (
              <article
                key={stop.id}
                className="journey-panel"
                ref={(element) => {
                  panelRefs.current[index] = element;
                }}
              >
                <motion.div
                  className={`journey-detail-card ${isActive ? 'active' : ''}`}
                  initial={false}
                  animate={reduceMotion ? {} : { opacity: isActive ? 1 : 0.42, y: isActive ? 0 : 18 }}
                  transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'easeOut' }}
                >
                  <p className="journey-detail-kicker">
                    {stop.label} · Stop {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3>{stop.title}</h3>
                  <p className="journey-detail-subtitle">{stop.subtitle}</p>
                  <div className="journey-detail-meta">
                    <span>{stop.period}</span>
                    {stop.location && <span>{stop.location}</span>}
                  </div>

                  {highlights.length > 0 && (
                    <ul className="journey-achievements">
                      {highlights.map((achievement, achievementIndex) => (
                        <li key={`${stop.id}-achievement-${achievementIndex}`}>{achievement}</li>
                      ))}
                    </ul>
                  )}

                  {stop.stack.length > 0 && (
                    <div className="journey-stack">
                      {stop.stack.map((tech, techIndex) => (
                        <span key={`${stop.id}-tech-${techIndex}`} className="journey-stack-chip">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {stop.highlightBlock && <p className="journey-highlight-block">{stop.highlightBlock}</p>}
                </motion.div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Journey;
