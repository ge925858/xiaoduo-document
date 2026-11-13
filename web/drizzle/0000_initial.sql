CREATE TABLE `category` (
  `id` varchar(36) NOT NULL,
  `title` varchar(200) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `position` int NOT NULL DEFAULT 0,
  CONSTRAINT `category_id` PRIMARY KEY(`id`),
  CONSTRAINT `category_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `article` (
  `id` varchar(36) NOT NULL,
  `category_id` varchar(36) NOT NULL,
  `title` varchar(300) NOT NULL,
  `path` varchar(300) NOT NULL,
  `position` int NOT NULL DEFAULT 0,
  `markdown` mediumtext NOT NULL DEFAULT (''),
  `plain_text` mediumtext NOT NULL DEFAULT (''),
  `content_json` mediumtext,
  `revision` int NOT NULL DEFAULT 1,
  `publication_state` enum('draft','published','unpublished') NOT NULL DEFAULT 'draft',
  `trashed_at` datetime(3),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `article_id` PRIMARY KEY(`id`),
  CONSTRAINT `article_category_path_unique` UNIQUE(`category_id`,`path`),
  CONSTRAINT `article_category_id_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE INDEX `article_category_idx` ON `article` (`category_id`,`position`);
--> statement-breakpoint
CREATE TABLE `article_version` (
  `id` varchar(36) NOT NULL,
  `article_id` varchar(36) NOT NULL,
  `kind` enum('manual','published') NOT NULL,
  `title` varchar(300) NOT NULL,
  `path` varchar(300) NOT NULL,
  `markdown` mediumtext NOT NULL,
  `plain_text` mediumtext NOT NULL,
  `content_json` mediumtext,
  `author_id` varchar(36) NOT NULL,
  `author_name` varchar(120) NOT NULL,
  `author_role` enum('owner','collaborator') NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `article_version_id` PRIMARY KEY(`id`),
  CONSTRAINT `article_version_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `article_version_article_idx` ON `article_version` (`article_id`,`created_at`);
