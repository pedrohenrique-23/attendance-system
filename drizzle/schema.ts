import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de operadores (sem relação com users de OAuth)
 * Armazena Nome e PA (Posição de Atendimento) para login simplificado
 */
export const operators = mysqlTable("operators", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  pa: varchar("pa", { length: 50 }).notNull(),
  lastLogin: timestamp("lastLogin").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  monitorStatus: mysqlEnum("monitorStatus", ["available", "away", "do_not_disturb"]).default("available").notNull(),
});

export type Operator = typeof operators.$inferSelect;
export type InsertOperator = typeof operators.$inferInsert;

export type MonitorStatus = "available" | "away" | "do_not_disturb";

/**
 * Tabela de fila de atendimento (FIFO)
 * Armazena operadores aguardando atendimento do monitor
 */
export const attendanceQueue = mysqlTable("attendanceQueue", {
  id: int("id").autoincrement().primaryKey(),
  operatorId: int("operatorId").notNull(),
  operatorName: varchar("operatorName", { length: 255 }).notNull(),
  operatorPa: varchar("operatorPa", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["waiting", "attended"]).default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  attendedAt: timestamp("attendedAt"),
});

export type AttendanceQueueItem = typeof attendanceQueue.$inferSelect;
export type InsertAttendanceQueueItem = typeof attendanceQueue.$inferInsert;

/**
 * Tabela de casos/cartões
 * Armazena casos criados pelos operadores
 */
export const cases = mysqlTable("cases", {
  id: int("id").autoincrement().primaryKey(),
  operatorId: int("operatorId").notNull(),
  operatorName: varchar("operatorName", { length: 255 }).notNull(),
  operatorPa: varchar("operatorPa", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["pending", "completed"]).default("pending").notNull(),
  monitorName: varchar("monitorName", { length: 255 }),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;