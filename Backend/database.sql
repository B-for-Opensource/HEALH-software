-- ============================================================
-- HEAL Aesthetic Clinic Management System
-- MySQL 8.x Database Schema
-- Compatible with cPanel Shared Hosting (MySQL via phpMyAdmin)
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+05:30';
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------
-- 1. BRANCHES
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `branches` (
  `id`           CHAR(32) PRIMARY KEY,
  `branch_code`  VARCHAR(10) NOT NULL UNIQUE,       -- KRN, CLT, WYD
  `name`         VARCHAR(100) NOT NULL,
  `address`      TEXT,
  `city`         VARCHAR(100),
  `phone`        VARCHAR(15),
  `email`        VARCHAR(255),
  `is_active`    TINYINT(1) DEFAULT 1,
  `created_at`   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `branches` (`id`, `branch_code`, `name`, `address`, `city`, `phone`)
VALUES
  ('branch001karanthoor00000000000', 'KRN', 'HEAL Karanthoor (Main)', 'Near NIT Calicut, Wayanad Road', 'Karanthoor, Kozhikode', '+91 495 2800100'),
  ('branch002beachroad000000000000', 'CLT', 'HEAL Beach Road City',   'Opp. Corporation Stadium, Beach Road', 'Kozhikode', '+91 495 2760200'),
  ('branch003sulthan0000000000000', 'WYD', 'HEAL Sulthan Bathery',   'Chungam Junction, Mysore Road', 'Sulthan Bathery, Wayanad', '+91 493 6220300');

-- -----------------------------------------------------------
-- 2. DEPARTMENTS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `departments` (
  `id`                CHAR(32) PRIMARY KEY,
  `code`              VARCHAR(20) NOT NULL UNIQUE,
  `name`              VARCHAR(150) NOT NULL,
  `default_fee`       DECIMAL(10,2) DEFAULT 500.00,
  `revisit_fee`       DECIMAL(10,2) DEFAULT 300.00,
  `is_active`         TINYINT(1) DEFAULT 1,
  `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `departments` (`id`, `code`, `name`, `default_fee`, `revisit_fee`) VALUES
  ('dept01derm000000000000000000', 'DERM',   'Clinical & Aesthetic Dermatology', 500.00, 300.00),
  ('dept02cosmet00000000000000000', 'COSM',  'Cosmetology & Laser Aesthetics',   700.00, 400.00),
  ('dept03trichol0000000000000000', 'TRICH', 'Trichology & Hair Restoration',    600.00, 350.00),
  ('dept04genmed0000000000000000', 'GENM',   'General Medicine',                 300.00, 200.00),
  ('dept05dental0000000000000000', 'DENT',   'Aesthetic Dentistry',              800.00, 500.00);

-- -----------------------------------------------------------
-- 3. STAFF (Doctors, Receptionists, Cashiers, etc.)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff` (
  `id`              CHAR(32) PRIMARY KEY,
  `username`        VARCHAR(50) NOT NULL UNIQUE,
  `password_hash`   VARCHAR(255) NOT NULL,
  `name`            VARCHAR(150) NOT NULL,
  `role`            ENUM('super_admin','branch_manager','doctor','receptionist','cashier','aesthetician','pharmacist') NOT NULL,
  `branch_id`       CHAR(32),
  `department_id`   CHAR(32),
  `email`           VARCHAR(255),
  `phone`           VARCHAR(15),
  `qualification`   VARCHAR(200),
  `specialisation`  VARCHAR(200),
  `license_no`      VARCHAR(100),
  `consultation_fee` DECIMAL(10,2) DEFAULT 500.00,
  `revisit_fee`     DECIMAL(10,2) DEFAULT 300.00,
  `commission_pct`  DECIMAL(5,2) DEFAULT 0.00,       -- % of consultation fee earned
  `is_active`       TINYINT(1) DEFAULT 1,
  `last_login`      DATETIME,
  `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`branch_id`)     REFERENCES `branches`(`id`),
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default admin (password: Admin@1234 - CHANGE THIS)
INSERT INTO `staff` (`id`, `username`, `password_hash`, `name`, `role`, `branch_id`) VALUES
  ('admin0000000000000000000000000', 'admin',
   '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   'System Administrator', 'super_admin', 'branch001karanthoor00000000000');

-- -----------------------------------------------------------
-- 4. PATIENTS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `patients` (
  `id`                CHAR(32) PRIMARY KEY,
  `op_no`             VARCHAR(16) NOT NULL UNIQUE,
  `branch_id`         CHAR(32),
  `first_name`        VARCHAR(100) NOT NULL,
  `last_name`         VARCHAR(100),
  `phone`             VARCHAR(15) NOT NULL,
  `alt_phone`         VARCHAR(15),
  `email`             VARCHAR(255),
  `date_of_birth`     DATE,
  `age_years`         TINYINT UNSIGNED,
  `gender`            ENUM('Male','Female','Other') NOT NULL,
  `blood_group`       VARCHAR(5),
  `relative_name`     VARCHAR(100),
  `relation_type`     VARCHAR(10),              -- S/o D/o W/o
  `address`           TEXT,
  `city`              VARCHAR(100),
  `district`          VARCHAR(100),
  `pincode`           VARCHAR(6),
  `consultation_type` VARCHAR(30),
  `known_allergies`   TEXT,
  `photo_url`         TEXT,
  `balance_advance`   DECIMAL(10,2) DEFAULT 0.00,
  `is_active`         TINYINT(1) DEFAULT 1,
  `created_by`        CHAR(32),
  `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`branch_id`)  REFERENCES `branches`(`id`),
  FOREIGN KEY (`created_by`) REFERENCES `staff`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 5. APPOINTMENTS / TOKENS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `appointments` (
  `id`                CHAR(32) PRIMARY KEY,
  `token_no`          SMALLINT UNSIGNED NOT NULL,
  `patient_id`        CHAR(32) NOT NULL,
  `doctor_id`         CHAR(32) NOT NULL,
  `branch_id`         CHAR(32) NOT NULL,
  `department_id`     CHAR(32),
  `appointment_date`  DATETIME NOT NULL,
  `visit_type`        VARCHAR(20) DEFAULT 'Walk-in',
  `consultation_type` VARCHAR(30),
  `purpose`           TEXT,
  `status`            ENUM('Waiting','Called','In-Consult','Procedure','Billing-Pending','Completed','Cancelled','No-Show') DEFAULT 'Waiting',
  `token_printed`     TINYINT(1) DEFAULT 0,
  `receptionist_id`   CHAR(32),
  `cancelled_by`      CHAR(32),
  `cancelled_at`      DATETIME,
  `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`)      REFERENCES `patients`(`id`),
  FOREIGN KEY (`doctor_id`)       REFERENCES `staff`(`id`),
  FOREIGN KEY (`branch_id`)       REFERENCES `branches`(`id`),
  FOREIGN KEY (`department_id`)   REFERENCES `departments`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 6. CONSULTATIONS (EMR)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `consultations` (
  `id`                CHAR(32) PRIMARY KEY,
  `appointment_id`    CHAR(32),
  `patient_id`        CHAR(32) NOT NULL,
  `doctor_id`         CHAR(32) NOT NULL,
  `branch_id`         CHAR(32) NOT NULL,
  `consult_date`      DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Vitals
  `bp_systolic`       TINYINT UNSIGNED,
  `bp_diastolic`      TINYINT UNSIGNED,
  `pulse_rate`        TINYINT UNSIGNED,
  `temperature_f`     DECIMAL(4,1),
  `spo2_percent`      TINYINT UNSIGNED,
  `weight_kg`         DECIMAL(5,1),
  `height_cm`         DECIMAL(5,1),
  `bmi`               DECIMAL(4,1),
  -- Clinical
  `known_conditions`  TEXT,
  `chief_complaints`  TEXT,
  `complaint_duration` VARCHAR(50),
  `skin_type`         VARCHAR(20),
  `examination_notes` TEXT,
  `diagnosis`         TEXT,
  `treatment_plan`    TEXT,
  `doctor_private_notes` TEXT,
  -- Follow-up
  `review_after_days` TINYINT UNSIGNED,
  `review_date`       DATE,
  `review_instructions` TEXT,
  -- Status
  `is_draft`          TINYINT(1) DEFAULT 1,
  `finalized_at`      DATETIME,
  `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`),
  FOREIGN KEY (`patient_id`)     REFERENCES `patients`(`id`),
  FOREIGN KEY (`doctor_id`)      REFERENCES `staff`(`id`),
  FOREIGN KEY (`branch_id`)      REFERENCES `branches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 7. MEDICINES MASTER
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `medicines` (
  `id`               CHAR(32) PRIMARY KEY,
  `name`             VARCHAR(200) NOT NULL,
  `generic_name`     VARCHAR(200),
  `brand_name`       VARCHAR(200),
  `dosage_form`      VARCHAR(50),          -- Tablet, Syrup, Cream, Gel
  `strength`         VARCHAR(50),
  `unit`             VARCHAR(20),          -- Tab, Cap, ml, gm
  `default_dosage`   VARCHAR(20),          -- 1 Tab
  `default_frequency` VARCHAR(20),         -- 1-0-1
  `default_timing`   VARCHAR(30),
  `route`            VARCHAR(20) DEFAULT 'Oral',
  `is_active`        TINYINT(1) DEFAULT 1,
  `created_at`       DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 8. PRESCRIPTIONS
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `prescriptions` (
  `id`               CHAR(32) PRIMARY KEY,
  `consultation_id`  CHAR(32),
  `patient_id`       CHAR(32) NOT NULL,
  `doctor_id`        CHAR(32) NOT NULL,
  `rx_date`          DATE DEFAULT (CURDATE()),
  `general_advice`   TEXT,
  `created_at`       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`),
  FOREIGN KEY (`patient_id`)      REFERENCES `patients`(`id`),
  FOREIGN KEY (`doctor_id`)       REFERENCES `staff`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prescription_items` (
  `id`               CHAR(32) PRIMARY KEY,
  `prescription_id`  CHAR(32) NOT NULL,
  `medicine_id`      CHAR(32),
  `medicine_name`    VARCHAR(200) NOT NULL,
  `dosage`           VARCHAR(30),
  `frequency`        VARCHAR(20),
  `timing`           VARCHAR(30),
  `duration_days`    TINYINT UNSIGNED,
  `quantity`         SMALLINT UNSIGNED,
  `route`            VARCHAR(20),
  `special_instructions` TEXT,
  `sort_order`       TINYINT DEFAULT 0,
  FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`),
  FOREIGN KEY (`medicine_id`)     REFERENCES `medicines`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 9. TREATMENT PACKAGES
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `treatment_packages` (
  `id`              CHAR(32) PRIMARY KEY,
  `code`            VARCHAR(20) UNIQUE,
  `name`            VARCHAR(200) NOT NULL,
  `category`        VARCHAR(50),
  `total_sessions`  TINYINT UNSIGNED NOT NULL,
  `validity_months` TINYINT UNSIGNED DEFAULT 12,
  `package_price`   DECIMAL(10,2) NOT NULL,
  `cgst_percent`    DECIMAL(4,2) DEFAULT 9.00,
  `sgst_percent`    DECIMAL(4,2) DEFAULT 9.00,
  `description`     TEXT,
  `is_active`       TINYINT(1) DEFAULT 1,
  `created_at`      DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `patient_packages` (
  `id`                CHAR(32) PRIMARY KEY,
  `patient_id`        CHAR(32) NOT NULL,
  `package_id`        CHAR(32) NOT NULL,
  `sold_by`           CHAR(32),
  `branch_id`         CHAR(32) NOT NULL,
  `purchase_date`     DATE DEFAULT (CURDATE()),
  `expiry_date`       DATE,
  `total_sessions`    TINYINT UNSIGNED NOT NULL,
  `sessions_used`     TINYINT UNSIGNED DEFAULT 0,
  `amount_paid`       DECIMAL(10,2),
  `bill_id`           CHAR(32),
  `status`            ENUM('Active','Completed','Expired','Cancelled') DEFAULT 'Active',
  `notes`             TEXT,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`),
  FOREIGN KEY (`package_id`) REFERENCES `treatment_packages`(`id`),
  FOREIGN KEY (`branch_id`)  REFERENCES `branches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `package_sessions` (
  `id`                   CHAR(32) PRIMARY KEY,
  `patient_package_id`   CHAR(32) NOT NULL,
  `patient_id`           CHAR(32) NOT NULL,
  `session_no`           TINYINT UNSIGNED NOT NULL,
  `session_date`         DATE DEFAULT (CURDATE()),
  `performed_by`         CHAR(32),
  `doctor_id`            CHAR(32),
  `branch_id`            CHAR(32) NOT NULL,
  `room_no`              VARCHAR(20),
  `device_used`          VARCHAR(100),
  `energy_level`         VARCHAR(50),
  `areas_treated`        TEXT,
  `patient_feedback`     TEXT,
  `adverse_reaction`     TEXT,
  `next_session_date`    DATE,
  `status`               VARCHAR(20) DEFAULT 'Completed',
  `notes`                TEXT,
  `created_at`           DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_package_id`) REFERENCES `patient_packages`(`id`),
  FOREIGN KEY (`patient_id`)         REFERENCES `patients`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `patient_photos` (
  `id`                 CHAR(32) PRIMARY KEY,
  `patient_id`         CHAR(32) NOT NULL,
  `package_session_id` CHAR(32),
  `photo_type`         ENUM('Before','Mid','After','Progress') NOT NULL,
  `photo_url`          TEXT NOT NULL,
  `consent_obtained`   TINYINT(1) DEFAULT 1,
  `taken_by`           CHAR(32),
  `taken_at`           DATETIME DEFAULT CURRENT_TIMESTAMP,
  `notes`              TEXT,
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 10. BILLING
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bills` (
  `id`               CHAR(32) PRIMARY KEY,
  `bill_no`          VARCHAR(30) NOT NULL UNIQUE,
  `patient_id`       CHAR(32) NOT NULL,
  `consultation_id`  CHAR(32),
  `branch_id`        CHAR(32) NOT NULL,
  `cashier_id`       CHAR(32),
  `doctor_id`        CHAR(32),
  `subtotal`         DECIMAL(10,2) DEFAULT 0,
  `discount_amount`  DECIMAL(10,2) DEFAULT 0,
  `discount_remarks` TEXT,
  `taxable_amount`   DECIMAL(10,2) DEFAULT 0,
  `cgst_amount`      DECIMAL(10,2) DEFAULT 0,
  `sgst_amount`      DECIMAL(10,2) DEFAULT 0,
  `net_amount`       DECIMAL(10,2) DEFAULT 0,
  `advance_applied`  DECIMAL(10,2) DEFAULT 0,
  `amount_paid`      DECIMAL(10,2) DEFAULT 0,
  `balance_due`      DECIMAL(10,2) DEFAULT 0,
  `payment_status`   ENUM('Unpaid','Partial','Paid','Refunded') DEFAULT 'Unpaid',
  `bill_date`        DATE DEFAULT (CURDATE()),
  `status`           ENUM('Active','Cancelled','Voided') DEFAULT 'Active',
  `cancel_reason`    TEXT,
  `cancelled_by`     CHAR(32),
  `cancelled_at`     DATETIME,
  `created_at`       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`patient_id`)      REFERENCES `patients`(`id`),
  FOREIGN KEY (`consultation_id`) REFERENCES `consultations`(`id`),
  FOREIGN KEY (`branch_id`)       REFERENCES `branches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bill_items` (
  `id`             CHAR(32) PRIMARY KEY,
  `bill_id`        CHAR(32) NOT NULL,
  `item_type`      ENUM('Consultation','Procedure','Medicine','Package','Retail') NOT NULL,
  `item_name`      VARCHAR(200) NOT NULL,
  `item_code`      VARCHAR(50),
  `quantity`       DECIMAL(8,2) DEFAULT 1,
  `unit_price`     DECIMAL(10,2) NOT NULL,
  `discount_amount` DECIMAL(10,2) DEFAULT 0,
  `taxable_amount` DECIMAL(10,2),
  `cgst_percent`   DECIMAL(4,2) DEFAULT 0,
  `sgst_percent`   DECIMAL(4,2) DEFAULT 0,
  `cgst_amount`    DECIMAL(10,2) DEFAULT 0,
  `sgst_amount`    DECIMAL(10,2) DEFAULT 0,
  `line_total`     DECIMAL(10,2) NOT NULL,
  `sort_order`     TINYINT DEFAULT 0,
  FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payments` (
  `id`             CHAR(32) PRIMARY KEY,
  `bill_id`        CHAR(32) NOT NULL,
  `patient_id`     CHAR(32),
  `branch_id`      CHAR(32),
  `cashier_id`     CHAR(32),
  `payment_date`   DATE DEFAULT (CURDATE()),
  `payment_time`   TIME DEFAULT (CURTIME()),
  `payment_mode`   ENUM('Cash','Card','UPI','Net-Banking','Advance') NOT NULL,
  `card_last4`     VARCHAR(4),
  `upi_ref`        VARCHAR(50),
  `amount`         DECIMAL(10,2) NOT NULL,
  `created_at`     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`bill_id`)    REFERENCES `bills`(`id`),
  FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------------------
-- 11. AUDIT LOG (INSERT-ONLY — never update or delete)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id`           CHAR(32) PRIMARY KEY,
  `event_time`   DATETIME DEFAULT CURRENT_TIMESTAMP,
  `user_id`      CHAR(32),
  `user_name`    VARCHAR(150),
  `branch_id`    CHAR(32),
  `terminal_id`  VARCHAR(100),
  `action`       VARCHAR(30),
  `entity_type`  VARCHAR(50),
  `entity_id`    CHAR(32),
  `entity_ref`   VARCHAR(50),
  `old_values`   JSON,
  `new_values`   JSON,
  `ip_address`   VARCHAR(45),
  `remarks`      TEXT,
  INDEX (`event_time`),
  INDEX (`user_id`),
  INDEX (`entity_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
