<?php

class OrganizationMembershipCrudValidator {

    public static function validateStudentOrganizationUniqueness($studentId, $existingMemberships = [], $excludeId = null) {
        if (!$studentId || empty($studentId)) {
            return [
                'isValid' => false,
                'message' => 'Student is required'
            ];
        }

        foreach ($existingMemberships as $membership) {
            if ($membership['student_id'] == $studentId && $membership['id'] != $excludeId) {
                return [
                    'isValid' => false,
                    'message' => 'Student already has an organization membership. A student can only belong to one organization.'
                ];
            }
        }

        return [
            'isValid' => true,
            'message' => null
        ];
    }

    public static function validate($data, $existingMemberships = [], $excludeId = null) {

        if (!isset($data['student_id']) || empty($data['student_id'])) {
            return [
                'isValid' => false,
                'message' => 'Student is required'
            ];
        }

        if (!isset($data['organization_id']) || empty($data['organization_id'])) {
            return [
                'isValid' => false,
                'message' => 'Organization is required'
            ];
        }

        if (!isset($data['date_joined']) || empty($data['date_joined'])) {
            return [
                'isValid' => false,
                'message' => 'Date joined is required'
            ];
        }

        if (!isset($data['role_id']) || empty($data['role_id'])) {
            return [
                'isValid' => false,
                'message' => 'Position/Role is required'
            ];
        }

        if (!isset($data['membership_status']) || empty($data['membership_status'])) {
            return [
                'isValid' => false,
                'message' => 'Membership status is required'
            ];
        }

        if (!$excludeId) {
            $uniquenessValidation = self::validateStudentOrganizationUniqueness($data['student_id'], $existingMemberships, $excludeId);
            if (!$uniquenessValidation['isValid']) {
                return $uniquenessValidation;
            }
        }

        return [
            'isValid' => true,
            'message' => null
        ];
    }
}
