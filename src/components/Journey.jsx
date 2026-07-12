import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiBookOpen, FiBriefcase, FiMapPin, FiNavigation } from 'react-icons/fi';
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function Journey() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const journeyItems = useMemo(() => {
    const educationItems = portfolioContent.education.map((entry, index) => ({
      id: `education-${index}`,
      kind: 'education',
      label: 'Education stop',
      title: entry.institution,
      subtitle: entry.degree,
      period: entry.period,
      location: entry.location,
      context: '',
      highlights: entry.highlights || [],
      startTimestamp: getStartTimestamp(entry.period),
      orderWeight: 1
    }));

    const experienceItems = portfolioContent.experience.map((entry, index) => ({
      id: `experience-${entry.id || index}`,
      kind: 'experience',
      label: 'Work stop',
      title: entry.company,
      subtitle: entry.role,
      period: entry.period,
      location: entry.location,
      context: entry.engagement || '',
      highlights: entry.highlights || [],
      startTimestamp: getStartTimestamp(entry.period),
      orderWeight: 2
    }));

    return [...educationItems, ...experienceItems]
      .sort((a, b) => a.startTimestamp - b.startTimestamp || a.orderWeight - b.orderWeight)
      .map((item, index) => ({
        ...item,
        stopNumber: String(index + 1).padStart(2, '0')
      }));
  }, []);

  const stops = useMemo(() => {
    const routePattern = [16, 80, 26, 76];
    const total = journeyItems.length;
    const top = 8;
    const bottom = 92;
    const step = total > 1 ? (bottom - top) / (total - 1) : 0;

    return journeyItems.map((item, index) => ({
      ...item,
      x: routePattern[index % routePattern.length],
      y: top + step * index
    }));
  }, [journeyItems]);

  const routePath = useMemo(() => {
    if (stops.length === 0) {
      return '';
    }
    return stops.map((stop, index) => `${index === 0 ? 'M' : 'L'} ${stop.x} ${stop.y}`).join(' ');
  }, [stops]);

  useEffect(() => {
    if (stops.length <= 1) {
      return;
    }

    const handleScroll = () => {
      const section = sectionRef.current;
      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const traveled = viewportHeight - rect.top;
      const totalTravel = rect.height + viewportHeight * 0.45;
      const progress = clamp(traveled / totalTravel, 0, 1);
      const nextIndex = clamp(Math.round(progress * (stops.length - 1)), 0, stops.length - 1);
      setActiveIndex(nextIndex);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [stops]);

  const activeStop = stops[activeIndex] || null;
  const progressRatio = stops.length > 1 ? activeIndex / (stops.length - 1) : 1;
  const strokeProgress = reduceMotion ? 1 : progressRatio;
  const pointerStyle = activeStop ? { left: `${activeStop.x}%`, top: `${activeStop.y}%` } : {};
  const visibleHighlights = (activeStop?.highlights || []).slice(0, activeStop?.kind === 'education' ? 2 : 4);

  return (
    <section id="journey" className="journey" ref={sectionRef}>
      <h2>Journey</h2>
      <p className="journey-intro">
        Follow the route from academic foundations to production-scale engineering ownership, one destination at a time.
      </p>

      <div className="journey-map-board">
        <div className="journey-map-canvas">
          <svg className="journey-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path className="journey-route-base" d={routePath} />
            <motion.path
              className="journey-route-progress"
              d={routePath}
              initial={{ pathLength: reduceMotion ? 1 : 0 }}
              animate={{ pathLength: strokeProgress }}
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: 'easeOut' }}
            />
          </svg>

          <motion.div
            className="journey-pointer"
            style={pointerStyle}
            animate={reduceMotion ? {} : { scale: [1, 1.08, 1] }}
            transition={reduceMotion ? {} : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            <FiNavigation size={16} />
          </motion.div>

          {stops.map((stop, index) => {
            const Icon = stop.kind === 'education' ? FiBookOpen : FiBriefcase;
            const isActive = index === activeIndex;

            return (
              <motion.button
                key={stop.id}
                type="button"
                className={`journey-stop-pin ${isActive ? 'active' : ''}`}
                style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
                onClick={() => setActiveIndex(index)}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                viewport={{ once: true, amount: 0.4 }}
                aria-label={`Go to stop ${stop.stopNumber}: ${stop.title}`}
              >
                <Icon size={14} />
                <span className="journey-pin-label">Stop {stop.stopNumber}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="journey-details-panel" aria-live="polite">
          <AnimatePresence mode="wait">
            {activeStop && (
              <motion.article
                key={activeStop.id}
                className="journey-detail-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: reduceMotion ? 0 : 0.32, ease: 'easeOut' }}
              >
                <p className="journey-detail-kicker">
                  {activeStop.label} · Stop {activeStop.stopNumber}
                </p>
                <h3>{activeStop.title}</h3>
                <p className="journey-detail-subtitle">{activeStop.subtitle}</p>

                <div className="journey-detail-meta">
                  <span>{activeStop.period}</span>
                  {activeStop.location && (
                    <span className="journey-detail-location">
                      <FiMapPin size={12} />
                      {activeStop.location}
                    </span>
                  )}
                </div>

                {activeStop.context && <p className="journey-detail-context">{activeStop.context}</p>}
                {visibleHighlights.length > 0 && (
                  <>
                    <p className="journey-detail-label">Destination highlights</p>
                    <ul className="journey-detail-highlights">
                      {visibleHighlights.map((highlight, index) => (
                        <li key={index}>{highlight}</li>
                      ))}
                    </ul>
                  </>
                )}
              </motion.article>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default Journey;
