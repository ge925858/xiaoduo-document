CREATE TABLE IF NOT EXISTS `notification` (
  `id` varchar(36) NOT NULL,
  `event_key` varchar(255) NOT NULL,
  `kind` enum('application','invitation','grant','publish') NOT NULL,
  `title` varchar(200) NOT NULL,
  `body` mediumtext NOT NULL,
  `href` varchar(1024),
  `read_at` datetime(3),
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `notification_id` PRIMARY KEY(`id`),
  CONSTRAINT `notification_event_key_unique` UNIQUE(`event_key`)
);
--> statement-breakpoint
CREATE INDEX `notification_created_at_idx` ON `notification` (`created_at`);
