CREATE TABLE IF NOT EXISTS `auth_user` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified` boolean NOT NULL DEFAULT false,
  `image` varchar(2048),
  `role` enum('owner','collaborator') NOT NULL DEFAULT 'collaborator',
  `status` enum('active','suspended') NOT NULL DEFAULT 'active',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `auth_user_id` PRIMARY KEY(`id`),
  CONSTRAINT `auth_user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `auth_session` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `ip_address` varchar(64),
  `user_agent` varchar(512),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `auth_session_id` PRIMARY KEY(`id`),
  CONSTRAINT `auth_session_token_unique` UNIQUE(`token`),
  CONSTRAINT `auth_session_user_id_auth_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `auth_session_user_idx` ON `auth_session` (`user_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `auth_account` (
  `id` varchar(36) NOT NULL,
  `account_id` varchar(255) NOT NULL,
  `provider_id` varchar(64) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `access_token` mediumtext,
  `refresh_token` mediumtext,
  `id_token` mediumtext,
  `access_token_expires_at` datetime(3),
  `refresh_token_expires_at` datetime(3),
  `scope` mediumtext,
  `password` varchar(255),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `auth_account_id` PRIMARY KEY(`id`),
  CONSTRAINT `auth_account_provider_account_unique` UNIQUE(`provider_id`,`account_id`),
  CONSTRAINT `auth_account_user_id_auth_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `auth_account_user_idx` ON `auth_account` (`user_id`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `auth_verification` (
  `id` varchar(36) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `auth_verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `auth_verification_identifier_idx` ON `auth_verification` (`identifier`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `site_profile` (
  `id` varchar(36) NOT NULL,
  `author_name` varchar(120) NOT NULL,
  `avatar_url` varchar(2048),
  `role_title` varchar(120) NOT NULL DEFAULT '站主',
  `intro` mediumtext NOT NULL DEFAULT (''),
  `now_text` mediumtext NOT NULL DEFAULT (''),
  `location` varchar(120) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `site_profile_id` PRIMARY KEY(`id`)
);
