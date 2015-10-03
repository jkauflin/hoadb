<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-10-02 JJK 	Initial version to update Sales 
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	$username = getUsername();

	// If they are set, get input parameters from the REQUEST
	$PARID = getParamVal("PARID");
	$SALEDT = getParamVal("SALEDT");
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = new mysqli($host, $dbadmin, $password, $dbname);

	// Check connection
	if ($conn->connect_error) {
    	die("Connection failed: " . $conn->connect_error);
	} 

	$stmt = $conn->prepare("UPDATE hoa_sales SET ProcessedFlag='Y',LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE PARID = ? AND SALEDT = ? ; ");
	$stmt->bind_param("sss",$username,$PARID,$SALEDT);	
	$stmt->execute();
	$stmt->close();
	$conn->close();

	echo 'Update Successful - parcelId = ' . $PARID;
	
?>
