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
	
	
	/*
	error_log(date('[Y-m-d H:i] '). "updHoaConfig, ConfigName = " . $configName . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaConfig, ConfigDesc = " . $configDesc . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaConfig, ConfigValue = " . $configValue . PHP_EOL, 3, "hoadb.log");

	Hoa_communications

Parcel_ID
CommID
CreateTs
OwnerID
CommType
CommDesc
	*/
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();

	//$sqlStr = 'INSERT INTO hoa_communications (Parcel_ID,CommID,CreateTs,OwnerID,CommType,CommDesc) VALUES(?,AUTO_INCREMENT,CURRENT_TIMESTAMP,?,?,?); ';
	$sqlStr = 'INSERT INTO hoa_communications (Parcel_ID,CommID,CreateTs,OwnerID,CommType,CommDesc) VALUES(?,null,CURRENT_TIMESTAMP,?,?,?); ';
	$stmt = $conn->prepare($sqlStr);
	$stmt->bind_param("siss",$parcelId,$ownerId,$commType,$commDesc);
	
	$stmt->execute();
	$stmt->close();
	$conn->close();
	
	echo 'Update Successful';
	
?>
