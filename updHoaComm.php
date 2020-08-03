<?php
/*==============================================================================
 * (C) Copyright 2015,2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-10-25 JJK 	Initial version 
 * 2018-11-12 JJK	Modified to handle POST and return queried list
 *============================================================================*/
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';

// Include database connection credentials from an external includes location
require_once getCredentialsFilename();
// This include will have the following variables set
//$host = 'localhost';
//$dbadmin = "username";
//$password = "password";
//$dbname = "<name of the mysql database>";

// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");


 include 'commonUtil.php';
	// Include table record classes and db connection parameters
	include 'hoaDbCommon.php';

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
	$conn = getConn();

	$sqlStr = 'INSERT INTO hoa_communications (Parcel_ID,CommID,CreateTs,OwnerID,CommType,CommDesc) VALUES(?,null,CURRENT_TIMESTAMP,?,?,?); ';
	$stmt = $conn->prepare($sqlStr);
	$stmt->bind_param("siss",$param->parcelId,$param->ownerId,$param->commType,$param->commDesc);
	
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
?>
