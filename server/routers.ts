import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getOrCreateOperator, addToQueue, getQueue, removeFromQueue, createCase, getPendingCases, completeCase, getCompletedCasesToday, deleteCompletedCases, assignMonitorToCase, getAllCases, getLoggedInOperators, updateCase } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  operator: router({
    login: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        if (typeof obj.name !== "string" || !obj.name.trim()) throw new Error("Nome é obrigatório");
        if (typeof obj.pa !== "string" || !obj.pa.trim()) throw new Error("PA é obrigatório");
        return { name: obj.name.trim(), pa: obj.pa.trim() };
      })
      .mutation(async ({ input }) => {
        const operator = await getOrCreateOperator(input.name, input.pa);
        return { operator };
      }),

    callMonitor: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        if (typeof obj.operatorId !== "number") throw new Error("operatorId é obrigatório");
        if (typeof obj.operatorName !== "string") throw new Error("operatorName é obrigatório");
        if (typeof obj.operatorPa !== "string") throw new Error("operatorPa é obrigatório");
        return obj as { operatorId: number; operatorName: string; operatorPa: string };
      })
      .mutation(async ({ input }) => {
        const queueItem = await addToQueue(input.operatorId, input.operatorName, input.operatorPa);
        return { queueItem };
      }),

    getQueue: publicProcedure.query(async () => {
      return await getQueue();
    }),

    removeFromQueue: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        if (typeof obj.queueId !== "number") throw new Error("queueId é obrigatório");
        return obj as { queueId: number };
      })
      .mutation(async ({ input }) => {
        await removeFromQueue(input.queueId);
        return { success: true };
      }),

    createCase: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        if (typeof obj.operatorId !== "number") throw new Error("operatorId é obrigatório");
        if (typeof obj.operatorName !== "string") throw new Error("operatorName é obrigatório");
        if (typeof obj.operatorPa !== "string") throw new Error("operatorPa é obrigatório");
        if (typeof obj.title !== "string" || !obj.title.trim()) throw new Error("Título é obrigatório");
        if (typeof obj.description !== "string" || !obj.description.trim()) throw new Error("Descrição é obrigatória");
        return obj as { operatorId: number; operatorName: string; operatorPa: string; title: string; description: string };
      })
      .mutation(async ({ input }) => {
        const caseItem = await createCase(input.operatorId, input.operatorName, input.operatorPa, input.title, input.description);
        return { caseItem };
      }),

    getPendingCases: publicProcedure.query(async () => {
      return await getPendingCases();
    }),

    assignMonitor: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        if (typeof obj.caseId !== "number") throw new Error("caseId é obrigatório");
        if (typeof obj.monitorName !== "string" || !obj.monitorName.trim()) throw new Error("monitorName é obrigatório");
        return obj as { caseId: number; monitorName: string };
      })
      .mutation(async ({ input }) => {
        await assignMonitorToCase(input.caseId, input.monitorName);
        return { success: true };
      }),

    completeCase: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        if (typeof obj.caseId !== "number") throw new Error("caseId é obrigatório");
        const resolution = typeof obj.resolution === "string" ? obj.resolution : undefined;
        return { caseId: obj.caseId, resolution };
      })
      .mutation(async ({ input }) => {
        await completeCase(input.caseId, input.resolution);
        return { success: true };
      }),

    getAllCases: publicProcedure.query(async () => {
      return await getAllCases();
    }),

    getLoggedInOperators: publicProcedure.query(async () => {
      return await getLoggedInOperators();
    }),

    getCompletedCasesToday: publicProcedure.query(async () => {
      return await getCompletedCasesToday();
    }),

    getCompletedCases: publicProcedure.query(async () => {
      return await getCompletedCasesToday();
    }),

    deleteCompletedCases: publicProcedure.mutation(async () => {
      await deleteCompletedCases();
      return { success: true };
    }),

    deleteAllCases: publicProcedure.mutation(async () => {
      await deleteCompletedCases();
      return { success: true };
    }),

    updateCase: publicProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        if (typeof obj.caseId !== "number") throw new Error("caseId é obrigatório");
        if (typeof obj.title !== "string" || !obj.title.trim()) throw new Error("Título é obrigatório");
        if (typeof obj.description !== "string" || !obj.description.trim()) throw new Error("Descrição é obrigatória");
        return { caseId: obj.caseId, title: obj.title.trim(), description: obj.description.trim() };
      })
      .mutation(async ({ input }) => {
        await updateCase(input.caseId, input.title, input.description);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
