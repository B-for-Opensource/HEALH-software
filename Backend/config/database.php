<?php
/**
 * HEAL Clinic — Database Configuration
 * MySQL 8.x (Standard on cPanel shared hosting)
 *
 * Deployment:
 *   On cPanel: Create MySQL database via cPanel > MySQL Databases
 *   Update credentials below or use environment variables
 */

class Database
{
    private static ?PDO $instance = null;

    // ---- CONNECTION SETTINGS ----
    // On cPanel: DB host is usually 'localhost'
    private static string $host     = 'localhost';
    private static string $dbname   = 'healclinic_db';    // cPanel: username_dbname
    private static string $username = 'healclinic_user';  // cPanel: username_dbuser
    private static string $password = 'CHANGE_THIS_PASSWORD';
    private static string $charset  = 'utf8mb4';

    public static function connect(): PDO
    {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=%s',
                self::$host,
                self::$dbname,
                self::$charset
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            ];

            self::$instance = new PDO($dsn, self::$username, self::$password, $options);
        }

        return self::$instance;
    }

    public static function get(): PDO
    {
        return self::connect();
    }
}

// Global shortcut
function db(): PDO {
    return Database::get();
}
