import { COMMON, ERROR_TEXT, UPLOAD, fieldsFor, isVisible, serviceFields, validateField, type Field, type FormKind, type Values } from "@/lib/forms";
import { renderField } from "@/lib/form-render";
import { track } from "./analytics";

type Lang = "en" | "ar";

function readValues(form: HTMLFormElement): Values {
  const out: Values = {};
  for (const [k, v] of new FormData(form).entries()) {
    if (typeof v !== "string") continue;
    const prev = out[k];
    out[k] = prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  // Multi-selects must be arrays even with one choice
  form.querySelectorAll<HTMLFieldSetElement>("fieldset[data-field]").forEach((fs) => {
    const n = fs.dataset.field!;
    if (out[n] !== undefined && !Array.isArray(out[n])) out[n] = [out[n] as string];
  });
  return out;
}

export function initRequestForm(form: HTMLFormElement) {
  const lang = (form.dataset.lang as Lang) ?? "en";
  const kind = (form.dataset.kind as FormKind) ?? "request";
  const steps = [...form.querySelectorAll<HTMLElement>("[data-step]")];
  const alertBox = form.querySelector<HTMLElement>("[data-alert]")!;
  const ui = {
    requiredText: lang === "ar" ? "مطلوب" : "Required", optionalText: lang === "ar" ? "اختياري" : "Optional",
    selectPlaceholder: lang === "ar" ? "اختر…" : "Select…",
  };
  let current = 0;
  let started = false;
  let files: File[] = [];

  // Hidden context fields
  form.querySelector<HTMLInputElement>("[data-source]")!.value = location.pathname;
  form.querySelector<HTMLInputElement>("[data-started]")!.value = String(Date.now());
  try {
    form.querySelector<HTMLInputElement>("[data-referrer]")!.value = sessionStorage.getItem("selorin_referrer") ?? document.referrer;
    const utm = JSON.parse(sessionStorage.getItem("selorin_utm") ?? "{}") as Record<string, string>;
    form.querySelectorAll<HTMLInputElement>("[data-utm]").forEach((i) => { i.value = utm[i.dataset.utm!] ?? ""; });
  } catch {}

  // Contact page: pre-select service from ?service=
  const qsService = new URLSearchParams(location.search).get("service");
  const serviceSelect = form.querySelector<HTMLSelectElement>("select[name='service']");
  if (qsService && serviceSelect && [...serviceSelect.options].some((o) => o.value === qsService)) serviceSelect.value = qsService;

  const currentService = () => (form.querySelector<HTMLInputElement | HTMLSelectElement>("[name='service']")?.value ?? "");
  const fields = (): Field[] => fieldsFor(kind, currentService());

  // Generic request page: swap step-2 fields when the service changes
  const slot = form.querySelector<HTMLElement>("[data-service-fields]");
  const renderServiceFields = () => {
    if (!slot || form.dataset.preset) return;
    slot.innerHTML = serviceFields(currentService()).map((f) => renderField(f, lang, ui)).join("");
    applyConditions();
  };
  serviceSelect?.addEventListener("change", () => { renderServiceFields(); track("form_service_select", { service_slug: currentService() }); });
  if (serviceSelect && serviceSelect.value) renderServiceFields();

  // Conditional fields (showIf)
  function applyConditions() {
    const values = readValues(form);
    form.querySelectorAll<HTMLElement>("[data-show-field]").forEach((el) => {
      const v = values[el.dataset.showField!];
      el.hidden = !(typeof v === "string" && el.dataset.showIn!.split(",").includes(v));
    });
  }
  form.addEventListener("change", applyConditions);
  applyConditions();

  // Analytics: form start
  form.addEventListener("input", () => {
    if (started) return;
    started = true;
    track("form_start", { form_kind: kind, service_slug: currentService() || undefined });
  }, { once: false });

  // Errors
  const setError = (name: string, code: keyof typeof ERROR_TEXT | "attachments" | null, custom?: string) => {
    const wrap = form.querySelector<HTMLElement>(`[data-field="${name}"]`);
    const err = form.querySelector<HTMLElement>(`#f-${name}-error`);
    const controls = wrap?.querySelectorAll<HTMLElement>("input, select, textarea") ?? [];
    controls.forEach((c) => (code ? c.setAttribute("aria-invalid", "true") : c.removeAttribute("aria-invalid")));
    if (err) err.textContent = code ? custom ?? (code in ERROR_TEXT ? ERROR_TEXT[code as keyof typeof ERROR_TEXT][lang] : "") : "";
  };

  const stepFieldNames = (i: number) => {
    const names = new Set<string>();
    steps[i]?.querySelectorAll<HTMLElement>("[data-field]").forEach((el) => { if (!el.hidden) names.add(el.dataset.field!); });
    return names;
  };

  function validateStep(i: number): boolean {
    const values = readValues(form);
    const names = stepFieldNames(i);
    let firstBad: string | null = null;
    for (const f of fields()) {
      if (!names.has(f.name) || !isVisible(f, values)) continue;
      const e = validateField(f, values[f.name]);
      setError(f.name, e);
      if (e && !firstBad) firstBad = f.name;
    }
    if (names.has("consent")) {
      const ok = values.consent === "yes";
      setError("consent", ok ? null : "required");
      if (!ok && !firstBad) firstBad = "consent";
    }
    if (names.has("attachments")) {
      const fileErr = checkFiles();
      setError("attachments", fileErr ? "attachments" : null, fileErr ?? undefined);
      if (fileErr && !firstBad) firstBad = "attachments";
    }
    if (firstBad) {
      alertBox.hidden = false;
      alertBox.textContent = lang === "ar" ? "يرجى مراجعة الحقول المحددة." : "Please check the highlighted fields.";
      form.querySelector<HTMLElement>(`[data-field="${firstBad}"] :is(input, select, textarea)`)?.focus();
      track("form_error", { form_kind: kind, step: i + 1, field: firstBad, service_slug: currentService() || undefined });
      return false;
    }
    alertBox.hidden = true;
    return true;
  }

  // Live re-validation once a field has been touched
  form.addEventListener("change", (e) => {
    const el = e.target as HTMLElement;
    const name = (el as HTMLInputElement).name;
    if (!name || !el.hasAttribute("aria-invalid")) return;
    const f = [...fields(), COMMON.company].find((x) => x.name === name);
    if (f) setError(name, validateField(f, readValues(form)[name]));
  });

  function go(i: number) {
    steps.forEach((s, k) => (s.hidden = k !== i));
    form.querySelectorAll<HTMLElement>("[data-progress]").forEach((p) => p.classList.toggle("done", Number(p.dataset.progress) <= i));
    current = i;
    steps[i].querySelector<HTMLElement>("h2")?.focus();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  form.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", () => {
    if (!validateStep(current)) return;
    track("form_step", { form_kind: kind, step: current + 2, service_slug: currentService() || undefined });
    go(current + 1);
  }));
  form.querySelectorAll("[data-back]").forEach((b) => b.addEventListener("click", () => go(current - 1)));

  // Attachments (managed list so files can be removed before sending)
  const input = form.querySelector<HTMLInputElement>("input[type='file']");
  const list = form.querySelector<HTMLUListElement>("[data-file-list]");
  const zone = form.querySelector<HTMLElement>("[data-dropzone]");
  const fmt = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);
  function checkFiles(): string | null {
    if (files.length > UPLOAD.maxFiles) return lang === "ar" ? `الحد الأقصى ${UPLOAD.maxFiles} ملفات.` : `Up to ${UPLOAD.maxFiles} files.`;
    if (files.reduce((n, f) => n + f.size, 0) > UPLOAD.maxTotalBytes) return lang === "ar" ? "الحجم الإجمالي يتجاوز 10 ميجابايت." : "Total size exceeds 10 MB.";
    const bad = files.find((f) => !UPLOAD.extensions.includes((f.name.split(".").pop() ?? "").toLowerCase()));
    if (bad) return lang === "ar" ? `نوع الملف غير مسموح: ${bad.name}` : `File type not allowed: ${bad.name}`;
    return null;
  }
  function renderFiles() {
    if (!list) return;
    list.innerHTML = "";
    files.forEach((f, i) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = `${f.name} · ${fmt(f.size)}`;
      const rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = lang === "ar" ? "إزالة" : "Remove";
      rm.setAttribute("aria-label", `${rm.textContent} ${f.name}`);
      rm.addEventListener("click", () => { files.splice(i, 1); renderFiles(); });
      li.append(name, rm);
      list.append(li);
    });
    const e = checkFiles();
    setError("attachments", e ? "attachments" : null, e ?? undefined);
  }
  input?.addEventListener("change", () => { files = [...files, ...Array.from(input.files ?? [])]; input.value = ""; renderFiles(); });
  zone?.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("is-over"); });
  zone?.addEventListener("dragleave", () => zone.classList.remove("is-over"));
  zone?.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("is-over"); files = [...files, ...Array.from(e.dataTransfer?.files ?? [])]; renderFiles(); });

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(current)) return;
    const btn = form.querySelector<HTMLButtonElement>("[data-submit]")!;
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = lang === "ar" ? "جارٍ الإرسال…" : "Sending…";
    const data = new FormData(form);
    data.delete("attachments");
    files.forEach((f) => data.append("attachments", f, f.name));
    try {
      const res = await fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; requestId?: string; errors?: Record<string, string>; error?: string };
      if (res.ok && body.ok && body.requestId) {
        const values = readValues(form);
        track("generate_lead", { form_kind: kind, request_id: body.requestId, service_slug: currentService() || "unspecified", industry: (values.industry as string) || undefined, urgent: values.urgent === "yes" });
        try { sessionStorage.setItem("selorin_last_request", body.requestId); } catch {}
        location.href = `${form.dataset.received}?id=${encodeURIComponent(body.requestId)}`;
        return;
      }
      if (body.errors) {
        Object.entries(body.errors).forEach(([name, code]) => setError(name, code as keyof typeof ERROR_TEXT, name === "attachments" ? (lang === "ar" ? "تعذّر قبول أحد المرفقات (النوع أو الحجم)." : "One of the attachments was rejected (type or size).") : undefined));
        const first = Object.keys(body.errors)[0];
        const stepIdx = steps.findIndex((s) => s.querySelector(`[data-field="${first}"]`));
        if (stepIdx >= 0 && stepIdx !== current) go(stepIdx);
      }
      alertBox.hidden = false;
      alertBox.textContent = body.error === "rate_limited"
        ? (lang === "ar" ? "تم استلام عدة طلبات من جهازك خلال وقت قصير. يرجى المحاولة لاحقاً أو التواصل عبر sales@selorin.co." : "Several requests were sent from your device recently. Please try again later or email sales@selorin.co.")
        : body.error === "captcha"
          ? (lang === "ar" ? "تعذّر التحقق من الطلب. يرجى إكمال التحقق والمحاولة مرة أخرى." : "We could not verify the request. Please complete the check and try again.")
          : body.errors ? (lang === "ar" ? "يرجى مراجعة الحقول المحددة." : "Please check the highlighted fields.")
          : (lang === "ar" ? "تعذّر إرسال طلبك. حاول مرة أخرى أو راسلنا على sales@selorin.co." : "We could not send your request. Please try again, or email sales@selorin.co.");
      track("form_error", { form_kind: kind, step: current + 1, field: body.error ?? "server", service_slug: currentService() || undefined });
    } catch {
      alertBox.hidden = false;
      alertBox.textContent = lang === "ar" ? "تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى، أو راسلنا على sales@selorin.co." : "Connection failed. Check your connection and try again, or email sales@selorin.co.";
    } finally {
      btn.disabled = false;
      btn.innerHTML = label;
    }
  });
}
