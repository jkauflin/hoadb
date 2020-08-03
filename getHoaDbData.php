<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 *============================================================================*/
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';

// Include database connection credentials from an external includes location
require_once getCredentialsFilename();
// This include will have the following variables set
//$host = 'localhost';
//$dbadmin = "username";
//$password = "password";
//$dbname = "<name of the mysql database>";

// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");


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
