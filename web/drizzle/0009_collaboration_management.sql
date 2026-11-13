CREATE TABLE IF NOT EXISTS `collaboration_password_reset` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `status` enum('pending','used','expired') NOT NULL DEFAULT 'pending',
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `collaboration_password_reset_id` PRIMARY KEY(`id`),
  CONSTRAINT `collaboration_password_reset_user_id_auth_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collaboration_password_reset_token_unique` ON `collaboration_password_reset` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `collaboration_password_reset_user_idx` ON `collaboration_password_reset` (`user_id`,`status`);
