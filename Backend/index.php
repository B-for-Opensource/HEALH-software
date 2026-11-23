<?php
/**
 * HEAL Clinic API — Main Router
 * PHP 8.1+ REST API Backend
 * All requests route through here via .htaccess
 */

define('HEAL_ROOT', __DIR__);
define('HEAL_VERSION', '1.0.0');

// --- CORS Headers (Allow React frontend) ---
header('Access-Control-Allow-Origin: *');         // Lock to your domain in production
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Branch-Id');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Autoload core libraries ---
require_once HEAL_ROOT . '/config/database.php';
require_once HEAL_ROOT . '/config/constants.php';
require_once HEAL_ROOT . '/lib/Response.php';
require_once HEAL_ROOT . '/lib/JWT.php';
require_once HEAL_ROOT . '/lib/Auth.php';
require_once HEAL_ROOT . '/lib/Validator.php';

// --- Parse request ---
$method    = $_SERVER['REQUEST_METHOD'];
$uri       = $_SERVER['REQUEST_URI'];
$basePath  = '/api';  // Change to '' if api is root on cPanel

// Strip base path and query string
$path = parse_url($uri, PHP_URL_PATH);
$path = preg_replace('#^' . preg_quote($basePath, '#') . '#', '', $path);
$path = rtrim($path, '/');
$segments = explode('/', ltrim($path, '/'));

$resource = $segments[0] ?? '';
$id       = $segments[1] ?? null;
$action   = $segments[2] ?? null;

// --- Route Map ---
// /auth/login         POST  - Login
// /auth/me            GET   - Current user
// /patients           GET   - List patients
// /patients           POST  - Create patient
// /patients/:id       GET   - Get patient
// /patients/:id       PUT   - Update patient
// /patients/:id/history GET  - Patient visit history
// /appointments       GET   - List queue / appointments
// /appointments       POST  - Create appointment / token
// /appointments/:id/status PUT - Update status
// /consultations      POST  - Save consultation
// /consultations/:id  GET   - Get consultation
// /prescriptions      POST  - Save prescription
// /prescriptions/:id/pdf GET - Generate PDF
// /bills              POST  - Create bill
// /bills/:id          GET   - Get bill
// /bills/:id/pay      POST  - Record payment
// /packages           GET   - List packages
// /patient-packages   POST  - Sell package to patient
// /sessions           POST  - Log treatment session
// /reports/collection GET   - Collection report
// /reports/billing    GET   - Billing report
// /reports/doctor     GET   - Doctor report
// /staff              GET   - Staff list (admin)
// /departments        GET   - Departments

try {
    switch ($resource) {
        case 'auth':
            require_once HEAL_ROOT . '/api/auth.php';
            break;

        case 'patients':
            require_once HEAL_ROOT . '/api/patients.php';
            break;

        case 'appointments':
            require_once HEAL_ROOT . '/api/appointments.php';
            break;

        case 'consultations':
            require_once HEAL_ROOT . '/api/consultations.php';
            break;

        case 'prescriptions':
            require_once HEAL_ROOT . '/api/prescriptions.php';
            break;

        case 'medicines':
            require_once HEAL_ROOT . '/api/medicines.php';
            break;

        case 'bills':
            require_once HEAL_ROOT . '/api/billing.php';
            break;

        case 'payments':
            require_once HEAL_ROOT . '/api/payments.php';
            break;

        case 'packages':
            require_once HEAL_ROOT . '/api/packages.php';
            break;

        case 'patient-packages':
            require_once HEAL_ROOT . '/api/patient_packages.php';
            break;

        case 'sessions':
            require_once HEAL_ROOT . '/api/sessions.php';
            break;

        case 'reports':
            require_once HEAL_ROOT . '/api/reports.php';
            break;

        case 'hrms':
            require_once HEAL_ROOT . '/api/hrms.php';
            break;

        case 'staff':
            require_once HEAL_ROOT . '/api/staff.php';
            break;

        case 'departments':
            require_once HEAL_ROOT . '/api/departments.php';
            break;

        case 'photos':
            require_once HEAL_ROOT . '/api/photos.php';
            break;

        case 'dashboard':
            require_once HEAL_ROOT . '/api/dashboard.php';
            break;

        case 'health':
            Response::json(['status' => 'healthy', 'service' => 'HEAL Clinic PHP API', 'timestamp' => date('c')]);
            break;

        case '':
            Response::json(['status' => 'ok', 'app' => 'HEAL Clinic API', 'version' => HEAL_VERSION]);
            break;

        default:
            Response::error('Endpoint not found', 404);
    }
} catch (PDOException $e) {
    error_log('[HEAL DB Error] ' . $e->getMessage());
    Response::error('Database error. Please try again.', 500);
} catch (Exception $e) {
    error_log('[HEAL Error] ' . $e->getMessage());
    Response::error($e->getMessage(), $e->getCode() ?: 500);
}
