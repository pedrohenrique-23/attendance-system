import { eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, operators, attendanceQueue, cases, MonitorStatus } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

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

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Operadores
 */
export async function getOrCreateOperator(name: string, pa: string): Promise<typeof operators.$inferSelect> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(operators)
    .where(eq(operators.name, name))
    .limit(1);

  if (existing.length > 0) {
    // Atualizar lastLogin
    await db
      .update(operators)
      .set({ lastLogin: new Date() })
      .where(eq(operators.id, existing[0].id));
    return existing[0];
  }

  // Criar novo operador
  const result = await db.insert(operators).values({ name, pa });
  const newOperator = await db
    .select()
    .from(operators)
    .where(eq(operators.id, result[0].insertId))
    .limit(1);
  return newOperator[0];
}

/**
 * Fila de Atendimento (FIFO)
 */
export async function addToQueue(
  operatorId: number,
  operatorName: string,
  operatorPa: string
): Promise<typeof attendanceQueue.$inferSelect> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(attendanceQueue).values({
    operatorId,
    operatorName,
    operatorPa,
    status: "waiting",
  });

  const newItem = await db
    .select()
    .from(attendanceQueue)
    .where((t) => eq(t.id, result[0].insertId))
    .limit(1);
  return newItem[0];
}

export async function getQueue(): Promise<typeof attendanceQueue.$inferSelect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(attendanceQueue)
    .where((t) => eq(t.status, "waiting"))
    .orderBy(attendanceQueue.createdAt);
}

export async function removeFromQueue(queueId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(cases).values({
    operatorId,
    operatorName,
    operatorPa,
    title,
    description,
    status: "pending",
  });

  const newCase = await db
    .select()
    .from(cases)
    .where((t) => eq(t.id, result[0].insertId))
    .limit(1);
  return newCase[0];
}

export async function getPendingCases(): Promise<typeof cases.$inferSelect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(cases)
    .where((t) => eq(t.status, "pending"))
    .orderBy(cases.createdAt);
}

export async function assignMonitorToCase(caseId: number, monitorName: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(cases)
    .set({ monitorName })
    .where(eq(cases.id, caseId));
}

export async function completeCase(caseId: number, resolution?: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(cases)
    .set({ status: "completed", completedAt: new Date(), resolution: resolution || null })
    .where(eq(cases.id, caseId));
}

export async function getAllCases(): Promise<typeof cases.$inferSelect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(cases)
    .orderBy(cases.createdAt);
}

export async function getCompletedCasesToday(): Promise<typeof cases.$inferSelect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(cases)
    .where(eq(cases.status, "completed"));
}

export async function deleteCompletedCases(): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(cases).where(eq(cases.status, "completed"));
}


/**
 * Operadores Logados
 */
export async function updateCase(
  caseId: number,
  title: string,
  description: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(cases)
    .set({ title, description })
    .where(eq(cases.id, caseId));
}

export async function getLoggedInOperators(): Promise<typeof operators.$inferSelect[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Retorna operadores que fizeram login nos últimos 30 minutos
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  return db
    .select()
    .from(operators)
    .where(gt(operators.lastLogin, thirtyMinutesAgo))
    .orderBy(operators.lastLogin);
}

/**
 * Monitor Status Management
 */
export async function updateMonitorStatus(
  operatorName: string,
  status: MonitorStatus
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(operators)
    .set({ monitorStatus: status })
    .where(eq(operators.name, operatorName));
}

export async function getMonitorStatus(operatorName: string): Promise<MonitorStatus | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(operators)
    .where(eq(operators.name, operatorName))
    .limit(1);

  return result.length > 0 ? result[0].monitorStatus : undefined;
}

export async function getAllMonitorsStatus(): Promise<Array<{ name: string; status: MonitorStatus }>> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      name: operators.name,
      status: operators.monitorStatus,
    })
    .from(operators)
    .orderBy(operators.name);

  return result;
}
