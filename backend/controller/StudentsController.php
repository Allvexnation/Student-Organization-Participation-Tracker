<?php

require_once __DIR__ . '/../model/Students/StudentsModel.php';
require_once __DIR__ . '/../model/StudentOtpModel.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../template/StudentEmail.php';
require_once __DIR__ . '/../cache/CacheService.php';

class StudentsController {
    private $studentsModel;
    private $studentOtpModel;

    public function __construct() {
        $this->studentsModel = new StudentsModel();
        $this->studentOtpModel = new StudentOtpModel();
    }

    public function getAll() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $students = CacheService::remember('students_all', 300, function() {
            return $this->studentsModel->readAll();
        });

        if ($students !== false) {
            http_response_code(200);
            echo json_encode(['students' => $students]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch students']);
        }
    }

    public function getOne($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $student = $this->studentsModel->readOne($id);

        if ($student) {
            http_response_code(200);
            echo json_encode(['student' => $student]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Student not found']);
        }
    }

    public function create() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        if (!isset($data['student_number']) || !isset($data['first_name']) || !isset($data['last_name']) || !isset($data['program']) || !isset($data['year_level']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $username = $this->studentsModel->generateUniqueUsername($data['first_name'], $data['last_name']);
        $password = $this->studentsModel->generateSecurePassword();

        $data['username'] = $username;
        $data['password'] = $password;

        $result = $this->studentsModel->create($data);
        if ($result) {
            CacheService::forget('students_all');
        }

        if ($result) {
            $studentEmail = new StudentEmail();
            $emailSent = $studentEmail->sendCredentials(
                $data['email'],
                $data['first_name'],
                $data['last_name'],
                $username,
                $password
            );

            $message = 'Student created successfully';
            if (!$emailSent) {
                $message .= ' (email notification failed)';
            }

            http_response_code(201);
            echo json_encode(['message' => $message, 'id' => $result, 'username' => $username]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create student']);
        }
    }

    public function update($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        if (!isset($data['student_number']) || !isset($data['first_name']) || !isset($data['last_name']) || !isset($data['program']) || !isset($data['year_level']) || !isset($data['username']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->studentsModel->update($id, $data);
        if ($result) {
            CacheService::forget('students_all');
            CacheService::forget('student_' . $id);
        }

        if ($result) {
            $student = $this->studentsModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Student updated successfully',
                'student' => $student
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update student']);
        }
    }

    public function delete($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $reason = isset($data['reason']) ? $data['reason'] : 'No reason provided';

        $student = $this->studentsModel->readOne($id);
        $adminName = JWT::getPayload($token)['name'] ?? 'Admin';

        $result = $this->studentsModel->delete($id);
        if ($result) {
            CacheService::forget('students_all');
            CacheService::forget('student_' . $id);
        }

        if ($result) {
            if ($student && $student['email']) {
                $studentEmail = new StudentEmail();
                $studentEmail->sendDeletionNotice($student['email'], $student['first_name'], $student['last_name'], $adminName, $reason);
            }

            http_response_code(200);
            echo json_encode(['message' => 'Student deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete student']);
        }
    }

    public function forgotPassword() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['username_or_email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Username or email is required']);
            return;
        }

        $usernameOrEmail = $data['username_or_email'];
        $student = $this->studentsModel->findByUsernameOrEmail($usernameOrEmail);

        if (!$student) {
            http_response_code(404);
            echo json_encode(['message' => 'Student not found']);
            return;
        }

        $this->studentOtpModel->deleteByStudentId($student['id']);
        
        $otpCode = sprintf('%06d', mt_rand(0, 999999));
        $otpCreated = $this->studentOtpModel->create($student['id'], $otpCode, 10);

        if ($otpCreated) {
            $studentEmail = new StudentEmail();
            $emailSent = $studentEmail->sendOtp($student['email'], $student['first_name'], $otpCode);

            if ($emailSent) {
                http_response_code(200);
                echo json_encode([
                    'message' => 'OTP sent successfully',
                    'student_id' => $student['id']
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Failed to send OTP email']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to generate OTP']);
        }
    }

    public function verifyOtp() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['student_id']) || !isset($data['otp_code'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Student ID and OTP code are required']);
            return;
        }

        $studentId = $data['student_id'];
        $otpCode = $data['otp_code'];

        $result = $this->studentOtpModel->verifyOtp($studentId, $otpCode, 3);

        if ($result['valid']) {
            http_response_code(200);
            echo json_encode(['message' => 'OTP verified successfully']);
        } else {
            http_response_code(400);
            echo json_encode(['message' => $result['message'], 'attempts' => $result['attempts'] ?? null]);
        }
    }

    public function resetPassword() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['student_id']) || !isset($data['new_password'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Student ID and new password are required']);
            return;
        }

        if (strlen($data['new_password']) < 6) {
            http_response_code(400);
            echo json_encode(['message' => 'Password must be at least 6 characters']);
            return;
        }

        $studentId = $data['student_id'];
        $newPassword = $data['new_password'];

        $result = $this->studentsModel->resetPassword($studentId, $newPassword);

        if ($result) {
            $this->studentOtpModel->deleteByStudentId($studentId);
            http_response_code(200);
            echo json_encode(['message' => 'Password reset successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to reset password']);
        }
    }
}
