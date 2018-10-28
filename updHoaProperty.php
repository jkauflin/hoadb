<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 * 2015-12-21 JJK	Removed Member boolean from the update
 * 2016-08-19 JJK   Added UserEmail
 * 2018-10-27 JJK	Re-factored to use POST and return JSON data
 *============================================================================*/
	include 'commonUtil.php';
	// Include table record classes and db connection parameters
	include 'hoaDbCommon.php';

	$username = getUsername();

	header("Content-Type: application/json; charset=UTF-8");
	# Get JSON as a string
	$json_str = file_get_contents('php://input');

	# Decode the string to get a JSON object
	$param = json_decode($json_str);


	//error_log(date('[Y-m-d H:i] '). "updHoaProperty, action = " . $param->action . PHP_EOL, 3, "hoadb.log");

	// If they are set, get input parameters from the REQUEST
	/*
	$parcelId = getParamVal("parcelId");
	
	$memberBoolean = paramBoolVal("memberBoolean");
	$vacantBoolean = paramBoolVal("vacantBoolean");
	$rentalBoolean = paramBoolVal("rentalBoolean");
	$managedBoolean = paramBoolVal("managedBoolean");
	$foreclosureBoolean = paramBoolVal("foreclosureBoolean");
	$bankruptcyBoolean = paramBoolVal("bankruptcyBoolean");
	$liensBoolean = paramBoolVal("liensBoolean");
	$useEmailBoolean = paramBoolVal("useEmailBoolean");
	
	$propertyComments = getParamVal("propertyComments");
	*/


	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();
	/*
    	$stmt = $conn->prepare("UPDATE hoa_properties SET Member=?,Vacant=?,Rental=?,Managed=?,Foreclosure=?,Bankruptcy=?,Liens_2B_Released=?,Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? ; ");
    	$stmt->bind_param("iiiiiiisss", $memberBoolean,$vacantBoolean,$rentalBoolean,$managedBoolean,$foreclosureBoolean,$bankruptcyBoolean,$liensBoolean,$propertyComments,$username,$parcelId);
    */ 
	$stmt = $conn->prepare("UPDATE hoa_properties SET Vacant=?,Rental=?,Managed=?,Foreclosure=?,Bankruptcy=?,Liens_2B_Released=?,UseEmail=?,Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? ; ");
	$stmt->bind_param("iiiiiiisss", $vacantBoolean,$rentalBoolean,$managedBoolean,$foreclosureBoolean,$bankruptcyBoolean,$liensBoolean,$useEmailBoolean,$propertyComments,$username,$parcelId);	
	$stmt->execute();
	$stmt->close();

	// Re-query the record from the database and return as a JSON structure
	$hoaRec = getHoaRec($conn,$parcelId,"","","");
	$hoaRec->adminLevel = getAdminLevel();
	$conn->close();
	echo json_encode($hoaRec);
?>
