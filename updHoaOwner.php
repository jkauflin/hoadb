<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 *============================================================================*/

// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	$ownerId = getParamVal("ownerId");

	$currentOwnerBoolean = paramBoolVal("currentOwnerBoolean");
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
	$conn = new mysqli($host, $username, $password, $dbname);

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
	*/
	
	$stmt = $conn->prepare("UPDATE hoa_owners SET CurrentOwner=?,Owner_Name1=?,Owner_Name2=?,DatePurchased=?,Mailing_Name=?,AlternateMailing=?,Alt_Address_Line1=?,Alt_Address_Line2=?,Alt_City=?,Alt_State=?,Alt_Zip=?,Owner_Phone=?,Comments=? WHERE Parcel_ID = ? AND OwnerID = ?; ");
	$stmt->bind_param("issssisssssssss",$currentOwnerBoolean,$ownerName1,$ownerName2,$datePurchased,$mailingName,$alternateMailingBoolean,$addrLine1,$addrLine2,$altCity,$altState,$altZip,$ownerPhone,$ownerComments,$parcelId,$ownerId);
	
	$stmt->execute();
	$stmt->close();
	$conn->close();

	//echo json_encode($hoaRec);
	//echo 'Update Successful - member = ' . $memberBoolean . ', vacant = ' . $vacantBoolean . ', rental = ' . $rentalBoolean . ', managed = ' . $managedBoolean . ', foreclosure = ' . $foreclosureBoolean . ', bankruptcy = ' . $bankruptcyBoolean . ', liens = ' . $liensBoolean;
	echo 'Update Successful - ownerId = ' . $ownerId . ', parcelId = ' . $parcelId;
	
?>
