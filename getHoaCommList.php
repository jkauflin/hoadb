<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-10-25 JJK 	Initial version to get Communications list
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	// If they are set, get input parameters from the REQUEST
$parcelId = getParamVal("parcelId");
$ownerId = getParamVal("ownerId");
$commId = getParamVal("commId");

	$conn = getConn();
	
	if (!empty($parcelId)) {
		
		if (!empty($commId)) {
			$sql = "SELECT * FROM hoa_communications WHERE Parcel_ID = ? AND CommID = ? ";
			$stmt = $conn->prepare($sql);
			$stmt->bind_param("ss", $parcelId,$commId);
				
		} else {
			$sql = "SELECT * FROM hoa_communications WHERE Parcel_ID = ? ORDER BY CommID DESC ";
			$stmt = $conn->prepare($sql);
			$stmt->bind_param("s", $parcelId);
		}
		
	} else {
		$sql = "SELECT * FROM hoa_communications ORDER BY CommID DESC ";
		$stmt = $conn->prepare($sql);
	}
	
	//error_log('$sql = ' . $sql);
	
	$stmt->execute();
	$result = $stmt->get_result();
	
	$outputArray = array();
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$hoaCommRec = new HoaCommRec();
	
			$hoaCommRec->Parcel_ID = $row["Parcel_ID"];
			$hoaCommRec->CommID = $row["CommID"];
			$hoaCommRec->CreateTs = $row["CreateTs"];
			$hoaCommRec->OwnerID = $row["OwnerID"];
			$hoaCommRec->CommType = $row["CommType"];
			$hoaCommRec->CommDesc = $row["CommDesc"];
				
			array_push($outputArray,$hoaCommRec);
		}
	} else {
		$hoaCommRec = new HoaCommRec();

		$hoaCommRec->Parcel_ID = '';
		$hoaCommRec->CommID = '';
		$hoaCommRec->CreateTs = '';
		$hoaCommRec->OwnerID = '';
		$hoaCommRec->CommType = '';
		$hoaCommRec->CommDesc = '';
		
		array_push($outputArray,$hoaCommRec);
	}
	
	$stmt->close();
	$conn->close();
	
	echo json_encode($outputArray);

?>
