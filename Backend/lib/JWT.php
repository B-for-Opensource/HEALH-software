<?php
/**
 * HEAL Clinic — JWT Authentication (Pure PHP, no dependencies)
 * HS256 algorithm — works on any cPanel PHP 8.1+
 */

class JWT
{
    private static string $secret = JWT_SECRET;
    private static string $algo   = 'SHA256';

    /**
     * Generate a new JWT token
     */
    public static function create(array $payload): string
    {
        $header = self::base64url(json_encode([
            'typ' => 'JWT',
            'alg' => 'HS256',
        ]));

        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRY;

        $payloadEncoded = self::base64url(json_encode($payload));

        $signature = self::base64url(hash_hmac(
            self::$algo,
            "$header.$payloadEncoded",
            self::$secret,
            true
        ));

        return "$header.$payloadEncoded.$signature";
    }

    /**
     * Verify and decode a JWT token
     * Returns the payload array or throws Exception
     */
    public static function verify(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new Exception('Invalid token format.', 401);
        }

        [$header, $payloadEncoded, $signature] = $parts;

        $expectedSig = self::base64url(hash_hmac(
            self::$algo,
            "$header.$payloadEncoded",
            self::$secret,
            true
        ));

        if (!hash_equals($expectedSig, $signature)) {
            throw new Exception('Invalid token signature.', 401);
        }

        $payload = json_decode(self::base64urlDecode($payloadEncoded), true);

        if (!$payload) {
            throw new Exception('Could not decode token.', 401);
        }

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token has expired. Please log in again.', 401);
        }

        return $payload;
    }

    private static function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64urlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
