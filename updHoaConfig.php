<?php
/*==============================================================================
 * (C) Copyright 2015,2020 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data
 * 2015-10-01 JJK	Added insert new owner logic
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
    if ($userRec->userLevel < 2) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

	header("Content-Type: application/json; charset=UTF-8");
	# Get JSON as a string
	$json_str = file_get_contents('php://input');

	# Decode the string to get a JSON object
	$param = json_decode($json_str);

	//error_log(date('[Y-m-d H:i] '). "updHoaConfig, action = " . $param->action . PHP_EOL, 3, "hoadb.log");
	//error_log(date('[Y-m-d H:i] '). "updHoaConfig, ConfigName = " . $param->ConfigName . PHP_EOL, 3, "hoadb.log");
	//error_log(date('[Y-m-d H:i] '). "updHoaConfig, ConfigDesc = " . $param->ConfigDesc . PHP_EOL, 3, "hoadb.log");
	//error_log(date('[Y-m-d H:i] '). "updHoaConfig, ConfigValue = " . $param->ConfigValue . PHP_EOL, 3, "hoadb.log");

	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn($host, $dbadmin, $password, $dbname);

    $configValue = mysqli_real_escape_string($conn, $param->ConfigValue);

	$sql = "SELECT * FROM hoa_config WHERE ConfigName = ? ";
	$stmt = $conn->prepare($sql);
	$stmt->bind_param("s", $param->ConfigName);

	$stmt->execute();
	$result = $stmt->get_result();
	$stmt->close();

	// If record found UPDATE, else INSERT
	if ($result->num_rows > 0) {
		$result->close();
		if ($param->action == 'Delete') {
			$stmt = $conn->prepare("DELETE FROM hoa_config WHERE ConfigName = ? ; ");
			$stmt->bind_param("s",$param->ConfigName);
		} else {
			$stmt = $conn->prepare("UPDATE hoa_config SET ConfigDesc=?,ConfigValue=? WHERE ConfigName = ? ; ");
			$stmt->bind_param("sss",$param->ConfigDesc,$configValue,$param->ConfigName);
		}
	} else {
		$result->close();
		$sqlStr = 'INSERT INTO hoa_config (ConfigName,ConfigDesc,ConfigValue) VALUES(?,?,?); ';
		$stmt = $conn->prepare($sqlStr);
		$stmt->bind_param("sss",$param->ConfigName,$param->ConfigDesc,$configValue);
	}
	$stmt->execute();
	$stmt->close();

	// Re-query the list and pass it back for display
	$sql = "SELECT * FROM hoa_config ORDER BY ConfigName ";
	$stmt = $conn->prepare($sql);
	$stmt->execute();
	$result = $stmt->get_result();
	$outputArray = array();
	if ($result != NULL) {
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
