-- Migracao: Relatorio de progresso por timestamp, cabecalho de identidade e adaptacao
CREATE TABLE IF NOT EXISTS player_digest_schedules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  player_id VARCHAR(120) NOT NULL,
  player_name VARCHAR(160) NOT NULL,
  player_email VARCHAR(200) NOT NULL,
  identity_role VARCHAR(120) NOT NULL DEFAULT 'Jogador / Criador',
  identity_bio TEXT NULL,
  brand_logo_url VARCHAR(500) NOT NULL DEFAULT '/logo.png',
  brand_name VARCHAR(160) NOT NULL DEFAULT 'SaaS Talentos & Stream',
  timezone VARCHAR(80) NOT NULL DEFAULT 'America/Belem',
  scheduled_for DATETIME NOT NULL,
  frequency_mode ENUM('once', 'weekly', 'biweekly', 'monthly') NOT NULL DEFAULT 'weekly',
  preferred_hour TINYINT UNSIGNED NOT NULL DEFAULT 20,
  focus_goal VARCHAR(160) NOT NULL DEFAULT 'Consistencia e visibilidade',
  progress_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  progress_summary TEXT NULL,
  send_by_default TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('pending', 'sent', 'cancelled') NOT NULL DEFAULT 'pending',
  last_sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_due_pending (status, scheduled_for),
  INDEX idx_player_id (player_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player_digest_adaptations (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id BIGINT UNSIGNED NOT NULL,
  player_id VARCHAR(120) NOT NULL,
  accepted TINYINT(1) NOT NULL DEFAULT 1,
  new_frequency_mode ENUM('once', 'weekly', 'biweekly', 'monthly') NULL,
  new_preferred_hour TINYINT UNSIGNED NULL,
  new_focus_goal VARCHAR(160) NULL,
  next_scheduled_for DATETIME NULL,
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_digest_adaptation_schedule
    FOREIGN KEY (schedule_id) REFERENCES player_digest_schedules(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
