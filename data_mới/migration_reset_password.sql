-- Them cot luu token dat lai mat khau cho bang users.
-- MariaDB (XAMPP) ho tro IF NOT EXISTS nen chay lai nhieu lan khong loi.
USE hoangnha;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reset_expires_at DATETIME DEFAULT NULL;
