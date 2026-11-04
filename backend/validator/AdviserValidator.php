<?php

class AdviserValidator {
    

    public static function isActive($adviser) {
        if (!isset($adviser['status'])) {
            return false;
        }
        $status = strtolower($adviser['status']);
        return $status === 'active';
    }
    
    public static function isInactive($adviser) {
        if (!isset($adviser['status'])) {
            return false;
        }
        $status = strtolower($adviser['status']);
        return $status === 'inactive';
    }

    public static function getDisplayName($adviser) {
        if (!isset($adviser['name'])) {
            return 'Unknown';
        }
        
        if (self::isInactive($adviser)) {
            return $adviser['name'] . ' (Inactive)';
        }
        
        return $adviser['name'];
    }

    public static function validateSelectedAdvisers($advisers, $selectedIds) {
        $selectedAdvisers = array_filter($advisers, function($adviser) use ($selectedIds) {
            return in_array($adviser['id'], $selectedIds);
        });
        
        $inactiveAdvisers = array_filter($selectedAdvisers, function($adviser) {
            return self::isInactive($adviser);
        });
        
        if (count($inactiveAdvisers) > 0) {
            $inactiveNames = array_map(function($adviser) {
                return $adviser['name'];
            }, $inactiveAdvisers);
            
            return [
                'isValid' => false,
                'message' => 'Cannot select inactive advisers: ' . implode(', ', $inactiveNames)
            ];
        }
        
        return [
            'isValid' => true,
            'message' => null
        ];
    }
    
    public static function filterActive($advisers) {
        return array_filter($advisers, function($adviser) {
            return self::isActive($adviser);
        });
    }
}
