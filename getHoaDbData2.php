<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 *============================================================================*/
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");
require_once 'vendor/autoload.php'; 

// Figure out how many levels up to get to the "public_html" root folder
$webRootDirOffset = substr_count(strstr(dirname(__FILE__),"public_html"),DIRECTORY_SEPARATOR) + 1;
// Get settings and credentials from a file in a directory outside of public_html
// (assume a settings file in the "external_includes" folder one level up from "public_html")
$extIncludePath = dirname(__FILE__, $webRootDirOffset+1).DIRECTORY_SEPARATOR.'external_includes'.DIRECTORY_SEPARATOR;
require_once $extIncludePath.'hoadbSecrets.php';
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';

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
