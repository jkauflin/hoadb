<?php
/*==============================================================================
 * (C) Copyright 2015,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-10-02 JJK 	Initial version to update Sales 
 * 2018-11-04 JJK	Re-factored to use POST and return JSON data of
 *                  re-queried record
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

	//error_log(date('[Y-m-d H:i] '). "updHoaSales, PARID = " . $param->PARID . PHP_EOL, 3, "hoadb.log");
	//error_log(date('[Y-m-d H:i] '). "updHoaSales, SALEDT = " . $param->SALEDT . PHP_EOL, 3, "hoadb.log");

	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();
	$stmt = $conn->prepare("UPDATE hoa_sales SET ProcessedFlag='Y',LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE PARID = ? AND SALEDT = ? ; ");
	$stmt->bind_param("sss",$username,$param->PARID,$param->SALEDT);	
	$stmt->execute();
	$stmt->close();
	$conn->close();
	echo 'Update Successful - parcelId = ' . $PARID;
?>
