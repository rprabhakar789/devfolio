import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FaMicrosoft } from 'react-icons/fa';
import { FiBookOpen, FiBriefcase, FiCalendar } from 'react-icons/fi';
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
      return (
        <img
          className="journey-stop-logo-image journey-stop-logo-contain journey-stop-logo-arcesium"
          src={`${baseUrl}logos/arcesium.svg`}
          alt={`${stop.title} logo`}
        />
      );
    case 'enliven':
      return <span className="journey-stop-monogram">R</span>;
    case 'work':
      return <FiBriefcase className="journey-stop-icon" aria-label={`${stop.title} logo`} />;
    default:
      return <HiOfficeBuilding className="journey-stop-icon" aria-label={`${stop.title} logo`} />;
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
      subtitle: entry.subtitle || entry.degree,
      period: entry.period,
      location: entry.location,
      achievements: entry.achievements || entry.highlights || [],
      stack: entry.stack || [],
      highlightBlock: entry.highlightBlock || '',
      logo: 'education',
      brandColor: entry.theme?.accent || '#1d4f91',
      brandSoft: entry.theme?.accentSoft || '#60a5fa',
      brandBorder: entry.theme?.border || 'rgba(96, 165, 250, 0.32)',
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
      logo: entry.logo || 'work',
      brandColor: entry.theme?.accent || '#10b981',
      brandSoft: entry.theme?.accentSoft || '#34d399',
      brandBorder: entry.theme?.border || 'rgba(52, 211, 153, 0.3)',
      startTimestamp: getStartTimestamp(entry.period),
      orderWeight: 2
    }));

    return [...educationStops, ...experienceStops].sort(
      (a, b) => a.startTimestamp - b.startTimestamp || a.orderWeight - b.orderWeight
    );
  }, []);

  return (
    <section id="journey" className="journey">
      <p className="journey-eyebrow">// journey</p>
      <h2>My Journey</h2>
      <p className="journey-intro">A journey of learning, growth and impact</p>

      <div className="journey-timeline">
        <span className="journey-line" aria-hidden="true" />
        <div className="journey-list">
          {journeyStops.map((stop, index) => {
            const highlights = stop.achievements.slice(0, 5);

            return (
              <motion.article
                key={stop.id}
                className="journey-entry"
                style={{
                  '--journey-brand': stop.brandColor,
                  '--journey-brand-soft': stop.brandSoft,
                  '--journey-brand-border': stop.brandBorder
                }}
                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.36) }}
              >
                <span className="journey-entry-icon">
                  <StopIcon stop={stop} />
                </span>
                <div className="journey-card">
                  <div className="journey-card-header">
                    <div>
                      <h3>{stop.title}</h3>
                      <p className="journey-card-subtitle">{stop.subtitle}</p>
                    </div>
                    <p className="journey-card-period">
                      <FiCalendar size={13} />
                      {stop.period}
                    </p>
                  </div>

                  {stop.highlightBlock && <p className="journey-card-summary">{stop.highlightBlock}</p>}

                  {highlights.length > 0 && (
                    <>
                      <h4 className="journey-section-label">Highlights</h4>
                      <ul className="journey-achievements">
                        {highlights.map((achievement, achievementIndex) => (
                          <li key={`${stop.id}-achievement-${achievementIndex}`}>
                            <span className="journey-bullet">▹</span>
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {stop.stack.length > 0 && (
                    <>
                      <h4 className="journey-section-label">Key Learnings</h4>
                      <div className="journey-stack">
                        {stop.stack.slice(0, 6).map((tech, techIndex) => (
                          <span key={`${stop.id}-tech-${techIndex}`} className="journey-stack-chip">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Journey;
