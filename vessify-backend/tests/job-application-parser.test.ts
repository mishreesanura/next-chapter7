import { parseWhatsAppMessage } from "../src/services/job-application-parser.service.js";

describe("Job Application Parser", () => {
  test("should extract application link and ignore JD link", () => {
    const text = `
      *Company*: Vessify
      *Roles*: Software Engineer
      *JD*: https://vessify.com/jd-link
      *Application Link*: https://vessify.com/apply-link
    `;
    const parsed = parseWhatsAppMessage(text);
    expect(parsed.companyName).toBe("Vessify");
    expect(parsed.roles).toBe("Software Engineer");
    expect(parsed.applicationLink).toBe("https://vessify.com/apply-link");
  });

  test("should still parse application link if JD is absent", () => {
    const text = `
      Company: TestCorp
      Roles: Frontend Developer
      Form: https://testcorp.com/form
    `;
    const parsed = parseWhatsAppMessage(text);
    expect(parsed.companyName).toBe("TestCorp");
    expect(parsed.roles).toBe("Frontend Developer");
    expect(parsed.applicationLink).toBe("https://testcorp.com/form");
  });
});
