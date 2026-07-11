export const RESUME_FILE_NAME = 'Rahul-Prabhakar-Resume.pdf';
export const RESUME_URL = `${import.meta.env.BASE_URL}${RESUME_FILE_NAME}`;

const EXPERIENCE_START_DATE = new Date(2020, 9, 1);

export function getExperienceYears(now = new Date()) {
  if (now < EXPERIENCE_START_DATE) {
    return 0;
  }

  let fullYears = now.getFullYear() - EXPERIENCE_START_DATE.getFullYear();
  const hasReachedAnniversary =
    now.getMonth() > EXPERIENCE_START_DATE.getMonth() ||
    (now.getMonth() === EXPERIENCE_START_DATE.getMonth() && now.getDate() >= EXPERIENCE_START_DATE.getDate());

  if (!hasReachedAnniversary) {
    fullYears -= 1;
  }

  const lastAnniversaryYear = hasReachedAnniversary ? now.getFullYear() : now.getFullYear() - 1;
  const lastAnniversary = new Date(
    lastAnniversaryYear,
    EXPERIENCE_START_DATE.getMonth(),
    EXPERIENCE_START_DATE.getDate()
  );
  const nextAnniversary = new Date(
    lastAnniversaryYear + 1,
    EXPERIENCE_START_DATE.getMonth(),
    EXPERIENCE_START_DATE.getDate()
  );
  const fractionalRemainder = (now - lastAnniversary) / (nextAnniversary - lastAnniversary);

  return fractionalRemainder > 0.5 ? fullYears + 1 : fullYears;
}

export const education = {
  institution: 'National Institute of Technology, Warangal',
  degree: 'B.Tech in Electronics and Communication',
  period: '2016 – 2020',
  scoreLabel: 'CGPA',
  score: '7.79'
};

export const campusHighlights = [
  {
    title: 'ACM Student Chapter, NIT Warangal',
    description:
      'Organized coding contests and peer learning sessions, while mentoring juniors to strengthen programming fundamentals and problem-solving skills.'
  }
];

export const experiences = [
  {
    id: 1,
    company: 'Microsoft',
    position: 'Software Engineer II',
    period: 'May 2025 – Current',
    location: 'Hyderabad',
    logo: 'microsoft',
    theme: {
      accent: '#00A4EF',
      accentSoft: '#7FBA00',
      surfaceFrom: 'rgba(0, 164, 239, 0.16)',
      surfaceTo: 'rgba(127, 186, 0, 0.08)',
      border: 'rgba(0, 164, 239, 0.38)',
      glow: 'rgba(0, 164, 239, 0.18)'
    },
    highlights: [
      'Re-architected the application to enable seamless, deployment-free onboarding of new clients, significantly reducing rollout time and operational overhead.',
      'Spearheaded AI agent-driven development initiatives and generated automated test suites with AI to cut regression testing effort.',
      'Integrated AI agents with project management tools and GitHub to enable end-to-end autonomous task execution.',
      'Designed and implemented bulk file upload flows supporting up to 20k records per batch for create, update, and delete operations.'
    ]
  },
  {
    id: 2,
    company: 'Arcesium',
    position: 'Senior Software Engineer',
    period: 'May 2022 – May 2025',
    location: 'Hyderabad',
    logo: 'arcesium',
    theme: {
      accent: '#2E67A7',
      accentSoft: '#60A5FA',
      surfaceFrom: 'rgba(46, 103, 167, 0.16)',
      surfaceTo: 'rgba(96, 165, 250, 0.08)',
      border: 'rgba(96, 165, 250, 0.32)',
      glow: 'rgba(46, 103, 167, 0.18)'
    },
    highlights: [
      'Led development of a secure application for encrypted storage and retrieval of sensitive data and files, serving 10+ internal clients using AWS S3, AWS KMS, and REST APIs.',
      'Migrated an application to an event-driven architecture with KEDA, reducing server costs by 60% through dynamic scaling.',
      'Enabled real-time search on PII data across 10M+ records using Lucene Index while preserving confidentiality.',
      'Optimized database performance, achieving 70% faster query execution by redesigning indexes and refining queries.',
      'Authored automation tests in Python and contributed more than 60% of the application’s automated test coverage.'
    ]
  },
  {
    id: 3,
    company: 'Wells Fargo',
    position: 'Software Engineer',
    period: 'Jan 2021 – Apr 2022',
    location: 'Hyderabad',
    logo: 'wells-fargo',
    theme: {
      accent: '#C40404',
      accentSoft: '#FFCC00',
      surfaceFrom: 'rgba(196, 4, 4, 0.16)',
      surfaceTo: 'rgba(255, 204, 0, 0.08)',
      border: 'rgba(255, 204, 0, 0.28)',
      glow: 'rgba(196, 4, 4, 0.18)'
    },
    highlights: [
      'Delivered a fully functional Java Spring application to automate daily foreign exchange trade reporting.',
      'Automated batch job failure monitoring with a Java application, saving 2 hours of daily manual work.',
      'Improved application security by implementing Spring Security and resolving a severity-2 vulnerability.',
      'Built a React-based web application for CMaaS, reducing environment configuration time from hours to minutes.'
    ]
  },
  {
    id: 4,
    company: 'Enliven Solutions Pvt Ltd',
    position: 'Software Engineer',
    period: 'Oct 2020 – Jan 2021',
    location: 'Freelance',
    engagement: 'Contract for Resolab',
    logo: 'enliven',
    theme: {
      accent: '#0F766E',
      accentSoft: '#2DD4BF',
      surfaceFrom: 'rgba(15, 118, 110, 0.16)',
      surfaceTo: 'rgba(45, 212, 191, 0.08)',
      border: 'rgba(45, 212, 191, 0.28)',
      glow: 'rgba(15, 118, 110, 0.18)'
    },
    highlights: [
      'Built a responsive user interface from scratch for Resolab, a resource management application, improving usability and visual polish.'
    ]
  },
  {
    id: 5,
    company: 'Samsung R&D Institute',
    position: 'Software Engineer Intern',
    period: 'May 2019 – July 2019',
    location: 'Bangalore',
    logo: 'samsung',
    theme: {
      accent: '#1428A0',
      accentSoft: '#60A5FA',
      surfaceFrom: 'rgba(20, 40, 160, 0.16)',
      surfaceTo: 'rgba(96, 165, 250, 0.08)',
      border: 'rgba(96, 165, 250, 0.3)',
      glow: 'rgba(20, 40, 160, 0.18)'
    },
    highlights: [
      'Developed a program to analyze user activity patterns in the Samsung Pay Android application, identifying the most frequently used features to improve user experience.'
    ]
  }
];
