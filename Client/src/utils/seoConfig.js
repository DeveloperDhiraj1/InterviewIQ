// src/utils/seoConfig.js
// SEO Configuration for all pages

const DOMAIN = 'https://interviewiqai.me'
const BRAND = 'InterviewIQ AI'

export const seoConfig = {
  home: {
    title: 'InterviewIQ AI - AI Mock Interviews & Resume Analysis',
    description: 'Master your interviews with InterviewIQ AI. Get AI-powered mock interviews, resume analysis, and expert feedback for technical, HR, and behavioral interviews.',
    keywords: 'AI mock interview, interview preparation, AI interview practice, resume analyzer, technical interview, HR interview',
    canonical: `${DOMAIN}/`,
    ogType: 'website',
    ogImage: `${DOMAIN}/img1.png`,
    twitterCard: 'summary_large_image',
  },
  about: {
    title: 'About InterviewIQ AI - AI Interview Preparation Platform',
    description: 'Learn about InterviewIQ AI, our mission to revolutionize interview preparation with AI technology. Meet our team and discover how we help thousands prepare for their dream jobs.',
    keywords: 'about InterviewIQ AI, interview preparation platform, AI technology, career preparation',
    canonical: `${DOMAIN}/about`,
    ogType: 'website',
    ogImage: `${DOMAIN}/img1.png`,
    twitterCard: 'summary',
  },
  pricing: {
    title: 'Pricing - InterviewIQ AI | Affordable Interview Preparation Plans',
    description: 'Choose the perfect plan for your interview preparation. From free trials to premium packages with unlimited mock interviews and detailed analytics.',
    keywords: 'InterviewIQ pricing, interview preparation plans, subscription plans, affordable mock interviews',
    canonical: `${DOMAIN}/pricing`,
    ogType: 'website',
    ogImage: `${DOMAIN}/img1.png`,
    twitterCard: 'summary',
  },
  interview: {
    title: 'Start Mock Interview - InterviewIQ AI | AI-Powered Interview Practice',
    description: 'Begin your AI-powered mock interview session. Practice technical, HR, and behavioral interviews with personalized feedback and scoring.',
    keywords: 'mock interview, AI interview, practice interview, interview simulation, interview training',
    canonical: `${DOMAIN}/interview`,
    ogType: 'website',
    ogImage: `${DOMAIN}/img1.png`,
    twitterCard: 'summary',
  },
  history: {
    title: 'Interview History - InterviewIQ AI | Your Interview Progress',
    description: 'View and analyze your interview history. Track your progress, review feedback, and identify areas for improvement.',
    keywords: 'interview history, interview progress, interview feedback, performance analytics',
    canonical: `${DOMAIN}/history`,
    ogType: 'website',
    ogImage: `${DOMAIN}/img1.png`,
    twitterCard: 'summary',
  },
}

/**
 * Get SEO metadata for a specific page
 * @param {string} pageName - Name of the page (home, about, pricing, interview, history)
 * @returns {object} SEO configuration for the page
 */
export const getPageSEO = (pageName) => {
  return seoConfig[pageName] || seoConfig.home
}

/**
 * Generate meta tag string for HTML head
 * @param {string} name - Meta tag name
 * @param {string} content - Meta tag content
 * @returns {string} Meta tag HTML string
 */
export const createMetaTag = (name, content) => {
  if (!content) return ''
  if (name.startsWith('og:') || name.startsWith('twitter:')) {
    return `<meta property="${name}" content="${content}" />`
  }
  return `<meta name="${name}" content="${content}" />`
}

/**
 * Keywords for SEO optimization
 */
export const PRIMARY_KEYWORDS = [
  'AI mock interview',
  'interview preparation',
  'AI interview practice',
  'resume analyzer',
  'technical interview preparation',
  'HR interview questions',
  'behavioral interview',
  'interview coaching',
  'mock interview platform',
  'AI interview platform',
]

/**
 * Structured data helper
 */
export const structuredData = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': BRAND,
    'url': DOMAIN,
    'logo': `${DOMAIN}/img1.png`,
    'description': 'AI-powered mock interview platform with resume analysis and personalized feedback',
    'sameAs': [
      'https://www.linkedin.com/company/interviewiq-ai',
      'https://twitter.com/InterviewIQAI'
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'Customer Support',
      'url': `${DOMAIN}/about`
    }
  },
  
  faq: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'What is InterviewIQ AI?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'InterviewIQ AI is an AI-powered mock interview platform that helps you prepare for technical, HR, and behavioral interviews with personalized feedback.'
        }
      },
      {
        '@type': 'Question',
        'name': 'How does the AI interview work?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Our AI conducts realistic mock interviews, evaluates your responses, and provides detailed feedback on content, communication, and confidence levels.'
        }
      },
      {
        '@type': 'Question',
        'name': 'Can I analyze my resume?',
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': 'Yes, InterviewIQ AI provides comprehensive resume analysis, highlighting strengths, weaknesses, and suggestions for improvement.'
        }
      }
    ]
  }
}
