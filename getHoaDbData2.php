<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 *============================================================================*/
require_once 'vendor/autoload.php'; 
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Include database connection credentials from an external includes location
require_once getSecretsFilename2();
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");

	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn($host, $dbadmin, $password, $dbname);
	$hoaRec = getHoaRec2($conn,$parcelId,$paypalFixedAmtButtonForm,$paypalFixedAmtButtonInput);
	
	$conn->close();
	
	echo json_encode($hoaRec);

?>
