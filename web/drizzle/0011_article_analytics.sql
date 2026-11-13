CREATE TABLE IF NOT EXISTS `article_view_event` (
  `id` varchar(36) NOT NULL,
  `article_id` varchar(36) NOT NULL,
  `visitor_ip` varchar(64) NOT NULL,
  `visitor_hash` varchar(64) NOT NULL,
  `location` varchar(120) NOT NULL,
  `referrer_domain` varchar(255) NOT NULL,
  `visited_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `article_view_event_id` PRIMARY KEY(`id`),
  CONSTRAINT `article_view_event_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `article_view_event_article_time_idx` ON `article_view_event` (`article_id`,`visited_at`);
--> statement-breakpoint
CREATE INDEX `article_view_event_ip_time_idx` ON `article_view_event` (`visitor_ip`,`visited_at`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `daily_article_metric` (
  `article_id` varchar(36) NOT NULL,
  `metric_date` date NOT NULL,
  `views` int NOT NULL DEFAULT 0,
  `unique_visitors` int NOT NULL DEFAULT 0,
  `last_visited_at` datetime(3),
  CONSTRAINT `daily_article_metric_article_date_unique` UNIQUE(`article_id`,`metric_date`),
  CONSTRAINT `daily_article_metric_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `daily_article_metric_date_idx` ON `daily_article_metric` (`metric_date`);
