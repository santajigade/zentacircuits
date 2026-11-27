// Site wide settings. Only true information here.
export const IS_PREVIEW = process.env.PREVIEW === '1';
const LAUNCHED = false; // set true on launch day: opens robots.txt, sitemap and indexing

export const SITE = {
  name: 'ZentaCircuits',
  url: IS_PREVIEW ? 'https://preview.zentacircuits.com' : 'https://zentacircuits.com',
  tagline: 'Learn electronics by watching circuits work',
  description: 'Free electronics lessons with worked examples and a live simulator on every topic, for students, hobbyists and young engineers.',
  email: 'contact@zentacircuits.com', // TODO: confirm contact email
  launched: LAUNCHED && !IS_PREVIEW,
  categoryMinItems: 3, // a category hub is indexable from this many live articles
  adsenseClient: '', // fill after AdSense approval
  showAdPlaceholders: false,
  newsletterAction: '', // MailerLite or Brevo form URL; signup boxes hide while empty
};

export type Author = { slug: string; name: string; role: string; bio: string; linkedin: string; initials: string };

export const AUTHORS: Record<string, Author> = {
  'santaji-gadepatil': {
    slug: 'santaji-gadepatil',
    name: 'Santaji Gadepatil',
    role: 'B.E. Electronics and Telecommunication',
    bio: 'Electronics and telecommunication engineer who writes about circuits, instrumentation and industrial electronics.', // TODO: final bio from Santaji
    linkedin: 'https://www.linkedin.com/in/santaji-gadepatil6680/',
    initials: 'SG',
  },
};

// Outbound links are allowed only to these sites, and only as text links inside the article body.
export const ALLOWED_OUTBOUND = ['zentacalculator.com', 'zentaengineering.com', 'instrumentationblog.in', 'kleevme.ae', 'kleevusa.com'];
