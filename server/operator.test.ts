import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return ctx;
}

describe("operator routes", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createContext();
  });

  it("should login operator with name and pa", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.operator.login({
      name: "João Silva",
      pa: "PA-01",
    });

    expect(result.operator).toBeDefined();
    expect(result.operator.name).toBe("João Silva");
    expect(result.operator.pa).toBe("PA-01");
  });

  it("should reject login with empty name", async () => {
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.operator.login({
        name: "",
        pa: "PA-01",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Nome é obrigatório");
    }
  });

  it("should reject login with empty pa", async () => {
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.operator.login({
        name: "João Silva",
        pa: "",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("PA é obrigatório");
    }
  });

  it("should add operator to queue", async () => {
    const caller = appRouter.createCaller(ctx);

    // First login
    const loginResult = await caller.operator.login({
      name: "João Silva",
      pa: "PA-01",
    });

    // Then call monitor
    const queueResult = await caller.operator.callMonitor({
      operatorId: loginResult.operator.id,
      operatorName: loginResult.operator.name,
      operatorPa: loginResult.operator.pa,
    });

    expect(queueResult.queueItem).toBeDefined();
    expect(queueResult.queueItem.operatorName).toBe("João Silva");
    expect(queueResult.queueItem.operatorPa).toBe("PA-01");
    expect(queueResult.queueItem.status).toBe("waiting");
  });

  it("should get queue with waiting items", async () => {
    const caller = appRouter.createCaller(ctx);

    // Add operator to queue
    const loginResult = await caller.operator.login({
      name: "João Silva",
      pa: "PA-01",
    });

    const queueResult = await caller.operator.callMonitor({
      operatorId: loginResult.operator.id,
      operatorName: loginResult.operator.name,
      operatorPa: loginResult.operator.pa,
    });

    // Get queue
    const queue = await caller.operator.getQueue();

    expect(queue).toBeDefined();
    expect(queue.length).toBeGreaterThan(0);
    // Check if the newly added item is in the queue
    const addedItem = queue.find((q) => q.id === queueResult.queueItem.id);
    expect(addedItem).toBeDefined();
    expect(addedItem?.operatorName).toBe("João Silva");
  });

  it("should create case", async () => {
    const caller = appRouter.createCaller(ctx);

    const loginResult = await caller.operator.login({
      name: "João Silva",
      pa: "PA-01",
    });

    const caseResult = await caller.operator.createCase({
      operatorId: loginResult.operator.id,
      operatorName: loginResult.operator.name,
      operatorPa: loginResult.operator.pa,
      title: "Erro Sistêmico",
      description: "Sistema não está respondendo",
    });

    expect(caseResult.caseItem).toBeDefined();
    expect(caseResult.caseItem.title).toBe("Erro Sistêmico");
    expect(caseResult.caseItem.description).toBe("Sistema não está respondendo");
    expect(caseResult.caseItem.status).toBe("pending");
  });

  it("should reject case creation with empty title", async () => {
    const caller = appRouter.createCaller(ctx);

    const loginResult = await caller.operator.login({
      name: "João Silva",
      pa: "PA-01",
    });

    try {
      await caller.operator.createCase({
        operatorId: loginResult.operator.id,
        operatorName: loginResult.operator.name,
        operatorPa: loginResult.operator.pa,
        title: "",
        description: "Sistema não está respondendo",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Título é obrigatório");
    }
  });

  it("should get pending cases", async () => {
    const caller = appRouter.createCaller(ctx);

    const loginResult = await caller.operator.login({
      name: "João Silva",
      pa: "PA-01",
    });

    await caller.operator.createCase({
      operatorId: loginResult.operator.id,
      operatorName: loginResult.operator.name,
      operatorPa: loginResult.operator.pa,
      title: "Erro Sistêmico",
      description: "Sistema não está respondendo",
    });

    const cases = await caller.operator.getPendingCases();

    expect(cases).toBeDefined();
    expect(cases.length).toBeGreaterThan(0);
    // Verificar se o último caso criado tem o título esperado
    const lastCase = cases[cases.length - 1];
    expect(lastCase?.title).toBe("Erro Sistêmico");
  });

  it("should complete case", async () => {
    const caller = appRouter.createCaller(ctx);

    const loginResult = await caller.operator.login({
      name: "João Silva",
      pa: "PA-01",
    });

    const caseResult = await caller.operator.createCase({
      operatorId: loginResult.operator.id,
      operatorName: loginResult.operator.name,
      operatorPa: loginResult.operator.pa,
      title: "Erro Sistêmico",
      description: "Sistema não está respondendo",
    });

    const completeResult = await caller.operator.completeCase({
      caseId: caseResult.caseItem.id,
    });

    expect(completeResult.success).toBe(true);

    // Verify case is no longer in pending
    const pendingCases = await caller.operator.getPendingCases();
    const completedCase = pendingCases.find((c) => c.id === caseResult.caseItem.id);
    expect(completedCase).toBeUndefined();
  });

  it("should remove operator from queue", async () => {
    const caller = appRouter.createCaller(ctx);

    const loginResult = await caller.operator.login({
      name: "João Silva",
      pa: "PA-01",
    });

    const queueResult = await caller.operator.callMonitor({
      operatorId: loginResult.operator.id,
      operatorName: loginResult.operator.name,
      operatorPa: loginResult.operator.pa,
    });

    const removeResult = await caller.operator.removeFromQueue({
      queueId: queueResult.queueItem.id,
    });

    expect(removeResult.success).toBe(true);

    // Verify operator is no longer in queue
    const queue = await caller.operator.getQueue();
    const queuedOperator = queue.find((q) => q.id === queueResult.queueItem.id);
    expect(queuedOperator).toBeUndefined();
  });
});
