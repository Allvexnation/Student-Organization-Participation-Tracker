<?php

require_once __DIR__ . '/Migration.php';

class Add_otp_fields_to_advisers_table extends Migration {
    public function up() {
        $this->addColumn('advisers', 'otp_code VARCHAR(6) DEFAULT NULL');
        $this->addColumn('advisers', 'otp_expiry TIMESTAMP NULL DEFAULT NULL');
        
        echo "OTP fields added to advisers table successfully.\n";
    }

    public function down() {
        $this->dropColumn('advisers', 'otp_code');
        $this->dropColumn('advisers', 'otp_expiry');
        
        echo "OTP fields dropped from advisers table successfully.\n";
    }
}
