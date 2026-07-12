import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FiBookOpen, FiBriefcase, FiMapPin } from 'react-icons/fi';
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

function Journey() {
  const reduceMotion = useReducedMotion();

  const journeyItems = useMemo(() => {
    const educationItems = portfolioContent.education.map((entry, index) => ({
      id: `education-${index}`,
      kind: 'education',
      label: 'Education',
      title: entry.institution,
      subtitle: entry.degree,
      period: entry.period,
      location: entry.location,
      highlights: entry.highlights || [],
      startTimestamp: getStartTimestamp(entry.period),
      orderWeight: 1
    }));

    const experienceItems = portfolioContent.experience.map((entry, index) => ({
      id: `experience-${entry.id || index}`,
      kind: 'experience',
      label: 'Work',
      title: entry.company,
      subtitle: entry.role,
      period: entry.period,
      location: entry.location,
      context: entry.engagement,
      highlights: entry.highlights || [],
      startTimestamp: getStartTimestamp(entry.period),
      orderWeight: 2
    }));

    return [...educationItems, ...experienceItems]
      .sort((a, b) => a.startTimestamp - b.startTimestamp || a.orderWeight - b.orderWeight)
      .map((item, index) => ({
        ...item,
        chapter: String(index + 1).padStart(2, '0'),
        side: index % 2 === 0 ? 'left' : 'right'
      }));
  }, []);

  const pathHeight = Math.max(700, 170 * journeyItems.length);
  const pathD = `M 50 20 C 66 ${pathHeight * 0.18}, 34 ${pathHeight * 0.34}, 50 ${pathHeight * 0.5} C 66 ${pathHeight * 0.66}, 34 ${pathHeight * 0.82}, 50 ${pathHeight - 20}`;

  return (
    <section id="journey" className="journey">
      <h2>Journey</h2>
      <p className="journey-intro">
        From foundational academics to high-impact engineering roles, each stop marks how scope, ownership, and
        outcomes evolved over time.
      </p>

      <div className="journey-map" style={{ '--path-height': `${pathHeight}px` }}>
        <svg
          className={`journey-road ${reduceMotion ? 'reduced-motion' : ''}`}
          viewBox={`0 0 100 ${pathHeight}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path className="journey-road-track" d={pathD} />
          <motion.path
            className="journey-road-progress"
            d={pathD}
            initial={{ pathLength: reduceMotion ? 1 : 0 }}
            whileInView={{ pathLength: 1 }}
            transition={{ duration: reduceMotion ? 0 : 1.5, ease: 'easeInOut' }}
            viewport={{ once: true, amount: 0.15 }}
          />
        </svg>

        {!reduceMotion && (
          <motion.div
            className="journey-traveler"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="journey-traveler-dot"
              animate={{ y: [0, pathHeight - 120], x: [0, 8, -8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}

        <div className="journey-stops">
          {journeyItems.map((item, index) => {
            const Icon = item.kind === 'education' ? FiBookOpen : FiBriefcase;
            const visibleHighlights = item.highlights.slice(0, item.kind === 'education' ? 2 : 3);
            const remainingHighlights = item.highlights.length - visibleHighlights.length;

            return (
              <motion.article
                key={item.id}
                className={`journey-stop ${item.side}`}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: index * 0.06 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="journey-side journey-side-left">
                  {item.side === 'left' && (
                    <div className="journey-card">
                      <p className="journey-kicker">{item.label}</p>
                      <h3>{item.title}</h3>
                      <p className="journey-subtitle">{item.subtitle}</p>
                      <div className="journey-meta">
                        <span>{item.period}</span>
                        {item.location && (
                          <span className="journey-location">
                            <FiMapPin size={12} />
                            {item.location}
                          </span>
                        )}
                      </div>
                      {item.context && <p className="journey-context">{item.context}</p>}
                      {visibleHighlights.length > 0 && (
                        <>
                          <p className="journey-label">Highlights</p>
                          <ul className="journey-highlights">
                            {visibleHighlights.map((highlight, highlightIndex) => (
                              <li key={highlightIndex}>{highlight}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {remainingHighlights > 0 && <p className="journey-more">+{remainingHighlights} more highlights</p>}
                    </div>
                  )}
                </div>

                <div className="journey-center">
                  <span className="journey-step">Stop {item.chapter}</span>
                  <motion.div
                    className="journey-node"
                    whileHover={{ scale: 1.08 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon size={16} />
                  </motion.div>
                </div>

                <div className="journey-side journey-side-right">
                  {item.side === 'right' && (
                    <div className="journey-card">
                      <p className="journey-kicker">{item.label}</p>
                      <h3>{item.title}</h3>
                      <p className="journey-subtitle">{item.subtitle}</p>
                      <div className="journey-meta">
                        <span>{item.period}</span>
                        {item.location && (
                          <span className="journey-location">
                            <FiMapPin size={12} />
                            {item.location}
                          </span>
                        )}
                      </div>
                      {item.context && <p className="journey-context">{item.context}</p>}
                      {visibleHighlights.length > 0 && (
                        <>
                          <p className="journey-label">Highlights</p>
                          <ul className="journey-highlights">
                            {visibleHighlights.map((highlight, highlightIndex) => (
                              <li key={highlightIndex}>{highlight}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {remainingHighlights > 0 && <p className="journey-more">+{remainingHighlights} more highlights</p>}
                    </div>
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
