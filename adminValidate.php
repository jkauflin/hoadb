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
 * 2020-12-21 JJK   Re-factored to use jjklogin package
 *============================================================================*/
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");
require_once 'vendor/autoload.php'; 

// Figure out how many levels up to get to the "public_html" root folder
$webRootDirOffset = substr_count(strstr(dirname(__FILE__),"public_html"),DIRECTORY_SEPARATOR) + 1;
// Get settings and credentials from a file in a directory outside of public_html
// (assume a settings file in the "external_includes" folder one level up from "public_html")
$extIncludePath = dirname(__FILE__, $webRootDirOffset+1).DIRECTORY_SEPARATOR.'external_includes'.DIRECTORY_SEPARATOR;
require_once $extIncludePath.'hoadbSecrets.php';
require_once $extIncludePath.'jjkloginSettings.php';
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';

use \jkauflin\jjklogin\LoginAuth;

$adminRec = new AdminRec();
try {
    $userRec = LoginAuth::getUserRec($cookieNameJJKLogin,$cookiePathJJKLogin,$serverKeyJJKLogin);
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 1) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

	$currTimestampStr = date("Y-m-d H:i:s");
	//JJK test, date = 2015-04-22 19:45:09

	$adminRec->result = "Not Valid";
	$adminRec->message = "";
    $adminRec->userName = $userRec->userName;
    $adminRec->userLevel = $userRec->userLevel;
    $adminLevel = $userRec->userLevel;

	$action = getParamVal("action");
	$fy = getParamVal("fy");
	$duesAmt = strToUSD(getParamVal("duesAmt"));

	if ($adminLevel < 2) {
		$adminRec->message = "You do not have permissions for this function";
		$adminRec->result = "Not Valid";
    } else {
        $adminRec->result = "Valid";
    	$adminRec->message = "Continue with " . $action . "?";
        
    	if ($action == "AddAssessments") {
            if (empty($duesAmt) || empty($fy)) {
    			$adminRec->message = "You must enter Dues Amount and Fiscal Year.";
    			$adminRec->result = "Not Valid";
            } else {
    		    $adminRec->message = "Are you sure you want to add assessment for Fiscal Year " . $fy . ' with Dues Amount of $' . $duesAmt .'?';
            }
    	} else if ($action == "MarkMailed") {
    			$adminRec->message = "Continue to record Communication to mark paper notices as mailed?";
    	} else if ($action == "DuesEmailsTest") {
    			$adminRec->message = "Continue with TEST email of Dues Notices to show the list and send the first one to the test address?";
    	} else if ($action == "DuesEmails") {
    			$adminRec->message = "Continue with email of Dues Notices?  This will create a Communication record for each email to send";
    	}
    }

	echo json_encode($adminRec);

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
	$adminRec->message = $e->getMessage();
	$adminRec->result = "Not Valid";
    echo json_encode($adminRec);
    /*
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
    */
}

?>
