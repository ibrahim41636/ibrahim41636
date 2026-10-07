import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { SERVICES, fieldsFor, serviceFields, validate, validateField, isVisible, displayValue } from "../src/lib/forms";

const base = { company: "Acme Industries", contactName: "Sara Ali", email: "sara@acme.sa", phone: "+966 50 123 4567", preferredContact: "email", industry: "industrial-manufacturing", location: "Jubail", description: "New production line", consent: "yes" };

describe("service catalogue", () => {
  it("matches the content files one-to-one", () => {
    const files = readdirSync("src/content/services").map((f) => f.replace(/\.json$/, "")).sort();
    expect(Object.keys(SERVICES).sort()).toEqual(files);
  });
});

describe("smart fields per service", () => {
  it("permitting asks for permit type, status and conditional expiry", () => {
    const names = serviceFields("environmental-permitting").map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(["facilityType", "projectStatus", "permitType", "permitStatus", "permitExpiry"]));
  });
  it("monitoring asks for monitoring type, points, parameters, duration and existing data", () => {
    const names = serviceFields("environmental-monitoring").map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(["monitoringType", "monitoringPoints", "parameters", "duration", "existingData"]));
  });
  it("fuel station VOC replaces generic monitoring fields with station fields", () => {
    const names = serviceFields("fuel-station-voc-monitoring").map((f) => f.name);
    expect(names).toContain("stations");
    expect(names).not.toContain("monitoringType");
  });
  it("renewable energy asks for site type, solutions, status, bill and area", () => {
    const names = serviceFields("solar-energy-systems").map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(["siteType", "energySolution", "projectStatus", "monthlyBill", "availableArea"]));
    const { errors } = validate("request", { ...base, service: "ev-charging-stations", siteType: "compound", energySolution: ["ev-charging", "rooftop-solar"], projectStatus: "planning" });
    expect(errors).toEqual({});
  });
  it("shows permit expiry only for valid/expiring/expired permits", () => {
    const expiry = serviceFields("environmental-permitting").find((f) => f.name === "permitExpiry")!;
    expect(isVisible(expiry, { permitStatus: "none" })).toBe(false);
    expect(isVisible(expiry, { permitStatus: "expiring" })).toBe(true);
  });
});

describe("server-side validation", () => {
  it("accepts a complete permitting request", () => {
    const { errors } = validate("request", { ...base, service: "environmental-permitting", facilityType: "factory", projectStatus: "operating", permitType: "renewal", permitStatus: "valid", permitExpiry: "2027-01-31" });
    expect(errors).toEqual({});
  });
  it("rejects missing required and out-of-list values", () => {
    const { errors } = validate("request", { ...base, service: "environmental-permitting", facilityType: "spaceship", permitStatus: "valid" });
    expect(errors.facilityType).toBe("invalid");
    expect(errors.projectStatus).toBe("required");
    expect(errors.permitType).toBe("required");
  });
  it("requires consent", () => {
    const { errors } = validate("contact", { contactName: "A", company: "B", email: "a@b.co", phone: "0501234567", message: "Hi" });
    expect(errors.consent).toBe("required");
  });
  it("validates email, phone, dates and numbers", () => {
    const f = fieldsFor("request", "fuel-station-voc-monitoring");
    const get = (n: string) => f.find((x) => x.name === n)!;
    expect(validateField(get("email"), "not-an-email")).toBe("invalid");
    expect(validateField(get("phone"), "<script>")).toBe("invalid");
    expect(validateField(get("stations"), "0")).toBe("out_of_range");
    expect(validateField(get("stations"), "12")).toBeNull();
    expect(validateField(serviceFields("environmental-permitting").find((x) => x.name === "permitExpiry")!, "31/01/2027")).toBe("invalid");
  });
  it("rejects over-long text", () => {
    const { errors } = validate("request", { ...base, service: "other", description: "x".repeat(5000) });
    expect(errors.description).toBe("too_long");
  });
  it("renders option labels for emails", () => {
    const f = serviceFields("environmental-monitoring").find((x) => x.name === "monitoringType")!;
    expect(displayValue(f, ["dust", "noise"])).toBe("Dust / particulates (PM), Noise / vibration");
  });
});
