<?php

class AdviserCrudValidator {

    public static function validate($data, $existingAdvisers = [], $mode = 'add', $currentId = null) {

        if (!isset($data['name']) || empty(trim($data['name']))) {
            return [
                'isValid' => false,
                'message' => 'Name is required'
            ];
        }

        if (!isset($data['email']) || empty(trim($data['email']))) {
            return [
                'isValid' => false,
                'message' => 'Email is required'
            ];
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return [
                'isValid' => false,
                'message' => 'Invalid email format'
            ];
        }

        $emailExists = false;
        foreach ($existingAdvisers as $adviser) {
            if ($mode === 'edit' && isset($adviser['id']) && $adviser['id'] == $currentId) {
                continue;
            }
            if (isset($adviser['email']) && strtolower($adviser['email']) === strtolower($data['email'])) {
                $emailExists = true;
                break;
            }
        }

        if ($emailExists) {
            return [
                'isValid' => false,
                'message' => 'Email already exists'
            ];
        }

        if ($mode === 'edit' && isset($data['username'])) {
            if (empty(trim($data['username']))) {
                return [
                    'isValid' => false,
                    'message' => 'Username is required'
                ];
            }

            $usernameExists = false;
            foreach ($existingAdvisers as $adviser) {
                if (isset($adviser['id']) && $adviser['id'] == $currentId) {
                    continue;
                }
                if (isset($adviser['username']) && strtolower($adviser['username']) === strtolower($data['username'])) {
                    $usernameExists = true;
                    break;
                }
            }

            if ($usernameExists) {
                return [
                    'isValid' => false,
                    'message' => 'Username already exists'
                ];
            }
        }

        if (isset($data['password']) && !empty($data['password']) && strlen($data['password']) < 8) {
            return [
                'isValid' => false,
                'message' => 'Password must be at least 8 characters'
            ];
        }

        if (!isset($data['role']) || ($data['role'] !== 'adviser' && $data['role'] !== 'head_adviser')) {
            return [
                'isValid' => false,
                'message' => 'Invalid role'
            ];
        }

        if (!isset($data['status']) || ($data['status'] !== 'active' && $data['status'] !== 'inactive')) {
            return [
                'isValid' => false,
                'message' => 'Invalid status'
            ];
        }

        return [
            'isValid' => true,
            'message' => null
        ];
    }

    public static function checkExistence($email, $username, $existingAdvisers = [], $excludeId = null) {
        if ($email) {
            foreach ($existingAdvisers as $adviser) {
                if ($excludeId && isset($adviser['id']) && $adviser['id'] == $excludeId) {
                    continue;
                }
                if (isset($adviser['email']) && strtolower($adviser['email']) === strtolower($email)) {
                    return ['exists' => true, 'field' => 'email'];
                }
            }
        }

        if ($username) {
            foreach ($existingAdvisers as $adviser) {
                if ($excludeId && isset($adviser['id']) && $adviser['id'] == $excludeId) {
                    continue;
                }
                if (isset($adviser['username']) && strtolower($adviser['username']) === strtolower($username)) {
                    return ['exists' => true, 'field' => 'username'];
                }
            }
        }

        return ['exists' => false, 'field' => null];
    }
}
