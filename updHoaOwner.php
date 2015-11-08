<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 * 2015-10-01 JJK	Added insert new owner logic
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	$username = getUsername();

	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	$ownerId = getParamVal("ownerId");

	//$currentOwnerBoolean = paramBoolVal("currentOwnerBoolean");
	$ownerName1 = getParamVal("ownerName1");
	$ownerName2 = getParamVal("ownerName2");
	$datePurchased = getParamVal("datePurchased");
	$mailingName = getParamVal("mailingName");
	$alternateMailingBoolean = paramBoolVal("alternateMailingBoolean");
	$addrLine1 = getParamVal("addrLine1");
	$addrLine2 = getParamVal("addrLine2");
	$altCity = getParamVal("altCity");
	$altState = getParamVal("altState");
	$altZip = getParamVal("altZip");
	$ownerPhone = getParamVal("ownerPhone");
	$ownerComments = getParamVal("ownerComments");
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = new mysqli($host, $dbadmin, $password, $dbname);

	// Check connection
	if ($conn->connect_error) {
    	die("Connection failed: " . $conn->connect_error);
	} 

	//if (empty($ownerId)) {
	/*
	CREATE TABLE IF NOT EXISTS `hoa_owners` (
			`OwnerID` int(1) DEFAULT NULL,
			`Parcel_ID` varchar(14) DEFAULT NULL,
			`CurrentOwner` int(1) DEFAULT NULL,
			`Owner_Name1` varchar(23) DEFAULT NULL,
			`Owner_Name2` varchar(12) DEFAULT NULL,
			`DatePurchased` varchar(18) DEFAULT NULL,
			`Mailing_Name` varchar(16) DEFAULT NULL,
			`AlternateMailing` int(1) DEFAULT NULL,
			`Alt_Address_Line1` varchar(16) DEFAULT NULL,
			`Alt_Address_Line2` varchar(10) DEFAULT NULL,
			`Alt_City` varchar(13) DEFAULT NULL,
			`Alt_State` varchar(2) DEFAULT NULL,
			`Alt_Zip` varchar(6) DEFAULT NULL,
			`Owner_Phone` varchar(14) DEFAULT NULL,
			`Comments` varchar(10) DEFAULT NULL,
			`EntryTimestamp` varchar(19) DEFAULT NULL,
			`UpdateTimestamp` varchar(19) DEFAULT NULL,
			
			LastChangedBy	varchar(40)	utf8_general_ci		Yes	NULL
			LastChangedTs	datetime			No	CURRENT_TIMESTAMP	
	*/
	
	if ($ownerId == "NEW") {
		$result = $conn->query("SELECT MAX(OwnerID) AS maxOwnerID FROM hoa_owners; ");
		
		$maxOwnerID = 0;
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$maxOwnerID = $row["maxOwnerID"];
			}
			$result->close();
		}		
		
		//error_log('$maxOwnerID = ' . $maxOwnerID);
		
		if ($maxOwnerID == 0) {
			$conn->close();
			die("maxOwnerID is zero on new owner insert ");
		}
		
		$maxOwnerID = $maxOwnerID + 1;
	/*
	CREATE TABLE IF NOT EXISTS `hoa_owners` (
			`OwnerID` int(1) DEFAULT NULL,
			`Parcel_ID` varchar(14) DEFAULT NULL,
			`CurrentOwner` int(1) DEFAULT NULL,
			`Owner_Name1` varchar(23) DEFAULT NULL,
			`Owner_Name2` varchar(12) DEFAULT NULL,
			`DatePurchased` varchar(18) DEFAULT NULL,
			`Mailing_Name` varchar(16) DEFAULT NULL,
			`AlternateMailing` int(1) DEFAULT NULL,
			`Alt_Address_Line1` varchar(16) DEFAULT NULL,
			`Alt_Address_Line2` varchar(10) DEFAULT NULL,
			`Alt_City` varchar(13) DEFAULT NULL,
			`Alt_State` varchar(2) DEFAULT NULL,
			`Alt_Zip` varchar(6) DEFAULT NULL,
			`Owner_Phone` varchar(14) DEFAULT NULL,
			`Comments` varchar(10) DEFAULT NULL,
			`EntryTimestamp` varchar(19) DEFAULT NULL,
			`UpdateTimestamp` varchar(19) DEFAULT NULL,
			
			LastChangedBy	varchar(40)	utf8_general_ci		Yes	NULL
			LastChangedTs	datetime			No	CURRENT_TIMESTAMP	
	*/
		// Turn current owner "off" on all other owners
		$currentOwnerBoolean = 0;
		$stmt = $conn->prepare("UPDATE hoa_owners SET CurrentOwner=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? ; ");
		$stmt->bind_param("iss",$currentOwnerBoolean,$username,$parcelId);
		$stmt->execute();
		$stmt->close();
		
		// Make new owners the current owner
		$currentOwnerBoolean = 1;
		$sqlStr = 'INSERT INTO hoa_owners (OwnerID,Parcel_ID,CurrentOwner,Owner_Name1,Owner_Name2,DatePurchased,Mailing_Name,AlternateMailing,Alt_Address_Line1,Alt_Address_Line2,Alt_City,Alt_State,Alt_Zip,Owner_Phone,Comments,LastChangedBy,LastChangedTs) ';
		$sqlStr = $sqlStr . ' VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP); ';
		$stmt = $conn->prepare($sqlStr);
		$stmt->bind_param("ssissssissssssss",$maxOwnerID,$parcelId,$currentOwnerBoolean,$ownerName1,$ownerName2,$datePurchased,$mailingName,$alternateMailingBoolean,$addrLine1,$addrLine2,$altCity,$altState,$altZip,$ownerPhone,$ownerComments,$username);
		
	} else {
		$stmt = $conn->prepare("UPDATE hoa_owners SET Owner_Name1=?,Owner_Name2=?,DatePurchased=?,Mailing_Name=?,AlternateMailing=?,Alt_Address_Line1=?,Alt_Address_Line2=?,Alt_City=?,Alt_State=?,Alt_Zip=?,Owner_Phone=?,Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? AND OwnerID = ?; ");
		$stmt->bind_param("ssssissssssssss",$ownerName1,$ownerName2,$datePurchased,$mailingName,$alternateMailingBoolean,$addrLine1,$addrLine2,$altCity,$altState,$altZip,$ownerPhone,$ownerComments,$username,$parcelId,$ownerId);
	}
	
	$stmt->execute();
	$stmt->close();
	$conn->close();

	//echo json_encode($hoaRec);
	//echo 'Update Successful - member = ' . $memberBoolean . ', vacant = ' . $vacantBoolean . ', rental = ' . $rentalBoolean . ', managed = ' . $managedBoolean . ', foreclosure = ' . $foreclosureBoolean . ', bankruptcy = ' . $bankruptcyBoolean . ', liens = ' . $liensBoolean;
	echo 'Update Successful - ownerId = ' . $ownerId . ', parcelId = ' . $parcelId;
	
?>
