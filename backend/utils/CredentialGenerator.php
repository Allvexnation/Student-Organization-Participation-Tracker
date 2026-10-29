<?php

class CredentialGenerator {

    public static function generateUniqueUsername($name, $checkCallback) {
        $baseUsername = self::sanitizeUsername($name);
        $username = $baseUsername;
        $counter = 1;

        while (call_user_func($checkCallback, $username)) {
            $username = $baseUsername . $counter;
            $counter++;
        }

        return $username;
    }

    private static function sanitizeUsername($name) {
        $username = strtolower($name);
        $username = preg_replace('/[^a-z0-9]/', '', $username);
        $username = substr($username, 0, 15);
        
        $numbers = '0123456789';
        $numbersLength = strlen($numbers);
        for ($i = 0; $i < 3; $i++) {
            $username .= $numbers[random_int(0, $numbersLength - 1)];
        }

        return $username;
    }

    public static function generateSecurePassword($length = 8) {
        $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $password = '';
        $charsLength = strlen($chars);

        for ($i = 0; $i < $length; $i++) {
            $password .= $chars[random_int(0, $charsLength - 1)];
        }

        return $password;
    }
}
