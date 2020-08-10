<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-09 JJK 	Initial version to get properties list
 * 2015-10-20 JJK	Improved the search by adding wildCardStrFromTokens
 * 					function to build wildcard parameter string from tokens 
 * 2016-09-01 JJK   If no records are found on the initial query, just try
 * 					the first word (i.e. house number)
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
	$lotNo = getParamVal("lotNo");
	$address = getParamVal("address");

	// Default SQL
	$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
	$paramStr = " ";
	
	if (!empty($parcelId)) {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
		$paramStr = wildCardStrFromTokens($parcelId);
	} elseif (!empty($lotNo)) {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND p.LotNo ";
		$paramStr = wildCardStrFromTokens($lotNo);
	} elseif (!empty($address)) {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_Location) ";
		$paramStr = wildCardStrFromTokens($address);
	} else {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
		// Hardcode the default to find all parcels
		$paramStr = '%r%';
	}
	
	$sql = $sql . "LIKE UPPER(?) ORDER BY p.Parcel_ID; ";
	//error_log('$sql = ' . $sql);
	
	$conn = getConn($host, $dbadmin, $password, $dbname);
	$stmt = $conn->prepare($sql);
	$stmt->bind_param("s", $paramStr);
	$stmt->execute();
	$result = $stmt->get_result();
	
	$outputArray = array();
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$hoaPropertyRec = new HoaPropertyRec();
	
			$hoaPropertyRec->parcelId = $row["Parcel_ID"];
			$hoaPropertyRec->lotNo = $row["LotNo"];
			$hoaPropertyRec->subDivParcel = $row["SubDivParcel"];
			$hoaPropertyRec->parcelLocation = $row["Parcel_Location"];
	
			array_push($outputArray,$hoaPropertyRec);
		}
	} else {
		// If no records found on the initial search try cutting off the last word
		$stmt->close();
		
		if (!empty($parcelId)) {
			$paramStr = wildCardStrFromTokens($parcelId);
		} elseif (!empty($lotNo)) {
			$paramStr = wildCardStrFromTokens($lotNo);
		} elseif (!empty($address)) {
			//$paramStr = wildCardStrFromTokens($address);
			// Just use the first word
			$token = strtok($address, " ");
			$paramStr = '%' . $token . '%';
		}

		$stmt = $conn->prepare($sql);
		$stmt->bind_param("s", $paramStr);
		$stmt->execute();
		$result = $stmt->get_result();
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$hoaPropertyRec = new HoaPropertyRec();
		
				$hoaPropertyRec->parcelId = $row["Parcel_ID"];
				$hoaPropertyRec->lotNo = $row["LotNo"];
				$hoaPropertyRec->subDivParcel = $row["SubDivParcel"];
				$hoaPropertyRec->parcelLocation = $row["Parcel_Location"];
		
				array_push($outputArray,$hoaPropertyRec);
			}
		}
	}
	
	$stmt->close();
	$conn->close();
	
	echo json_encode($outputArray);

?>
