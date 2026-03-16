import { pgTable, serial, text, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";

// Definição dos Enums para Postgres
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const monitorStatusEnum = pgEnum("monitorStatus", ["available", "away", "do_not_disturb"]);
export const queueStatusEnum = pgEnum("status", ["waiting", "attended"]);
export const caseStatusEnum = pgEnum("caseStatus", ["pending", "completed"]);

/**
 * Tabela de Usuários (OAuth)
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de Operadores
 */
export const operators = pgTable("operators", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  pa: varchar("pa", { length: 50 }).notNull(),
  lastLogin: timestamp("lastLogin").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  monitorStatus: monitorStatusEnum("monitorStatus").default("available").notNull(),
});

export type Operator = typeof operators.$inferSelect;
export type InsertOperator = typeof operators.$inferInsert;

/**
 * Tabela de Fila de Atendimento
 */
export const attendanceQueue = pgTable("attendanceQueue", {
  id: serial("id").primaryKey(),
  operatorId: serial("operatorId").notNull(),
  operatorName: varchar("operatorName", { length: 255 }).notNull(),
  operatorPa: varchar("operatorPa", { length: 50 }).notNull(),
  status: queueStatusEnum("status").default("waiting").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  attendedAt: timestamp("attendedAt"),
});

/**
 * Tabela de Casos
 */
export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  operatorId: serial("operatorId").notNull(),
  operatorName: varchar("operatorName", { length: 255 }).notNull(),
  operatorPa: varchar("operatorPa", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: caseStatusEnum("status").default("pending").notNull(),
  monitorName: varchar("monitorName", { length: 255 }),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});