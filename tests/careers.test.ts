import { describe, expect, it } from "vitest";
import { validate, fieldsFor } from "../src/lib/forms";
import { buildLead, emailSubject, confirmationEmail } from "../src/lib/lead";

const base = {
  kind: "careers", lang: "ar", consent: "yes",
  contactName: "سارة أحمد", email: "sara@example.com", phone: "+966 50 000 0000", location: "الرياض",
  careerArea: "field-monitoring", experience: "4",
};

describe("careers form", () => {
  it("accepts a complete application", () => {
    expect(validate("careers", base).errors).toEqual({});
  });

  it("requires area and experience, and checks the experience range", () => {
    const { errors } = validate("careers", { ...base, careerArea: "", experience: "70" });
    expect(errors.careerArea).toBe("required");
    expect(errors.experience).toBe("out_of_range");
  });

  it("does not ask candidates for a company", () => {
    expect(fieldsFor("careers", undefined).some((f) => f.name === "company")).toBe(false);
  });

  it("builds a job-application email and an applicant confirmation", () => {
    const { fields } = validate("careers", base);
    const lead = buildLead({ leadId: "SEL-2026-000007", kind: "careers", values: base, fields, now: new Date("2026-10-06T09:00:00Z"), attachments: [] });
    expect(emailSubject(lead)).toBe("[New Job Application] – Field monitoring & measurement – سارة أحمد");
    const c = confirmationEmail(lead);
    expect(c.subject).toContain("طلب التوظيف");
    expect(c.text).toContain("SEL-2026-000007");
  });
});
