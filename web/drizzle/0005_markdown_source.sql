ALTER TABLE `article`
  ADD COLUMN `source_file_name` varchar(255) NULL AFTER `content_json`;
