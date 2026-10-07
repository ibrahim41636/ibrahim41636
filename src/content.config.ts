// Content model for the Selorin website.
// Every collection here maps 1:1 to a document type in the planned headless CMS
// (see docs/cms-architecture.md), so content can move to the CMS without template changes.
import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

export const SERVICE_CATEGORIES = [
  "permitting-compliance",
  "environmental-studies",
  "monitoring-measurement",
  "waste-circular-economy",
  "sustainability-climate",
  "sustainable-buildings",
  "renewable-energy",
] as const;

export const FORM_FAMILIES = ["permitting", "studies", "monitoring", "waste", "sustainability", "buildings", "energy"] as const;

export const INSIGHT_CATEGORIES = [
  "regulatory-updates",
  "environmental-compliance",
  "esg",
  "sustainability",
  "technical-articles",
  "industry-guides",
] as const;

const faq = z.object({ q: z.string(), a: z.string() });
const titled = z.object({ title: z.string(), description: z.string() });

const serviceLocale = z.object({
  name: z.string(),
  seoTitle: z.string().max(70),
  metaDescription: z.string().max(170),
  valueProp: z.string(),
  cardDescription: z.string(),
  keyBenefit: z.string(),
  definition: z.string(),
  overview: z.array(z.string()).min(2),
  whenYouNeed: z.array(z.string()).min(4),
  deliver: z.array(titled).min(4),
  approach: z.array(titled).min(4),
  deliverables: z.array(z.object({ item: z.string(), format: z.string(), timing: z.string() })).min(4),
  regulatoryContext: z.array(z.string()).min(2),
  faqs: z.array(faq).min(4),
});

const services = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/services" }),
  schema: z.object({
    category: z.enum(SERVICE_CATEGORIES),
    order: z.number(),
    formFamily: z.enum(FORM_FAMILIES),
    industries: z.array(reference("industries")),
    related: z.array(reference("services")),
    en: serviceLocale,
    ar: serviceLocale,
  }),
});

const industryLocale = z.object({
  name: z.string(),
  seoTitle: z.string().max(70),
  metaDescription: z.string().max(170),
  cardDescription: z.string(),
  overview: z.array(z.string()).min(2),
  challenges: z.array(titled).min(4),
  requirements: z.array(z.string()).min(4),
  support: z.array(titled).min(3),
  faqs: z.array(faq).min(3),
});

const industries = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/industries" }),
  schema: z.object({
    order: z.number(),
    services: z.array(reference("services")),
    en: industryLocale,
    ar: industryLocale,
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/authors" }),
  schema: z.object({
    type: z.enum(["Person", "Organization"]),
    en: z.object({ name: z.string(), role: z.string(), bio: z.string() }),
    ar: z.object({ name: z.string(), role: z.string(), bio: z.string() }),
    image: z.string().optional(),
    linkedin: z.url().optional(),
  }),
});

const insights = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/insights" }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(170),
    category: z.enum(INSIGHT_CATEGORIES),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    author: reference("authors"),
    heroImage: z.string(),
    heroAlt: z.string(),
    translationKey: z.string(),
    relatedServices: z.array(reference("services")).default([]),
    relatedIndustries: z.array(reference("industries")).default([]),
    keyTakeaways: z.array(z.string()).min(3),
    faqs: z.array(faq).default([]),
    draft: z.boolean().default(false),
  }),
});

const projectLocale = z.object({
  title: z.string(),
  clientType: z.string(),
  location: z.string(),
  summary: z.string(),
  scope: z.array(z.string()),
  challenge: z.string(),
  approach: z.array(z.string()),
  deliverables: z.array(z.string()),
  outcome: z.string(),
});

const projects = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/projects" }),
  schema: z.object({
    // Placeholder entries stay unpublished (noindex, hidden from listings) until real data replaces them.
    status: z.enum(["placeholder", "published"]),
    industry: reference("industries"),
    services: z.array(reference("services")),
    year: z.string(),
    image: z.string().optional(),
    en: projectLocale,
    ar: projectLocale,
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/legal" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date(),
    translationKey: z.string(),
  }),
});

export const collections = { services, industries, authors, insights, projects, legal };
