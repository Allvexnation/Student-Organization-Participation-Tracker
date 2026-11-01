<?php

require_once __DIR__ . '/../../config/db.php';

class StudentAttendanceModel {
    private $conn;
    private $table_name = "attendances";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in Students AttendanceModel");
        }
    }

    public function getEventsForStudent($student_id) {
        if (!$this->conn) return false;

        $query = "SELECT DISTINCT e.id, e.title, e.description, e.event_day_start, e.event_day_end, 
                                 e.venue, e.event_category, 
                                 COALESCE(eo.organization_id, e.organization_id) as organization_id, 
                                 o.name as organization_name,
                                 COALESCE(o.adviser_id, eo.approver_id, 1) as adviser_id,
                                 adv.name as adviser_name
                  FROM events e
                  LEFT JOIN event_registrations er ON er.event_id = e.id AND er.student_id = :student_id_1
                  LEFT JOIN event_organizations eo ON eo.event_id = e.id
                  LEFT JOIN organization_memberships om ON om.organization_id = eo.organization_id AND om.student_id = :student_id_2
                  LEFT JOIN organizations o ON o.id = COALESCE(eo.organization_id, e.organization_id)
                  LEFT JOIN advisers adv ON adv.id = COALESCE(o.adviser_id, eo.approver_id)
                  WHERE er.id IS NOT NULL OR om.id IS NOT NULL
                  ORDER BY e.event_day_start DESC, e.id DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':student_id_1', $student_id);
            $stmt->bindParam(':student_id_2', $student_id);
            $stmt->execute();
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($events as &$event) {
                $schedQuery = "SELECT id, schedule_date, start_time, end_time 
                               FROM event_daily_schedules 
                               WHERE event_id = :event_id 
                               ORDER BY schedule_date ASC";
                $schedStmt = $this->conn->prepare($schedQuery);
                $schedStmt->bindParam(':event_id', $event['id']);
                $schedStmt->execute();
                $schedules = $schedStmt->fetchAll(PDO::FETCH_ASSOC);

                if (empty($schedules) && !empty($event['event_day_start']) && !empty($event['event_day_end'])) {
                    $start = new DateTime($event['event_day_start']);
                    $end = new DateTime($event['event_day_end']);
                    $end->modify('+1 day');
                    $period = new DatePeriod($start, new DateInterval('P1D'), $end);

                    $generated = [];
                    foreach ($period as $dt) {
                        $generated[] = [
                            'id' => null,
                            'schedule_date' => $dt->format('Y-m-d'),
                            'start_time' => '08:00:00',
                            'end_time' => '17:00:00'
                        ];
                    }
                    $schedules = $generated;
                }

                $event['daily_schedules'] = $schedules;
            }

            return $events;
        } catch (PDOException $e) {
            error_log("Error fetching student events for attendance: " . $e->getMessage());
            return false;
        }
    }

    public function getAttendanceForStudentAndEvent($student_id, $event_id) {
        if (!$this->conn) return false;

        $query = "SELECT a.*, 
                         e.title as event_title,
                         o.name as organization_name,
                         adv.name as adviser_name
                  FROM " . $this->table_name . " a
                  LEFT JOIN events e ON a.event_id = e.id
                  LEFT JOIN organizations o ON a.organization_id = o.id
                  LEFT JOIN advisers adv ON a.adviser_id = adv.id
                  WHERE a.student_id = :student_id AND a.event_id = :event_id
                  ORDER BY a.schedule_date ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':student_id', $student_id);
            $stmt->bindParam(':event_id', $event_id);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error fetching student attendance: " . $e->getMessage());
            return false;
        }
    }

    public function getStudentRecord($student_id, $event_id, $schedule_date) {
        if (!$this->conn) return false;

        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE student_id = :student_id AND event_id = :event_id AND schedule_date = :schedule_date
                  LIMIT 1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':student_id', $student_id);
            $stmt->bindParam(':event_id', $event_id);
            $stmt->bindParam(':schedule_date', $schedule_date);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error reading student record: " . $e->getMessage());
            return false;
        }
    }

    private function computeStatusAndDuration($record) {
        $timeInAm = !empty($record['time_in_am']) ? $record['time_in_am'] : null;
        $timeOutAm = !empty($record['time_out_am']) ? $record['time_out_am'] : null;
        $breakOut = !empty($record['break_out']) ? $record['break_out'] : null;
        $breakIn = !empty($record['break_in']) ? $record['break_in'] : null;
        $timeInPm = !empty($record['time_in_pm']) ? $record['time_in_pm'] : null;
        $timeOutPm = !empty($record['time_out_pm']) ? $record['time_out_pm'] : null;

        $isAbsent = !empty($record['is_absent']);
        $absentSession = !empty($record['absent_session']) ? strtoupper($record['absent_session']) : null;
        $isExcused = !empty($record['is_excused']);
        $excuseSession = !empty($record['excuse_session']) ? strtoupper($record['excuse_session']) : null;
        $excuseStatus = !empty($record['excuse_status']) ? $record['excuse_status'] : null;

        $durationMinutes = 0;

        if ($timeInAm && $timeOutAm) {
            $amStart = strtotime("1970-01-01 " . $timeInAm);
            $amEnd = strtotime("1970-01-01 " . $timeOutAm);
            if ($amEnd > $amStart) {
                $durationMinutes += round(($amEnd - $amStart) / 60);
            }
        }

        if ($timeInPm && $timeOutPm) {
            $pmStart = strtotime("1970-01-01 " . $timeInPm);
            $pmEnd = strtotime("1970-01-01 " . $timeOutPm);
            if ($pmEnd > $pmStart) {
                $durationMinutes += round(($pmEnd - $pmStart) / 60);
            }
        }

        if ($breakOut && $breakIn) {
            $bOut = strtotime("1970-01-01 " . $breakOut);
            $bIn = strtotime("1970-01-01 " . $breakIn);
            if (!$timeInAm && !$timeInPm && $timeInAm && $timeOutPm) {
                $totalStart = strtotime("1970-01-01 " . $timeInAm);
                $totalEnd = strtotime("1970-01-01 " . $timeOutPm);
                if ($totalEnd > $totalStart) {
                    $tot = round(($totalEnd - $totalStart) / 60);
                    $brk = ($bIn > $bOut) ? round(($bIn - $bOut) / 60) : 0;
                    $durationMinutes = max(0, $tot - $brk);
                }
            }
        }

        $status = 'Pending';

        if ($isAbsent) {
            if ($absentSession === 'BOTH' || $absentSession === 'WHOLE') {
                $status = 'Absent';
            } elseif ($absentSession === 'AM') {
                $status = ($timeInPm && $timeOutPm) ? 'Completed (AM Absent)' : 'Absent (AM)';
            } elseif ($absentSession === 'PM') {
                $status = ($timeInAm && $timeOutAm) ? 'Completed (PM Absent)' : 'Absent (PM)';
            } else {
                $status = 'Absent';
            }
        } elseif ($excuseStatus === 'Pending') {
            $status = 'Pending Excuse';
        } elseif ($isExcused && ($excuseStatus === 'Approved' || empty($excuseStatus))) {
            if ($excuseSession === 'AM') {
                $status = ($timeInPm && $timeOutPm) ? 'Completed (AM Excused)' : 'Excused (AM)';
            } elseif ($excuseSession === 'PM') {
                $status = ($timeInAm && $timeOutAm) ? 'Completed (PM Excused)' : 'Excused (PM)';
            } else {
                $status = 'Excused';
            }
        } else {
            $amCompleted = ($timeInAm && $timeOutAm);
            $pmCompleted = ($timeInPm && $timeOutPm);

            if ($amCompleted && $pmCompleted) {
                $status = 'Completed';
            } elseif ($timeInAm || $timeOutAm || $breakOut || $breakIn || $timeInPm || $timeOutPm) {
                $status = 'In Progress';
            } else {
                $status = 'Pending';
            }
        }

        return [
            'status' => $status,
            'duration_minutes' => $durationMinutes
        ];
    }

    public function logTime($student_id, $event_id, $organization_id, $adviser_id, $schedule_date, $log_type, $time_value = null) {
        if (!$this->conn) return false;

        $allowedTypes = ['time_in_am', 'time_out_am', 'break_out', 'break_in', 'time_in_pm', 'time_out_pm'];
        if (!in_array($log_type, $allowedTypes)) {
            return false;
        }

        if (empty($time_value)) {
            $time_value = date('H:i:s');
        } else {
            $time_value = date('H:i:s', strtotime($time_value));
        }

        $existing = $this->getStudentRecord($student_id, $event_id, $schedule_date);

        if (!$existing) {
            $data = [
                'student_id' => $student_id,
                'adviser_id' => $adviser_id,
                'event_id' => $event_id,
                'organization_id' => $organization_id,
                'schedule_date' => $schedule_date,
                $log_type => $time_value,
                'is_absent' => 0,
                'absent_session' => null,
                'is_excused' => 0,
                'excuse_reason' => null,
                'excuse_session' => null,
                'excuse_status' => null,
                'marked_by' => 'student'
            ];
            $computed = $this->computeStatusAndDuration($data);
            $data['status'] = $computed['status'];
            $data['duration_minutes'] = $computed['duration_minutes'];

            $query = "INSERT INTO " . $this->table_name . " 
                      (student_id, adviser_id, event_id, organization_id, schedule_date, {$log_type}, marked_by, status, duration_minutes)
                      VALUES (:student_id, :adviser_id, :event_id, :organization_id, :schedule_date, :val, 'student', :status, :duration_minutes)";

            try {
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':student_id', $student_id);
                $stmt->bindParam(':adviser_id', $adviser_id);
                $stmt->bindParam(':event_id', $event_id);
                $stmt->bindParam(':organization_id', $organization_id);
                $stmt->bindParam(':schedule_date', $schedule_date);
                $stmt->bindParam(':val', $time_value);
                $stmt->bindParam(':status', $data['status']);
                $stmt->bindParam(':duration_minutes', $data['duration_minutes']);
                $stmt->execute();
                return $this->getStudentRecord($student_id, $event_id, $schedule_date);
            } catch (PDOException $e) {
                error_log("Error inserting student attendance log: " . $e->getMessage());
                return false;
            }
        } else {
            $existing[$log_type] = $time_value;
            $existing['marked_by'] = 'student';
            if ($existing['is_absent'] && $existing['absent_session'] === 'BOTH') {
                $existing['is_absent'] = 0;
                $existing['absent_session'] = null;
            }

            $computed = $this->computeStatusAndDuration($existing);

            $query = "UPDATE " . $this->table_name . " 
                      SET {$log_type} = :val,
                          marked_by = 'student',
                          status = :status,
                          duration_minutes = :duration_minutes,
                          is_absent = :is_absent,
                          absent_session = :absent_session
                      WHERE id = :id";

            try {
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':val', $time_value);
                $stmt->bindParam(':status', $computed['status']);
                $stmt->bindParam(':duration_minutes', $computed['duration_minutes']);
                $stmt->bindParam(':is_absent', $existing['is_absent']);
                $stmt->bindParam(':absent_session', $existing['absent_session']);
                $stmt->bindParam(':id', $existing['id']);
                $stmt->execute();
                return $this->getStudentRecord($student_id, $event_id, $schedule_date);
            } catch (PDOException $e) {
                error_log("Error updating student attendance log: " . $e->getMessage());
                return false;
            }
        }
    }

    public function submitExcuse($student_id, $event_id, $organization_id, $adviser_id, $schedule_date, $reason, $session = 'BOTH') {
        if (!$this->conn) return false;

        $session = strtoupper($session ?: 'BOTH');
        if (!in_array($session, ['AM', 'PM', 'BOTH'])) {
            $session = 'BOTH';
        }

        $existing = $this->getStudentRecord($student_id, $event_id, $schedule_date);

        if (!$existing) {
            $query = "INSERT INTO " . $this->table_name . " 
                      (student_id, adviser_id, event_id, organization_id, schedule_date, is_excused, excuse_reason, excuse_session, excuse_status, marked_by, is_absent, status, duration_minutes)
                      VALUES (:student_id, :adviser_id, :event_id, :organization_id, :schedule_date, 0, :reason, :session, 'Pending', 'student', 0, 'Pending Excuse', 0)";

            try {
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':student_id', $student_id);
                $stmt->bindParam(':adviser_id', $adviser_id);
                $stmt->bindParam(':event_id', $event_id);
                $stmt->bindParam(':organization_id', $organization_id);
                $stmt->bindParam(':schedule_date', $schedule_date);
                $stmt->bindParam(':reason', $reason);
                $stmt->bindParam(':session', $session);
                $stmt->execute();
                return $this->getStudentRecord($student_id, $event_id, $schedule_date);
            } catch (PDOException $e) {
                error_log("Error creating pending excuse: " . $e->getMessage());
                return false;
            }
        } else {
            $query = "UPDATE " . $this->table_name . " 
                      SET is_excused = 0,
                          excuse_reason = :reason,
                          excuse_session = :session,
                          excuse_status = 'Pending',
                          marked_by = 'student',
                          is_absent = 0,
                          absent_session = NULL,
                          status = 'Pending Excuse'
                      WHERE id = :id";

            try {
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':reason', $reason);
                $stmt->bindParam(':session', $session);
                $stmt->bindParam(':id', $existing['id']);
                $stmt->execute();
                return $this->getStudentRecord($student_id, $event_id, $schedule_date);
            } catch (PDOException $e) {
                error_log("Error submitting excuse: " . $e->getMessage());
                return false;
            }
        }
    }
}
