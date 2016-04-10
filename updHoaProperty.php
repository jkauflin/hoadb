<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 * 2015-12-21 JJK	Removed Member boolean from the update
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	$username = getUsername();

	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	
	$memberBoolean = paramBoolVal("memberBoolean");
	$vacantBoolean = paramBoolVal("vacantBoolean");
	$rentalBoolean = paramBoolVal("rentalBoolean");
	$managedBoolean = paramBoolVal("managedBoolean");
	$foreclosureBoolean = paramBoolVal("foreclosureBoolean");
	$bankruptcyBoolean = paramBoolVal("bankruptcyBoolean");
	$liensBoolean = paramBoolVal("liensBoolean");
	
	$propertyComments = getParamVal("propertyComments");
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();
	/*
    	$stmt = $conn->prepare("UPDATE hoa_properties SET Member=?,Vacant=?,Rental=?,Managed=?,Foreclosure=?,Bankruptcy=?,Liens_2B_Released=?,Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? ; ");
    	$stmt->bind_param("iiiiiiisss", $memberBoolean,$vacantBoolean,$rentalBoolean,$managedBoolean,$foreclosureBoolean,$bankruptcyBoolean,$liensBoolean,$propertyComments,$username,$parcelId);
    */ 
	$stmt = $conn->prepare("UPDATE hoa_properties SET Vacant=?,Rental=?,Managed=?,Foreclosure=?,Bankruptcy=?,Liens_2B_Released=?,Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? ; ");
	$stmt->bind_param("iiiiiisss", $vacantBoolean,$rentalBoolean,$managedBoolean,$foreclosureBoolean,$bankruptcyBoolean,$liensBoolean,$propertyComments,$username,$parcelId);	
	$stmt->execute();
	$stmt->close();
	$conn->close();

	echo 'Update Successful, parcelId = ' . $parcelId;
	
?>
