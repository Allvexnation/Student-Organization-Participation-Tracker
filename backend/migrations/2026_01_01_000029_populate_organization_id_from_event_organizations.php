<?php

require_once __DIR__ . '/Migration.php';

class Populate_organization_id_from_event_organizations extends Migration {
    public function up() {
        $sql = "UPDATE events e 
                SET e.organization_id = (
                    SELECT eo.organization_id 
                    FROM event_organizations eo 
                    WHERE eo.event_id = e.id 
                    LIMIT 1
                )
                WHERE e.organization_id IS NULL";
        
        try {
            $this->conn->exec($sql);
            echo "Organization_id populated from event_organizations table successfully.\n";
            return true;
        } catch(PDOException $e) {
            echo "Error populating organization_id: " . $e->getMessage() . "\n";
            return false;
        }
    }

    public function down() {
        $sql = "UPDATE events SET organization_id = NULL";
        
        try {
            $this->conn->exec($sql);
            echo "Organization_id reset to NULL successfully.\n";
            return true;
        } catch(PDOException $e) {
            echo "Error resetting organization_id: " . $e->getMessage() . "\n";
            return false;
        }
    }
}
