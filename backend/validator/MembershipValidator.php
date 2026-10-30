<?php

class MembershipValidator {

    public static function isActive($membership) {
        if (!$membership || !isset($membership['membership_status'])) {
            return false;
        }
        $status = strtolower($membership['membership_status']);
        return $status === 'active';
    }

    public static function isInactive($membership) {
        if (!$membership || !isset($membership['membership_status'])) {
            return false;
        }
        $status = strtolower($membership['membership_status']);
        return $status === 'inactive' || $status === 'resigned';
    }

    public static function getDisplayName($membership) {
        if (!$membership || !isset($membership['student_name'])) {
            return 'Unknown';
        }
        
        if (self::isInactive($membership)) {
            return $membership['student_name'] . ' (' . $membership['membership_status'] . ')';
        }
        
        return $membership['student_name'];
    }

    public static function filterActive($memberships) {
        if (!$memberships || !is_array($memberships)) {
            return [];
        }
        return array_filter($memberships, function($membership) {
            return self::isActive($membership);
        });
    }
}
