CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  owner_user_id BIGINT UNSIGNED NULL,
  plan_tier ENUM('starter', 'growth', 'scale', 'enterprise') NOT NULL DEFAULT 'starter',
  max_licenses INT UNSIGNED NOT NULL DEFAULT 10,
  max_streams INT UNSIGNED NOT NULL DEFAULT 3,
  monthly_price_brl DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('active', 'past_due', 'suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_org_plan_status (plan_tier, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NULL,
  actor_email VARCHAR(160) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NULL,
  metadata_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_org_time (organization_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NULL,
  target_url VARCHAR(500) NOT NULL,
  event_types VARCHAR(255) NOT NULL DEFAULT '*',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_status_code INT NULL,
  last_triggered_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_webhook_org_active (organization_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
