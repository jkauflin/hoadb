<?php
require_once 'vendor/autoload.php'; 
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./paypal-ipn.log");
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Include database connection credentials from an external includes location
//require_once getSecretsFilename2();
require_once getSecretsFilename();

            $parcelId = "";
            $ownerId = 0;
            $fy = 2021;
            $txn_id = "";
            $payment_date = "2020-09-18 08:00:00";
            $payer_email = "";
            $payment_amt = 129.0;
            $payment_fee = 4.04;

        $conn = getConn($host, $dbadmin, $password, $dbname);
		updAssessmentPaid(
            $conn,
            $parcelId,
            $ownerId,
            $fy,
            $txn_id,
            $payment_date,
            $payer_email,
            $payment_amt,
            $payment_fee,
            $fromEmailAddress);

?>
