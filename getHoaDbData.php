<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 *============================================================================*/

	include 'commonUtil.php';
	// Include table record classes and db connection parameters
	include 'hoaDbCommon.php';

	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	$ownerId = getParamVal("ownerId");
	$fy = getParamVal("fy");
	$saleDate = getParamVal("saleDate");
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();
	$hoaRec = getHoaRec($conn,$parcelId,$ownerId,$fy,$saleDate);
	$hoaRec->adminLevel = getAdminLevel();
	$hoaRec->userName = getUsername();
	$conn->close();
	echo json_encode($hoaRec);
?>
