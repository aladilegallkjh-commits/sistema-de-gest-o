import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const appRoles = ["admin", "gestor", "comercial", "producao", "compras", "pos_venda"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", ...appRoles]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  company: varchar("company", { length: 180 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  segment: varchar("segment", { length: 80 }),
  status: mysqlEnum("status", ["active", "inactive", "prospect"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  version: int("version").default(1).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "approved", "rejected", "expired"]).default("draft").notNull(),
  totalValue: decimal("totalValue", { precision: 14, scale: 2 }).default("0").notNull(),
  validUntil: timestamp("validUntil"),
  conditions: text("conditions"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const proposalItems = mysqlTable("proposalItems", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposalId").notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).default("1").notNull(),
  unitValue: decimal("unitValue", { precision: 14, scale: 2 }).default("0").notNull(),
  totalValue: decimal("totalValue", { precision: 14, scale: 2 }).default("0").notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  proposalId: int("proposalId"),
  code: varchar("code", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["planning", "in_progress", "paused", "delivered", "post_sale"]).default("planning").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  soldValue: decimal("soldValue", { precision: 14, scale: 2 }).default("0").notNull(),
  plannedCost: decimal("plannedCost", { precision: 14, scale: 2 }).default("0").notNull(),
  actualCost: decimal("actualCost", { precision: 14, scale: 2 }).default("0").notNull(),
  startDate: timestamp("startDate"),
  dueDate: timestamp("dueDate"),
  ownerId: int("ownerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const productionOrders = mysqlTable("productionOrders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  code: varchar("code", { length: 40 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  status: mysqlEnum("status", ["queued", "in_progress", "blocked", "done"]).default("queued").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  progress: int("progress").default(0).notNull(),
  dueDate: timestamp("dueDate"),
  responsibleId: int("responsibleId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const checklistTemplates = mysqlTable("checklistTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  serviceType: varchar("serviceType", { length: 100 }).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const checklistItems = mysqlTable("checklistItems", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export const checklistRuns = mysqlTable("checklistRuns", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  templateId: int("templateId").notNull(),
  itemId: int("itemId").notNull(),
  status: mysqlEnum("status", ["pending", "done", "blocked"]).default("pending").notNull(),
  evidenceUrl: text("evidenceUrl"),
  completedBy: int("completedBy"),
  completedAt: timestamp("completedAt"),
});

export const inventoryItems = mysqlTable("inventoryItems", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 60 }).notNull().unique(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 20 }).default("un").notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).default("0").notNull(),
  minimumQuantity: decimal("minimumQuantity", { precision: 12, scale: 2 }).default("0").notNull(),
  averageCost: decimal("averageCost", { precision: 14, scale: 2 }).default("0").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const inventoryMovements = mysqlTable("inventoryMovements", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  projectId: int("projectId"),
  orderId: int("orderId"),
  type: mysqlEnum("type", ["in", "out", "reserve", "release"]).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  note: text("note"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const materialRequests = mysqlTable("materialRequests", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  orderId: int("orderId"),
  requesterId: int("requesterId"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "purchased", "delivered"]).default("pending").notNull(),
  urgency: mysqlEnum("urgency", ["normal", "urgent"]).default("normal").notNull(),
  description: text("description").notNull(),
  neededBy: timestamp("neededBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  category: varchar("category", { length: 100 }),
  contactName: varchar("contactName", { length: 160 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 40 }),
  paymentTerms: varchar("paymentTerms", { length: 120 }),
  deliveryStatus: mysqlEnum("deliveryStatus", ["on_time", "pending", "delayed"]).default("on_time").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const projectCosts = mysqlTable("projectCosts", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: mysqlEnum("category", ["material", "service", "expense"]).notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  plannedValue: decimal("plannedValue", { precision: 14, scale: 2 }).default("0").notNull(),
  actualValue: decimal("actualValue", { precision: 14, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["planned", "committed", "paid"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const postSales = mysqlTable("postSales", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  projectId: int("projectId").notNull(),
  stage: mysqlEnum("stage", ["scheduled", "contacted", "satisfied", "opportunity", "closed"]).default("scheduled").notNull(),
  satisfactionScore: int("satisfactionScore"),
  nextContactAt: timestamp("nextContactAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const communications = mysqlTable("communications", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  projectId: int("projectId"),
  stage: mysqlEnum("stage", ["proposal_sent", "awaiting_response", "production_started", "delivery", "satisfaction", "post_sale"]).notNull(),
  channel: mysqlEnum("channel", ["email", "whatsapp", "internal"]).default("internal").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["scheduled", "sent", "cancelled"]).default("scheduled").notNull(),
  subject: varchar("subject", { length: 180 }).notNull(),
  body: text("body"),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  entity: varchar("entity", { length: 80 }).notNull(),
  entityId: int("entityId"),
  action: varchar("action", { length: 80 }).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const moduleChats = mysqlTable("moduleChats", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: varchar("moduleId", { length: 60 }).notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ModuleChat = typeof moduleChats.$inferSelect;
export type InsertModuleChat = typeof moduleChats.$inferInsert;
