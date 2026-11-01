<?php

require_once __DIR__ . '/../../config/db.php';

class AttendanceModel {
    private $conn;
    private $table_name = "attendances";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in AttendanceModel");
        }
    }

    public function getRegisteredEventsForAdviser($adviser_id) {
        if (!$this->conn) return false;

        $query = "SELECT DISTINCT e.id, e.title, e.description, e.event_day_start, e.event_day_end, 
                                 e.venue, e.event_category, o.id as organization_id, o.name as organization_name
                  FROM events e
                  INNER JOIN event_organizations eo ON eo.event_id = e.id
                  INNER JOIN organizations o ON eo.organization_id = o.id
                  LEFT JOIN advisers a ON a.id = :adviser_id
                  WHERE (o.adviser_id = :adviser_id OR o.id = a.current_organization_id)
                  ORDER BY e.event_day_start DESC, e.id DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':adviser_id', $adviser_id);
            $stmt->execute();
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($events)) {
                $fallbackQuery = "SELECT DISTINCT e.id, e.title, e.description, e.event_day_start, e.event_day_end, 
                                                 e.venue, e.event_category, o.id as organization_id, o.name as organization_name
                                  FROM events e
                                  INNER JOIN organizations o ON e.organization_id = o.id
                                  WHERE o.adviser_id = :adviser_id
                                  ORDER BY e.event_day_start DESC, e.id DESC";
                $fallbackStmt = $this->conn->prepare($fallbackQuery);
                $fallbackStmt->bindParam(':adviser_id', $adviser_id);
                $fallbackStmt->execute();
                $events = $fallbackStmt->fetchAll(PDO::FETCH_ASSOC);
            }

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
            error_log("Error fetching adviser events for attendance: " . $e->getMessage());
            return false;
        }
    }

    public function getEventForAdviser($event_id, $adviser_id) {
        if (!$this->conn) return false;

        $query = "SELECT DISTINCT e.id, e.title, e.description, e.event_day_start, e.event_day_end, 
                                 e.venue, e.event_category, o.id as organization_id, o.name as organization_name
                  FROM events e
                  INNER JOIN event_organizations eo ON eo.event_id = e.id
                  INNER JOIN organizations o ON eo.organization_id = o.id
                  LEFT JOIN advisers a ON a.id = :adviser_id
                  WHERE e.id = :event_id AND (o.adviser_id = :adviser_id OR o.id = a.current_organization_id)
                  LIMIT 1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $event_id);
            $stmt->bindParam(':adviser_id', $adviser_id);
            $stmt->execute();
            $event = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$event) {
                $fallbackQuery = "SELECT DISTINCT e.id, e.title, e.description, e.event_day_start, e.event_day_end, 
                                                 e.venue, e.event_category, o.id as organization_id, o.name as organization_name
                                  FROM events e
                                  INNER JOIN organizations o ON e.organization_id = o.id
                                  WHERE e.id = :event_id AND o.adviser_id = :adviser_id
                                  LIMIT 1";
                $fallbackStmt = $this->conn->prepare($fallbackQuery);
                $fallbackStmt->bindParam(':event_id', $event_id);
                $fallbackStmt->bindParam(':adviser_id', $adviser_id);
                $fallbackStmt->execute();
                $event = $fallbackStmt->fetch(PDO::FETCH_ASSOC);
            }

            if ($event) {
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

            return $event;
        } catch (PDOException $e) {
            error_log("Error fetching event for adviser: " . $e->getMessage());
            return false;
        }
    }

    public function getStudentsForEvent($event_id, $adviser_id) {
        if (!$this->conn) return false;

        $event = $this->getEventForAdviser($event_id, $adviser_id);
        $orgId = $event && !empty($event['organization_id']) ? (int)$event['organization_id'] : 0;

        $query = "SELECT DISTINCT s.id as student_id, s.student_number, s.first_name, s.last_name,
                         CONCAT(s.first_name, ' ', s.last_name) as student_name,
                         s.email, s.program, s.year_level
                  FROM students s
                  INNER JOIN event_registrations er ON er.student_id = s.id AND er.event_id = :event_id";

        if ($orgId > 0) {
            $query .= " UNION 
                       SELECT DISTINCT s.id as student_id, s.student_number, s.first_name, s.last_name,
                              CONCAT(s.first_name, ' ', s.last_name) as student_name,
                              s.email, s.program, s.year_level
                       FROM students s
                       INNER JOIN organization_memberships om ON om.student_id = s.id AND om.organization_id = :org_id";
        }

        $query .= " ORDER BY last_name ASC, first_name ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $event_id);
            if ($orgId > 0) {
                $stmt->bindParam(':org_id', $orgId);
            }
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error fetching students for event: " . $e->getMessage());
            return false;
        }
    }

    public function getAttendanceByEvent($event_id, $schedule_date = null) {
        if (!$this->conn) return false;

        $query = "SELECT a.*, 
                         s.student_number, 
                         CONCAT(s.first_name, ' ', s.last_name) as student_name,
                         s.program, 
                         s.year_level
                  FROM " . $this->table_name . " a
                  INNER JOIN students s ON a.student_id = s.id
                  WHERE a.event_id = :event_id";

        if ($schedule_date) {
            $query .= " AND a.schedule_date = :schedule_date";
        }

        $query .= " ORDER BY a.schedule_date ASC, s.last_name ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $event_id);
            if ($schedule_date) {
                $stmt->bindParam(':schedule_date', $schedule_date);
            }
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error fetching attendance for event: " . $e->getMessage());
            return false;
        }
    }


    public function getStudentAttendanceRecord($student_id, $event_id, $schedule_date) {
        if (!$this->conn) return false;

        $query = "SELECT a.*, 
                         s.student_number, 
                         CONCAT(s.first_name, ' ', s.last_name) as student_name,
                         s.program, 
                         s.year_level
                  FROM " . $this->table_name . " a
                  INNER JOIN students s ON a.student_id = s.id
                  WHERE a.student_id = :student_id AND a.event_id = :event_id AND a.schedule_date = :schedule_date
                  LIMIT 1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':student_id', $student_id);
            $stmt->bindParam(':event_id', $event_id);
            $stmt->bindParam(':schedule_date', $schedule_date);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error fetching student attendance record: " . $e->getMessage());
            return false;
        }
    }

    public function computeStatusAndDuration($record) {
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

    public function logTime($student_id, $adviser_id, $event_id, $organization_id, $schedule_date, $log_type, $time_value = null) {
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

        $existing = $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);

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
                'marked_by' => 'adviser'
            ];
            $computed = $this->computeStatusAndDuration($data);
            $data['status'] = $computed['status'];
            $data['duration_minutes'] = $computed['duration_minutes'];

            $query = "INSERT INTO " . $this->table_name . " 
                      (student_id, adviser_id, event_id, organization_id, schedule_date, {$log_type}, marked_by, status, duration_minutes)
                      VALUES (:student_id, :adviser_id, :event_id, :organization_id, :schedule_date, :val, 'adviser', :status, :duration_minutes)";

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
                return $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);
            } catch (PDOException $e) {
                error_log("Error inserting student attendance log: " . $e->getMessage());
                return false;
            }
        } else {
            $existing[$log_type] = $time_value;
            $existing['marked_by'] = 'adviser';
            if ($existing['is_absent'] && $existing['absent_session'] === 'BOTH') {
                $existing['is_absent'] = 0;
                $existing['absent_session'] = null;
            }

            $computed = $this->computeStatusAndDuration($existing);

            $query = "UPDATE " . $this->table_name . " 
                      SET {$log_type} = :val,
                          marked_by = 'adviser',
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
                return $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);
            } catch (PDOException $e) {
                error_log("Error updating student attendance log: " . $e->getMessage());
                return false;
            }
        }
    }

    public function editStudentSession($student_id, $adviser_id, $event_id, $organization_id, $schedule_date, $sessionData) {
        if (!$this->conn) return false;

        $existing = $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);

        $timeInAm = isset($sessionData['time_in_am']) && $sessionData['time_in_am'] !== '' ? date('H:i:s', strtotime($sessionData['time_in_am'])) : null;
        $timeOutAm = isset($sessionData['time_out_am']) && $sessionData['time_out_am'] !== '' ? date('H:i:s', strtotime($sessionData['time_out_am'])) : null;
        $breakOut = isset($sessionData['break_out']) && $sessionData['break_out'] !== '' ? date('H:i:s', strtotime($sessionData['break_out'])) : null;
        $breakIn = isset($sessionData['break_in']) && $sessionData['break_in'] !== '' ? date('H:i:s', strtotime($sessionData['break_in'])) : null;
        $timeInPm = isset($sessionData['time_in_pm']) && $sessionData['time_in_pm'] !== '' ? date('H:i:s', strtotime($sessionData['time_in_pm'])) : null;
        $timeOutPm = isset($sessionData['time_out_pm']) && $sessionData['time_out_pm'] !== '' ? date('H:i:s', strtotime($sessionData['time_out_pm'])) : null;

        $recordData = [
            'student_id' => $student_id,
            'adviser_id' => $adviser_id,
            'event_id' => $event_id,
            'organization_id' => $organization_id,
            'schedule_date' => $schedule_date,
            'time_in_am' => $timeInAm,
            'time_out_am' => $timeOutAm,
            'break_out' => $breakOut,
            'break_in' => $breakIn,
            'time_in_pm' => $timeInPm,
            'time_out_pm' => $timeOutPm,
            'is_absent' => !empty($sessionData['is_absent']) ? 1 : 0,
            'absent_session' => !empty($sessionData['absent_session']) ? $sessionData['absent_session'] : null,
            'is_excused' => !empty($sessionData['is_excused']) ? 1 : 0,
            'excuse_reason' => !empty($sessionData['excuse_reason']) ? $sessionData['excuse_reason'] : null,
            'excuse_session' => !empty($sessionData['excuse_session']) ? $sessionData['excuse_session'] : null,
            'excuse_status' => !empty($sessionData['excuse_status']) ? $sessionData['excuse_status'] : null,
            'marked_by' => 'adviser'
        ];

        $computed = $this->computeStatusAndDuration($recordData);
        $recordData['status'] = $computed['status'];
        $recordData['duration_minutes'] = $computed['duration_minutes'];

        if (!$existing) {
            $query = "INSERT INTO " . $this->table_name . " 
                      (student_id, adviser_id, event_id, organization_id, schedule_date, time_in_am, time_out_am, break_out, break_in, time_in_pm, time_out_pm, is_absent, absent_session, is_excused, excuse_reason, excuse_session, excuse_status, marked_by, status, duration_minutes)
                      VALUES (:student_id, :adviser_id, :event_id, :organization_id, :schedule_date, :time_in_am, :time_out_am, :break_out, :break_in, :time_in_pm, :time_out_pm, :is_absent, :absent_session, :is_excused, :excuse_reason, :excuse_session, :excuse_status, 'adviser', :status, :duration_minutes)";
        } else {
            $query = "UPDATE " . $this->table_name . " 
                      SET time_in_am = :time_in_am,
                          time_out_am = :time_out_am,
                          break_out = :break_out,
                          break_in = :break_in,
                          time_in_pm = :time_in_pm,
                          time_out_pm = :time_out_pm,
                          is_absent = :is_absent,
                          absent_session = :absent_session,
                          is_excused = :is_excused,
                          excuse_reason = :excuse_reason,
                          excuse_session = :excuse_session,
                          excuse_status = :excuse_status,
                          marked_by = 'adviser',
                          status = :status,
                          duration_minutes = :duration_minutes
                      WHERE id = :id";
        }

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':time_in_am', $recordData['time_in_am']);
            $stmt->bindParam(':time_out_am', $recordData['time_out_am']);
            $stmt->bindParam(':break_out', $recordData['break_out']);
            $stmt->bindParam(':break_in', $recordData['break_in']);
            $stmt->bindParam(':time_in_pm', $recordData['time_in_pm']);
            $stmt->bindParam(':time_out_pm', $recordData['time_out_pm']);
            $stmt->bindParam(':is_absent', $recordData['is_absent']);
            $stmt->bindParam(':absent_session', $recordData['absent_session']);
            $stmt->bindParam(':is_excused', $recordData['is_excused']);
            $stmt->bindParam(':excuse_reason', $recordData['excuse_reason']);
            $stmt->bindParam(':excuse_session', $recordData['excuse_session']);
            $stmt->bindParam(':excuse_status', $recordData['excuse_status']);
            $stmt->bindParam(':status', $recordData['status']);
            $stmt->bindParam(':duration_minutes', $recordData['duration_minutes']);

            if (!$existing) {
                $stmt->bindParam(':student_id', $student_id);
                $stmt->bindParam(':adviser_id', $adviser_id);
                $stmt->bindParam(':event_id', $event_id);
                $stmt->bindParam(':organization_id', $organization_id);
                $stmt->bindParam(':schedule_date', $schedule_date);
            } else {
                $stmt->bindParam(':id', $existing['id']);
            }

            $stmt->execute();
            return $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);
        } catch (PDOException $e) {
            error_log("Error editing student session: " . $e->getMessage());
            return false;
        }
    }

    public function handleExcuseApproval($student_id, $adviser_id, $event_id, $schedule_date, $action, $attendance_id = null) {
        if (!$this->conn) return false;

        $existing = null;
        if ($attendance_id) {
            $stmt = $this->conn->prepare("SELECT a.*, s.student_number, CONCAT(s.first_name, ' ', s.last_name) as student_name, s.program, s.year_level 
                                          FROM " . $this->table_name . " a 
                                          INNER JOIN students s ON a.student_id = s.id 
                                          WHERE a.id = :id LIMIT 1");
            $stmt->bindParam(':id', $attendance_id);
            $stmt->execute();
            $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$existing && $student_id && $event_id && $schedule_date) {
            $existing = $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);
        }

        if (!$existing) return false;

        if ($action === 'approve') {
            $existing['is_excused'] = 1;
            $existing['excuse_status'] = 'Approved';
            $existing['is_absent'] = 0;
            $existing['marked_by'] = 'adviser';
        } else {
            $existing['is_excused'] = 0;
            $existing['excuse_status'] = 'Rejected';
            $existing['marked_by'] = 'adviser';
        }

        $computed = $this->computeStatusAndDuration($existing);

        $query = "UPDATE " . $this->table_name . " 
                  SET is_excused = :is_excused,
                      excuse_status = :excuse_status,
                      marked_by = 'adviser',
                      status = :status,
                      duration_minutes = :duration_minutes
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':is_excused', $existing['is_excused']);
            $stmt->bindParam(':excuse_status', $existing['excuse_status']);
            $stmt->bindParam(':status', $computed['status']);
            $stmt->bindParam(':duration_minutes', $computed['duration_minutes']);
            $stmt->bindParam(':id', $existing['id']);
            $stmt->execute();
            return $this->getStudentAttendanceRecord($existing['student_id'], $existing['event_id'], $existing['schedule_date']);
        } catch (PDOException $e) {
            error_log("Error handling excuse approval: " . $e->getMessage());
            return false;
        }
    }

    public function markAbsent($student_id, $adviser_id, $event_id, $organization_id, $schedule_date, $session = 'BOTH') {
        if (!$this->conn) return false;

        $session = strtoupper($session);
        if (!in_array($session, ['AM', 'PM', 'BOTH'])) {
            $session = 'BOTH';
        }

        $existing = $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);

        if (!$existing) {
            $data = [
                'student_id' => $student_id,
                'adviser_id' => $adviser_id,
                'event_id' => $event_id,
                'organization_id' => $organization_id,
                'schedule_date' => $schedule_date,
                'is_absent' => 1,
                'absent_session' => $session,
                'is_excused' => 0,
                'excuse_reason' => null,
                'excuse_status' => null,
                'marked_by' => 'adviser'
            ];
            $computed = $this->computeStatusAndDuration($data);

            $query = "INSERT INTO " . $this->table_name . " 
                      (student_id, adviser_id, event_id, organization_id, schedule_date, is_absent, absent_session, marked_by, status, duration_minutes)
                      VALUES (:student_id, :adviser_id, :event_id, :organization_id, :schedule_date, 1, :absent_session, 'adviser', :status, 0)";

            try {
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':student_id', $student_id);
                $stmt->bindParam(':adviser_id', $adviser_id);
                $stmt->bindParam(':event_id', $event_id);
                $stmt->bindParam(':organization_id', $organization_id);
                $stmt->bindParam(':schedule_date', $schedule_date);
                $stmt->bindParam(':absent_session', $session);
                $stmt->bindParam(':status', $computed['status']);
                $stmt->execute();
                return $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);
            } catch (PDOException $e) {
                error_log("Error marking student absent: " . $e->getMessage());
                return false;
            }
        } else {
            $existing['is_absent'] = 1;
            $existing['absent_session'] = $session;
            $existing['is_excused'] = 0;
            $existing['excuse_reason'] = null;
            $existing['excuse_status'] = null;
            $existing['marked_by'] = 'adviser';

            if ($session === 'BOTH') {
                $existing['time_in_am'] = null;
                $existing['time_out_am'] = null;
                $existing['break_out'] = null;
                $existing['break_in'] = null;
                $existing['time_in_pm'] = null;
                $existing['time_out_pm'] = null;
            } elseif ($session === 'AM') {
                $existing['time_in_am'] = null;
                $existing['time_out_am'] = null;
            } elseif ($session === 'PM') {
                $existing['time_in_pm'] = null;
                $existing['time_out_pm'] = null;
            }

            $computed = $this->computeStatusAndDuration($existing);

            $query = "UPDATE " . $this->table_name . " 
                      SET is_absent = 1,
                          absent_session = :absent_session,
                          is_excused = 0,
                          excuse_reason = NULL,
                          excuse_session = NULL,
                          excuse_status = NULL,
                          marked_by = 'adviser',
                          time_in_am = :time_in_am,
                          time_out_am = :time_out_am,
                          time_in_pm = :time_in_pm,
                          time_out_pm = :time_out_pm,
                          status = :status,
                          duration_minutes = :duration_minutes
                      WHERE id = :id";

            try {
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':absent_session', $session);
                $stmt->bindParam(':time_in_am', $existing['time_in_am']);
                $stmt->bindParam(':time_out_am', $existing['time_out_am']);
                $stmt->bindParam(':time_in_pm', $existing['time_in_pm']);
                $stmt->bindParam(':time_out_pm', $existing['time_out_pm']);
                $stmt->bindParam(':status', $computed['status']);
                $stmt->bindParam(':duration_minutes', $computed['duration_minutes']);
                $stmt->bindParam(':id', $existing['id']);
                $stmt->execute();
                return $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);
            } catch (PDOException $e) {
                error_log("Error updating student absent: " . $e->getMessage());
                return false;
            }
        }
    }

    public function markExcused($student_id, $adviser_id, $event_id, $organization_id, $schedule_date, $reason, $session = 'BOTH') {
        if (!$this->conn) return false;

        $session = strtoupper($session ?: 'BOTH');
        if (!in_array($session, ['AM', 'PM', 'BOTH'])) {
            $session = 'BOTH';
        }

        $existing = $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);

        if (!$existing) {
            $data = [
                'student_id' => $student_id,
                'adviser_id' => $adviser_id,
                'event_id' => $event_id,
                'organization_id' => $organization_id,
                'schedule_date' => $schedule_date,
                'is_excused' => 1,
                'excuse_reason' => $reason,
                'excuse_session' => $session,
                'excuse_status' => 'Approved',
                'marked_by' => 'adviser',
                'is_absent' => 0,
                'absent_session' => null
            ];
            $computed = $this->computeStatusAndDuration($data);

            $query = "INSERT INTO " . $this->table_name . " 
                      (student_id, adviser_id, event_id, organization_id, schedule_date, is_excused, excuse_reason, excuse_session, excuse_status, marked_by, is_absent, status, duration_minutes)
                      VALUES (:student_id, :adviser_id, :event_id, :organization_id, :schedule_date, 1, :reason, :session, 'Approved', 'adviser', 0, :status, 0)";

            try {
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':student_id', $student_id);
                $stmt->bindParam(':adviser_id', $adviser_id);
                $stmt->bindParam(':event_id', $event_id);
                $stmt->bindParam(':organization_id', $organization_id);
                $stmt->bindParam(':schedule_date', $schedule_date);
                $stmt->bindParam(':reason', $reason);
                $stmt->bindParam(':session', $session);
                $stmt->bindParam(':status', $computed['status']);
                $stmt->execute();
                return $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);
            } catch (PDOException $e) {
                error_log("Error marking student excused: " . $e->getMessage());
                return false;
            }
        } else {
            $existing['is_excused'] = 1;
            $existing['excuse_reason'] = $reason;
            $existing['excuse_session'] = $session;
            $existing['excuse_status'] = 'Approved';
            $existing['marked_by'] = 'adviser';
            $existing['is_absent'] = 0;
            $existing['absent_session'] = null;

            $computed = $this->computeStatusAndDuration($existing);

            $query = "UPDATE " . $this->table_name . " 
                      SET is_excused = 1,
                          excuse_reason = :reason,
                          excuse_session = :session,
                          excuse_status = 'Approved',
                          marked_by = 'adviser',
                          is_absent = 0,
                          absent_session = NULL,
                          status = :status,
                          duration_minutes = :duration_minutes
                      WHERE id = :id";

            try {
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':reason', $reason);
                $stmt->bindParam(':session', $session);
                $stmt->bindParam(':status', $computed['status']);
                $stmt->bindParam(':duration_minutes', $computed['duration_minutes']);
                $stmt->bindParam(':id', $existing['id']);
                $stmt->execute();
                return $this->getStudentAttendanceRecord($student_id, $event_id, $schedule_date);
            } catch (PDOException $e) {
                error_log("Error updating student excused: " . $e->getMessage());
                return false;
            }
        }
    }

    public function resetStudentDayAttendance($student_id, $event_id, $schedule_date) {
        if (!$this->conn) return false;

        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE student_id = :student_id AND event_id = :event_id AND schedule_date = :schedule_date";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':student_id', $student_id);
            $stmt->bindParam(':event_id', $event_id);
            $stmt->bindParam(':schedule_date', $schedule_date);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Error resetting student attendance: " . $e->getMessage());
            return false;
        }
    }
}
