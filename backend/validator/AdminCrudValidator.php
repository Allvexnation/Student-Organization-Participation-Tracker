<?php

class AdminCrudValidator {

    public static function validate($data, $existingAdmins = [], $mode = 'add', $currentId = null) {
        $crtAdminEmail = getenv('CRT_ADMIN_EMAIL');

        if ($mode === 'edit') {
            $currentAdmin = null;
            foreach ($existingAdmins as $admin) {
                if (isset($admin['id']) && $admin['id'] == $currentId) {
                    $currentAdmin = $admin;
                    break;
                }
            }

            if ($currentAdmin && strtolower($currentAdmin['email']) === strtolower($crtAdminEmail)) {
                return [
                    'isValid' => false,
                    'message' => 'Cannot modify CRT admin account'
                ];
            }
        }

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
        foreach ($existingAdmins as $admin) {
            if ($mode === 'edit' && isset($admin['id']) && $admin['id'] == $currentId) {
                continue;
            }
            if (isset($admin['email']) && strtolower($admin['email']) === strtolower($data['email'])) {
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
            foreach ($existingAdmins as $admin) {
                if (isset($admin['id']) && $admin['id'] == $currentId) {
                    continue;
                }
                if (isset($admin['username']) && strtolower($admin['username']) === strtolower($data['username'])) {
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

        if (!isset($data['role']) || ($data['role'] !== 'admin' && $data['role'] !== 'super_admin')) {
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

    public static function canDelete($adminId, $existingAdmins = []) {
        $crtAdminEmail = getenv('CRT_ADMIN_EMAIL');

        foreach ($existingAdmins as $admin) {
            if (isset($admin['id']) && $admin['id'] == $adminId) {
                if (isset($admin['email']) && strtolower($admin['email']) === strtolower($crtAdminEmail)) {
                    return [
                        'canDelete' => false,
                        'message' => 'Cannot delete CRT admin account'
                    ];
                }
                break;
            }
        }

        return [
            'canDelete' => true,
            'message' => null
        ];
    }

    public static function checkExistence($email, $username, $existingAdmins = [], $excludeId = null) {
        if ($email) {
            foreach ($existingAdmins as $admin) {
                if ($excludeId && isset($admin['id']) && $admin['id'] == $excludeId) {
                    continue;
                }
                if (isset($admin['email']) && strtolower($admin['email']) === strtolower($email)) {
                    return ['exists' => true, 'field' => 'email'];
                }
            }
        }

        if ($username) {
            foreach ($existingAdmins as $admin) {
                if ($excludeId && isset($admin['id']) && $admin['id'] == $excludeId) {
                    continue;
                }
                if (isset($admin['username']) && strtolower($admin['username']) === strtolower($username)) {
                    return ['exists' => true, 'field' => 'username'];
                }
            }
        }

        return ['exists' => false, 'field' => null];
    }
}
