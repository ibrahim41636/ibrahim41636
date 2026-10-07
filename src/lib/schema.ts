// JSON-LD builders. Entities reference each other by @id so search and AI engines can
// resolve Organization → Service → Industry → Article relationships as one graph.
import { site, href, type Lang } from "@/i18n/ui";

const ORG_ID = `${site.url}/#organization`;
// Primary market first: Saudi Arabia, then the other GCC states.
const GCC = [["SA", "Saudi Arabia"], ["AE", "United Arab Emirates"], ["KW", "Kuwait"], ["QA", "Qatar"], ["BH", "Bahrain"], ["OM", "Oman"]] as const;
const SA_CITIES = ["Riyadh", "Jeddah", "Makkah", "Madinah", "Dammam", "Khobar", "Jubail", "Yanbu", "Tabuk", "NEOM", "Abha", "Buraidah", "Hail", "Jazan"];
const AREA_SERVED = [
  ...GCC.map(([code, name]) => ({ "@type": "Country", name, identifier: code })),
  ...SA_CITIES.map((name) => ({ "@type": "City", name, containedInPlace: { "@type": "Country", name: "Saudi Arabia" } })),
];

const abs = (lang: Lang, path: string) => new URL(href(lang, path), site.url).toString();

export interface Crumb { name: string; path: string }

export function organizationSchema() {
  const sameAs = Object.values(site.social).filter(Boolean);
  return {
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORG_ID,
    name: site.name.en,
    legalName: "Selorin Company",
    identifier: { "@type": "PropertyValue", propertyID: "SA Unified National Number", value: "7054829457" },
    alternateName: [site.name.ar, "Selorin"],
    url: site.url,
    logo: { "@type": "ImageObject", url: `${site.url}/icons/selorin-mark.svg` },
    image: `${site.url}/images/og-default.jpg`,
    description: "Environmental advisory and services firm in Saudi Arabia serving the GCC, providing environmental permitting and compliance, environmental impact assessment, environmental monitoring, waste management and sustainability advisory.",
    email: site.email,
    telephone: site.phone,
    address: { "@type": "PostalAddress", addressCountry: "SA" },
    location: { "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "SA" } },
    areaServed: AREA_SERVED,
    knowsLanguage: ["en", "ar"],
    knowsAbout: [
      "Environmental permitting", "Environmental compliance", "Environmental impact assessment", "Environmental monitoring",
      "Air quality monitoring", "Dust monitoring", "VOC monitoring", "Noise monitoring", "Water quality monitoring",
      "Waste management", "Circular economy", "ESG", "Greenhouse gas accounting", "Net zero", "Life cycle assessment", "Green buildings",
      "Solar energy systems", "EV charging stations", "Battery energy storage", "Renewable energy operation and maintenance",
    ],
    contactPoint: [{ "@type": "ContactPoint", contactType: "sales", email: site.email, telephone: site.phone, areaServed: GCC.map(([code]) => code), availableLanguage: ["English", "Arabic"] }],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteSchema() {
  return { "@type": "WebSite", "@id": `${site.url}/#website`, url: site.url, name: "Selorin", publisher: { "@id": ORG_ID }, inLanguage: ["en", "ar"] };
}

export function breadcrumbSchema(lang: Lang, crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(lang, c.path) })),
  };
}

export function serviceSchema(lang: Lang, s: { slug: string; name: string; description: string; category: string; industries: string[] }) {
  return {
    "@type": "Service",
    "@id": `${abs(lang, `/services/${s.slug}/`)}#service`,
    name: s.name,
    serviceType: s.name,
    description: s.description,
    category: s.category,
    provider: { "@id": ORG_ID },
    areaServed: AREA_SERVED,
    audience: s.industries.map((n) => ({ "@type": "BusinessAudience", audienceType: n })),
    url: abs(lang, `/services/${s.slug}/`),
    inLanguage: lang,
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function articleSchema(lang: Lang, a: { slug: string; title: string; description: string; date: Date; updated?: Date; image: string; author: { name: string; type: string }; about: string[] }) {
  return {
    "@type": "Article",
    "@id": `${abs(lang, `/insights/${a.slug}/`)}#article`,
    headline: a.title,
    description: a.description,
    datePublished: a.date.toISOString(),
    dateModified: (a.updated ?? a.date).toISOString(),
    image: new URL(a.image, site.url).toString(),
    author: { "@type": a.author.type, name: a.author.name, ...(a.author.type === "Organization" ? { "@id": ORG_ID } : {}) },
    publisher: { "@id": ORG_ID },
    inLanguage: lang,
    mainEntityOfPage: abs(lang, `/insights/${a.slug}/`),
    about: a.about.map((name) => ({ "@type": "Thing", name })),
  };
}

export function collectionSchema(lang: Lang, path: string, name: string, items: { name: string; path: string }[]) {
  return {
    "@type": "CollectionPage",
    name,
    url: abs(lang, path),
    isPartOf: { "@id": `${site.url}/#website` },
    mainEntity: { "@type": "ItemList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: abs(lang, it.path) })) },
  };
}
