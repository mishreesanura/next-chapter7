import type { Prisma, JobApplication } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { withOrganizationRls } from "../lib/prisma.js";
import type { AuthContext } from "../types/index.js";
import type { ParsedJobApplication } from "./job-application-parser.service.js";

type CursorPayload = {
  createdAt: string;
  id: string;
};

export type JobApplicationResponse = {
  id: string;
  rawText: string;
  companyName: string;
  roles: string;
  stipend: string | null;
  location: string | null;
  duration: string | null;
  eligibility: string | null;
  deadline: string | null;
  applicationLink: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function encodeCursor(payload: CursorPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): CursorPayload {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Partial<CursorPayload>;

    if (!decoded.createdAt || !decoded.id) {
      throw new Error("Cursor payload is incomplete.");
    }

    return {
      createdAt: decoded.createdAt,
      id: decoded.id
    };
  } catch {
    throw new HTTPException(400, {
      message: "Invalid pagination cursor."
    });
  }
}

export function serializeJobApplication(app: JobApplication): JobApplicationResponse {
  return {
    id: app.id,
    rawText: app.rawText,
    companyName: app.companyName,
    roles: app.roles,
    stipend: app.stipend,
    location: app.location,
    duration: app.duration,
    eligibility: app.eligibility,
    deadline: app.deadline,
    applicationLink: app.applicationLink,
    status: app.status,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString()
  };
}

export async function saveParsedJobApplication(
  auth: AuthContext,
  rawText: string,
  parsed: ParsedJobApplication
) {
  const app = await withOrganizationRls(auth.organizationId, async (tx) =>
    tx.jobApplication.create({
      data: {
        organizationId: auth.organizationId,
        userId: auth.userId,
        rawText,
        companyName: parsed.companyName,
        roles: parsed.roles,
        stipend: parsed.stipend,
        location: parsed.location,
        duration: parsed.duration,
        eligibility: parsed.eligibility,
        deadline: parsed.deadline,
        applicationLink: parsed.applicationLink,
        status: "Not Applied"
      }
    })
  );

  return serializeJobApplication(app);
}

export async function updateJobApplicationStatus(
  auth: AuthContext,
  id: string,
  status: string
) {
  const app = await withOrganizationRls(auth.organizationId, async (tx) => {
    // Confirm ownership
    const existing = await tx.jobApplication.findUnique({
      where: { id }
    });

    if (!existing || existing.organizationId !== auth.organizationId) {
      throw new HTTPException(404, { message: "Job application not found." });
    }

    return tx.jobApplication.update({
      where: { id },
      data: { status }
    });
  });

  return serializeJobApplication(app);
}

export async function deleteJobApplication(
  auth: AuthContext,
  id: string
) {
  await withOrganizationRls(auth.organizationId, async (tx) => {
    // Confirm ownership
    const existing = await tx.jobApplication.findUnique({
      where: { id }
    });

    if (!existing || existing.organizationId !== auth.organizationId) {
      throw new HTTPException(404, { message: "Job application not found." });
    }

    return tx.jobApplication.delete({
      where: { id }
    });
  });
}

export async function listJobApplications(
  auth: AuthContext,
  options: {
    cursor?: string;
    limit?: number;
    search?: string;
    status?: string;
    sortOrder?: "asc" | "desc";
  }
) {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;
  const cursorCreatedAt = cursor ? new Date(cursor.createdAt) : null;
  const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";

  if (cursorCreatedAt && Number.isNaN(cursorCreatedAt.getTime())) {
    throw new HTTPException(400, {
      message: "Invalid pagination cursor date."
    });
  }

  const conditions: Prisma.JobApplicationWhereInput[] = [
    { organizationId: auth.organizationId }
  ];

  if (options.status && options.status !== "ALL") {
    conditions.push({ status: options.status });
  }

  if (options.search) {
    const searchLower = options.search.trim();
    conditions.push({
      OR: [
        { companyName: { contains: searchLower, mode: "insensitive" } },
        { roles: { contains: searchLower, mode: "insensitive" } },
        { location: { contains: searchLower, mode: "insensitive" } }
      ]
    });
  }

  if (cursor && cursorCreatedAt) {
    if (sortOrder === "desc") {
      conditions.push({
        OR: [
          {
            createdAt: {
              lt: cursorCreatedAt
            }
          },
          {
            createdAt: cursorCreatedAt,
            id: {
              lt: cursor.id
            }
          }
        ]
      });
    } else {
      conditions.push({
        OR: [
          {
            createdAt: {
              gt: cursorCreatedAt
            }
          },
          {
            createdAt: cursorCreatedAt,
            id: {
              gt: cursor.id
            }
          }
        ]
      });
    }
  }

  const where: Prisma.JobApplicationWhereInput = {
    AND: conditions
  };

  const rows = await withOrganizationRls(auth.organizationId, async (tx) =>
    tx.jobApplication.findMany({
      where,
      orderBy: [
        {
          createdAt: sortOrder
        },
        {
          id: sortOrder
        }
      ],
      take: limit + 1
    })
  );

  const visibleRows = rows.slice(0, limit);
  const last = visibleRows.at(-1);
  const nextCursor =
    rows.length > limit && last
      ? encodeCursor({
          createdAt: last.createdAt.toISOString(),
          id: last.id
        })
      : null;

  return {
    jobApplications: visibleRows.map(serializeJobApplication),
    nextCursor
  };
}
