<?php

require_once __DIR__ . '/../../model/Students/StudentsModel.php';
require_once __DIR__ . '/../../model/StudentOtpModel.php';
require_once __DIR__ . '/../../model/SessionModel.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../template/StudentEmail.php';

class StudentController {
    private $studentsModel;
    private $studentOtpModel;
    private $sessionModel;

    public function __construct() {
        $this->studentsModel = new StudentsModel();
        $this->studentOtpModel = new StudentOtpModel();
        $this->sessionModel = new SessionModel();
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

        $students = $this->studentsModel->readAll();

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

        if (!isset($data['first_name']) || !isset($data['last_name']) || !isset($data['email'])) {
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
            http_response_code(201);
            echo json_encode(['message' => 'Student created successfully', 'id' => $result, 'username' => $username]);
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

        if (!isset($data['first_name']) || !isset($data['last_name']) || !isset($data['username']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->studentsModel->update($id, $data);

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

        $result = $this->studentsModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Student deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete student']);
        }
    }

    public function login() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['username_or_email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Username/email and password are required']);
            return;
        }

        $usernameOrEmail = $data['username_or_email'];
        $password = $data['password'];

        $student = $this->studentsModel->verifyLogin($usernameOrEmail, $password);

        if ($student) {
            unset($student['password']);
            
            if (isset($student['profile_photo']) && !empty($student['profile_photo'])) {
                $student['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($student['profile_photo']);
            }
            
            $tokenPayload = [
                'user_id' => $student['id'],
                'email' => $student['email'],
                'role' => 'student'
            ];
            $token = JWT::encode($tokenPayload);
            
            // Store token in database
            $expiresAt = date('Y-m-d H:i:s', time() + (24 * 60 * 60)); // 24 hours from now
            $sessionData = [
                'user_id' => $student['id'],
                'user_type' => 'student',
                'token' => $token,
                'expires_at' => $expiresAt,
                'is_active' => 1
            ];
            
            $this->sessionModel->create($sessionData);
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Login successful',
                'token' => $token,
                'student' => $student
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid credentials']);
        }
    }

    public function getProfile() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $studentId = JWT::getUserId($token);

        $student = $this->studentsModel->readOne($studentId);

        if ($student) {
            unset($student['password']);
            
            if (isset($student['profile_photo']) && !empty($student['profile_photo'])) {
                $student['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($student['profile_photo']);
            }
            
            http_response_code(200);
            echo json_encode(['student' => $student]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Student not found']);
        }
    }

    public function updateProfile() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $studentId = JWT::getUserId($token);

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        // Get existing student to preserve profile photo if not being updated
        $existingStudent = $this->studentsModel->readOne($studentId);
        
        $profilePhoto = null;
        if (isset($data['profile_photo']) && !empty($data['profile_photo'])) {
            if (strpos($data['profile_photo'], 'data:image') === 0) {
                $parts = explode(',', $data['profile_photo']);
                if (isset($parts[1])) {
                    $profilePhoto = base64_decode($parts[1]);
                }
            } else {
                $profilePhoto = base64_decode($data['profile_photo']);
            }
        } elseif ($existingStudent && isset($existingStudent['profile_photo'])) {
            $profilePhoto = $existingStudent['profile_photo'];
        }

        $updateData = [
            'profile_photo' => $profilePhoto,
            'student_number' => isset($data['student_number']) ? $data['student_number'] : '',
            'first_name' => isset($data['first_name']) ? $data['first_name'] : '',
            'last_name' => isset($data['last_name']) ? $data['last_name'] : '',
            'program' => isset($data['program']) ? $data['program'] : '',
            'year_level' => isset($data['year_level']) ? $data['year_level'] : '',
            'username' => isset($data['username']) ? $data['username'] : '',
            'email' => isset($data['email']) ? $data['email'] : ''
        ];

        if (isset($data['password']) && !empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        $result = $this->studentsModel->update($studentId, $updateData);

        if ($result) {
            $student = $this->studentsModel->readOne($studentId);
            unset($student['password']);
            
            if (isset($student['profile_photo']) && !empty($student['profile_photo'])) {
                $student['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($student['profile_photo']);
            }
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Profile updated successfully',
                'student' => $student
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update profile']);
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

    public function logout() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->sessionModel->deleteByToken($token);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Logout successful']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to logout']);
        }
    }

    public function verify() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        http_response_code(200);
        echo json_encode(['message' => 'Token is valid']);
    }
}
