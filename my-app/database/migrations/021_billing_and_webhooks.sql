CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  plan_tier ENUM('starter', 'growth', 'scale', 'enterprise') NOT NULL DEFAULT 'starter',
  billing_cycle ENUM('monthly', 'annual') NOT NULL DEFAULT 'monthly',
  amount_brl DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('active', 'trialing', 'past_due', 'canceled') NOT NULL DEFAULT 'active',
  external_ref VARCHAR(160) NULL,
  current_period_end DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sub_org_status (organization_id, status),
  CONSTRAINT fk_sub_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  webhook_id BIGINT UNSIGNED NULL,
  event_type VARCHAR(120) NOT NULL,
  target_url VARCHAR(500) NOT NULL,
  payload_json JSON NULL,
  response_status INT NULL,
  delivered TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_wh_event_time (event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
