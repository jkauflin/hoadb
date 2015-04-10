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
	$fy = getParamVal("fy");
	
	$memberBoolean = paramBoolVal("memberBoolean");
	$vacantBoolean = paramBoolVal("vacantBoolean");
	$rentalBoolean = paramBoolVal("rentalBoolean");
	$managedBoolean = paramBoolVal("managedBoolean");
	$foreclosureBoolean = paramBoolVal("foreclosureBoolean");
	$bankruptcyBoolean = paramBoolVal("bankruptcyBoolean");
	$liensBoolean = paramBoolVal("liensBoolean");
	
	$propertyComments = getParamVal("propertyComments");
	
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
	
	$stmt = $conn->prepare("UPDATE hoa_properties SET Member=?,Vacant=?,Rental=?,Managed=?,Foreclosure=?,Bankruptcy=?,Liens_2B_Released=?,Comments=? WHERE Parcel_ID = ? ; ");
	$stmt->bind_param("iiiiiiiss", $memberBoolean,$vacantBoolean,$rentalBoolean,$managedBoolean,$foreclosureBoolean,$bankruptcyBoolean,$liensBoolean,$propertyComments,$parcelId);	
	$stmt->execute();
	$stmt->close();
	$conn->close();

	//echo json_encode($hoaRec);
	//echo 'Update Successful - member = ' . $memberBoolean . ', vacant = ' . $vacantBoolean . ', rental = ' . $rentalBoolean . ', managed = ' . $managedBoolean . ', foreclosure = ' . $foreclosureBoolean . ', bankruptcy = ' . $bankruptcyBoolean . ', liens = ' . $liensBoolean;
	echo 'Update Successful - propertyComments = ' . $propertyComments . ', parcelId = ' . $parcelId;
	
?>
