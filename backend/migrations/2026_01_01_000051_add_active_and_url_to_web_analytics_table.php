<?php

require_once __DIR__ . '/Migration.php';

class Add_active_and_url_to_web_analytics_table extends Migration {
    public function up() {
        $this->addColumn('web_analytics', 'active TINYINT(1) DEFAULT 0');
        $this->addColumn('web_analytics', 'url VARCHAR(500) NULL');

        try {
            $this->conn->exec("CREATE INDEX idx_active ON web_analytics(active)");
            echo "Added index on active column.\n";
        } catch(PDOException $e) {
            echo "Note: Index may already exist or error creating index: " . $e->getMessage() . "\n";
        }
        
        echo "Added active and url columns to web_analytics table successfully.\n";
    }

    public function down() {

        try {
            $this->conn->exec("DROP INDEX idx_active ON web_analytics");
        } catch(PDOException $e) {
            echo "Note: Index may not exist or error dropping index: " . $e->getMessage() . "\n";
        }
        
        $this->dropColumn('web_analytics', 'url');
        $this->dropColumn('web_analytics', 'active');
        
        echo "Removed active and url columns from web_analytics table successfully.\n";
    }
}
