<?php

require_once __DIR__ . '/Migration.php';

class Create_support_contact_email_history_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'contact_id INT NOT NULL',
            'sent_to VARCHAR(255) NOT NULL',
            'subject VARCHAR(255) NOT NULL',
            'message TEXT NOT NULL',
            'sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];
        
        $this->createTable('support_contact_email_history', $columns);

        $this->addForeignKey('support_contact_email_history', 'contact_id', 'support_contacts', 'id', 'CASCADE', 'CASCADE');
        
        echo "Support contact email history table created successfully.\n";
    }

    public function down() {
        $this->dropTable('support_contact_email_history');
        
        echo "Support contact email history table dropped successfully.\n";
    }
}
