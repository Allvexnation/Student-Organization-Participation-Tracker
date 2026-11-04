<?php

class StudentCrudValidator {

    public static function validate($data, $existingStudents = [], $mode = 'add', $currentId = null) {

        if (!isset($data['student_number']) || empty(trim($data['student_number']))) {
            return [
                'isValid' => false,
                'message' => 'Student number is required'
            ];
        }

        $studentNumberExists = false;
        foreach ($existingStudents as $student) {
            if ($mode === 'edit' && isset($student['id']) && $student['id'] == $currentId) {
                continue;
            }
            if (isset($student['student_number']) && strtolower($student['student_number']) === strtolower($data['student_number'])) {
                $studentNumberExists = true;
                break;
            }
        }

        if ($studentNumberExists) {
            return [
                'isValid' => false,
                'message' => 'Student number already exists'
            ];
        }

        if (!isset($data['first_name']) || empty(trim($data['first_name']))) {
            return [
                'isValid' => false,
                'message' => 'First name is required'
            ];
        }

        if (!isset($data['last_name']) || empty(trim($data['last_name']))) {
            return [
                'isValid' => false,
                'message' => 'Last name is required'
            ];
        }

        if (!isset($data['program']) || empty(trim($data['program']))) {
            return [
                'isValid' => false,
                'message' => 'Program is required'
            ];
        }

        if (!isset($data['year_level']) || empty(trim($data['year_level']))) {
            return [
                'isValid' => false,
                'message' => 'Year level is required'
            ];
        }

        $validYearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
        if (!in_array($data['year_level'], $validYearLevels)) {
            return [
                'isValid' => false,
                'message' => 'Invalid year level'
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
        foreach ($existingStudents as $student) {
            if ($mode === 'edit' && isset($student['id']) && $student['id'] == $currentId) {
                continue;
            }
            if (isset($student['email']) && strtolower($student['email']) === strtolower($data['email'])) {
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
            foreach ($existingStudents as $student) {
                if (isset($student['id']) && $student['id'] == $currentId) {
                    continue;
                }
                if (isset($student['username']) && strtolower($student['username']) === strtolower($data['username'])) {
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

        return [
            'isValid' => true,
            'message' => null
        ];
    }

    public static function checkExistence($studentNumber, $email, $username, $existingStudents = [], $excludeId = null) {
        if ($studentNumber) {
            foreach ($existingStudents as $student) {
                if ($excludeId && isset($student['id']) && $student['id'] == $excludeId) {
                    continue;
                }
                if (isset($student['student_number']) && strtolower($student['student_number']) === strtolower($studentNumber)) {
                    return ['exists' => true, 'field' => 'student_number'];
                }
            }
        }

        if ($email) {
            foreach ($existingStudents as $student) {
                if ($excludeId && isset($student['id']) && $student['id'] == $excludeId) {
                    continue;
                }
                if (isset($student['email']) && strtolower($student['email']) === strtolower($email)) {
                    return ['exists' => true, 'field' => 'email'];
                }
            }
        }

        if ($username) {
            foreach ($existingStudents as $student) {
                if ($excludeId && isset($student['id']) && $student['id'] == $excludeId) {
                    continue;
                }
                if (isset($student['username']) && strtolower($student['username']) === strtolower($username)) {
                    return ['exists' => true, 'field' => 'username'];
                }
            }
        }

        return ['exists' => false, 'field' => null];
    }
}
