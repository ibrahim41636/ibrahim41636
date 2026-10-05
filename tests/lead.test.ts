import { describe, expect, it } from "vitest";
import { buildLead, emailSubject, emailHtml, emailText, formatLeadId, clean } from "../src/lib/lead";
import { fieldsFor } from "../src/lib/forms";

const values = {
  kind: "request", lang: "en", service: "environmental-permitting", industry: "industrial-manufacturing", location: "Jubail",
  facilityType: "factory", projectStatus: "operating", permitType: "renewal", permitStatus: "expiring", permitExpiry: "2027-01-31",
  description: "Renewal for line 2", company: "Acme <b>Industries</b>", contactName: "Sara Ali", email: "sara@acme.sa", phone: "+966501234567",
  preferredContact: "whatsapp", consent: "yes", urgent: "yes", sourcePage: "/services/environmental-permitting/", utm_source: "google", utm_medium: "cpc", utm_campaign: "permits",
};

describe("lead", () => {
  const lead = buildLead({ leadId: formatLeadId(2026, 123), kind: "request", values, fields: fieldsFor("request", "environmental-permitting"), now: new Date("2026-10-05T09:30:00Z"), attachments: [{ name: "site.pdf", size: 2048, type: "application/pdf" }] });

  it("formats request IDs", () => expect(formatLeadId(2026, 123)).toBe("SEL-2026-000123"));
  it("carries CRM fields", () => {
    expect(lead.service).toEqual({ slug: "environmental-permitting", name: "Environmental Permitting" });
    expect(lead.industry).toBe("Industrial & Manufacturing");
    expect(lead.utm).toMatchObject({ source: "google", medium: "cpc", campaign: "permits" });
    expect(lead.date).toBe("2026-10-05");
    expect(lead.time).toBe("12:30"); // Asia/Riyadh
    expect(lead.preferredContact).toBe("WhatsApp");
    expect(lead.details.map((d) => d.field)).toContain("permitExpiry");
  });
  it("uses the agreed subject format", () => {
    expect(emailSubject(lead)).toBe("[URGENT] [New Service Request] – Environmental Permitting – Acme <b>Industries</b>");
  });
  it("escapes user input in HTML email", () => {
    const html = emailHtml(lead);
    expect(html).toContain("Acme &lt;b&gt;Industries&lt;/b&gt;");
    expect(html).not.toContain("<b>Industries</b>");
  });
  it("includes every required section in the text email", () => {
    const text = emailText(lead);
    for (const s of ["SERVICE REQUESTED", "Company Name", "Contact Person", "Email", "Phone", "Location", "PROJECT DETAILS", "ADDITIONAL INFORMATION", "Submission Date", "Source Page", "UTM Source"]) expect(text).toContain(s);
  });
  it("strips header-injection characters", () => {
    expect(clean("a\r\nBcc: x@y.z")).toBe("a\r\nBcc: x@y.z".replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ""));
    const l2 = buildLead({ leadId: "SEL-2026-000001", kind: "contact", values: { ...values, company: "X\r\nBcc: evil@x.com" }, fields: fieldsFor("contact", undefined), now: new Date(), attachments: [] });
    expect(emailSubject(l2)).not.toMatch(/[\r\n]/);
  });
});
