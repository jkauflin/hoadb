<?php
/*==============================================================================
 * (C) Copyright 2015,2018,2020 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:  Update hoa_sales table flags for processed and welcome sent
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-10-02 JJK 	Initial version to update Sales
 * 2018-11-04 JJK	Re-factored to use POST and return JSON data of
 *                  re-queried record
 * 2020-08-01 JJK   Re-factored to use jjklogin for authentication
 * 2020-12-21 JJK   Re-factored to use jjklogin package
 * 2022-09-04 JJK   Removed echo statement with invalid variable name
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

try {
    $userRec = LoginAuth::getUserRec($cookieNameJJKLogin,$cookiePathJJKLogin,$serverKeyJJKLogin);
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 2) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

	$username = $userRec->userName;

	header("Content-Type: application/json; charset=UTF-8");
	# Get JSON as a string (from the Request)
	$json_str = file_get_contents('php://input');
	# Decode the string to get a JSON object
	$param = json_decode($json_str);

	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
    $conn = getConn($host, $dbadmin, $password, $dbname);
    $stmt = null;
    if ($param->ACTION == "NewOwnerIgnore") {
	    $stmt = $conn->prepare("UPDATE hoa_sales SET ProcessedFlag='Y',LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE PARID = ? AND SALEDT = ? ; ");
    } else if ($param->ACTION == "WelcomeSend") {
	    $stmt = $conn->prepare("UPDATE hoa_sales SET WelcomeSent='S',LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE PARID = ? AND SALEDT = ? ; ");
    } else if ($param->ACTION == "WelcomeIgnore") {
	    $stmt = $conn->prepare("UPDATE hoa_sales SET WelcomeSent='N',LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE PARID = ? AND SALEDT = ? ; ");
    } else {
        throw new Exception('ACTION is not valid, value = ' . $param->ACTION, 500);
    }
	$stmt->bind_param("sss",$username,$param->PARID,$param->SALEDT);
	$stmt->execute();
	$stmt->close();
	$conn->close();

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
}

?>
