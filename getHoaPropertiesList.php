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
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	$outputArray = array();
	
	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	$address = getParamVal("address");
	$ownerName = getParamVal("ownerName");
	$phoneNo = getParamVal("phoneNo");
	$altAddress = getParamVal("altAddress");
	$checkNo = getParamVal("checkNo");

	// Default SQL
	$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
	$paramStr = " ";
	
	if (!empty($parcelId)) {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
		$paramStr = wildCardStrFromTokens($parcelId);
	} elseif (!empty($address)) {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_Location) ";
		$paramStr = wildCardStrFromTokens($address);
	} elseif (!empty($ownerName)) {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND UPPER(CONCAT(o.Owner_Name1,' ',o.Owner_Name2,' ',o.Mailing_Name)) ";
		// Check if a tokenized string was entered, break it into token and put wildcards between each token?
		// search need to be bullitproof if you are using it for members
		$paramStr = wildCardStrFromTokens($ownerName);
	} elseif (!empty($phoneNo)) {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND UPPER(o.Owner_Phone) ";
		$paramStr = wildCardStrFromTokens($phoneNo);
	} elseif (!empty($altAddress)) {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND UPPER(o.Alt_Address_Line1) ";
		$paramStr = wildCardStrFromTokens($altAddress);
	} elseif (!empty($checkNo)) {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a WHERE p.Parcel_ID = o.Parcel_ID AND p.Parcel_ID = a.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(a.Comments) ";
		$paramStr = wildCardStrFromTokens($checkNo);
	} else {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
		// Hardcode the default to find all parcels
		$paramStr = '%r%';
	}
	
	$sql = $sql . "LIKE UPPER(?) ORDER BY p.Parcel_ID; ";
	//error_log('$sql = ' . $sql);
	
	
	// Create connection
	$conn = new mysqli($host, $dbadmin, $password, $dbname);

	// Check connection
	if ($conn->connect_error) {
    	die("Connection failed: " . $conn->connect_error);
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
			$hoaPropertyRec->ownerName = $row["Owner_Name1"] . ' ' . $row["Owner_Name2"];
			$hoaPropertyRec->ownerPhone = $row["Owner_Phone"];
			
			array_push($outputArray,$hoaPropertyRec);
		}
    }
	
	$stmt->close();
    $conn->close();

	echo json_encode($outputArray);

?>
