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

	// If they are set, get input parameters from the REQUEST
	$configName = getParamVal("ConfigName");
	$configDesc = getParamVal("ConfigDesc");
	$configValue = getParamVal("ConfigValue");
	$configAction = getParamVal("ConfigAction");
	
	/*
	error_log(date('[Y-m-d H:i] '). "updHoaConfig, ConfigName = " . $configName . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaConfig, ConfigDesc = " . $configDesc . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaConfig, ConfigValue = " . $configValue . PHP_EOL, 3, "hoadb.log");
	*/
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();

	$sql = "SELECT * FROM hoa_config WHERE ConfigName = ? ";
	$stmt = $conn->prepare($sql);
	$stmt->bind_param("s", $configName);
	
	$stmt->execute();
	$result = $stmt->get_result();
	$stmt->close();
	
	// If record found UPDATE, else INSERT
	if ($result->num_rows > 0) {
		$result->close();
		if ($configAction == 'Delete') {
			$stmt = $conn->prepare("DELETE FROM hoa_config WHERE ConfigName = ? ; ");
			$stmt->bind_param("s",$configName);
		} else {
			$stmt = $conn->prepare("UPDATE hoa_config SET ConfigDesc=?,ConfigValue=? WHERE ConfigName = ? ; ");
			$stmt->bind_param("sss",$configDesc,$configValue,$configName);
		}
	} else {
		$result->close();
		$sqlStr = 'INSERT INTO hoa_config (ConfigName,ConfigDesc,ConfigValue) VALUES(?,?,?); ';
		$stmt = $conn->prepare($sqlStr);
		$stmt->bind_param("sss",$configName,$configDesc,$configValue);
	}
	$stmt->execute();
	$stmt->close();
	$conn->close();
	
	echo 'Update Successful, ConfigName = ' . $configName;
	
?>
