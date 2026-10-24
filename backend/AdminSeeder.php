<?php

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/migrations/Migrator.php';

class AdminSeeder {
    private $conn;
    private $database = "student_organization_tracker";

    public function __construct() {
    }

    private function getConnection() {
        if (!$this->conn) {
            $db = new Database();
            $this->conn = $db->getConnection();
        }
        return $this->conn;
    }

    private function seedAdmins() {
        $conn = $this->getConnection();
        
        $admins = [
            [
                'profile_photo' => 'admin1.jpg',
                'name' => 'John Admin',
                'username' => 'johnadmin',
                'email' => 'johnadmin@example.com',
                'password' => 'admin123',
                'role' => 'super_admin'
            ],
            [
                'profile_photo' => 'admin2.jpg',
                'name' => 'Jane Administrator',
                'username' => 'janeadmin',
                'email' => 'janeadmin@example.com',
                'password' => 'admin123',
                'role' => 'admin'
            ],
            [
                'profile_photo' => 'admin3.jpg',
                'name' => 'Bob Manager',
                'username' => 'bobmanager',
                'email' => 'bobmanager@example.com',
                'password' => 'admin123',
                'role' => 'moderator'
            ]
        ];

        $query = "INSERT INTO admins (profile_photo, name, username, email, password, role) 
                  VALUES (:profile_photo, :name, :username, :email, :password, :role)";

        try {
            $stmt = $conn->prepare($query);
            
            foreach ($admins as $admin) {
                $hashedPassword = password_hash($admin['password'], PASSWORD_DEFAULT);
                
                $stmt->bindParam(':profile_photo', $admin['profile_photo']);
                $stmt->bindParam(':name', $admin['name']);
                $stmt->bindParam(':username', $admin['username']);
                $stmt->bindParam(':email', $admin['email']);
                $stmt->bindParam(':password', $hashedPassword);
                $stmt->bindParam(':role', $admin['role']);
                
                $stmt->execute();
                echo "Admin created: " . $admin['username'] . " (Password: " . $admin['password'] . ")\n";
            }
            
            echo "\nAdmin seeding completed successfully!\n";
        } catch(PDOException $e) {
            echo "Error seeding admins: " . $e->getMessage() . "\n";
        }
    }

    public function run() {
        echo "Starting admin seeder...\n\n";
        
        echo "Running migrations...\n";
        $migrator = new Migrator(__DIR__ . '/migrations');
        $migrator->migrate();
        
        $this->seedAdmins();
    }
}

if (php_sapi_name() === 'cli') {
    $seeder = new AdminSeeder();
    $seeder->run();
} else {
    echo "This script can only be run from the command line.\n";
}
