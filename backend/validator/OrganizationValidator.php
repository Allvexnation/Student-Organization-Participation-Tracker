<?php

class OrganizationValidator {

    public static function isActive($organization) {
        if (!isset($organization['status'])) {
            return false;
        }
        $status = strtolower($organization['status']);
        return $status === 'active';
    }

    public static function isSuspended($organization) {
        if (!isset($organization['status'])) {
            return false;
        }
        $status = strtolower($organization['status']);
        return $status === 'suspended' || $status === 'inactive';
    }

    public static function getDisplayName($organization) {
        if (!isset($organization['name'])) {
            return 'Unknown';
        }
        
        if (self::isSuspended($organization)) {
            return $organization['name'] . ' (Suspended)';
        }
        
        return $organization['name'];
    }

    public static function validateSelectedOrganizations($organizations, $selectedIds) {
        $selectedOrgs = array_filter($organizations, function($org) use ($selectedIds) {
            return in_array($org['id'], $selectedIds);
        });
        
        $suspendedOrgs = array_filter($selectedOrgs, function($org) {
            return self::isSuspended($org);
        });
        
        if (count($suspendedOrgs) > 0) {
            $suspendedNames = array_map(function($org) {
                return $org['name'];
            }, $suspendedOrgs);
            
            return [
                'isValid' => false,
                'message' => 'Cannot select suspended organizations: ' . implode(', ', $suspendedNames)
            ];
        }
        
        return [
            'isValid' => true,
            'message' => null
        ];
    }

    public static function filterActive($organizations) {
        return array_filter($organizations, function($org) {
            return self::isActive($org);
        });
    }
}
