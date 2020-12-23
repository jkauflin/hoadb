<?php
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./paypal-ipn.log");
require_once 'vendor/autoload.php'; 

// Figure out how many levels up to get to the "public_html" root folder
$webRootDirOffset = substr_count(strstr(dirname(__FILE__),"public_html"),DIRECTORY_SEPARATOR) + 1;
// Get settings and credentials from a file in a directory outside of public_html
// (assume a settings file in the "external_includes" folder one level up from "public_html")
$extIncludePath = dirname(__FILE__, $webRootDirOffset+1).DIRECTORY_SEPARATOR.'external_includes'.DIRECTORY_SEPARATOR;
require_once $extIncludePath.'hoadbSecrets.php';
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';

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
