ALTER TABLE `article_version`
  ADD COLUMN `category_id` varchar(36) NULL AFTER `title`,
  ADD COLUMN `label` varchar(200) NULL AFTER `path`;
--> statement-breakpoint
ALTER TABLE `article_version`
  ADD CONSTRAINT `article_version_category_id_category_id_fk`
  FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON DELETE RESTRICT;
