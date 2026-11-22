CREATE TABLE IF NOT EXISTS live_access_passes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  pass_code VARCHAR(120) NOT NULL,
  pass_type ENUM('ppv_event', 'timed_license', 'promo_window') NOT NULL DEFAULT 'ppv_event',
  price_brl DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  partner_share_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  platform_fee_pct DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  starts_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  status ENUM('active', 'expired', 'revoked') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pass_code (pass_code),
  KEY idx_pass_org_window (organization_id, starts_at, expires_at, status),
  CONSTRAINT fk_pass_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS live_revenue_splits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  pass_code VARCHAR(120) NOT NULL,
  gross_amount_brl DECIMAL(10,2) NOT NULL,
  platform_amount_brl DECIMAL(10,2) NOT NULL,
  partner_amount_brl DECIMAL(10,2) NOT NULL,
  organizer_net_brl DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_split_org_time (organization_id, created_at),
  CONSTRAINT fk_split_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
