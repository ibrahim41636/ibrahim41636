# Selorin content guide (for writers and the CMS)

Company: **Selorin Environmental Advisory & Services** (Arabic: **سيلورين للاستشارات والخدمات البيئية**), an environmental advisory and services firm operating in Saudi Arabia.
Website https://selorin.co · sales@selorin.co · +966 53 430 2332 · Location: Saudi Arabia.

Positioning: Selorin turns regulatory requirements and environmental data into clear, defensible decisions — combining permitting and compliance, environmental studies, field monitoring and sustainability advisory under one accountable team.

## 1. Non-negotiable rules

1. **Never invent facts about Selorin**: no certifications, accreditations, government approvals or registrations, client names, project counts, years in business, staff numbers, revenue, awards, partnerships, response-time guarantees, prices, or lab accreditations. Write about *what the service is, how the work is done, and what the client receives* — not about Selorin's track record.
2. If a sentence genuinely needs a missing fact, write `[CONTENT REQUIRED: what is needed]`. Prefer phrasing that does not need the fact at all.
3. **No hype**: never "leading", "best", "world-class", "number one", "unmatched", "cutting-edge", "one-stop shop", "passionate". No exclamation marks.
4. **Regulatory accuracy**: name Saudi bodies and frameworks only where relevant and only in ways that are true. Do **not** cite article numbers, numeric thresholds, fees, statutory timelines or permit validity periods. Prefer "under the Environmental Law and its Implementing Regulations" over specifics you are not certain of. Never claim Selorin is approved/registered by any authority.
   Safe references (use correctly, sparingly):
   - Environmental Law (2020) and its Implementing Regulations — نظام البيئة ولوائحه التنفيذية
   - National Center for Environmental Compliance (NCEC) — المركز الوطني للرقابة على الالتزام البيئي — environmental permits, compliance monitoring, inspections, EIA review
   - Ministry of Environment, Water and Agriculture (MEWA) — وزارة البيئة والمياه والزراعة
   - National Center for Waste Management (MWAN) — المركز الوطني لإدارة النفايات (موان) — Waste Management Law and regulations
   - National Center for Vegetation Cover Development and Combating Desertification (NCVC), National Center for Wildlife (NCW)
   - Royal Commission for Jubail and Yanbu (RCJY) — الهيئة الملكية للجبيل وينبع; Saudi Authority for Industrial Cities and Technology Zones (MODON) — مدن
   - Saudi Green Initiative (SGI) — مبادرة السعودية الخضراء; Saudi Arabia's net-zero target for 2060; Vision 2030
   - Saudi Exchange ESG Disclosure Guidelines; GHG Protocol; ISO 14064-1; ISO 14001; ISO 14040/14044; IFRS S1/S2 (ISSB); GRI Standards
   - Mostadam rating system (Saudi), LEED (USGBC), Envision (ISI)
5. Statements about method are fine ("we sample at upwind and downwind locations", "calibration with traceable reference gas"). Statements that imply credentials are not ("our accredited laboratory", "our certified LEED APs").

## 2. Voice

- Audience: decision makers (HSE/environmental managers, project managers, procurement, facility managers, owners/executives). Write for a busy professional: concrete, specific, calm.
- Lead with the answer. First sentence of a definition must define the thing (good for search and AI answer engines).
- Use precise verbs: assess, document, measure, monitor, prepare, submit, verify, report.
- Name deliverables concretely (e.g. "Monitoring plan with sampling locations, parameters and frequency").
- English: British/International spelling is fine; be consistent within a file. Sentence case for titles.

## 3. Arabic

- Write native, formal Modern Standard Arabic as used by Saudi government and corporate documents — **not** a literal translation of the English. Restructure sentences naturally.
- Standard terms: التصريح البيئي، الامتثال البيئي، تقييم الأثر البيئي، خطة الإدارة البيئية، التدقيق البيئي، الفحص البيئي النافي للجهالة، الرصد البيئي، جودة الهواء المحيط، الانبعاثات، الضوضاء، جودة المياه ومياه الصرف، إدارة النفايات، الاقتصاد الدائري، الحوكمة البيئية والاجتماعية والمؤسسية (ESG)، حصر انبعاثات غازات الاحتباس الحراري، الحياد الصفري، تقييم دورة الحياة، المباني الخضراء.
- Give the English acronym in parentheses at first use only, e.g. تقييم الأثر البيئي (EIA).
- Keep numbers, units and standards in Latin characters: PM2.5، 4–20 mA، ISO 14064-1.
- Arabic SEO title ≤ 60 characters where possible, meta description ≤ 160.

## 4. IDs used for cross-references

Service IDs (22):
environmental-permitting, environmental-compliance, environmental-records, environmental-audits, environmental-due-diligence,
environmental-impact-assessment, environmental-management-plans,
environmental-monitoring, air-quality-monitoring, dust-monitoring, fuel-station-voc-monitoring, noise-monitoring, water-quality-monitoring,
waste-management, circular-economy,
esg-advisory, ghg-carbon-accounting, net-zero-advisory, sustainability-advisory, life-cycle-assessment,
sustainable-buildings, green-building-advisory

Service categories: permitting-compliance, environmental-studies, monitoring-measurement, waste-circular-economy, sustainability-climate, sustainable-buildings
Form families: permitting, studies, monitoring, waste, sustainability, buildings

Industry IDs (14):
industrial-manufacturing, construction, real-estate, infrastructure, energy, oil-gas, logistics-warehousing, food-beverage, healthcare, hospitality, mining-quarrying, waste-recycling, government-public-sector, commercial-facilities

Insight categories: regulatory-updates, environmental-compliance, esg, sustainability, technical-articles, industry-guides
Author ID available: `selorin-editorial`

## 5. File formats

### Service — `src/content/services/{service-id}.json`
```json
{
  "category": "permitting-compliance",
  "order": 1,
  "formFamily": "permitting",
  "industries": ["industrial-manufacturing", "construction"],
  "related": ["environmental-compliance", "environmental-impact-assessment"],
  "en": { ...locale },
  "ar": { ...locale }
}
```
Locale object (all fields required):
- `name` — service name (short, e.g. "Environmental Permitting")
- `seoTitle` — ≤ 60 chars, pattern "{Service} in Saudi Arabia | Selorin" or similar, must include primary keyword
- `metaDescription` — 140–160 chars, specific, includes keyword and a benefit
- `valueProp` — hero line, one sentence (≤ 25 words)
- `cardDescription` — 1–2 sentences for service cards (≤ 30 words)
- `keyBenefit` — one short business benefit phrase (≤ 12 words)
- `definition` — 45–70 words; first sentence defines the service ("Environmental permitting is …"); answer-engine ready
- `overview` — 3 paragraphs, 60–110 words each; technical + business oriented; Saudi context
- `whenYouNeed` — 6 concrete triggers (each ≤ 18 words)
- `deliver` — 6 items `{title, description}` (description 15–30 words) — "What we deliver"
- `approach` — 5 or 6 steps `{title, description}` specific to this service (titles 1–3 words)
- `deliverables` — 5–7 rows `{item, format, timing}` e.g. `{"item":"Permit application package","format":"Completed forms + supporting documents (PDF)","timing":"Submission stage"}`
- `regulatoryContext` — 3–5 bullets naming relevant bodies/frameworks (see rules in §1.4)
- `faqs` — 5 real questions buyers ask, answers 40–90 words, no invented facts

### Industry — `src/content/industries/{industry-id}.json`
```json
{ "order": 1, "services": ["environmental-permitting", "..."], "en": {...}, "ar": {...} }
```
Locale: `name`, `seoTitle`, `metaDescription`, `cardDescription` (≤ 25 words), `overview` (2–3 paragraphs), `challenges` (5 `{title, description}`), `requirements` (5–7 typical environmental requirements as strings), `support` (4 `{title, description}` — how Selorin supports, linked to services), `faqs` (3–4).

### Insight article — `src/content/insights/{en|ar}/{slug}.md`
Front matter:
```yaml
---
title: "…"
description: "… (≤ 160 chars)"
category: industry-guides
date: 2026-10-05
author: selorin-editorial
heroImage: /images/fields.jpg
heroAlt: "…"
translationKey: environmental-permit-guide   # same in EN and AR versions
relatedServices: [environmental-permitting, environmental-compliance]
relatedIndustries: [industrial-manufacturing]
keyTakeaways:
  - "…"
  - "…"
  - "…"
faqs:
  - q: "…"
    a: "…"
---
```
Body: Markdown, 900–1300 words, H2/H3 structure, starts with a 2–3 sentence answer-first summary, includes a short checklist or table where useful. No H1 in body (the title is the H1). The Arabic version uses the same slug filename and translationKey and is written natively.

Available hero images: /images/fields.jpg, /images/water.jpg, /images/sky.jpg, /images/river.jpg, /images/construction.jpg, /images/station.jpg, /images/handheld.jpg, /images/team-event.jpg, /images/hq.jpg, /images/signage.jpg, /images/engineer.jpg, /images/landscape-logo.jpg

### Legal page — `src/content/legal/{en|ar}/{privacy|terms|cookies}.md`
Front matter: `title`, `description`, `updated: 2026-10-05`, `translationKey`. Body in Markdown. Use `[CONTENT REQUIRED: …]` for legal entity name, CR number, registered address, governing details, and DPO contact. Reference the Saudi Personal Data Protection Law (PDPL) generically. Must be marked as a draft pending legal review at the top.
