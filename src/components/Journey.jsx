import React, { useMemo } from 'react';
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
      return <span className="journey-badge-monogram" aria-label={`${stop.title} logo`}>A</span>;
    case 'enliven':
      return <span className="journey-badge-monogram" aria-label={`${stop.title} logo`}>E</span>;
    default:
      return <HiOfficeBuilding size={16} aria-label={`${stop.title} logo`} />;
  }
}

function Journey() {
  const reduceMotion = useReducedMotion();

  const journeyStops = useMemo(() => {
    const educationStops = portfolioContent.education.map((entry, index) => ({
      id: `education-${index}`,
      kind: 'education',
      label: 'Education',
      title: entry.institution,
      subtitle: entry.degree,
      period: entry.period,
      location: entry.location,
      context: '',
      logo: 'education',
      highlights: entry.highlights || [],
      startTimestamp: getStartTimestamp(entry.period),
      orderWeight: 1
    }));

    const experienceStops = portfolioContent.experience.map((entry, index) => ({
      id: `experience-${entry.id || index}`,
      kind: 'experience',
      label: 'Work',
      title: entry.company,
      subtitle: entry.role,
      period: entry.period,
      location: entry.location,
      context: entry.engagement || '',
      logo: entry.logo || '',
      highlights: entry.highlights || [],
      startTimestamp: getStartTimestamp(entry.period),
      orderWeight: 2
    }));

    return [...educationStops, ...experienceStops]
      .sort((a, b) => a.startTimestamp - b.startTimestamp || a.orderWeight - b.orderWeight)
      .map((stop, index) => ({
        ...stop,
        step: String(index + 1).padStart(2, '0')
      }));
  }, []);

  return (
    <section id="journey" className="journey">
      <h2>Journey</h2>
      <p className="journey-intro">
        A single timeline of learning and work, moving from education foundations to production-scale engineering.
      </p>

      <div className="journey-list">
        {journeyStops.map((stop, index) => {
          const previewHighlights = stop.highlights.slice(0, stop.kind === 'education' ? 2 : 3);
          const connectorClass = index === journeyStops.length - 1 ? 'journey-marker last' : 'journey-marker';

          return (
            <motion.article
              key={stop.id}
              className="journey-row"
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : index * 0.05 }}
              viewport={{ once: true, amount: 0.25 }}
            >
              <div className="journey-content">
                <p className="journey-kicker">
                  {stop.label} · Stop {stop.step}
                </p>
                <h3>{stop.title}</h3>
                <p className="journey-subtitle">{stop.subtitle}</p>
                <div className="journey-meta">
                  <span>{stop.period}</span>
                  {stop.location && <span>{stop.location}</span>}
                </div>
                {stop.context && <p className="journey-context">{stop.context}</p>}
                {previewHighlights.length > 0 && (
                  <ul className="journey-highlights">
                    {previewHighlights.map((highlight, highlightIndex) => (
                      <li key={highlightIndex}>{highlight}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={connectorClass}>
                <motion.div
                  className="journey-badge"
                  whileHover={reduceMotion ? {} : { scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <StopIcon stop={stop} />
                </motion.div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

export default Journey;
