<?php

require_once __DIR__ . '/../config/db.php';

class AuditLogScope {
    public static function empty() {
        return [
            'organization_ids' => [],
            'membership_ids' => [],
            'student_ids' => [],
            'adviser_ids' => [],
            'event_ids' => [],
            'task_ids' => [],
            'attendance_ids' => []
        ];
    }

    public static function forAdviser($adviserId) {
        $scope = self::empty();
        $adviserId = (int)$adviserId;
        if (!$adviserId) {
            return $scope;
        }

        $scope['adviser_ids'][] = $adviserId;

        try {
            $db = Database::getInstance()->getConnection();

            $stmtOrg = $db->prepare("SELECT id FROM organizations WHERE adviser_id = :adviser_id");
            $stmtOrg->bindParam(':adviser_id', $adviserId, PDO::PARAM_INT);
            $stmtOrg->execute();
            $scope['organization_ids'] = array_map('intval', $stmtOrg->fetchAll(PDO::FETCH_COLUMN));

            $stmtAdv = $db->prepare("SELECT current_organization_id FROM advisers WHERE id = :adviser_id");
            $stmtAdv->bindParam(':adviser_id', $adviserId, PDO::PARAM_INT);
            $stmtAdv->execute();
            $currOrg = $stmtAdv->fetchColumn();
            if ($currOrg && !in_array((int)$currOrg, $scope['organization_ids'], true)) {
                $scope['organization_ids'][] = (int)$currOrg;
            }

            if (!empty($scope['organization_ids'])) {
                $placeholders = implode(',', array_fill(0, count($scope['organization_ids']), '?'));

                $stmtMem = $db->prepare("SELECT id, student_id FROM organization_memberships WHERE organization_id IN ($placeholders)");
                $stmtMem->execute($scope['organization_ids']);
                foreach ($stmtMem->fetchAll(PDO::FETCH_ASSOC) as $membership) {
                    if (!empty($membership['id'])) {
                        $scope['membership_ids'][] = (int)$membership['id'];
                    }
                    if (!empty($membership['student_id'])) {
                        $scope['student_ids'][] = (int)$membership['student_id'];
                    }
                }

                try {
                    $stmtEvents = $db->prepare("SELECT event_id FROM event_organizations WHERE organization_id IN ($placeholders)");
                    $stmtEvents->execute($scope['organization_ids']);
                    $scope['event_ids'] = array_map('intval', $stmtEvents->fetchAll(PDO::FETCH_COLUMN));
                } catch (Exception $e) {
                    error_log("Error retrieving adviser event associations: " . $e->getMessage());
                }

                try {
                    $stmtTasks = $db->prepare("SELECT id FROM member_tasks WHERE organization_id IN ($placeholders)");
                    $stmtTasks->execute($scope['organization_ids']);
                    $scope['task_ids'] = array_map('intval', $stmtTasks->fetchAll(PDO::FETCH_COLUMN));
                } catch (Exception $e) {
                    error_log("Error retrieving adviser task associations: " . $e->getMessage());
                }

                try {
                    $stmtAtt = $db->prepare("SELECT id FROM attendances WHERE organization_id IN ($placeholders)");
                    $stmtAtt->execute($scope['organization_ids']);
                    $scope['attendance_ids'] = array_map('intval', $stmtAtt->fetchAll(PDO::FETCH_COLUMN));
                } catch (Exception $e) {
                    error_log("Error retrieving adviser attendance associations: " . $e->getMessage());
                }
            }
        } catch (Exception $e) {
            error_log("Error retrieving adviser associations: " . $e->getMessage());
        }

        return self::unique($scope);
    }

    public static function forStudent($studentId) {
        $scope = self::empty();
        $studentId = (int)$studentId;
        if (!$studentId) {
            return $scope;
        }

        $scope['student_ids'][] = $studentId;

        try {
            $db = Database::getInstance()->getConnection();

            $stmtMem = $db->prepare("SELECT id, organization_id FROM organization_memberships WHERE student_id = :student_id");
            $stmtMem->bindParam(':student_id', $studentId, PDO::PARAM_INT);
            $stmtMem->execute();
            foreach ($stmtMem->fetchAll(PDO::FETCH_ASSOC) as $membership) {
                if (!empty($membership['id'])) {
                    $scope['membership_ids'][] = (int)$membership['id'];
                }
                if (!empty($membership['organization_id'])) {
                    $scope['organization_ids'][] = (int)$membership['organization_id'];
                }
            }

            if (!empty($scope['organization_ids'])) {
                $placeholders = implode(',', array_fill(0, count($scope['organization_ids']), '?'));

                $stmtAdv = $db->prepare("SELECT adviser_id FROM organizations WHERE id IN ($placeholders) AND adviser_id IS NOT NULL");
                $stmtAdv->execute($scope['organization_ids']);
                $scope['adviser_ids'] = array_map('intval', $stmtAdv->fetchAll(PDO::FETCH_COLUMN));

                $stmtCurr = $db->prepare("SELECT id FROM advisers WHERE current_organization_id IN ($placeholders)");
                $stmtCurr->execute($scope['organization_ids']);
                $scope['adviser_ids'] = array_merge($scope['adviser_ids'], array_map('intval', $stmtCurr->fetchAll(PDO::FETCH_COLUMN)));

                try {
                    $stmtEvents = $db->prepare("SELECT event_id FROM event_organizations WHERE organization_id IN ($placeholders)");
                    $stmtEvents->execute($scope['organization_ids']);
                    $scope['event_ids'] = array_map('intval', $stmtEvents->fetchAll(PDO::FETCH_COLUMN));
                } catch (Exception $e) {
                    error_log("Error retrieving student event associations: " . $e->getMessage());
                }
            }

            try {
                $stmtReg = $db->prepare("SELECT event_id FROM event_registrations WHERE student_id = :student_id");
                $stmtReg->bindParam(':student_id', $studentId, PDO::PARAM_INT);
                $stmtReg->execute();
                $scope['event_ids'] = array_merge($scope['event_ids'], array_map('intval', $stmtReg->fetchAll(PDO::FETCH_COLUMN)));
            } catch (Exception $e) {
                error_log("Error retrieving student event registrations: " . $e->getMessage());
            }

            try {
                $stmtTasks = $db->prepare("SELECT id FROM member_tasks WHERE student_id = :student_id");
                $stmtTasks->bindParam(':student_id', $studentId, PDO::PARAM_INT);
                $stmtTasks->execute();
                $scope['task_ids'] = array_map('intval', $stmtTasks->fetchAll(PDO::FETCH_COLUMN));
            } catch (Exception $e) {
                error_log("Error retrieving student task associations: " . $e->getMessage());
            }

            try {
                $stmtAtt = $db->prepare("SELECT id FROM attendances WHERE student_id = :student_id");
                $stmtAtt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
                $stmtAtt->execute();
                $scope['attendance_ids'] = array_map('intval', $stmtAtt->fetchAll(PDO::FETCH_COLUMN));
            } catch (Exception $e) {
                error_log("Error retrieving student attendance associations: " . $e->getMessage());
            }
        } catch (Exception $e) {
            error_log("Error retrieving student associations: " . $e->getMessage());
        }

        return self::unique($scope);
    }

    public static function merge($filters, $scope) {
        return array_merge($filters, $scope);
    }

    public static function visibilitySql($alias, $filters) {
        $prefix = $alias ? $alias . '.' : '';

        if (!empty($filters['adviser_id'])) {
            return self::adviserVisibilitySql($prefix, $filters);
        }

        if (!empty($filters['student_id'])) {
            return self::studentVisibilitySql($prefix, $filters);
        }

        return '';
    }

    public static function redactForStudent($logs) {
        if (!is_array($logs)) {
            return $logs;
        }

        foreach ($logs as &$log) {
            $userType = $log['user_type'] ?? '';
            if ($userType === 'admin' || $userType === 'adviser') {
                $log['ip_address'] = 'Hidden';
                $log['device_type'] = 'Hidden';
                $log['device_brand'] = 'Hidden';
                $log['browser'] = 'Hidden';
                $log['os'] = 'Hidden';
                $log['user_agent'] = 'Hidden';
                $log['screen_resolution'] = 'Hidden';
            }
        }

        return $logs;
    }

    private static function adviserVisibilitySql($prefix, $filters) {
        $orgIds = $filters['organization_ids'] ?? [];
        $studentIds = $filters['student_ids'] ?? [];
        $membershipIds = $filters['membership_ids'] ?? [];
        $eventIds = $filters['event_ids'] ?? [];
        $taskIds = $filters['task_ids'] ?? [];
        $attendanceIds = $filters['attendance_ids'] ?? [];
        $adviserId = (int)$filters['adviser_id'];
        $conditions = [];

        $conditions[] = "({$prefix}user_id = $adviserId AND {$prefix}user_type = 'adviser')";
        $conditions[] = "({$prefix}table_name = 'advisers' AND {$prefix}record_id = $adviserId)";

        if (!empty($studentIds)) {
            $studentIdsStr = implode(',', array_map('intval', $studentIds));
            $conditions[] = "({$prefix}user_id IN ($studentIdsStr) AND {$prefix}user_type = 'student')";
            $conditions[] = "({$prefix}table_name = 'students' AND {$prefix}record_id IN ($studentIdsStr))";
        }

        if (!empty($orgIds)) {
            $orgIdsStr = implode(',', array_map('intval', $orgIds));
            $conditions[] = "({$prefix}table_name = 'organizations' AND {$prefix}record_id IN ($orgIdsStr))";
            $conditions[] = "({$prefix}table_name = 'organization_memberships' AND ({$prefix}old_value REGEXP '(^|,)$orgIdsStr(,|$)' OR {$prefix}new_value REGEXP '(^|,)$orgIdsStr(,|$)'))";
        }

        if (!empty($membershipIds)) {
            $membershipIdsStr = implode(',', array_map('intval', $membershipIds));
            $conditions[] = "({$prefix}table_name = 'organization_memberships' AND {$prefix}record_id IN ($membershipIdsStr))";
        }

        if (!empty($eventIds)) {
            $eventIdsStr = implode(',', array_map('intval', $eventIds));
            $conditions[] = "({$prefix}table_name IN ('events', 'event_organizations') AND {$prefix}record_id IN ($eventIdsStr))";
        }

        if (!empty($taskIds)) {
            $taskIdsStr = implode(',', array_map('intval', $taskIds));
            $conditions[] = "({$prefix}table_name IN ('tasks', 'member_tasks') AND {$prefix}record_id IN ($taskIdsStr))";
        }

        if (!empty($attendanceIds)) {
            $attIdsStr = implode(',', array_map('intval', $attendanceIds));
            $conditions[] = "({$prefix}table_name IN ('attendance', 'attendances') AND {$prefix}record_id IN ($attIdsStr))";
        }

        if (empty($conditions)) {
            return " AND (({$prefix}table_name = 'advisers' AND {$prefix}record_id = $adviserId) OR ({$prefix}user_id = $adviserId AND {$prefix}user_type = 'adviser'))";
        }

        return ' AND (' . implode(' OR ', $conditions) . ')';
    }

    private static function studentVisibilitySql($prefix, $filters) {
        $studentId = (int)$filters['student_id'];
        $adviserIds = $filters['adviser_ids'] ?? [];
        $orgIds = $filters['organization_ids'] ?? [];
        $membershipIds = $filters['membership_ids'] ?? [];
        $eventIds = $filters['event_ids'] ?? [];
        $taskIds = $filters['task_ids'] ?? [];
        $attendanceIds = $filters['attendance_ids'] ?? [];
        $conditions = [];

        $conditions[] = "({$prefix}user_id = $studentId AND {$prefix}user_type = 'student')";
        $conditions[] = "({$prefix}table_name = 'students' AND {$prefix}record_id = $studentId)";
        $conditions[] = "({$prefix}table_name IN ('attendance', 'attendances') AND ({$prefix}record_id = $studentId OR {$prefix}record_id IN (SELECT id FROM attendances WHERE student_id = $studentId)))";

        if (!empty($adviserIds)) {
            $adviserIdsStr = implode(',', array_map('intval', $adviserIds));
            $conditions[] = "({$prefix}user_id IN ($adviserIdsStr) AND {$prefix}user_type = 'adviser' AND (
                ({$prefix}table_name = 'organizations' AND " . self::inList($prefix . 'record_id', $orgIds) . ")
                OR ({$prefix}table_name = 'students' AND {$prefix}record_id = $studentId)
                OR ({$prefix}table_name = 'organization_memberships' AND " . self::inList($prefix . 'record_id', $membershipIds) . ")
                OR ({$prefix}table_name IN ('events', 'event_organizations') AND " . self::inList($prefix . 'record_id', $eventIds) . ")
                OR ({$prefix}table_name IN ('tasks', 'member_tasks') AND " . self::inList($prefix . 'record_id', $taskIds) . ")
                OR ({$prefix}table_name IN ('attendance', 'attendances') AND " . self::inList($prefix . 'record_id', $attendanceIds) . ")
            ))";
        }

        if (!empty($orgIds)) {
            $orgIdsStr = implode(',', array_map('intval', $orgIds));
            $conditions[] = "({$prefix}table_name = 'organizations' AND {$prefix}record_id IN ($orgIdsStr))";
        }

        if (!empty($membershipIds)) {
            $membershipIdsStr = implode(',', array_map('intval', $membershipIds));
            $conditions[] = "({$prefix}table_name = 'organization_memberships' AND {$prefix}record_id IN ($membershipIdsStr))";
        }

        if (!empty($eventIds)) {
            $eventIdsStr = implode(',', array_map('intval', $eventIds));
            $conditions[] = "({$prefix}table_name IN ('events', 'event_organizations') AND {$prefix}record_id IN ($eventIdsStr))";
        }

        if (!empty($taskIds)) {
            $taskIdsStr = implode(',', array_map('intval', $taskIds));
            $conditions[] = "({$prefix}table_name IN ('tasks', 'member_tasks') AND {$prefix}record_id IN ($taskIdsStr))";
        }

        if (!empty($attendanceIds)) {
            $attIdsStr = implode(',', array_map('intval', $attendanceIds));
            $conditions[] = "({$prefix}table_name IN ('attendance', 'attendances') AND {$prefix}record_id IN ($attIdsStr))";
        }

        return ' AND (' . implode(' OR ', $conditions) . ')';
    }

    private static function inList($column, $ids) {
        if (empty($ids)) {
            return '0=1';
        }
        return $column . ' IN (' . implode(',', array_map('intval', $ids)) . ')';
    }

    private static function unique($scope) {
        foreach ($scope as $key => $values) {
            $scope[$key] = array_values(array_unique(array_filter(array_map('intval', $values))));
        }
        return $scope;
    }
}
