import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { StringValue } from "ms";
import { PrismaClient } from "../generated/client";
import { config } from "../config";
import { getTestPrisma, setupTestDb } from "./testUtils";

describe("Permanent Link Sharing", () => {
  const userAgent = "vitest-link-sharing-expiry";

  let prisma: PrismaClient;
  let app: any;
  let ownerUser: { id: string; email: string };
  let ownerToken: string;
  let ownerAgent: any;
  let ownerCsrfHeaderName: string;
  let ownerCsrfToken: string;

  const createDrawing = async () => {
    return prisma.drawing.create({
      data: {
        name: "Shared Drawing",
        elements: "[]",
        appState: "{}",
        files: "{}",
        userId: ownerUser.id,
        collectionId: null,
        preview: null,
      },
      select: { id: true },
    });
  };

  const postLinkShare = async (
    drawingId: string,
    permission: "view" | "edit",
    body?: { expiresAt?: string | null },
  ) => {
    const payload: Record<string, unknown> = { permission };
    if (body && Object.prototype.hasOwnProperty.call(body, "expiresAt")) {
      payload.expiresAt = body.expiresAt;
    }
    return ownerAgent
      .post(`/drawings/${drawingId}/link-shares`)
      .set("User-Agent", userAgent)
      .set("Authorization", `Bearer ${ownerToken}`)
      .set(ownerCsrfHeaderName, ownerCsrfToken)
      .send(payload);
  };

  const createLinkShare = async (
    drawingId: string,
    permission: "view" | "edit",
    body?: { expiresAt?: string | null },
  ) => {
    const response = await postLinkShare(drawingId, permission, body);
    expect(response.status).toBe(200);
    return response;
  };

  beforeAll(async () => {
    setupTestDb();
    prisma = getTestPrisma();

    ({ app } = await import("../index"));

    await prisma.systemConfig.upsert({
      where: { id: "default" },
      update: {
        authEnabled: true,
        registrationEnabled: false,
      },
      create: {
        id: "default",
        authEnabled: true,
        registrationEnabled: false,
      },
    });

    const passwordHash = await bcrypt.hash("password123", 10);
    ownerUser = await prisma.user.create({
      data: {
        email: "owner-expiry-user@test.local",
        passwordHash,
        name: "Owner User",
        role: "USER",
        isActive: true,
      },
      select: { id: true, email: true },
    });

    const signOptions: SignOptions = {
      expiresIn: config.jwtAccessExpiresIn as StringValue,
    };
    ownerToken = jwt.sign(
      { userId: ownerUser.id, email: ownerUser.email, type: "access" },
      config.jwtSecret,
      signOptions,
    );

    ownerAgent = request.agent(app);
    const csrfRes = await ownerAgent
      .get("/csrf-token")
      .set("User-Agent", userAgent);
    ownerCsrfHeaderName = csrfRes.body.header;
    ownerCsrfToken = csrfRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it.each(["view", "edit"] as const)(
    "creates a permanent %s link when expiry is omitted",
    async (permission) => {
      const drawing = await createDrawing();
      const res = await createLinkShare(drawing.id, permission);
      expect(res.body.share.expiresAt).toBeNull();
      const stored = await prisma.drawingLinkShare.findUnique({
        where: { id: res.body.share.id },
      });
      expect(stored?.expiresAt).toBeNull();
      expect(stored?.revokedAt).toBeNull();
    },
  );

  it("accepts explicit null from clients requesting a permanent link", async () => {
    const drawing = await createDrawing();
    const res = await createLinkShare(drawing.id, "edit", { expiresAt: null });
    expect(res.body.share.expiresAt).toBeNull();
  });

  it("rejects expiry requests instead of silently creating permanent access", async () => {
    const drawing = await createDrawing();
    const res = await postLinkShare(drawing.id, "edit", {
      expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    });
    expect(res.status).toBe(400);
    expect(
      await prisma.drawingLinkShare.count({ where: { drawingId: drawing.id } }),
    ).toBe(0);
  });
});
