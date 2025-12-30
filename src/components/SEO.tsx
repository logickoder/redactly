import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
}

const SEO = ({ title, description, keywords, image, type = 'website' }: SEOProps) => {
  const location = useLocation();

  const siteName = 'Redactly';
  const defaultTitle = 'Redactly - Secure WhatsApp Chat Redaction';
  const defaultDescription =
    'A simple, secure, client-side tool for users to prepare sensitive WhatsApp chat data for external analysis. Anonymize your chats locally without data leaving your device.';
  const defaultKeywords =
    'whatsapp redaction, chat anonymizer, privacy tool, secure chat export, client-side processing, whatsapp privacy, data anonymization';
  const author = 'Jeffery Orazulike';
  const twitterHandle = '@logickoder';

  // Construct absolute URLs
  const origin = window.location.origin;
  const currentUrl = `${origin}${location.pathname}`;
  const defaultImage = `${origin}/pwa-512x512.png`;

  const metaTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const metaDescription = description || defaultDescription;
  const metaKeywords = keywords || defaultKeywords;
  const metaImage = image ? (image.startsWith('http') ? image : `${origin}${image}`) : defaultImage;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: siteName,
    description: metaDescription,
    url: origin,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web Browser',
    author: {
      '@type': 'Person',
      name: author,
      url: 'https://logickoder.dev'
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };

  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* PWA and Mobile */}
      <meta name="theme-color" content="#2563EB" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={siteName} />

      {/* Structured Data */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
};

export default SEO;
