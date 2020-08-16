<?php
/*==============================================================================
 * (C) Copyright 2015,2016,2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-10-25 JJK 	Initial version 
 * 2018-11-12 JJK	Modified to handle POST and return queried list
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

	header("Content-Type: application/json; charset=UTF-8");
	# Get JSON as a string
	$json_str = file_get_contents('php://input');

	# Decode the string to get a JSON object
	$param = json_decode($json_str);

	/*
	error_log(date('[Y-m-d H:i] '). "updHoaComm, parcelId = " . $param->parcelId . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaComm, ownerId = " . $param->ownerId . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaComm, commId = " . $param->commId . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaComm, commType = " . $param->commType . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaComm, commDesc = " . $param->commDesc . PHP_EOL, 3, "hoadb.log");
	*/

	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn($host, $dbadmin, $password, $dbname);

    $sqlStr = '';
    $stmt = null;
    if ($param->commId == "NEW") {
	    $sqlStr = 'INSERT INTO hoa_communications (Parcel_ID,CommID,CreateTs,OwnerID,CommType,CommDesc) VALUES(?,null,CURRENT_TIMESTAMP,?,?,?); ';
	    $stmt = $conn->prepare($sqlStr);
	    $stmt->bind_param("siss",$param->parcelId,$param->ownerId,$param->commType,$param->commDesc);
    } else {
        $sqlStr = 'UPDATE hoa_communications SET CommDesc=? WHERE CommID =?; ';
	    $stmt = $conn->prepare($sqlStr);
	    $stmt->bind_param("si",$param->commDesc,$param->commId);
    }
	$stmt->execute();
	$stmt->close();
	
	// Re-query the list and pass it back for display
	$sql = "SELECT * FROM hoa_communications WHERE Parcel_ID = ? ORDER BY CommID DESC ";
	$stmt = $conn->prepare($sql);
	$stmt->bind_param("s", $param->parcelId);
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
    exit;
}

?>
