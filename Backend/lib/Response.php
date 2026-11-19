<?php
/**
 * HEAL Clinic — Response Helper
 * Standardised JSON output for all API responses
 */

class Response
{
    /**
     * Send a successful JSON response
     */
    public static function json(mixed $data, int $code = 200): void
    {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'data'    => $data,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit();
    }

    /**
     * Send a list response with pagination metadata
     */
    public static function list(array $items, int $total, int $page = 1, int $pageSize = DEFAULT_PAGE_SIZE): void
    {
        http_response_code(200);
        echo json_encode([
            'success'  => true,
            'data'     => $items,
            'meta'     => [
                'total'      => $total,
                'page'       => $page,
                'page_size'  => $pageSize,
                'pages'      => (int) ceil($total / $pageSize),
            ],
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit();
    }

    /**
     * Send an error response
     */
    public static function error(string $message, int $code = 400, array $errors = []): void
    {
        http_response_code($code);
        $body = [
            'success' => false,
            'message' => $message,
        ];
        if (!empty($errors)) {
            $body['errors'] = $errors;
        }
        echo json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit();
    }

    /**
     * Send a 404 Not Found
     */
    public static function notFound(string $entity = 'Record'): void
    {
        self::error("$entity not found.", 404);
    }

    /**
     * Send a 401 Unauthorised
     */
    public static function unauthorised(string $msg = 'Unauthorised. Please log in.'): void
    {
        self::error($msg, 401);
    }

    /**
     * Send a 403 Forbidden
     */
    public static function forbidden(string $msg = 'You do not have permission to perform this action.'): void
    {
        self::error($msg, 403);
    }

    /**
     * Created (201)
     */
    public static function created(mixed $data, string $message = 'Created successfully.'): void
    {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit();
    }
}
