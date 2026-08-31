/**
 * Production-safe migration script using raw SQL.
 * Runs on every startup via `pnpm run migrate && pnpm run start`.
 * drizzle-kit is a devDependency and unavailable in production Railway builds.
 */
import mysql from "mysql2/promise";

async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[migrate] DATABASE_URL not set, skipping migrations.");
    return;
  }

  console.log("[migrate] Connecting to database...");
  const conn = await mysql.createConnection(url);

  const tables: string[] = [
    `CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`openId\` varchar(64) UNIQUE,
      \`username\` varchar(64) UNIQUE,
      \`passwordHash\` varchar(255),
      \`name\` text,
      \`email\` varchar(320),
      \`loginMethod\` varchar(64),
      \`role\` enum('user','admin','gestor','comercial','producao','compras','pos_venda') NOT NULL DEFAULT 'user',
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`lastSignedIn\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`clients\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`name\` varchar(180) NOT NULL,
      \`company\` varchar(180),
      \`email\` varchar(320),
      \`phone\` varchar(40),
      \`segment\` varchar(80),
      \`status\` enum('active','inactive','prospect') NOT NULL DEFAULT 'active',
      \`notes\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`proposals\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`clientId\` int NOT NULL,
      \`code\` varchar(40) NOT NULL UNIQUE,
      \`title\` varchar(180) NOT NULL,
      \`version\` int NOT NULL DEFAULT 1,
      \`status\` enum('draft','sent','approved','rejected','expired') NOT NULL DEFAULT 'draft',
      \`totalValue\` decimal(14,2) NOT NULL DEFAULT '0',
      \`validUntil\` timestamp NULL,
      \`conditions\` text,
      \`createdBy\` int,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`proposalItems\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`proposalId\` int NOT NULL,
      \`description\` varchar(240) NOT NULL,
      \`quantity\` decimal(12,2) NOT NULL DEFAULT '1',
      \`unitValue\` decimal(14,2) NOT NULL DEFAULT '0',
      \`totalValue\` decimal(14,2) NOT NULL DEFAULT '0'
    )`,
    `CREATE TABLE IF NOT EXISTS \`projects\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`clientId\` int NOT NULL,
      \`proposalId\` int,
      \`code\` varchar(40) NOT NULL UNIQUE,
      \`name\` varchar(180) NOT NULL,
      \`status\` enum('planning','in_progress','paused','delivered','post_sale') NOT NULL DEFAULT 'planning',
      \`priority\` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
      \`soldValue\` decimal(14,2) NOT NULL DEFAULT '0',
      \`plannedCost\` decimal(14,2) NOT NULL DEFAULT '0',
      \`actualCost\` decimal(14,2) NOT NULL DEFAULT '0',
      \`startDate\` timestamp NULL,
      \`dueDate\` timestamp NULL,
      \`ownerId\` int,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`productionOrders\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`projectId\` int NOT NULL,
      \`code\` varchar(40) NOT NULL UNIQUE,
      \`title\` varchar(180) NOT NULL,
      \`status\` enum('queued','in_progress','blocked','done') NOT NULL DEFAULT 'queued',
      \`priority\` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
      \`progress\` int NOT NULL DEFAULT 0,
      \`dueDate\` timestamp NULL,
      \`responsibleId\` int,
      \`notes\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`checklistTemplates\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`name\` varchar(160) NOT NULL,
      \`serviceType\` varchar(100) NOT NULL,
      \`active\` int NOT NULL DEFAULT 1,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`checklistItems\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`templateId\` int NOT NULL,
      \`description\` varchar(240) NOT NULL,
      \`sortOrder\` int NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS \`checklistRuns\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`orderId\` int NOT NULL,
      \`templateId\` int NOT NULL,
      \`itemId\` int NOT NULL,
      \`status\` enum('pending','done','blocked') NOT NULL DEFAULT 'pending',
      \`evidenceUrl\` text,
      \`completedBy\` int,
      \`completedAt\` timestamp NULL
    )`,
    `CREATE TABLE IF NOT EXISTS \`inventoryItems\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`sku\` varchar(60) NOT NULL UNIQUE,
      \`name\` varchar(180) NOT NULL,
      \`category\` varchar(100),
      \`unit\` varchar(20) NOT NULL DEFAULT 'un',
      \`quantity\` decimal(12,2) NOT NULL DEFAULT '0',
      \`minimumQuantity\` decimal(12,2) NOT NULL DEFAULT '0',
      \`averageCost\` decimal(14,2) NOT NULL DEFAULT '0',
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`inventoryMovements\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`itemId\` int NOT NULL,
      \`projectId\` int,
      \`orderId\` int,
      \`type\` enum('in','out','reserve','release') NOT NULL,
      \`quantity\` decimal(12,2) NOT NULL,
      \`note\` text,
      \`createdBy\` int,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`materialRequests\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`projectId\` int,
      \`orderId\` int,
      \`requesterId\` int,
      \`status\` enum('pending','approved','rejected','purchased','delivered') NOT NULL DEFAULT 'pending',
      \`urgency\` enum('normal','urgent') NOT NULL DEFAULT 'normal',
      \`description\` text NOT NULL,
      \`neededBy\` timestamp NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`suppliers\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`name\` varchar(180) NOT NULL,
      \`category\` varchar(100),
      \`contactName\` varchar(160),
      \`email\` varchar(320),
      \`phone\` varchar(40),
      \`paymentTerms\` varchar(120),
      \`deliveryStatus\` enum('on_time','pending','delayed') NOT NULL DEFAULT 'on_time',
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`projectCosts\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`projectId\` int NOT NULL,
      \`category\` enum('material','service','expense') NOT NULL,
      \`description\` varchar(240) NOT NULL,
      \`plannedValue\` decimal(14,2) NOT NULL DEFAULT '0',
      \`actualValue\` decimal(14,2) NOT NULL DEFAULT '0',
      \`status\` enum('planned','committed','paid') NOT NULL DEFAULT 'planned',
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`postSales\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`clientId\` int NOT NULL,
      \`projectId\` int NOT NULL,
      \`stage\` enum('scheduled','contacted','satisfied','opportunity','closed') NOT NULL DEFAULT 'scheduled',
      \`satisfactionScore\` int,
      \`nextContactAt\` timestamp NULL,
      \`notes\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`communications\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`clientId\` int NOT NULL,
      \`projectId\` int,
      \`stage\` enum('proposal_sent','awaiting_response','production_started','delivery','satisfaction','post_sale') NOT NULL,
      \`channel\` enum('email','whatsapp','internal') NOT NULL DEFAULT 'internal',
      \`scheduledAt\` timestamp NULL,
      \`sentAt\` timestamp NULL,
      \`status\` enum('scheduled','sent','cancelled') NOT NULL DEFAULT 'scheduled',
      \`subject\` varchar(180) NOT NULL,
      \`body\` text
    )`,
    `CREATE TABLE IF NOT EXISTS \`auditLogs\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`userId\` int,
      \`entity\` varchar(80) NOT NULL,
      \`entityId\` int,
      \`action\` varchar(80) NOT NULL,
      \`details\` text,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`moduleChats\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`moduleId\` varchar(60) NOT NULL,
      \`userId\` int NOT NULL,
      \`content\` text NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`pushSubscriptions\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`userId\` int NOT NULL,
      \`endpoint\` text NOT NULL,
      \`p256dh\` varchar(255) NOT NULL,
      \`auth\` varchar(255) NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS \`appNotifications\` (
      \`id\` int AUTO_INCREMENT PRIMARY KEY,
      \`userId\` int NOT NULL,
      \`title\` varchar(180) NOT NULL,
      \`message\` text NOT NULL,
      \`moduleId\` varchar(60),
      \`isRead\` boolean NOT NULL DEFAULT false,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of tables) {
    const tableName = sql.match(/`(\w+)`/)?.[1] ?? "?";
    try {
      await conn.execute(sql);
      console.log(`[migrate] ✓ ${tableName}`);
    } catch (err: any) {
      console.error(`[migrate] ✗ ${tableName}: ${err.message}`);
    }
  }

  await conn.end();
  console.log("[migrate] Done.");
}

runMigrations().catch((err) => {
  console.error("[migrate] Fatal error:", err);
  process.exit(1);
});
