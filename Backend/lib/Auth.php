<?php
/**
 * HEAL Clinic — Auth Middleware
 * Call Auth::require() at the top of any protected route
 */

class Auth
{
    private static ?array $currentUser = null;

    /**
     * Require a valid JWT. Populates Auth::user(). 
     * Calls Response::unauthorised() and exits if invalid.
     */
    public static function require(): void
    {
        $token = self::extractToken();

        if (!$token) {
            Response::unauthorised('No authentication token provided.');
        }

        try {
            $payload = JWT::verify($token);
            self::$currentUser = $payload;
        } catch (Exception $e) {
            Response::unauthorised($e->getMessage());
        }
    }

    /**
     * Require auth AND one of the specified roles.
     * Usage: Auth::requireRole([ROLE_DOCTOR, ROLE_SUPER_ADMIN])
     */
    public static function requireRole(array $roles): void
    {
        self::require();
        if (!in_array(self::$currentUser['role'] ?? '', $roles, true)) {
            Response::forbidden();
        }
    }

    /**
     * Get the currently authenticated user payload
     */
    public static function user(): ?array
    {
        return self::$currentUser;
    }

    /**
     * Get current user ID
     */
    public static function id(): ?string
    {
        return self::$currentUser['id'] ?? null;
    }

    /**
     * Get current user branch
     */
    public static function branchId(): ?string
    {
        // Allow override via header (for multi-branch switching by admin)
        $headerBranch = $_SERVER['HTTP_X_BRANCH_ID'] ?? null;
        if ($headerBranch && in_array(self::$currentUser['role'] ?? '', [
            ROLE_SUPER_ADMIN, ROLE_BRANCH_MANAGER
        ])) {
            return $headerBranch;
        }
        return self::$currentUser['branch_id'] ?? null;
    }

    /**
     * Extract Bearer token from Authorization header
     */
    private static function extractToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
                  ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
                  ?? getallheaders()['Authorization']
                  ?? null;

        if ($header && preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }
}
