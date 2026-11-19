<?php
/**
 * HEAL Clinic — Input Validator
 */

class Validator
{
    private array $data;
    private array $errors = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public static function json(): self
    {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?? [];
        return new self($data);
    }

    public static function query(): self
    {
        return new self($_GET);
    }

    public function required(string $field, string $label = ''): self
    {
        $label = $label ?: ucfirst(str_replace('_', ' ', $field));
        if (empty($this->data[$field]) && $this->data[$field] !== '0' && $this->data[$field] !== 0) {
            $this->errors[$field] = "$label is required.";
        }
        return $this;
    }

    public function string(string $field, int $min = 0, int $max = 500): self
    {
        if (isset($this->data[$field])) {
            $val = trim($this->data[$field]);
            $len = mb_strlen($val);
            if ($min > 0 && $len < $min) {
                $this->errors[$field] = ucfirst($field) . " must be at least $min characters.";
            }
            if ($len > $max) {
                $this->errors[$field] = ucfirst($field) . " cannot exceed $max characters.";
            }
        }
        return $this;
    }

    public function phone(string $field): self
    {
        if (!empty($this->data[$field])) {
            $phone = preg_replace('/\D/', '', $this->data[$field]);
            if (strlen($phone) < 10 || strlen($phone) > 15) {
                $this->errors[$field] = "Please enter a valid phone number.";
            }
        }
        return $this;
    }

    public function email(string $field): self
    {
        if (!empty($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = "Please enter a valid email address.";
        }
        return $this;
    }

    public function numeric(string $field, float $min = 0): self
    {
        if (!empty($this->data[$field]) && (!is_numeric($this->data[$field]) || $this->data[$field] < $min)) {
            $this->errors[$field] = ucfirst($field) . " must be a number >= $min.";
        }
        return $this;
    }

    public function date(string $field): self
    {
        if (!empty($this->data[$field])) {
            $d = DateTime::createFromFormat('Y-m-d', $this->data[$field]);
            if (!$d) {
                $this->errors[$field] = ucfirst($field) . " must be a valid date (YYYY-MM-DD).";
            }
        }
        return $this;
    }

    public function in(string $field, array $allowed): self
    {
        if (!empty($this->data[$field]) && !in_array($this->data[$field], $allowed, true)) {
            $this->errors[$field] = ucfirst($field) . " must be one of: " . implode(', ', $allowed);
        }
        return $this;
    }

    public function fails(): bool
    {
        return !empty($this->errors);
    }

    public function errors(): array
    {
        return $this->errors;
    }

    public function validate(): void
    {
        if ($this->fails()) {
            Response::error('Validation failed.', 422, $this->errors);
        }
    }

    public function get(string $field, mixed $default = null): mixed
    {
        return $this->data[$field] ?? $default;
    }

    public function all(): array
    {
        return $this->data;
    }
}
