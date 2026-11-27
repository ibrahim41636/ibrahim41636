// Client portal: where a request stands, which technical stage may start, the client's meeting and
// contract details, the electronic contract document, and the portal e-mails. Pure functions,
// shared by the Worker (functions/api/portal.ts, functions/api/projects.ts) and unit tested.
import { STAGES } from "./tracking";
import { SIGN_AR, SIGN_EN, formatSar, mailHtml, type Lang, type Trigger } from "./payments";

export { STAGES };

/** Hours the team has to send a proposal (or a revised one, or a meeting time) after the client's step. */
export const DEFAULT_SLA_HOURS = 3;
export const slaHours = (v?: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= 72 ? n : DEFAULT_SLA_HOURS;
};

/** "YYYY-MM-DD HH:MM:SS" in UTC, the format D1 writes with datetime('now'). */
export const dbTime = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
export const fromDb = (s: string) => new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
export const addHours = (s: string, h: number) => dbTime(new Date(fromDb(s).getTime() + h * 3600_000));

// ---------------------------------------------------------------- where the request stands

export interface ProjectSnapshot {
  leadStatus: string;
  quoteStatus?: string | null; // the live proposal (not superseded or cancelled)
  contractStatus?: string | null; // details | issued | countersigned
  advanceDue?: boolean; // an instalment due on approval is still unpaid
  workStarted?: boolean; // a technical stage is active or done
  completed?: boolean; // every stage done and everything paid
}

/** Index into STAGES. */
export function projectStage(s: ProjectSnapshot): number {
  if (s.completed || s.leadStatus === "completed") return 7;
  if (s.workStarted) return 6;
  if (s.contractStatus === "countersigned") return 6;
  if (s.contractStatus === "issued") return 5;
  if (s.contractStatus === "details") return s.advanceDue ? 4 : 5;
  if (s.quoteStatus === "accepted" || s.quoteStatus === "paid") return 3;
  if (s.quoteStatus === "sent" || s.quoteStatus === "change_requested") return 2;
  return 1;
}

// ---------------------------------------------------------------- technical stages and payment gates

export interface GateStage { seq: number; status: string }
export interface GatePay { id: number; label: string; amount: number; trigger: string; status: string; stage_seq: number | null }
export type GateState = "done" | "active" | "ready" | "locked" | "waiting" | "upcoming";

/**
 * Which stage may run. Stages run in order, one at a time. Nothing starts before the contract is
 * signed and the advance is paid (`ready`). A stage stays locked while an instalment that fell due
 * on an earlier stage is unpaid: the next stage opens only after the client pays for the last one.
 */
export function workGates(stages: GateStage[], pays: GatePay[], ready: boolean): { seq: number; state: GateState; blockedBy?: GatePay }[] {
  let earlierOpen = false;
  return [...stages].sort((a, b) => a.seq - b.seq).map((st) => {
    if (st.status === "done") return { seq: st.seq, state: "done" };
    if (st.status === "active") { earlierOpen = true; return { seq: st.seq, state: "active" }; }
    if (!ready) return { seq: st.seq, state: "waiting" };
    if (earlierOpen) return { seq: st.seq, state: "upcoming" };
    earlierOpen = true;
    const blocker = pays.find((p) => p.stage_seq !== null && p.stage_seq < st.seq && p.status !== "paid" && p.status !== "cancelled");
    return blocker ? { seq: st.seq, state: "locked", blockedBy: blocker } : { seq: st.seq, state: "ready" };
  });
}

export type StagePlanError = "stage_title" | "stage_link" | "too_many_stages";

/**
 * Work stages for a proposal and the stage each instalment is tied to. Without explicit stages,
 * each instalment due on a stage becomes a stage of the same name (or one delivery stage).
 */
export function planStages(rows: { trigger: Trigger; label: string; stage?: number | null }[], titles: string[], fallback: string):
  { ok: true; stages: string[]; links: (number | null)[] } | { ok: false; error: StagePlanError } {
  const clean = titles.map((t) => String(t ?? "").trim()).filter(Boolean);
  if (clean.some((t) => t.length > 160)) return { ok: false, error: "stage_title" };
  if (clean.length > 12) return { ok: false, error: "too_many_stages" };
  if (!clean.length) {
    const stages: string[] = [];
    const links = rows.map((r) => (r.trigger === "milestone" ? stages.push(r.label.trim()) : null));
    return { ok: true, stages: stages.length ? stages : [fallback], links };
  }
  const links: (number | null)[] = [];
  for (const r of rows) {
    if (r.trigger !== "milestone") { links.push(null); continue; }
    const n = Number(r.stage);
    if (!Number.isInteger(n) || n < 1 || n > clean.length) return { ok: false, error: "stage_link" };
    links.push(n);
  }
  return { ok: true, stages: clean, links };
}

// ---------------------------------------------------------------- client input

const digits = (s: string) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
const text = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MEETING_MODES = ["online", "office", "site", "phone"] as const;
export type MeetingMode = (typeof MEETING_MODES)[number];
export const MEETING_MODE_LABELS: Record<MeetingMode, Record<Lang, string>> = {
  online: { en: "Online video call", ar: "اجتماع مرئي عن بعد" },
  office: { en: "At Selorin's office", ar: "في مكتب سيلورين" },
  site: { en: "At the project site", ar: "في موقع المشروع" },
  phone: { en: "Phone call", ar: "مكالمة هاتفية" },
};

export function parseMeetingRequest(b: unknown): { ok: true; request: { mode: MeetingMode; preferred: string; topics: string } } | { ok: false; error: "mode" | "preferred" } {
  const o = (b ?? {}) as Record<string, unknown>;
  const mode = String(o.mode ?? "") as MeetingMode;
  if (!MEETING_MODES.includes(mode)) return { ok: false, error: "mode" };
  const preferred = text(o.preferred, 300);
  if (preferred.length < 3) return { ok: false, error: "preferred" };
  return { ok: true, request: { mode, preferred, topics: text(o.topics, 1000) } };
}

export interface ContractDetails {
  legalName: string; crNumber: string; address: string;
  signatoryName: string; signatoryTitle: string; signatoryPhone: string; signatoryEmail: string;
}

/** The authorised signatory and company details the contract is generated from. */
export function parseContractDetails(b: unknown): { ok: true; details: ContractDetails } | { ok: false; errors: Record<string, string> } {
  const o = (b ?? {}) as Record<string, unknown>;
  const errors: Record<string, string> = {};
  const legalName = text(o.legalName, 160);
  const crNumber = digits(text(o.crNumber, 30)).replace(/\s+/g, "");
  const address = text(o.address, 300);
  const signatoryName = text(o.signatoryName, 120);
  const signatoryTitle = text(o.signatoryTitle, 120);
  const signatoryPhone = digits(text(o.signatoryPhone, 30)).replace(/[\s()-]/g, "");
  const signatoryEmail = text(o.signatoryEmail, 160).toLowerCase();
  if (legalName.length < 2) errors.legalName = "required";
  if (crNumber && !/^\d{7,15}$/.test(crNumber)) errors.crNumber = "invalid";
  if (signatoryName.length < 3) errors.signatoryName = "required";
  if (signatoryTitle.length < 2) errors.signatoryTitle = "required";
  if (!/^\+?\d{8,15}$/.test(signatoryPhone)) errors.signatoryPhone = "invalid";
  if (!EMAIL.test(signatoryEmail)) errors.signatoryEmail = "invalid";
  if (o.agree !== true) errors.agree = "required";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, details: { legalName, crNumber, address, signatoryName, signatoryTitle, signatoryPhone, signatoryEmail } };
}

/** SEL-2026-000123-Q2 → SEL-2026-000123-C2 */
export const contractNumber = (quoteId: string) => quoteId.replace(/-Q(\d+)$/, "-C$1");

// ---------------------------------------------------------------- the electronic contract

export interface ContractParty { legalName: string; crNumber?: string; vatNumber?: string; address?: string; signatoryName: string; signatoryTitle: string; phone?: string; email?: string }
export interface ContractInput {
  lang: Lang;
  contractNo: string;
  date: string; // YYYY-MM-DD
  issued: boolean; // false: a preview for the client to read before agreeing and paying
  provider: ContractParty;
  client: ContractParty;
  leadId: string;
  quoteId: string;
  title: string;
  documents: string[];
  subtotal: number;
  vat: number;
  total: number;
  payments: { label: string; amount: number; when: string }[];
  stages: string[];
  acceptance?: { at: string; name: string; email: string } | null;
  signature?: string | null; // data:image/png;base64,...
  stamp?: string | null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const IMG = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/;
export const validImage = (s: string | null | undefined): s is string => !!s && s.length < 1_500_000 && IMG.test(s);

/** Full HTML document of the contract, ready to print or save as PDF. */
export function contractDocument(c: ContractInput): string {
  const ar = c.lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const none = ar ? "غير مذكور" : "not stated";
  const sar = (h: number) => formatSar(h, c.lang);
  const v = (s?: string) => esc(s && s.trim() ? s : none);
  // Numbers, dates, IDs, phones and e-mails keep their left-to-right order inside Arabic text.
  const L = (s?: string | null) => (s && s.trim() ? `<span dir="ltr">${esc(s)}</span>` : esc(none));
  const party = (p: ContractParty, role: string) => ar
    ? `<p><b>${role}:</b> ${v(p.legalName)}، سجل تجاري رقم ${L(p.crNumber)}${p.vatNumber ? `، الرقم الضريبي ${L(p.vatNumber)}` : ""}، العنوان: ${v(p.address)}، ويمثله في التوقيع ${v(p.signatoryName)} بصفته ${v(p.signatoryTitle)}${p.phone ? `، الجوال ${L(p.phone)}` : ""}${p.email ? `، البريد ${L(p.email)}` : ""}.</p>`
    : `<p><b>${role}:</b> ${v(p.legalName)}, commercial registration ${L(p.crNumber)}${p.vatNumber ? `, VAT number ${L(p.vatNumber)}` : ""}, address: ${v(p.address)}, represented by ${v(p.signatoryName)} as ${v(p.signatoryTitle)}${p.phone ? `, mobile ${L(p.phone)}` : ""}${p.email ? `, e-mail ${L(p.email)}` : ""}.</p>`;
  const docs = c.documents.length ? c.documents.map((d) => `<bdi>${esc(d)}</bdi>`).join(ar ? "، " : ", ") : (ar ? "العرض الفني والمالي" : "the technical and financial proposal");
  const stages = `<ol>${c.stages.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`;
  const payRows = c.payments.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.label)}</td><td>${esc(p.when)}</td><td class="num">${esc(sar(p.amount))}</td></tr>`).join("");
  const payTable = `<table class="pay"><thead><tr><th>#</th><th>${ar ? "الدفعة" : "Instalment"}</th><th>${ar ? "تستحق" : "Due"}</th><th>${ar ? "المبلغ شامل الضريبة" : "Amount incl. VAT"}</th></tr></thead><tbody>${payRows}</tbody></table>`;
  const sig = validImage(c.signature) && c.issued ? `<img class="sig" src="${c.signature}" alt="">` : `<span class="line"></span>`;
  const stamp = validImage(c.stamp) && c.issued ? `<img class="stamp" src="${c.stamp}" alt="">` : `<span class="line"></span>`;
  const accepted = c.acceptance
    ? (ar
      ? `<p class="acc">سجل القبول الإلكتروني: وافق الطرف الثاني على هذا العقد عبر بوابة الطلب الإلكترونية بتاريخ ${L(c.acceptance.at)} (بتوقيت الرياض)، باسم ${esc(c.acceptance.name)} وبريد ${L(c.acceptance.email)}.</p>`
      : `<p class="acc">Electronic acceptance record: the Second Party accepted this contract through the online request portal on ${L(c.acceptance.at)} (Riyadh time), in the name of ${esc(c.acceptance.name)} with e-mail ${L(c.acceptance.email)}.</p>`)
    : "";
  const banner = c.issued ? "" : `<p class="draft">${ar ? "نسخة للاطلاع قبل الموافقة والسداد. تصدر النسخة الموقعة والمختومة من سيلورين بعد سداد الدفعة الأولى." : "Preview for review before approval and payment. The copy signed and stamped by Selorin is issued after the first payment."}</p>`;

  const articles = ar ? [
    ["التمهيد والمرفقات", `يُعد التمهيد السابق والعرض الفني والمالي رقم ${L(c.quoteId)} ومرفقاته (${docs}) جزءاً لا يتجزأ من هذا العقد ومكملاً له، وعند التعارض تُقدَّم أحكام هذا العقد.`],
    ["نطاق العمل ومراحله", `يلتزم الطرف الأول بتنفيذ الأعمال الواردة في العرض الفني والمالي وفق المنهجية المعتمدة فيه، وعلى المراحل الآتية: ${stages}ويتابع الطرف الثاني تقدم الأعمال عبر بوابة الطلب الإلكترونية.`],
    ["قيمة العقد وطريقة السداد", `قيمة العقد ${esc(sar(c.subtotal))}، تضاف إليها ضريبة القيمة المضافة ${esc(sar(c.vat))}، فيكون الإجمالي ${esc(sar(c.total))}، وتُسدد وفق الجدول الآتي: ${payTable}وتُسدد الدفعات إلكترونياً عبر بوابة الطلب أو بالتحويل البنكي إلى حساب الطرف الأول، ويصدر الطرف الأول فاتورة ضريبية بكل دفعة. ولا تبدأ أي مرحلة لاحقة من الأعمال قبل سداد الدفعة المستحقة عن المرحلة السابقة لها.`],
    ["المدة", "يبدأ تنفيذ الأعمال بعد توقيع هذا العقد وسداد الدفعة الأولى إن وُجدت، وتُنفَّذ وفق البرنامج الزمني الوارد في العرض الفني، وتمتد المدة بقدر أي تأخير يعود إلى الطرف الثاني أو إلى القوة القاهرة."],
    ["التزامات الطرف الأول", "تنفيذ الأعمال بعناية مهنية وفق الأنظمة واللوائح المعمول بها في المملكة العربية السعودية والممارسات المهنية المعترف بها، وتسليم المخرجات الواردة في العرض، وإبلاغ الطرف الثاني بتقدم الأعمال وبأي معوقات، والمحافظة على سرية معلوماته."],
    ["التزامات الطرف الثاني", "تزويد الطرف الأول بالمعلومات والمستندات اللازمة في وقتها، وتمكين فريقه من الوصول إلى المواقع في الأوقات المتفق عليها، وسداد الدفعات في مواعيدها، وتسمية ممثل للتواصل واعتماد المخرجات. ولا يتحمل الطرف الأول نتائج عدم دقة البيانات المقدمة إليه."],
    ["السرية", "يلتزم كل طرف بعدم إفشاء المعلومات السرية للطرف الآخر إلا بموافقته الكتابية أو بطلب من جهة مختصة، ويستمر هذا الالتزام بعد انتهاء العقد."],
    ["المخرجات والملكية", "تؤول ملكية المخرجات النهائية المعدة للطرف الثاني إليه بعد سداد كامل قيمة العقد، ويحتفظ الطرف الأول بملكية منهجياته وأدواته ونماذجه، وبحق الاحتفاظ بنسخة من المخرجات لأغراض السجلات."],
    ["حدود المسؤولية", "لا تتجاوز المسؤولية الإجمالية للطرف الأول بموجب هذا العقد القيمة المدفوعة له فعلاً، ولا يُسأل أي من الطرفين عن الأضرار غير المباشرة أو التبعية أو فوات الربح."],
    ["القوة القاهرة", "لا يُعد أي من الطرفين مخلاً بالتزاماته إذا تعذر تنفيذها بسبب قوة قاهرة خارجة عن إرادته، على أن يُخطر الطرف الآخر فور علمه بها."],
    ["الإنهاء", "يجوز لأي من الطرفين إنهاء العقد بإشعار كتابي إذا أخل الطرف الآخر بالتزام جوهري ولم يُصلح الإخلال خلال خمسة عشر يوماً من إشعاره بذلك، ويستحق الطرف الأول عند الإنهاء قيمة الأعمال المنفذة حتى تاريخه."],
    ["التعامل الإلكتروني والإشعارات", "تُعد المراسلات عبر البريد الإلكتروني لكل طرف المذكور في هذا العقد وعبر بوابة الطلب الإلكترونية إشعاراً صحيحاً منتجاً لآثاره، ويقر الطرفان بأن إبرام هذا العقد وقبوله إلكترونياً صحيح ومنتج لآثاره وفق نظام التعاملات الإلكترونية في المملكة العربية السعودية."],
    ["النظام الواجب التطبيق وحل النزاعات", "يخضع هذا العقد لأنظمة المملكة العربية السعودية، ويسعى الطرفان إلى حل أي خلاف ودياً، فإن تعذر ذلك اختصت المحاكم المختصة في المملكة العربية السعودية بالفصل فيه."],
    ["أحكام عامة", "يمثل هذا العقد ومرفقاته كامل الاتفاق بين الطرفين بشأن موضوعه، ولا يُعتد بأي تعديل عليه إلا إذا كان مكتوباً ومعتمداً من الطرفين، وحُرر إلكترونياً ويحتفظ كل طرف بنسخة منه."],
  ] : [
    ["Recitals and attachments", `The recitals above and the technical and financial proposal ${esc(c.quoteId)} with its attachments (${docs}) form an integral part of this contract. If they conflict, this contract prevails.`],
    ["Scope and stages", `The First Party shall carry out the work described in the technical and financial proposal according to its methodology, in the following stages: ${stages}The Second Party follows progress through the online request portal.`],
    ["Contract value and payment", `The contract value is ${esc(sar(c.subtotal))}, plus VAT of ${esc(sar(c.vat))}, for a total of ${esc(sar(c.total))}, payable as follows: ${payTable}Payments are made online through the request portal or by bank transfer to the First Party, which issues a tax invoice for each payment. No later stage of the work starts before the instalment due on the previous stage has been paid.`],
    ["Duration", "Work starts after this contract is signed and the first instalment, if any, is paid, and follows the schedule in the technical proposal. The duration extends by any delay attributable to the Second Party or to force majeure."],
    ["First Party obligations", "To carry out the work with professional care in accordance with the laws and regulations of the Kingdom of Saudi Arabia and recognised professional practice, deliver the outputs set out in the proposal, inform the Second Party of progress and of any obstacles, and keep its information confidential."],
    ["Second Party obligations", "To provide the information and documents needed on time, give the First Party's team access to sites at agreed times, pay instalments when due, and name a representative for communication and approval of outputs. The First Party is not responsible for the consequences of inaccurate information provided to it."],
    ["Confidentiality", "Each party shall not disclose the other's confidential information without its written consent or a request from a competent authority. This obligation survives the end of the contract."],
    ["Outputs and ownership", "Ownership of the final outputs prepared for the Second Party passes to it once the full contract value is paid. The First Party keeps ownership of its methods, tools and templates and may keep a copy of the outputs for its records."],
    ["Limitation of liability", "The First Party's total liability under this contract shall not exceed the amount actually paid to it, and neither party is liable for indirect or consequential loss or loss of profit."],
    ["Force majeure", "Neither party is in breach if performance is prevented by force majeure beyond its control, provided it notifies the other party as soon as it becomes aware of it."],
    ["Termination", "Either party may terminate the contract by written notice if the other commits a material breach and does not remedy it within fifteen days of being notified. On termination the First Party is entitled to the value of the work performed up to that date."],
    ["Electronic dealings and notices", "Correspondence through each party's e-mail stated in this contract and through the online request portal is valid notice. The parties acknowledge that concluding and accepting this contract electronically is valid and effective under the Electronic Transactions Law of the Kingdom of Saudi Arabia."],
    ["Governing law and disputes", "This contract is governed by the laws of the Kingdom of Saudi Arabia. The parties will seek to settle any dispute amicably, failing which the competent courts of the Kingdom of Saudi Arabia have jurisdiction."],
    ["General", "This contract and its attachments are the entire agreement between the parties on its subject. No amendment is valid unless made in writing and approved by both parties. It was executed electronically and each party keeps a copy."],
  ];
  const body = articles.map(([h, t], i) => `<section><h2>${ar ? `المادة (${i + 1}): ${h}` : `Article ${i + 1}: ${h}`}</h2><div>${t}</div></section>`).join("");
  const intro = ar
    ? `<p>أُبرم هذا العقد إلكترونياً بتاريخ ${L(c.date)} بين كل من:</p>${party(c.provider, "الطرف الأول (مقدم الخدمة)")}${party(c.client, "الطرف الثاني (العميل)")}<p>وحيث إن الطرف الثاني تقدّم بطلب الخدمة رقم ${L(c.leadId)} عبر موقع سيلورين، وقدّم له الطرف الأول العرض الفني والمالي رقم ${L(c.quoteId)} بعنوان «${esc(c.title)}»، ووافق عليه الطرف الثاني إلكترونياً، فقد اتفق الطرفان وهما بكامل الأهلية المعتبرة شرعاً ونظاماً على ما يلي:</p>`
    : `<p>This contract was concluded electronically on ${esc(c.date)} between:</p>${party(c.provider, "First Party (service provider)")}${party(c.client, "Second Party (client)")}<p>Whereas the Second Party submitted service request ${esc(c.leadId)} through Selorin's website, the First Party provided technical and financial proposal ${esc(c.quoteId)} titled "${esc(c.title)}", and the Second Party approved it electronically, the parties, having full legal capacity, agree as follows:</p>`;
  const signBlock = ar
    ? `<section class="sign"><div><h3>الطرف الأول</h3><p>${v(c.provider.legalName)}</p><p>الاسم: ${v(c.provider.signatoryName)}</p><p>الصفة: ${v(c.provider.signatoryTitle)}</p><p>التوقيع: ${sig}</p><p>الختم: ${stamp}</p></div><div><h3>الطرف الثاني</h3><p>${v(c.client.legalName)}</p><p>الاسم: ${v(c.client.signatoryName)}</p><p>الصفة: ${v(c.client.signatoryTitle)}</p><p>التوقيع: <span class="line"></span></p><p>الختم: <span class="line"></span></p></div></section>`
    : `<section class="sign"><div><h3>First Party</h3><p>${v(c.provider.legalName)}</p><p>Name: ${v(c.provider.signatoryName)}</p><p>Title: ${v(c.provider.signatoryTitle)}</p><p>Signature: ${sig}</p><p>Stamp: ${stamp}</p></div><div><h3>Second Party</h3><p>${v(c.client.legalName)}</p><p>Name: ${v(c.client.signatoryName)}</p><p>Title: ${v(c.client.signatoryTitle)}</p><p>Signature: <span class="line"></span></p><p>Stamp: <span class="line"></span></p></div></section>`;

  return `<!doctype html><html lang="${c.lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>${ar ? "عقد" : "Contract"} ${esc(c.contractNo)}</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #ecebe6; color: #121614; font: 14.5px/1.85 "IBM Plex Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif; }
  .bar { position: sticky; top: 0; display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; justify-content: center; padding: 12px; background: #0b3b2a; color: #fff; font-size: 13px; }
  .bar button { font: inherit; font-weight: 700; padding: 9px 16px; border: 0; border-radius: 8px; background: #cdefd3; color: #0b3b2a; cursor: pointer; }
  .sheet { position: relative; max-width: 820px; margin: 24px auto; background: #fff; padding: 44px 48px; box-shadow: 0 6px 28px rgba(0,0,0,.08); }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0b3b2a; padding-bottom: 12px; margin-bottom: 18px; }
  header .brand { font-weight: 700; font-size: 22px; color: #0b3b2a; letter-spacing: .02em; }
  header .meta { font-size: 12.5px; color: #4a4f4c; text-align: end; }
  h1 { font-size: 21px; text-align: center; margin: 8px 0 18px; }
  h2 { font-size: 15px; margin: 18px 0 6px; color: #0b3b2a; }
  h3 { font-size: 15px; margin: 0 0 6px; }
  p { margin: 0 0 8px; }
  ol { margin: 6px 0 8px; padding-inline-start: 22px; }
  table.pay { width: 100%; border-collapse: collapse; margin: 8px 0 10px; font-size: 13.5px; }
  table.pay th, table.pay td { border: 1px solid #cfcac0; padding: 6px 8px; text-align: start; }
  table.pay th { background: #f3f1ec; }
  td.num { white-space: nowrap; font-variant-numeric: tabular-nums; }
  span[dir="ltr"] { unicode-bidi: isolate; white-space: nowrap; }
  .draft { border: 1px dashed #b07a00; background: #fff7e0; color: #6b4a00; padding: 10px 14px; border-radius: 8px; font-weight: 600; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 26px; padding-top: 16px; border-top: 1px solid #cfcac0; }
  .sign p { margin: 0 0 10px; }
  .line { display: inline-block; min-width: 150px; border-bottom: 1px solid #121614; height: 1.2em; vertical-align: bottom; }
  img.sig { max-height: 64px; max-width: 200px; vertical-align: middle; }
  img.stamp { max-height: 110px; max-width: 140px; vertical-align: middle; }
  .acc { margin-top: 18px; font-size: 12.5px; color: #4a4f4c; background: #f7f6f2; padding: 10px 12px; border-radius: 8px; }
  @media (max-width: 640px) { .sheet { padding: 24px 18px; margin: 0; } .sign { grid-template-columns: 1fr; } }
  @media print { body { background: #fff; } .bar { display: none; } .sheet { box-shadow: none; margin: 0; max-width: none; padding: 0; } section { break-inside: avoid-page; } }
</style></head><body>
<div class="bar"><button type="button" onclick="window.print()">${ar ? "تحميل PDF أو طباعة" : "Download PDF or print"}</button><span>${ar ? "اختر «حفظ بصيغة PDF» من نافذة الطباعة لحفظ نسخة." : "Choose “Save as PDF” in the print window to keep a copy."}</span></div>
<main class="sheet">
<header><div class="brand">Selorin | سيلورين</div><div class="meta">${ar ? "رقم العقد" : "Contract no."}: ${L(c.contractNo)}<br>${ar ? "التاريخ" : "Date"}: ${L(c.date)}</div></header>
${banner}
<h1>${ar ? "عقد تقديم خدمات بيئية" : "Environmental Services Contract"}</h1>
${intro}
${body}
${signBlock}
${accepted}
</main></body></html>`;
}

// ---------------------------------------------------------------- e-mails

/** Keeps a date, time or code in left-to-right order inside Arabic plain text (Unicode isolate marks). */
export const ltr = (s: string) => `\u2066${s}\u2069`;

interface Base { lang: Lang; name: string; leadId: string; url: string }
const sign = (lang: Lang) => (lang === "ar" ? SIGN_AR : SIGN_EN);
const pack = (lang: Lang, subject: string, p: string[], cta: string, url: string) => ({ subject, text: `${p.join("\n\n")}\n\n${url}\n\n${sign(lang)}`, html: mailHtml(lang, p, { label: cta, url }) });

export function portalLinkEmail(i: Base & { service: string }) {
  return i.lang === "ar"
    ? pack("ar", `رابط بوابة طلبك ${i.leadId}`, [`مرحباً ${i.name}،`, `هذا رابط بوابة طلبك رقم ${i.leadId} (${i.service}). من البوابة تتابع مراحل الطلب، وتراجع العرض الفني والمالي، وتطلب اجتماعاً، وتُكمل التعاقد والسداد.`, "الرابط خاص بك، فلا تشاركه إلا مع المعنيين في شركتكم."], "فتح بوابة الطلب", i.url)
    : pack("en", `Your request portal link ${i.leadId}`, [`Dear ${i.name},`, `Here is the link to the portal for your request ${i.leadId} (${i.service}). There you can follow its stages, review the technical and financial proposal, ask for a meeting, and complete the contract and payment.`, "The link is private: share it only with the people involved at your company."], "Open the request portal", i.url);
}

export function meetingScheduledEmail(i: Base & { when: string; mode: string; location: string }) {
  return i.lang === "ar"
    ? pack("ar", `موعد اجتماع مناقشة العرض لطلبك ${i.leadId}`, [`مرحباً ${i.name}،`, `حددنا موعد اجتماع مناقشة العرض ونطاق العمل لطلبك رقم ${i.leadId}:`, `الموعد: ${ltr(i.when)} (بتوقيت الرياض)\nالطريقة: ${i.mode}${i.location ? `\nالرابط أو المكان: ${i.location}` : ""}`], "فتح بوابة الطلب", i.url)
    : pack("en", `Proposal meeting for your request ${i.leadId}`, [`Dear ${i.name},`, `We have scheduled the meeting to discuss the proposal and scope of your request ${i.leadId}:`, `When: ${i.when} (Riyadh time)\nHow: ${i.mode}${i.location ? `\nLink or place: ${i.location}` : ""}`], "Open the request portal", i.url);
}

export function contractIssuedEmail(i: Base & { contractNo: string }) {
  return i.lang === "ar"
    ? pack("ar", `عقدك ${i.contractNo} جاهز للتوقيع`, [`مرحباً ${i.name}،`, `أصدرنا عقد طلبك رقم ${i.leadId} موقعاً ومختوماً من سيلورين (رقم العقد ${i.contractNo}).`, "حمّله من بوابة الطلب، ووقّعه واختمه من طرفكم، ثم ارفع النسخة الموقعة من البوابة نفسها لنبدأ التنفيذ الفني."], "تحميل العقد من بوابة الطلب", i.url)
    : pack("en", `Your contract ${i.contractNo} is ready to sign`, [`Dear ${i.name},`, `We have issued the contract for your request ${i.leadId}, signed and stamped by Selorin (contract ${i.contractNo}).`, "Download it from the request portal, sign and stamp it on your side, then upload the signed copy in the same portal so we can start the technical work."], "Download the contract from the portal", i.url);
}

export function stageDoneEmail(i: Base & { title: string; stage: string; next?: string | null }) {
  return i.lang === "ar"
    ? pack("ar", `أنجزنا مرحلة «${i.stage}» في طلبك ${i.leadId}`, [`مرحباً ${i.name}،`, `أنجزنا مرحلة «${i.stage}» من أعمال طلبك رقم ${i.leadId} (${i.title}).${i.next ? ` وبدأنا مرحلة «${i.next}».` : ""}`, "تتابع التفاصيل وسجل الأعمال من بوابة الطلب."], "فتح بوابة الطلب", i.url)
    : pack("en", `Stage "${i.stage}" completed on your request ${i.leadId}`, [`Dear ${i.name},`, `We have completed the "${i.stage}" stage of your request ${i.leadId} (${i.title}).${i.next ? ` We have started "${i.next}".` : ""}`, "Details and the work log are in your request portal."], "Open the request portal", i.url);
}

export function projectDoneEmail(i: Base & { title: string }) {
  return i.lang === "ar"
    ? pack("ar", `اكتمل طلبك ${i.leadId}`, [`مرحباً ${i.name}،`, `اكتملت أعمال طلبك رقم ${i.leadId} (${i.title}) وسُددت جميع الدفعات. شكراً لثقتكم بسيلورين.`, "يبقى سجل الطلب ومستنداته متاحاً في بوابة الطلب."], "فتح بوابة الطلب", i.url)
    : pack("en", `Your request ${i.leadId} is complete`, [`Dear ${i.name},`, `The work on your request ${i.leadId} (${i.title}) is complete and all payments are settled. Thank you for choosing Selorin.`, "The request record and documents remain available in your portal."], "Open the request portal", i.url);
}

export type StaffEvent = "meeting" | "contract_details" | "countersigned" | "documents" | "sla_soon" | "sla_late";

/** Short notes to the sales inbox (English, like the other staff e-mails). */
export function staffNote(event: StaffEvent, i: { leadId: string; company?: string; quoteId?: string; detail?: string; adminUrl: string; due?: string }) {
  const who = `${i.leadId}${i.company ? ` | ${i.company}` : ""}`;
  const tail = `\n\nOpen: ${i.adminUrl}`;
  switch (event) {
    case "meeting": return { subject: `[Meeting requested] ${who}`, text: `The client asked for a meeting about ${i.quoteId ?? "the proposal"}.\n\n${i.detail ?? ""}\n\nSchedule it within the proposal timer${i.due ? ` (due ${i.due} UTC)` : ""}.${tail}` };
    case "contract_details": return { subject: `[Contract details received] ${who}`, text: `The client submitted the signatory details for ${i.quoteId ?? "the proposal"} and accepted the contract electronically.\n\n${i.detail ?? ""}${tail}` };
    case "countersigned": return { subject: `[Signed contract received] ${who}`, text: `The client uploaded the signed and stamped contract (attached). The technical work can start once any payment due is settled.${tail}` };
    case "documents": return { subject: `[Documents added] ${who}`, text: `The client added documents to the request (attached).\n\n${i.detail ?? ""}${tail}` };
    case "sla_soon": return { subject: `[Due in 30 minutes] ${who} | ${i.detail ?? ""}`, text: `${i.detail ?? "A proposal task"} for ${who} is due at ${i.due ?? ""} UTC.${tail}` };
    case "sla_late": return { subject: `[Overdue] ${who} | ${i.detail ?? ""}`, text: `${i.detail ?? "A proposal task"} for ${who} was due at ${i.due ?? ""} UTC and is now overdue.${tail}` };
  }
}
