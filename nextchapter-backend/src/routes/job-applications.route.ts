import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware.js";
import { extractRateLimit } from "../middleware/rate-limit.middleware.js";
import { parseWhatsAppMessage } from "../services/job-application-parser.service.js";
import { listJobApplications, saveParsedJobApplication, updateJobApplicationStatus, deleteJobApplication } from "../services/job-application.service.js";
import type { AppBindings } from "../types/index.js";

const extractSchema = z.object({
  text: z.string().trim().min(10).max(10_000)
});

const listSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional()
});

const updateStatusSchema = z.object({
  status: z.string().trim().min(1)
});

export const jobApplicationRoutes = new Hono<AppBindings>();

jobApplicationRoutes.use("*", requireAuth);

jobApplicationRoutes.post("/extract", extractRateLimit, async (c) => {
  const body = extractSchema.safeParse(await c.req.json());

  if (!body.success) {
    throw new HTTPException(400, {
      message: body.error.issues[0]?.message ?? "Invalid application payload."
    });
  }

  const parsed = parseWhatsAppMessage(body.data.text);
  const application = await saveParsedJobApplication(c.get("auth"), body.data.text, parsed);

  return c.json({
    application
  });
});

jobApplicationRoutes.get("/", async (c) => {
  const query = listSchema.safeParse(c.req.query());

  if (!query.success) {
    throw new HTTPException(400, {
      message: query.error.issues[0]?.message ?? "Invalid filter query."
    });
  }

  return c.json(await listJobApplications(c.get("auth"), query.data));
});

jobApplicationRoutes.patch("/:id/status", async (c) => {
  const id = c.req.param("id");
  const body = updateStatusSchema.safeParse(await c.req.json());

  if (!body.success) {
    throw new HTTPException(400, {
      message: body.error.issues[0]?.message ?? "Invalid status value."
    });
  }

  const application = await updateJobApplicationStatus(c.get("auth"), id, body.data.status);
  return c.json({ application });
});

jobApplicationRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await deleteJobApplication(c.get("auth"), id);
  return c.json({ success: true });
});
