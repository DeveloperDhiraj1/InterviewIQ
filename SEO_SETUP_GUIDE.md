# SEO Setup Guide for InterviewIQ AI

Complete SEO implementation guide for your React Vite website.

## ✅ What Has Been Implemented

### 1. **Sitemap & Robots Files**
- ✅ `public/robots.txt` - Search engine crawler directives
- ✅ `public/sitemap.xml` - XML sitemap with all public pages

**Accessible at:**
- `https://interviewiqai.me/robots.txt`
- `https://interviewiqai.me/sitemap.xml`

### 2. **Meta Tags (in index.html)**
- ✅ Title tags with keywords
- ✅ Meta descriptions
- ✅ Meta keywords
- ✅ Canonical URLs
- ✅ Open Graph tags (Facebook, LinkedIn sharing)
- ✅ Twitter Card tags
- ✅ Mobile viewport settings
- ✅ Apple mobile web app tags

### 3. **Structured Data (JSON-LD)**
- ✅ SoftwareApplication schema
- ✅ Organization schema
- ✅ WebSite schema with SearchAction

### 4. **SEO Utilities**
- ✅ `src/utils/seoConfig.js` - Centralized SEO configurations
- ✅ `src/components/SEOHelmet.jsx` - Dynamic meta tag management component

### 5. **SEO Keywords Optimized**
- AI mock interview
- Interview preparation
- AI interview practice
- Resume analyzer
- Technical interview preparation
- HR interview questions
- Behavioral interview
- Interview coaching
- Mock interview platform
- AI interview platform

---

## 🔧 How to Use SEO Components in Your Pages

### Update Your Page Components

Add the `SEOHelmet` component to the top of each page file:

#### Example: `src/pages/Home.jsx`
```jsx
import SEOHelmet from '../components/SEOHelmet'

export default function Home() {
  return (
    <>
      <SEOHelmet pageName="home" />
      {/* Rest of your component */}
    </>
  )
}
```

#### Example: `src/pages/About.jsx`
```jsx
import SEOHelmet from '../components/SEOHelmet'

export default function About() {
  return (
    <>
      <SEOHelmet pageName="about" />
      {/* Rest of your component */}
    </>
  )
}
```

#### Example: `src/pages/Pricing.jsx`
```jsx
import SEOHelmet from '../components/SEOHelmet'

export default function Pricing() {
  return (
    <>
      <SEOHelmet pageName="pricing" />
      {/* Rest of your component */}
    </>
  )
}
```

#### Example: `src/pages/Interview.jsx`
```jsx
import SEOHelmet from '../components/SEOHelmet'

export default function Interview() {
  return (
    <>
      <SEOHelmet pageName="interview" />
      {/* Rest of your component */}
    </>
  )
}
```

#### Example: `src/pages/History.jsx`
```jsx
import SEOHelmet from '../components/SEOHelmet'

export default function History() {
  return (
    <>
      <SEOHelmet pageName="history" />
      {/* Rest of your component */}
    </>
  )
}
```

### Custom Meta Tags (Optional)

You can override default meta tags for specific pages:

```jsx
<SEOHelmet 
  pageName="pricing" 
  customTitle="Special Offer: 50% Off Interview Prep Plans"
  customDescription="Limited time offer on our premium interview preparation packages"
/>
```

---

## 📋 Google Search Console Setup

### Step 1: Add Your Site to Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property"
3. Enter your domain: `https://interviewiqai.me`
4. Verify ownership using one of these methods:
   - **HTML file upload**: Add verification file to `public/` folder
   - **HTML tag**: Add to index.html (optional, already can do via meta tag)
   - **Google Analytics**: Link to existing GA account
   - **Google Tag Manager**: Use GTM account

### Step 2: Submit Sitemap
1. In GSC left menu, go to **Sitemaps**
2. Click "Add new sitemap"
3. Enter: `sitemap.xml`
4. GSC will automatically fetch and index

### Step 3: Review Coverage Report
1. Go to **Coverage** section
2. Check for crawl errors
3. Ensure all public pages are indexed

### Step 4: Performance Monitoring
1. Go to **Performance** section
2. Monitor:
   - Click-through rates
   - Impressions
   - Average position
   - Query data

### Step 5: Mobile Usability
1. Go to **Mobile Usability**
2. Fix any reported issues

---

## 🔍 Bing Webmaster Tools Setup

### Step 1: Add Your Site
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Click "Add a site"
3. Enter: `https://interviewiqai.me`

### Step 2: Submit Sitemap
1. Go to **Sitemaps** in the menu
2. Click "Submit a Sitemap"
3. Enter: `https://interviewiqai.me/sitemap.xml`

### Step 3: Configure robots.txt
Bing will automatically discover `robots.txt` at the root

---

## 📊 Setting Up Google Analytics 4

To track user behavior and conversion:

1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new property for `interviewiqai.me`
3. Get your measurement ID (G-XXXXXXXXXX)
4. Install `react-ga4`:
```bash
npm install react-ga4
```

5. Add to `src/main.jsx`:
```javascript
import ReactGA from 'react-ga4'

ReactGA.initialize('G-XXXXXXXXXX')
ReactGA.send(pageview)
```

---

## 📱 Structured Data Testing

Test your JSON-LD structured data:

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **Schema.org Validator**: https://validator.schema.org/
- **Bing Markup Validator**: https://www.bing.com/webmaster/markup-validator

Paste your index.html code and verify all schemas are valid.

---

## 🎯 SEO Optimization Checklist

### On-Page SEO
- ✅ Unique title tags (50-60 characters)
- ✅ Meta descriptions (150-160 characters)
- ✅ Heading hierarchy (H1, H2, H3)
- ✅ Keyword optimization
- ✅ Image alt text
- ✅ Internal linking
- ✅ Mobile responsiveness

### Technical SEO
- ✅ robots.txt configured
- ✅ sitemap.xml submitted
- ✅ Canonical URLs set
- ✅ HTTPS enabled (Render uses HTTPS by default)
- ✅ Page speed optimization
- ✅ Mobile-friendly design
- ✅ Structured data (JSON-LD)

### Content SEO
- ✅ High-quality, unique content
- ✅ Relevant keywords naturally incorporated
- ✅ Proper heading structure
- ✅ Internal linking strategy
- ✅ Call-to-action optimization

### Link Building
- Submit to business directories
- Create content worth linking to
- Reach out to relevant websites
- Social media promotion

---

## 🚀 Performance Optimization

### Core Web Vitals Optimization
1. **Largest Contentful Paint (LCP)**: Optimize images, lazy load
2. **First Input Delay (FID)**: Minimize JavaScript
3. **Cumulative Layout Shift (CLS)**: Avoid layout shifts

### Tools to Check Performance
- [Google PageSpeed Insights](https://pagespeed.web.dev)
- [GTmetrix](https://gtmetrix.com)
- [WebPageTest](https://www.webpagetest.org)

---

## 📧 Monitoring & Maintenance

### Weekly Tasks
- Check Google Search Console for errors
- Monitor Core Web Vitals
- Review search queries and click-through rates

### Monthly Tasks
- Update sitemap.xml with new pages
- Review and optimize underperforming pages
- Monitor competitor keywords
- Check backlink profile

### Quarterly Tasks
- Full SEO audit
- Update content for freshness
- Review and improve poorly ranked pages
- Analyze conversion rates

---

## 🔗 Additional Resources

- [Google Search Central](https://developers.google.com/search)
- [Bing Webmaster Tools Help](https://www.bing.com/webmasters/help)
- [Schema.org Documentation](https://schema.org)
- [SEO Best Practices Guide](https://developers.google.com/search/docs)

---

## 💡 Key Points for Long-Term Success

1. **Keep Content Fresh**: Regularly update pages with new content
2. **Monitor Rankings**: Track your keyword rankings over time
3. **Fix Issues Quickly**: Address any crawl errors or indexing issues
4. **Optimize for Users**: Focus on user experience, not just rankings
5. **Build Quality Backlinks**: Earn links from reputable sources
6. **Mobile First**: Ensure excellent mobile experience

---

Last Updated: 2026-06-09
Version: 1.0
