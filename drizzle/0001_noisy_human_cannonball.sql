CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`entity` varchar(80) NOT NULL,
	`entityId` int,
	`action` varchar(80) NOT NULL,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`description` varchar(240) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `checklistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`templateId` int NOT NULL,
	`itemId` int NOT NULL,
	`status` enum('pending','done','blocked') NOT NULL DEFAULT 'pending',
	`evidenceUrl` text,
	`completedBy` int,
	`completedAt` timestamp,
	CONSTRAINT `checklistRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`serviceType` varchar(100) NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checklistTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`company` varchar(180),
	`email` varchar(320),
	`phone` varchar(40),
	`segment` varchar(80),
	`status` enum('active','inactive','prospect') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`projectId` int,
	`stage` enum('proposal_sent','awaiting_response','production_started','delivery','satisfaction','post_sale') NOT NULL,
	`channel` enum('email','whatsapp','internal') NOT NULL DEFAULT 'internal',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`status` enum('scheduled','sent','cancelled') NOT NULL DEFAULT 'scheduled',
	`subject` varchar(180) NOT NULL,
	`body` text,
	CONSTRAINT `communications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(60) NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` varchar(100),
	`unit` varchar(20) NOT NULL DEFAULT 'un',
	`quantity` decimal(12,2) NOT NULL DEFAULT '0',
	`minimumQuantity` decimal(12,2) NOT NULL DEFAULT '0',
	`averageCost` decimal(14,2) NOT NULL DEFAULT '0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventoryItems_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `inventoryMovements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`projectId` int,
	`orderId` int,
	`type` enum('in','out','reserve','release') NOT NULL,
	`quantity` decimal(12,2) NOT NULL,
	`note` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventoryMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materialRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`orderId` int,
	`requesterId` int,
	`status` enum('pending','approved','rejected','purchased','delivered') NOT NULL DEFAULT 'pending',
	`urgency` enum('normal','urgent') NOT NULL DEFAULT 'normal',
	`description` text NOT NULL,
	`neededBy` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `materialRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `postSales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`projectId` int NOT NULL,
	`stage` enum('scheduled','contacted','satisfied','opportunity','closed') NOT NULL DEFAULT 'scheduled',
	`satisfactionScore` int,
	`nextContactAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `postSales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productionOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`code` varchar(40) NOT NULL,
	`title` varchar(180) NOT NULL,
	`status` enum('queued','in_progress','blocked','done') NOT NULL DEFAULT 'queued',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`progress` int NOT NULL DEFAULT 0,
	`dueDate` timestamp,
	`responsibleId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productionOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `productionOrders_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `projectCosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`category` enum('material','service','expense') NOT NULL,
	`description` varchar(240) NOT NULL,
	`plannedValue` decimal(14,2) NOT NULL DEFAULT '0',
	`actualValue` decimal(14,2) NOT NULL DEFAULT '0',
	`status` enum('planned','committed','paid') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectCosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`proposalId` int,
	`code` varchar(40) NOT NULL,
	`name` varchar(180) NOT NULL,
	`status` enum('planning','in_progress','paused','delivered','post_sale') NOT NULL DEFAULT 'planning',
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`soldValue` decimal(14,2) NOT NULL DEFAULT '0',
	`plannedCost` decimal(14,2) NOT NULL DEFAULT '0',
	`actualCost` decimal(14,2) NOT NULL DEFAULT '0',
	`startDate` timestamp,
	`dueDate` timestamp,
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `proposalItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`description` varchar(240) NOT NULL,
	`quantity` decimal(12,2) NOT NULL DEFAULT '1',
	`unitValue` decimal(14,2) NOT NULL DEFAULT '0',
	`totalValue` decimal(14,2) NOT NULL DEFAULT '0',
	CONSTRAINT `proposalItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`code` varchar(40) NOT NULL,
	`title` varchar(180) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`status` enum('draft','sent','approved','rejected','expired') NOT NULL DEFAULT 'draft',
	`totalValue` decimal(14,2) NOT NULL DEFAULT '0',
	`validUntil` timestamp,
	`conditions` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`),
	CONSTRAINT `proposals_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`category` varchar(100),
	`contactName` varchar(160),
	`email` varchar(320),
	`phone` varchar(40),
	`paymentTerms` varchar(120),
	`deliveryStatus` enum('on_time','pending','delayed') NOT NULL DEFAULT 'on_time',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','gestor','comercial','producao','compras','pos_venda') NOT NULL DEFAULT 'user';