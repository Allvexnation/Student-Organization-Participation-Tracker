<?php

require_once __DIR__ . '/Migration.php';

class Drop_otp_columns_from_advisers_table extends Migration {
    public function up() {
        $this->dropColumn('advisers', 'otp_code');
        $this->dropColumn('advisers', 'otp_expiry');
        
        echo "OTP columns dropped from advisers table successfully.\n";
    }

    public function down() {
        $this->addColumn('advisers', 'otp_code VARCHAR(6) DEFAULT NULL');
        $this->addColumn('advisers', 'otp_expiry TIMESTAMP NULL DEFAULT NULL');
        
        echo "OTP columns added back to advisers table successfully.\n";
    }
}
