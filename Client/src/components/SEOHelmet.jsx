// src/components/SEOHelmet.jsx
// Dynamic SEO Meta Tags Component
import { useEffect } from 'react'
import { getPageSEO } from '../utils/seoConfig'

/**
 * SEOHelmet Component - Update page meta tags dynamically
 * Usage: <SEOHelmet pageName="home" />
 */
export const SEOHelmet = ({ pageName = 'home', customTitle = '', customDescription = '' }) => {
  useEffect(() => {
    const seo = getPageSEO(pageName)
    
    // Update title
    const title = customTitle || seo.title
    document.title = title
    
    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      if (!content) return
      
      const attribute = isProperty ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attribute}="${name}"]`)
      
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attribute, name)
        document.head.appendChild(meta)
      }
      
      meta.setAttribute('content', content)
    }
    
    // Basic meta tags
    updateMetaTag('title', title)
    updateMetaTag('description', customDescription || seo.description)
    updateMetaTag('keywords', seo.keywords)
    
    // Open Graph tags
    updateMetaTag('og:title', title, true)
    updateMetaTag('og:description', customDescription || seo.description, true)
    updateMetaTag('og:type', seo.ogType, true)
    updateMetaTag('og:url', seo.canonical, true)
    updateMetaTag('og:image', seo.ogImage, true)
    updateMetaTag('og:site_name', 'InterviewIQ AI', true)
    updateMetaTag('og:locale', 'en_US', true)
    
    // Twitter Card tags
    updateMetaTag('twitter:title', title, true)
    updateMetaTag('twitter:description', customDescription || seo.description, true)
    updateMetaTag('twitter:card', seo.twitterCard, true)
    updateMetaTag('twitter:image', seo.ogImage, true)
    updateMetaTag('twitter:url', seo.canonical, true)

    let schemaScript = document.querySelector('#page-schema')
    if (seo.schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script')
        schemaScript.id = 'page-schema'
        schemaScript.type = 'application/ld+json'
        document.head.appendChild(schemaScript)
      }
      schemaScript.textContent = JSON.stringify(seo.schema)
    } else if (schemaScript) {
      schemaScript.remove()
    }
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = seo.canonical
    
    // Scroll to top on page change
    window.scrollTo(0, 0)
  }, [pageName, customTitle, customDescription])

  return null
}

export default SEOHelmet
