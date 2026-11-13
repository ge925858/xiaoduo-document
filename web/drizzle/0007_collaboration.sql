CREATE TABLE IF NOT EXISTS `collaboration_application` (
  `id` varchar(36) NOT NULL,
  `article_id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(255) NOT NULL,
  `note` mediumtext NOT NULL DEFAULT (''),
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewed_at` datetime(3),
  CONSTRAINT `collaboration_application_id` PRIMARY KEY(`id`),
  CONSTRAINT `collaboration_application_pending_unique` UNIQUE(`article_id`,`email`,`status`),
  CONSTRAINT `collaboration_application_article_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `collaboration_invite` (
  `id` varchar(36) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `display_name` varchar(120),
  `source` enum('application','direct') NOT NULL,
  `application_id` varchar(36),
  `status` enum('pending','activated','expired','revoked') NOT NULL DEFAULT 'pending',
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `collaboration_invite_id` PRIMARY KEY(`id`),
  CONSTRAINT `collaboration_invite_token_unique` UNIQUE(`token_hash`),
  CONSTRAINT `collaboration_invite_application_fk` FOREIGN KEY (`application_id`) REFERENCES `collaboration_application`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `collaboration_invite_article` (
  `invite_id` varchar(36) NOT NULL,
  `article_id` varchar(36) NOT NULL,
  CONSTRAINT `collaboration_invite_article_unique` UNIQUE(`invite_id`,`article_id`),
  CONSTRAINT `collaboration_invite_article_invite_fk` FOREIGN KEY (`invite_id`) REFERENCES `collaboration_invite`(`id`) ON DELETE CASCADE,
  CONSTRAINT `collaboration_invite_article_article_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
