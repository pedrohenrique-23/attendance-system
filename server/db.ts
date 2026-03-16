import { eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js"; // Mudamos de mysql2 para postgres-js
import postgres from "postgres"; // Importação do driver
import { InsertUser, users, operators, attendanceQueue, cases, MonitorStatus } from "../drizzle/schema";
import { ENV } from './_core/env';

// Configuração do cliente Postgres
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });

// Instância única do banco
export const db = drizzle(client);

/**
 * Usuários
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      const value = user[field];
      if (value !== undefined) {
        const normalized = value ?? null;
        values[field] = normalized;
        updateSet[field] = normalized;
      }
    });

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    // No Postgres usamos onConflictDoUpdate em vez de onDuplicateKeyUpdate
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Operadores
 */
export async function getOrCreateOperator(name: string, pa: string): Promise<typeof operators.$inferSelect> {
  const existing = await db
    .select()
    .from(operators)
    .where(eq(operators.name, name))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(operators)
      .set({ lastLogin: new Date() })
      .where(eq(operators.id, existing[0].id));
    return existing[0];
  }

  // No Postgres, usamos a cláusula returning() para pegar o objeto criado
  const [newOperator] = await db.insert(operators).values({ name, pa }).returning();
  return newOperator;
}

/**
 * Fila de Atendimento (FIFO)
 */
export async function addToQueue(
  operatorId: number,
  operatorName: string,
  operatorPa: string
): Promise<typeof attendanceQueue.$inferSelect> {
  const [newItem] = await db.insert(attendanceQueue).values({
    operatorId,
    operatorName,
    operatorPa,
    status: "waiting",
  }).returning();
  return newItem;
}

export async function getQueue(): Promise<typeof attendanceQueue.$inferSelect[]> {
  return db
    .select()
    .from(attendanceQueue)
    .where(eq(attendanceQueue.status, "waiting"))
    .orderBy(attendanceQueue.createdAt);
}

export async function removeFromQueue(queueId: number): Promise<void> {
  await db
    .update(attendanceQueue)
    .set({ status: "attended", attendedAt: new Date() })
    .where(eq(attendanceQueue.id, queueId));
}

/**
 * Casos
 */
export async function createCase(
  operatorId: number,
  operatorName: string,
  operatorPa: string,
  title: string,
  description: string
): Promise<typeof cases.$inferSelect> {
  const [newCase] = await db.insert(cases).values({
    operatorId,
    operatorName,
    operatorPa,
    title,
    description,
    status: "pending",
  }).returning();
  return newCase;
}

export async function getPendingCases(): Promise<typeof cases.$inferSelect[]> {
  return db
    .select()
    .from(cases)
    .where(eq(cases.status, "pending"))
    .orderBy(cases.createdAt);
}

export async function assignMonitorToCase(caseId: number, monitorName: string): Promise<void> {
  await db
    .update(cases)
    .set({ monitorName })
    .where(eq(cases.id, caseId));
}

export async function completeCase(caseId: number, resolution?: string): Promise<void> {
  await db
    .update(cases)
    .set({ status: "completed", completedAt: new Date(), resolution: resolution || null })
    .where(eq(cases.id, caseId));
}

export async function getAllCases(): Promise<typeof cases.$inferSelect[]> {
  return db
    .select()
    .from(cases)
    .orderBy(cases.createdAt);
}

export async function getCompletedCasesToday(): Promise<typeof cases.$inferSelect[]> {
  return db
    .select()
    .from(cases)
    .where(eq(cases.status, "completed"));
}

export async function deleteCompletedCases(): Promise<void> {
  await db.delete(cases).where(eq(cases.status, "completed"));
}

export async function updateCase(
  caseId: number,
  title: string,
  description: string
): Promise<void> {
  await db
    .update(cases)
    .set({ title, description })
    .where(eq(cases.id, caseId));
}

export async function getLoggedInOperators(): Promise<typeof operators.$inferSelect[]> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  return db
    .select()
    .from(operators)
    .where(gt(operators.lastLogin, thirtyMinutesAgo))
    .orderBy(operators.lastLogin);
}

export async function updateMonitorStatus(
  operatorName: string,
  status: MonitorStatus
): Promise<void> {
  await db
    .update(operators)
    .set({ monitorStatus: status })
    .where(eq(operators.name, operatorName));
}

export async function getMonitorStatus(operatorName: string): Promise<MonitorStatus | undefined> {
  const result = await db
    .select()
    .from(operators)
    .where(eq(operators.name, operatorName))
    .limit(1);

  return result.length > 0 ? result[0].monitorStatus : undefined;
}

export async function getAllMonitorsStatus(): Promise<Array<{ name: string; status: MonitorStatus }>> {
  return db
    .select({
      name: operators.name,
      status: operators.monitorStatus,
    })
    .from(operators)
    .orderBy(operators.name);
}