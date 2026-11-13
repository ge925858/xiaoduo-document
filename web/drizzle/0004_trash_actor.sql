ALTER TABLE `article`
  ADD COLUMN `trashed_by_id` varchar(36) NULL AFTER `trashed_at`,
  ADD COLUMN `trashed_by_name` varchar(120) NULL AFTER `trashed_by_id`;
