// src/utils/advancedSeoUtils.js
// Advanced SEO utilities for blog posts, FAQ, and dynamic content

/**
 * Generate JSON-LD Schema for Blog Post
 * @param {object} post - Blog post object
 * @returns {object} JSON-LD schema
 */
export const generateBlogPostSchema = (post) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    'headline': post.title,
    'description': post.excerpt,
    'image': post.imageUrl,
    'datePublished': post.publishedDate,
    'dateModified': post.updatedDate,
    'author': {
      '@type': 'Person',
      'name': post.author || 'InterviewIQ AI'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'InterviewIQ AI',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://interviewiqai.me/img1.png'
      }
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': post.url
    }
  }
}

/**
 * Generate JSON-LD Schema for FAQ Page
 * @param {array} faqs - Array of FAQ objects [{question, answer}, ...]
 * @returns {object} JSON-LD schema
 */
export const generateFAQSchema = (faqs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  }
}

/**
 * Generate JSON-LD Schema for Product/Service
 * @param {object} product - Product object
 * @returns {object} JSON-LD schema
 */
export const generateProductSchema = (product) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': product.name,
    'description': product.description,
    'image': product.imageUrl,
    'brand': {
      '@type': 'Brand',
      'name': 'InterviewIQ AI'
    },
    'offers': {
      '@type': 'Offer',
      'url': product.url,
      'priceCurrency': product.currency || 'USD',
      'price': product.price,
      'availability': product.availability || 'https://schema.org/InStock'
    },
    'aggregateRating': product.rating ? {
      '@type': 'AggregateRating',
      'ratingValue': product.rating.value,
      'reviewCount': product.rating.count
    } : undefined
  }
}

/**
 * Generate JSON-LD Schema for Event (Interview Preparation Workshop)
 * @param {object} event - Event object
 * @returns {object} JSON-LD schema
 */
export const generateEventSchema = (event) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    'name': event.name,
    'description': event.description,
    'startDate': event.startDate,
    'endDate': event.endDate,
    'eventStatus': event.status || 'https://schema.org/EventScheduled',
    'eventAttendanceMode': event.attendanceMode || 'https://schema.org/OnlineEventAttendanceMode',
    'location': {
      '@type': 'VirtualLocation',
      'url': event.url
    },
    'organizer': {
      '@type': 'Organization',
      'name': 'InterviewIQ AI',
      'url': 'https://interviewiqai.me'
    },
    'image': event.imageUrl,
    'offers': {
      '@type': 'Offer',
      'url': event.registrationUrl,
      'price': event.price || '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/PreOrder'
    }
  }
}

/**
 * Generate JSON-LD Schema for Video
 * @param {object} video - Video object
 * @returns {object} JSON-LD schema
 */
export const generateVideoSchema = (video) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    'name': video.title,
    'description': video.description,
    'thumbnailUrl': [video.thumbnailUrl],
    'uploadDate': video.uploadDate,
    'duration': video.duration, // ISO 8601 format (e.g., PT10M)
    'contentUrl': video.videoUrl,
    'embedUrl': video.embedUrl,
    'interactionCount': video.viewCount
  }
}

/**
 * Generate JSON-LD Schema for Breadcrumb Navigation
 * @param {array} breadcrumbs - Array of breadcrumb objects [{name, url}, ...]
 * @returns {object} JSON-LD schema
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': crumb.name,
      'item': crumb.url
    }))
  }
}

/**
 * Generate JSON-LD Schema for Course
 * @param {object} course - Course object
 * @returns {object} JSON-LD schema
 */
export const generateCourseSchema = (course) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    'name': course.name,
    'description': course.description,
    'provider': {
      '@type': 'Organization',
      'name': 'InterviewIQ AI',
      'url': 'https://interviewiqai.me',
      'logo': 'https://interviewiqai.me/img1.png'
    },
    'image': course.imageUrl,
    'educationLevel': course.level || 'Intermediate',
    'learningResourceType': course.type || 'Online Course',
    'aggregateRating': course.rating ? {
      '@type': 'AggregateRating',
      'ratingValue': course.rating.value,
      'ratingCount': course.rating.count
    } : undefined,
    'offers': {
      '@type': 'Offer',
      'url': course.enrollUrl,
      'price': course.price,
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock'
    }
  }
}

/**
 * Generate JSON-LD Schema for Review/Rating
 * @param {object} review - Review object
 * @returns {object} JSON-LD schema
 */
export const generateReviewSchema = (review) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    'reviewRating': {
      '@type': 'Rating',
      'ratingValue': review.rating
    },
    'author': {
      '@type': 'Person',
      'name': review.author || 'Anonymous'
    },
    'reviewBody': review.text,
    'datePublished': review.date
  }
}

/**
 * Generate JSON-LD Schema for LocalBusiness
 * @param {object} business - Business object
 * @returns {object} JSON-LD schema
 */
export const generateLocalBusinessSchema = (business) => {
  return {
    '@context': 'https://schema.org',
    '@type': business.type || 'LocalBusiness',
    'name': 'InterviewIQ AI',
    'image': business.imageUrl,
    'description': business.description,
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': business.street,
      'addressLocality': business.city,
      'addressRegion': business.state,
      'postalCode': business.zip,
      'addressCountry': business.country
    },
    'telephone': business.phone,
    'email': business.email,
    'url': 'https://interviewiqai.me',
    'priceRange': business.priceRange,
    'sameAs': [
      'https://www.linkedin.com/company/interviewiq-ai',
      'https://twitter.com/InterviewIQAI'
    ]
  }
}

/**
 * Inject JSON-LD schema into page head
 * @param {object} schema - JSON-LD schema object
 */
export const injectJsonLdSchema = (schema) => {
  const scriptTag = document.createElement('script')
  scriptTag.type = 'application/ld+json'
  scriptTag.textContent = JSON.stringify(schema)
  document.head.appendChild(scriptTag)
  return scriptTag
}

/**
 * Remove JSON-LD schema from page
 * @param {element} scriptTag - Script tag to remove
 */
export const removeJsonLdSchema = (scriptTag) => {
  if (scriptTag && scriptTag.parentNode) {
    scriptTag.parentNode.removeChild(scriptTag)
  }
}

/**
 * SEO-friendly slug generator
 * @param {string} text - Text to convert to slug
 * @returns {string} SEO-friendly slug
 */
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Generate excerpt from text
 * @param {string} text - Full text
 * @param {number} length - Character length (default 160)
 * @returns {string} Excerpt text
 */
export const generateExcerpt = (text, length = 160) => {
  if (text.length <= length) return text
  return text.substring(0, length).trim() + '...'
}

/**
 * Check if URL is valid
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Generate canonical URL
 * @param {string} path - Page path (e.g., /about)
 * @returns {string} Canonical URL
 */
export const generateCanonicalUrl = (path) => {
  const domain = 'https://interviewiqai.me'
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${domain}${cleanPath}`
}

/**
 * Generate Open Graph image URL with dynamic text
 * @param {string} title - Title text
 * @param {string} subtitle - Subtitle text
 * @returns {string} OG image URL
 */
export const generateOGImage = (title, subtitle = '') => {
  // This would use a service like Vercel's OG Image generation
  // For now, use default image
  return 'https://interviewiqai.me/img1.png'
}
