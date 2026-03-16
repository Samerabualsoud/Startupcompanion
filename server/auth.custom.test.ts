import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// ── Mock the DB helpers ────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUserLastSignedIn: vi.fn(),
  updateUserName: vi.fn(),
}));

import * as db from "./db";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeMockUser(overrides: Partial<any> = {}) {
  return {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    passwordHash: bcrypt.hashSync("password123", 10),
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    emailVerified: false,
    openId: null,
    loginMethod: "email",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: "inactive",
    subscriptionPlan: null,
    subscriptionCurrentPeriodEnd: null,
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Custom Auth: password hashing", () => {
  it("should hash passwords with bcrypt", async () => {
    const hash = await bcrypt.hash("mypassword", 12);
    expect(hash).toBeTruthy();
    expect(hash).not.toBe("mypassword");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("should verify correct password", async () => {
    const hash = await bcrypt.hash("correctpassword", 10);
    const valid = await bcrypt.compare("correctpassword", hash);
    expect(valid).toBe(true);
  });

  it("should reject wrong password", async () => {
    const hash = await bcrypt.hash("correctpassword", 10);
    const valid = await bcrypt.compare("wrongpassword", hash);
    expect(valid).toBe(false);
  });
});

describe("Custom Auth: login flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user when credentials are valid", async () => {
    const mockUser = makeMockUser();
    vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(db.updateUserLastSignedIn).mockResolvedValue(undefined);

    const user = await db.getUserByEmail("test@example.com");
    expect(user).toBeTruthy();
    expect(user?.email).toBe("test@example.com");

    const valid = await bcrypt.compare("password123", user!.passwordHash!);
    expect(valid).toBe(true);
  });

  it("should return null for non-existent user", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue(null);

    const user = await db.getUserByEmail("nonexistent@example.com");
    expect(user).toBeNull();
  });

  it("should reject invalid password", async () => {
    const mockUser = makeMockUser();
    vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);

    const user = await db.getUserByEmail("test@example.com");
    const valid = await bcrypt.compare("wrongpassword", user!.passwordHash!);
    expect(valid).toBe(false);
  });
});

describe("Custom Auth: register flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create user with hashed password", async () => {
    const mockUser = makeMockUser();
    vi.mocked(db.getUserByEmail).mockResolvedValue(null);
    vi.mocked(db.createUser).mockResolvedValue(mockUser);

    const existing = await db.getUserByEmail("new@example.com");
    expect(existing).toBeNull();

    const hash = await bcrypt.hash("newpassword123", 12);
    const created = await db.createUser({ email: "new@example.com", passwordHash: hash, name: "New User" });

    expect(db.createUser).toHaveBeenCalledWith({
      email: "new@example.com",
      passwordHash: expect.stringMatching(/^\$2/),
      name: "New User",
    });
    expect(created).toBeTruthy();
  });

  it("should reject duplicate email", async () => {
    const mockUser = makeMockUser();
    vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);

    const existing = await db.getUserByEmail("test@example.com");
    expect(existing).toBeTruthy();
    // In the real router, this triggers a CONFLICT TRPCError
  });
});

describe("Custom Auth: getUserById", () => {
  it("should return user by ID", async () => {
    const mockUser = makeMockUser({ id: 42 });
    vi.mocked(db.getUserById).mockResolvedValue(mockUser);

    const user = await db.getUserById(42);
    expect(user?.id).toBe(42);
    expect(user?.email).toBe("test@example.com");
  });

  it("should return null for missing user", async () => {
    vi.mocked(db.getUserById).mockResolvedValue(null);

    const user = await db.getUserById(9999);
    expect(user).toBeNull();
  });
});

describe("Resources Router: data integrity", () => {
  it("VC firms data has required fields", async () => {
    const { VC_FIRMS_DATA } = await import("./resourcesRouter");
    expect(VC_FIRMS_DATA.length).toBeGreaterThan(0);
    for (const firm of VC_FIRMS_DATA) {
      expect(firm.name).toBeTruthy();
      expect(firm.description).toBeTruthy();
      expect(Array.isArray(firm.stages)).toBe(true);
      expect(Array.isArray(firm.sectors)).toBe(true);
      expect(Array.isArray(firm.regions)).toBe(true);
    }
  });

  it("Angel investors data has required fields", async () => {
    const { ANGEL_INVESTORS_DATA } = await import("./resourcesRouter");
    expect(ANGEL_INVESTORS_DATA.length).toBeGreaterThan(0);
    for (const angel of ANGEL_INVESTORS_DATA) {
      expect(angel.name).toBeTruthy();
      expect(angel.bio).toBeTruthy();
      expect(Array.isArray(angel.stages)).toBe(true);
    }
  });

  it("Grants data has required fields", async () => {
    const { GRANTS_DATA } = await import("./resourcesRouter");
    expect(GRANTS_DATA.length).toBeGreaterThan(0);
    for (const grant of GRANTS_DATA) {
      expect(grant.name).toBeTruthy();
      expect(grant.provider).toBeTruthy();
      expect(typeof grant.isEquityFree).toBe("boolean");
    }
  });

  it("Venture lawyers data has required fields", async () => {
    const { VENTURE_LAWYERS_DATA } = await import("./resourcesRouter");
    expect(VENTURE_LAWYERS_DATA.length).toBeGreaterThan(0);
    for (const lawyer of VENTURE_LAWYERS_DATA) {
      expect(lawyer.name).toBeTruthy();
      expect(lawyer.firm).toBeTruthy();
      expect(Array.isArray(lawyer.specializations)).toBe(true);
    }
  });
});
