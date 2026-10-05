// Renders form fields to HTML strings. Used at build time (server-rendered, works without JS)
// and in the browser when the visitor picks a service on the generic request page.
import type { Field, FormLang } from "./forms";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export function renderField(f: Field, lang: FormLang, opts: { full?: boolean; requiredText: string; optionalText: string; selectPlaceholder: string }) {
  const id = `f-${f.name}`;
  const label = esc(f.label[lang]);
  const tag = f.required ? "" : ` <span class="opt">(${esc(opts.optionalText)})</span>`;
  const hintId = f.hint ? `${id}-hint` : "";
  const errId = `${id}-error`;
  const describedBy = [hintId, errId].filter(Boolean).join(" ");
  const req = f.required ? " required aria-required=\"true\"" : "";
  const hint = f.hint ? `<span class="hint" id="${hintId}">${esc(f.hint[lang])}</span>` : "";
  const err = `<span class="error" id="${errId}" aria-live="polite"></span>`;
  const cls = `field${opts.full || f.type === "textarea" || f.type === "multi" ? " full" : ""}`;
  const show = f.showIf ? ` data-show-field="${f.showIf.field}" data-show-in="${f.showIf.in.join(",")}" hidden` : "";

  if (f.type === "multi") {
    const choices = f.options!.map((o) => `<label class="choice"><input type="checkbox" name="${f.name}" value="${esc(o.value)}"><span>${esc(o[lang])}</span></label>`).join("");
    return `<fieldset class="${cls}" data-field="${f.name}"${show} aria-describedby="${describedBy}"${f.required ? ' data-required="true"' : ""}><legend>${label}${tag}</legend>${hint}<div class="choices">${choices}</div>${err}</fieldset>`;
  }
  let control: string;
  const common = `id="${id}" name="${f.name}" aria-describedby="${describedBy}"${req}${f.autocomplete ? ` autocomplete="${f.autocomplete}"` : ""}`;
  if (f.type === "select") {
    const options = (f.options ?? []).map((o) => `<option value="${esc(o.value)}">${esc(o[lang])}</option>`).join("");
    control = `<select ${common}><option value="">${esc(opts.selectPlaceholder)}</option>${options}</select>`;
  } else if (f.type === "textarea") {
    control = `<textarea ${common}${f.maxLength ? ` maxlength="${f.maxLength}"` : ""}></textarea>`;
  } else {
    const type = f.type === "number" ? "text\" inputmode=\"numeric\" pattern=\"[0-9]*" : f.type;
    const dirAttr = ["email", "tel", "number", "date"].includes(f.type) ? ' dir="ltr"' : "";
    control = `<input type="${type}" ${common}${f.maxLength ? ` maxlength="${f.maxLength}"` : ""}${dirAttr}>`;
  }
  return `<div class="${cls}" data-field="${f.name}"${show}><label for="${id}">${label}${tag}</label>${control}${hint}${err}</div>`;
}
