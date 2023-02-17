<?php
/*==============================================================================
 * (C) Copyright 2016,2020 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-10-25 JJK 	Initial version to get Communications list
 * 2018-11-12 JJK	Modified to put rows straight in the output array
 * 2020-08-01 JJK   Re-factored to use jjklogin for authentication
 * 2020-12-21 JJK   Re-factored to use jjklogin package
 * 2023-02-17 JJK   Refactor for non-static jjklogin class and settings from DB
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
    $loginAuth = new LoginAuth($hostJJKLogin, $dbadminJJKLogin, $passwordJJKLogin, $dbnameJJKLogin);
    $userRec = $loginAuth->getUserRec();
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 1) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	$ownerId = getParamVal("ownerId");
	$commId = getParamVal("commId");

	$conn = getConn($host, $dbadmin, $password, $dbname);

	if (!empty($parcelId)) {
		if (!empty($commId)) {
			$sql = "SELECT * FROM hoa_communications WHERE Parcel_ID = ? AND CommID = ? ";
			$stmt = $conn->prepare($sql);
			$stmt->bind_param("ss", $parcelId,$commId);
		} else {
			$sql = "SELECT * FROM hoa_communications WHERE Parcel_ID = ? ORDER BY CommID DESC ";
			$stmt = $conn->prepare($sql);
			$stmt->bind_param("s", $parcelId);
		}
	} else {
		$sql = "SELECT * FROM hoa_communications ORDER BY CommID DESC ";
		$stmt = $conn->prepare($sql);
	}

	//error_log('$sql = ' . $sql);

	$stmt->execute();
	$result = $stmt->get_result();
	$outputArray = array();
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			array_push($outputArray,$row);
		}
	}
	$stmt->close();
	$conn->close();

	echo json_encode($outputArray);

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
