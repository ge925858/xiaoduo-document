CREATE FULLTEXT INDEX `article_version_search_idx`
  ON `article_version` (`title`, `markdown`, `plain_text`)
  WITH PARSER ngram;
