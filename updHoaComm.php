<?php
/*==============================================================================
 * (C) Copyright 2015,2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-10-25 JJK 	Initial version 
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	$commId = getParamVal("commId");
	$ownerId = getParamVal("ownerId");
	$commType = getParamVal("commType");
	$commDesc = getParamVal("commDesc");
	$CommAction = getParamVal("CommAction");
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();

	$sqlStr = 'INSERT INTO hoa_communications (Parcel_ID,CommID,CreateTs,OwnerID,CommType,CommDesc) VALUES(?,null,CURRENT_TIMESTAMP,?,?,?); ';
	$stmt = $conn->prepare($sqlStr);
	$stmt->bind_param("siss",$parcelId,$ownerId,$commType,$commDesc);
	
	$stmt->execute();
	$stmt->close();
	$conn->close();
	
	echo 'Update Successful';
	
?>
