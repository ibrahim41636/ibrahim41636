// Staff page for the social publishing hub (/ar/admin/social/): channels, funnel report, composer
// and posting queue. Talks to /api/admin/social* and /api/admin/funnel with the ADMIN_TOKEN.
import { CHANNEL_INFO, VARIANT_INFO, xLength, type Channel, type Variant } from "@/lib/social";

const KEY = "selorin_admin_token";
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
let token = sessionStorage.getItem(KEY) || "";
let channels: { id: Channel; name: string; configured: boolean }[] = [];
const STATUS: Record<string, string> = { scheduled: "مجدولة", publishing: "جارٍ النشر", published: "منشورة", failed: "فشلت", cancelled: "ملغاة" };
const ERR: Record<string, string> = {
  x_too_long: "النص أطول من حد منصة إكس (٢٨٠ حرفًا مع الرابط)", instagram_needs_image: "إنستغرام يحتاج رابط صورة",
  image_url: "رابط الصورة يجب أن يبدأ بـ https://", validation: "تحقق من الحقول", not_editable: "لا يمكن تعديل منشور منشور أو ملغى",
};

const msg = (text: string, err = false) => { const m = $("[data-msg]"); m.textContent = text; m.className = "adm-msg" + (err ? " err" : ""); m.hidden = !text; };
async function api(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(path, { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) { logout(); throw new Error("رمز الدخول غير صحيح"); }
  if (res.status === 503) throw new Error(body.error === "admin_not_configured" ? "لم يُضبط ADMIN_TOKEN في Cloudflare بعد" : "قاعدة البيانات غير مربوطة بعد");
  if (!res.ok || !body.ok) throw new Error(ERR[body.error] || body.error || "تعذّر تنفيذ الطلب");
  return body;
}
const riyadh = (s: string) => new Date(s.replace(" ", "T") + "Z").toLocaleString("ar-SA-u-ca-gregory", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });
const fromLocal = (v: string) => v ? new Date(`${v}:00+03:00`).toISOString() : undefined;
const toLocal = (s: string) => new Date(new Date(s.replace(" ", "T") + "Z").getTime() + 3 * 3600_000).toISOString().slice(0, 16);
const td = (text: string | number, cls = "") => { const c = document.createElement("td"); c.textContent = String(text ?? ""); if (cls) c.className = cls; return c; };
const button = (label: string, onClick: () => Promise<void>, ghost = true) => {
  const b = document.createElement("button"); b.type = "button"; b.className = ghost ? "btn btn--ghost" : "btn"; b.textContent = label;
  b.onclick = async () => { b.disabled = true; try { await onClick(); } catch (e) { msg((e as Error).message, true); } finally { b.disabled = false; } };
  return b;
};

async function loadQueue() {
  const f = $<HTMLSelectElement>("[data-filter]").value;
  const data = await api(`/api/admin/social${f ? `?status=${f}` : ""}`);
  channels = data.channels;
  $("[data-channels]").replaceChildren(...channels.map((c) => {
    const li = document.createElement("li"); li.className = c.configured ? "on" : "";
    li.textContent = `${c.name} — ${c.configured ? "مربوط" : "غير مربوط"}`; return li;
  }));
  const pick = $("[data-pick]");
  if (!pick.childElementCount) pick.replaceChildren(...channels.map((c) => {
    const l = document.createElement("label"); const i = document.createElement("input");
    i.type = "checkbox"; i.value = c.id; i.checked = c.configured && c.id !== "instagram"; i.disabled = !c.configured; i.onchange = count;
    l.append(i, c.name); return l;
  }));
  const rows = (data.posts as any[]).map((p) => {
    const tr = document.createElement("tr");
    const text = document.createElement("td"); const div = document.createElement("div"); div.className = "soc-text"; div.textContent = p.text; text.append(div);
    if (p.link) { const a = document.createElement("a"); a.href = p.link; a.textContent = "الرابط"; a.target = "_blank"; a.rel = "noopener"; text.append(a); }
    const status = td(`${STATUS[p.status] || p.status}${p.attempts > 1 ? ` (محاولة ${p.attempts})` : ""}`);
    if (p.error) { const e = document.createElement("div"); e.className = "soc-err"; e.textContent = p.error; status.append(e); }
    const act = document.createElement("td"); const box = document.createElement("div"); box.className = "soc-actions";
    if (p.status === "scheduled" || p.status === "failed") {
      box.append(
        button("انشر الآن", async () => { await api("/api/admin/social/update", { method: "POST", body: JSON.stringify({ id: p.id, action: "publish_now" }) }); msg("تم النشر"); await loadQueue(); }, false),
        button("تعديل", async () => {
          const t = prompt("نص المنشور", p.text); if (t === null) return;
          const at = prompt("الموعد بتوقيت الرياض (YYYY-MM-DDTHH:MM)", toLocal(p.scheduled_at)); if (at === null) return;
          await api("/api/admin/social/update", { method: "POST", body: JSON.stringify({ id: p.id, action: "edit", text: t, scheduledAt: fromLocal(at) }) });
          msg("تم الحفظ"); await loadQueue();
        }),
        button("إلغاء", async () => { if (!confirm("إلغاء هذا المنشور؟")) return; await api("/api/admin/social/update", { method: "POST", body: JSON.stringify({ id: p.id, action: "cancel" }) }); await loadQueue(); }),
      );
    }
    act.append(box);
    const variant = VARIANT_INFO[p.variant as Variant]?.ar ?? p.variant;
    tr.append(td(riyadh(p.published_at || p.scheduled_at)), td(`${CHANNEL_INFO[p.channel as Channel]?.ar ?? p.channel}${p.lang === "en" ? " (EN)" : ""}`), td(`${variant}${p.title ? ` — ${p.title}` : ""}`), text, status, act);
    return tr;
  });
  $("[data-rows]").replaceChildren(...rows);
  if (!rows.length) { const tr = document.createElement("tr"); const c = td("لا توجد منشورات بعد. اربط حسابًا واحدًا على الأقل (انظر docs/social-funnel-ar.md) ثم اضغط «تشغيل النشر الآن»."); c.colSpan = 6; tr.append(c); $("[data-rows]").replaceChildren(tr); }
}

async function loadFunnel() {
  const data = await api(`/api/admin/funnel?days=${$<HTMLSelectElement>("[data-days]").value}`);
  const sources = data.sources as { source: string; medium: string; leads: number; quoted: number; won: number }[];
  const sum = (k: "leads" | "quoted" | "won", f: (s: (typeof sources)[number]) => boolean = () => true) => sources.filter(f).reduce((n, s) => n + (s[k] || 0), 0);
  const published = (data.posts as { published: number }[]).reduce((n, p) => n + p.published, 0);
  const social = (s: { medium: string }) => s.medium === "social";
  const cards: [string, number][] = [
    ["منشورات نُشرت", published], ["طلبات من التواصل الاجتماعي", sum("leads", social)], ["كل الطلبات", sum("leads")],
    ["وصلت لعرض سعر", sum("quoted")], ["مكتملة", sum("won")],
  ];
  $("[data-funnel]").replaceChildren(...cards.map(([label, n]) => { const d = document.createElement("div"); const s = document.createElement("strong"); s.textContent = String(n); d.append(s, label); return d; }));
  const names: Record<string, string> = { "(direct)": "مباشر / بحث عضوي", google: "جوجل" };
  Object.values(CHANNEL_INFO).forEach((c) => { names[c.utmSource] = c.ar; });
  $("[data-sources]").replaceChildren(...sources.map((s) => {
    const tr = document.createElement("tr");
    tr.append(td(names[s.source] ?? s.source), td(s.medium, "ltr"), td(s.leads), td(s.quoted), td(s.won), td(s.leads ? `${Math.round((s.quoted / s.leads) * 100)}%` : "—"));
    return tr;
  }));
}

function count() {
  const text = $<HTMLTextAreaElement>("[data-text]").value;
  const link = $<HTMLInputElement>("[data-link]").value.trim();
  const xOn = document.querySelector<HTMLInputElement>('[data-pick] input[value="x"]')?.checked;
  const n = xLength(link && !text.includes(link) ? `${text}\n\n${link}` : text);
  const el = $("[data-count]");
  el.textContent = `${[...text].length} حرفًا${xOn ? ` · إكس: ${n}/280` : ""}`;
  el.className = "soc-count" + (xOn && n > 280 ? " over" : "");
}

async function load() { msg(""); try { await Promise.all([loadQueue(), loadFunnel()]); } catch (e) { msg((e as Error).message, true); } }
function logout() { token = ""; sessionStorage.removeItem(KEY); $("[data-panel]").hidden = true; $("[data-login]").hidden = false; }
function start() { $("[data-login]").hidden = true; $("[data-panel]").hidden = false; load(); }

$("[data-login]").addEventListener("submit", (e) => { e.preventDefault(); token = $<HTMLInputElement>("#adm-token").value.trim(); sessionStorage.setItem(KEY, token); start(); });
$("[data-compose]").addEventListener("submit", async (e) => {
  e.preventDefault();
  const picked = [...document.querySelectorAll<HTMLInputElement>("[data-pick] input:checked")].map((i) => i.value);
  if (!picked.length) return msg("اختر حسابًا واحدًا على الأقل", true);
  try {
    const r = await api("/api/admin/social/posts", { method: "POST", body: JSON.stringify({
      channels: picked, text: $<HTMLTextAreaElement>("[data-text]").value, link: $<HTMLInputElement>("[data-link]").value,
      image: $<HTMLInputElement>("[data-image]").value, lang: $<HTMLSelectElement>("[data-lang]").value, scheduledAt: fromLocal($<HTMLInputElement>("[data-at]").value),
    }) });
    msg(`تمت جدولة ${r.created} منشور`); ($("[data-compose]") as HTMLFormElement).reset(); count(); await loadQueue();
  } catch (err) { msg((err as Error).message, true); }
});
$("[data-text]").addEventListener("input", count);
$("[data-link]").addEventListener("input", count);
$("[data-refresh]").onclick = load;
$("[data-filter]").onchange = () => loadQueue().catch((e) => msg(e.message, true));
$("[data-days]").onchange = () => loadFunnel().catch((e) => msg(e.message, true));
$("[data-run]").onclick = async () => {
  try { const r = await api("/api/admin/social/run", { method: "POST" }); msg(`أُضيف ${r.queued} منشورًا للقائمة، ونُشر ${r.published}، وفشل ${r.failed}`); await loadQueue(); }
  catch (e) { msg((e as Error).message, true); }
};
$("[data-logout]").onclick = logout;
if (token) start();
