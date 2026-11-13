CREATE TABLE IF NOT EXISTS `url_redirect` (
  `id` varchar(36) NOT NULL,
  `from_path` varchar(512) NOT NULL,
  `to_path` varchar(1024) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `url_redirect_id` PRIMARY KEY(`id`),
  CONSTRAINT `url_redirect_from_unique` UNIQUE(`from_path`)
);
--> statement-breakpoint
ALTER TABLE `article_version`
  ADD COLUMN `category_slug` varchar(120) NULL AFTER `category_id`;
