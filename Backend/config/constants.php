<?php
/**
 * HEAL Clinic — Application Constants
 */

// JWT
define('JWT_SECRET',      'HEAL_JWT_SECRET_CHANGE_IN_PRODUCTION_MIN_32_CHARS');
define('JWT_EXPIRY',      60 * 60 * 10);       // 10 hours in seconds
define('JWT_REFRESH',     60 * 60 * 24 * 7);   // 7 days

// App
define('APP_NAME',        'HEAL Clinic');
define('APP_TIMEZONE',    'Asia/Kolkata');

// Uploads
define('UPLOAD_PATH',     HEAL_ROOT . '/uploads/');
define('UPLOAD_MAX_MB',   10);
define('ALLOWED_IMAGES',  ['image/jpeg', 'image/png', 'image/webp']);

// Pagination
define('DEFAULT_PAGE_SIZE', 50);

// Roles
define('ROLE_SUPER_ADMIN',   'super_admin');
define('ROLE_BRANCH_MANAGER','branch_manager');
define('ROLE_DOCTOR',        'doctor');
define('ROLE_RECEPTIONIST',  'receptionist');
define('ROLE_CASHIER',       'cashier');
define('ROLE_AESTHETICIAN',  'aesthetician');
define('ROLE_PHARMACIST',    'pharmacist');

// Appointment statuses
define('STATUS_WAITING',          'Waiting');
define('STATUS_CALLED',           'Called');
define('STATUS_IN_CONSULT',       'In-Consult');
define('STATUS_PROCEDURE',        'Procedure');
define('STATUS_BILLING_PENDING',  'Billing-Pending');
define('STATUS_COMPLETED',        'Completed');
define('STATUS_CANCELLED',        'Cancelled');
define('STATUS_NO_SHOW',          'No-Show');

// Payment modes
define('PAY_CASH',         'Cash');
define('PAY_CARD',         'Card');
define('PAY_UPI',          'UPI');
define('PAY_NETBANKING',   'Net-Banking');
define('PAY_ADVANCE',      'Advance');

// Set timezone globally
date_default_timezone_set(APP_TIMEZONE);
