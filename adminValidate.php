<?php
/*==============================================================================
 * (C) Copyright 2016,2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Functions to validate Admin operations (i.e. check permissions
 * 				parameters, timing, etc.)
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-04-05 JJK 	Added check for AddAssessments 
 * 2020-08-01 JJK   Re-factored to use jjklogin for authentication
 *============================================================================*/
require_once 'vendor/autoload.php'; 

// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Login Authentication class
require_once 'php_secure/jjklogin.php';
use \jkauflin\jjklogin\LoginAuth;
// Include database connection credentials from an external includes location
require_once getSecretsFilename();
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");

try {
    $userRec = LoginAuth::getUserRec($cookieName,$cookiePath,$serverKey);
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 1) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

	$currTimestampStr = date("Y-m-d H:i:s");
	//JJK test, date = 2015-04-22 19:45:09

	$adminRec = new AdminRec();
	$adminRec->result = "Not Valid";
	$adminRec->message = "";
    $adminRec->userName = $userRec->userName;
    $adminRec->userLevel = $userRec->userLevel;

	$action = getParamVal("action");
	$fy = getParamVal("fy");
	$duesAmt = strToUSD(getParamVal("duesAmt"));

	if ($action == "AddAssessments") {
		if ($adminLevel < 2) {
			$adminRec->message = "You do not have permissions to Add Assessments.";
			$adminRec->result = "Not Valid";
		} else {
			$adminRec->message = "Are you sure you want to add assessment for Fiscal Year " . $fy . ' with Dues Amount of $' . $duesAmt .'?';
			$adminRec->result = "Valid";
		}
	} else if ($action == "DuesNotices") {
		if ($adminLevel < 2) {
			$adminRec->message = "You do not have permissions to generate Dues Notices.";
			$adminRec->result = "Not Valid";
		} else {
			$adminRec->message = "Continue with creation of Yearly Dues Notices?";
			$adminRec->result = "Valid";
		}	
	} else if ($action == "DuesRank") {
			$adminRec->message = "Continue with Unpaid Dues Ranking?";
			$adminRec->result = "Valid";
	} else if ($action == "DuesEmails") {
		if ($adminLevel < 2) {
			$adminRec->message = "You do not have permissions to email Dues Notices.";
			$adminRec->result = "Not Valid";
		} else {
			$adminRec->message = "Continue with email of Yearly Dues Notices?";
			$adminRec->result = "Valid";
		}
	} else if ($action == "AdminFix") {
		if ($adminLevel < 2) {
			$adminRec->message = "You do not have permissions to run this command.";
			$adminRec->result = "Not Valid";
		} else {
			$adminRec->message = "Continue with admin fix?";
			$adminRec->result = "Valid";
		}
	} else if ($action == "MarkMailed") {
		if ($adminLevel < 2) {
			$adminRec->message = "You do not have permissions to run this command.";
			$adminRec->result = "Not Valid";
		} else {
			$adminRec->message = "Continue to record Communication to mark paper notices as mailed?";
			$adminRec->result = "Valid";
		}
	} else if ($action == "DuesEmailsTest") {
			$adminRec->message = "Continue with TEST email of Dues Notices to show the list and send the first one to the test address?";
			$adminRec->result = "Valid";
	} else if ($action == "DuesEmails") {
		if ($adminLevel < 2) {
			$adminRec->message = "You do not have permissions to email Dues Notices.";
			$adminRec->result = "Not Valid";
		} else {
			$adminRec->message = "Continue with email of Dues Notices?";
			$adminRec->result = "Valid";
		}
	}

	echo json_encode($adminRec);

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
    exit;
}

?>
