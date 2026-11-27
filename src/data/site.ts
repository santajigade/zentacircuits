// Site wide settings. Only true information here.
export const IS_PREVIEW = process.env.PREVIEW === '1';
const LAUNCHED = false; // set true on launch day: opens robots.txt, sitemap and indexing

export const SITE = {
  name: 'ZentaCircuits',
  url: IS_PREVIEW ? 'https://preview.zentacircuits.com' : 'https://zentacircuits.com',
  tagline: 'Learn electronics. Run the circuit. See it work.',
  description: 'Free electronics lessons with worked examples and a live simulator on every topic, for students, hobbyists and young engineers.',
  email: 'contact@zentacircuits.com', // TODO: confirm contact email
  launched: LAUNCHED && !IS_PREVIEW,
  categoryMinItems: 3, // a category hub is indexable from this many live articles
  ga4: IS_PREVIEW ? '' : 'G-TVXCKNHN81', // Google Analytics 4 measurement ID (live site only)
  adsenseClient: '', // fill after AdSense approval
  showAdPlaceholders: false,
  newsletterAction: '', // MailerLite or Brevo form URL; signup boxes hide while empty
};

export type Author = { slug: string; name: string; title: string; role: string; bio: string; linkedin: string; initials: string; photo: string; topics: string[] };

export const AUTHORS: Record<string, Author> = {
  'santaji-gadepatil': {
    slug: 'santaji-gadepatil',
    name: 'Santaji Gadepatil',
    title: 'Founder of ZentaCircuits',
    role: 'B.E. Electronics and Telecommunication',
    bio: 'Santaji is an electronics and telecommunication engineer who works with industrial process instrumentation. He writes about circuits, power electronics, sensors and industrial electronics.',
    photo: '/images/authors/santaji-gadepatil.webp',
    topics: ['Electronics', 'Power Electronics', 'Instrumentation', 'Industrial Automation'],
    linkedin: 'https://www.linkedin.com/in/santaji-gadepatil6680/',
    initials: 'SG',
  },
};

// Outbound links are allowed only to these sites, and only as text links inside the article body.
export const ALLOWED_OUTBOUND = ['zentacalculator.com', 'zentaengineering.com', 'instrumentationblog.in', 'kleevme.ae', 'kleevusa.com'];
