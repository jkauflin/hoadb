<?php
/*==============================================================================
 * (C) Copyright 2015,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 * 2015-10-01 JJK	Added insert new owner logic
 * 2016-08-19 JJK	Added EmailAddr
 * 2018-11-04 JJK	Re-factored to use POST and return JSON data of
 *                  re-queried record
 * 2018-11-27 JJK	Added EmailAddr2
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

	$username = getUsername();

	header("Content-Type: application/json; charset=UTF-8");
	# Get JSON as a string
	$json_str = file_get_contents('php://input');

	# Decode the string to get a JSON object
	$param = json_decode($json_str);

	/*
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, parcelId = " . $param->parcelId . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, ownerId = " . $param->ownerId . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, ownerName1 = " . $param->ownerName1 . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, ownerName2 = " . $param->ownerName2 . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, datePurchased = " . $param->datePurchased . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, mailingName = " . $param->mailingName . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, alternateMailingCheckbox = " . $param->alternateMailingCheckbox . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, addrLine1 = " . $param->addrLine1 . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, addrLine2 = " . $param->addrLine2 . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, altCity = " . $param->altCity . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, altState = " . $param->altState . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, altZip = " . $param->altZip . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, ownerPhone = " . $param->ownerPhone . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, emailAddr = " . $param->emailAddr . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, emailAddr2 = " . $param->emailAddr2 . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, ownerComments = " . $param->ownerComments . PHP_EOL, 3, "hoadb.log");
	*/
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();

	if ($param->ownerId == "NEW") {
		$result = $conn->query("SELECT MAX(OwnerID) AS maxOwnerID FROM hoa_owners; ");
		
		$maxOwnerID = 0;
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$maxOwnerID = $row["maxOwnerID"];
			}
			$result->close();
		}		
		
		if ($maxOwnerID == 0) {
			$conn->close();
			die("maxOwnerID is zero on new owner insert ");
		}

		// Increment to get a new id
		$maxOwnerID = $maxOwnerID + 1;

		// Turn current owner "off" on all other owners
		$currentOwnerBoolean = 0;
		$stmt = $conn->prepare("UPDATE hoa_owners SET CurrentOwner=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? ; ");
		$stmt->bind_param("iss",$currentOwnerBoolean,$username,$param->parcelId);
		$stmt->execute();
		$stmt->close();
		
		// Remove the property from the Sales new owners list
		$stmt = $conn->prepare("UPDATE hoa_sales SET ProcessedFlag='Y',LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE PARID = ? ; ");
		$stmt->bind_param("ss",$username,$param->parcelId);
		$stmt->execute();
		$stmt->close();
		
		// Make new owners the current owner
		$currentOwnerBoolean = 1;
		$sqlStr = 'INSERT INTO hoa_owners (OwnerID,Parcel_ID,CurrentOwner,Owner_Name1,Owner_Name2,DatePurchased,Mailing_Name,AlternateMailing,Alt_Address_Line1,Alt_Address_Line2,Alt_City,Alt_State,Alt_Zip,Owner_Phone,EmailAddr,EmailAddr2,Comments,LastChangedBy,LastChangedTs) ';
		$sqlStr = $sqlStr . ' VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP); ';
		$stmt = $conn->prepare($sqlStr);
		$stmt->bind_param("ssissssissssssssss",$maxOwnerID,$param->parcelId,$currentOwnerBoolean,$param->ownerName1,$param->ownerName2,$param->datePurchased,$param->mailingName,$param->alternateMailingCheckbox,$param->addrLine1,$param->addrLine2,$param->altCity,$param->altState,$param->altZip,$param->ownerPhone,$param->emailAddr,$param->emailAddr2,$param->ownerComments,$username);
		
	} else {
		$stmt = $conn->prepare("UPDATE hoa_owners SET Owner_Name1=?,Owner_Name2=?,DatePurchased=?,Mailing_Name=?,AlternateMailing=?,Alt_Address_Line1=?,Alt_Address_Line2=?,Alt_City=?,Alt_State=?,Alt_Zip=?,Owner_Phone=?,EmailAddr=?,EmailAddr2=?,Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? AND OwnerID = ?; ");
		$stmt->bind_param("ssssissssssssssss",$param->ownerName1,$param->ownerName2,$param->datePurchased,$param->mailingName,$param->alternateMailingCheckbox,$param->addrLine1,$param->addrLine2,$param->altCity,$param->altState,$param->altZip,$param->ownerPhone,$param->emailAddr,$param->emailAddr2,$param->ownerComments,$username,$param->parcelId,$param->ownerId);
	}
	
	$stmt->execute();
	$stmt->close();
	
	// Re-query the record from the database and return as a JSON structure
	$hoaRec = getHoaRec($conn,$param->parcelId,"","","");
	$hoaRec->adminLevel = getAdminLevel();
	$conn->close();
	echo json_encode($hoaRec);
?>
