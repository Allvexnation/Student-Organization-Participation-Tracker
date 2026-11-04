<?php

require_once __DIR__ . '/../../config/env.php';
require_once __DIR__ . '/../../config/db.php';

function changeAdminCredentials($backendDir) {
    echo "\033c";
    loadEnv($backendDir . '/.env');
    
    $envFile = $backendDir . '/.env';

    $currentName = getenv('CRT_ADMIN_NAME') ?: 'Not set';
    $currentUsername = getenv('CRT_ADMIN_USERNAME') ?: 'Not set';
    $currentEmail = getenv('CRT_ADMIN_EMAIL') ?: 'Not set';
    $currentPassword = getenv('CRT_ADMIN_PASSWORD') ?: 'Not set';
    $currentRole = getenv('CRT_ADMIN_ROLE') ?: 'Not set';

    if ($currentEmail === 'Not set' || empty($currentEmail)) {
        echo "\033[1;31mError: CRT_ADMIN_EMAIL is not set in .env file.\033[0m\n";
        return;
    }
    
    try {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        
        $stmt = $conn->prepare("SELECT id, email, name, username FROM admins WHERE email = :email");
        $stmt->bindParam(':email', $currentEmail);
        $stmt->execute();
        $admin = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$admin) {
            echo "\033[1;31mError: No admin found in database with email '{$currentEmail}'.\033[0m\n";
            echo "\033[1;33mPlease ensure the email in .env matches an existing admin record.\033[0m\n";
            return;
        }
        
        echo "\033[1;32mAdmin found in database:\033[0m\n";
        echo "  ID: \033[0;36m{$admin['id']}\033[0m\n";
        echo "  Email: \033[0;36m{$admin['email']}\033[0m\n";
        echo "\n";
        
    } catch (PDOException $e) {
        echo "\033[1;31mDatabase error: " . $e->getMessage() . "\033[0m\n";
        return;
    }
    
    echo "\033[1;34m=== Change Admin Credentials ===\033[0m\n\n";
    echo "\033[1;33mCurrent Credentials:\033[0m\n";
    echo "  1. Name: \033[0;36m{$currentName}\033[0m\n";
    echo "  2. Username: \033[0;36m{$currentUsername}\033[0m\n";
    echo "  3. Email: \033[0;36m{$currentEmail}\033[0m\n";
    echo "  4. Password: \033[0;36m" . str_repeat('*', strlen($currentPassword)) . "\033[0m\n";
    echo "  5. Role: \033[0;36m{$currentRole}\033[0m\n";
    echo "\n";
    
    echo "\033[1;33mSelect fields to edit (comma-separated, e.g., 1,3,5):\033[0m ";
    $fieldsInput = trim(fgets(STDIN));
    $fieldsToEdit = array_map('trim', explode(',', $fieldsInput));
    
    $updates = [];
    
    foreach ($fieldsToEdit as $field) {
        switch ($field) {
            case '1':
                echo "\033[1;33mEnter new Name:\033[0m ";
                $newName = trim(fgets(STDIN));
                if ($newName) {
                    $updates['CRT_ADMIN_NAME'] = $newName;
                }
                break;
            case '2':
                echo "\033[1;33mEnter new Username:\033[0m ";
                $newUsername = trim(fgets(STDIN));
                if ($newUsername) {
                    $updates['CRT_ADMIN_USERNAME'] = $newUsername;
                }
                break;
            case '3':
                echo "\033[1;33mEnter new Email:\033[0m ";
                $newEmail = trim(fgets(STDIN));
                if ($newEmail) {
                    $updates['CRT_ADMIN_EMAIL'] = $newEmail;
                }
                break;
            case '4':
                echo "\033[1;33mEnter new Password:\033[0m ";
                $newPassword = trim(fgets(STDIN));
                if ($newPassword) {
                    $updates['CRT_ADMIN_PASSWORD'] = $newPassword;
                }
                break;
            case '5':
                echo "\033[1;33mEnter new Role:\033[0m ";
                $newRole = trim(fgets(STDIN));
                if ($newRole) {
                    $updates['CRT_ADMIN_ROLE'] = $newRole;
                }
                break;
        }
    }
    
    if (empty($updates)) {
        echo "\033[1;31mNo changes to make.\033[0m\n";
        return;
    }
    
    echo "\n\033[1;33mSummary of Changes:\033[0m\n";
    foreach ($updates as $key => $value) {
        $displayValue = $key === 'CRT_ADMIN_PASSWORD' ? str_repeat('*', strlen($value)) : $value;
        echo "  \033[0;32m{$key}:\033[0m {$displayValue}\n";
    }
    
    echo "\n\033[1;33mConfirm changes? (y/n):\033[0m ";
    $confirm = trim(fgets(STDIN));
    
    if (strtolower($confirm) !== 'y') {
        echo "\033[1;31mChanges cancelled.\033[0m\n";
        return;
    }

    try {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        
        $updateFields = [];
        $params = [];
        
        if (isset($updates['CRT_ADMIN_NAME'])) {
            $updateFields[] = "name = :name";
            $params[':name'] = $updates['CRT_ADMIN_NAME'];
        }
        if (isset($updates['CRT_ADMIN_USERNAME'])) {
            $updateFields[] = "username = :username";
            $params[':username'] = $updates['CRT_ADMIN_USERNAME'];
        }
        if (isset($updates['CRT_ADMIN_EMAIL'])) {
            $updateFields[] = "email = :email";
            $params[':email'] = $updates['CRT_ADMIN_EMAIL'];
        }
        if (isset($updates['CRT_ADMIN_PASSWORD'])) {
            $hashedPassword = password_hash($updates['CRT_ADMIN_PASSWORD'], PASSWORD_DEFAULT);
            $updateFields[] = "password = :password";
            $params[':password'] = $hashedPassword;
        }
        if (isset($updates['CRT_ADMIN_ROLE'])) {
            $updateFields[] = "role = :role";
            $params[':role'] = $updates['CRT_ADMIN_ROLE'];
        }
        
        if (!empty($updateFields)) {
            $params[':id'] = $admin['id'];
            $sql = "UPDATE admins SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            
            echo "\033[1;32mDatabase record updated successfully!\033[0m\n";
        }
        
    } catch (PDOException $e) {
        echo "\033[1;31mError: Failed to update database: " . $e->getMessage() . "\033[0m\n";
        return;
    }
    
    echo "\033[1;32mAdmin credentials updated successfully in database!\033[0m\n";
}
