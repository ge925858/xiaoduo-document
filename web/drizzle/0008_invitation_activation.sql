CREATE TABLE IF NOT EXISTS `article_grant` (
  `user_id` varchar(36) NOT NULL,
  `article_id` varchar(36) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `article_grant_user_id_auth_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON DELETE CASCADE,
  CONSTRAINT `article_grant_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `article_grant_user_article_unique` ON `article_grant` (`user_id`,`article_id`);
--> statement-breakpoint
CREATE INDEX `article_grant_article_idx` ON `article_grant` (`article_id`);
