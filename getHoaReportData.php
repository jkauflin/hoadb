<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Get data for reports
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-04-12 JJK 	Initial version
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

$username = getUsername();

$reportName = getParamVal("reportName");
$reportYear = getParamVal("reportYear");

$outputArray = array();
$conn = getConn();

if ($reportName == "SalesReport" || $reportName == "SalesNewOwnerReport") {

	// Add Year to query???
	
	if ($reportName == "SalesNewOwnerReport") {
		$stmt = $conn->prepare("SELECT * FROM hoa_sales WHERE ProcessedFlag != 'Y' ORDER BY CreateTimestamp DESC; ");
	} else {
		$stmt = $conn->prepare("SELECT * FROM hoa_sales ORDER BY CreateTimestamp DESC; ");
	}
	$stmt->execute();
	$result = $stmt->get_result();
	$stmt->close();
	
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$hoaSalesRec = new HoaSalesRec();
			$hoaSalesRec->PARID = $row["PARID"];
			$hoaSalesRec->CONVNUM = $row["CONVNUM"];
			$hoaSalesRec->SALEDT = $row["SALEDT"];
			$hoaSalesRec->PRICE = $row["PRICE"];
			$hoaSalesRec->OLDOWN = $row["OLDOWN"];
			$hoaSalesRec->OWNERNAME1 = $row["OWNERNAME1"];
			$hoaSalesRec->PARCELLOCATION = $row["PARCELLOCATION"];
			$hoaSalesRec->MAILINGNAME1 = $row["MAILINGNAME1"];
			$hoaSalesRec->MAILINGNAME2 = $row["MAILINGNAME2"];
			$hoaSalesRec->PADDR1 = $row["PADDR1"];
			$hoaSalesRec->PADDR2 = $row["PADDR2"];
			$hoaSalesRec->PADDR3 = $row["PADDR3"];
			$hoaSalesRec->CreateTimestamp = $row["CreateTimestamp"];
			$hoaSalesRec->NotificationFlag = $row["NotificationFlag"];
			$hoaSalesRec->ProcessedFlag = $row["ProcessedFlag"];
			$hoaSalesRec->LastChangedBy = $row["LastChangedBy"];
			$hoaSalesRec->LastChangedTs = $row["LastChangedTs"];
	
			$hoaSalesRec->adminLevel = getAdminLevel();

			array_push($outputArray,$hoaSalesRec);
		}
		$result->close();
	}
	
	
	// End of if ($reportName == "SalesReport" || $reportName == "SalesNewOwnerReport") {
} else if ($reportName == "UnpaidDuesReport") {

	$parcelId = "";
	$ownerId = "";
	$fy = "2017";
	$saleDate = "SKIP";
	
	
	// try to get the parameters into the initial select query to limit the records it then tries to get from the getHoaRec

	// *** just use the highest FY - the first assessment record ***
	
		// Loop through all the member properties
		//$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Member = 1 AND p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ";		
		//$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a WHERE p.Parcel_ID = o.Parcel_ID AND p.Parcel_ID = a.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(a.Comments) ";
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a " . 
				"WHERE p.Parcel_ID = o.Parcel_ID AND p.Parcel_ID = a.Parcel_ID AND o.CurrentOwner = 1 " .
				"AND a.FY = 2017 AND a.Paid = 0 ORDER BY p.Parcel_ID; ";
		
		$stmt = $conn->prepare($sql);
		$stmt->execute();
		$result = $stmt->get_result();
		$stmt->close();
		
		$cnt = 0;
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$cnt = $cnt + 1;

				$parcelId = $row["Parcel_ID"];
				$ownerId = $row["OwnerID"];
				
				$hoaRec = getHoaRec($conn,$parcelId,$ownerId,$fy,$saleDate);
				
				array_push($outputArray,$hoaRec);
			}
			
		}

} // End of } else if ($reportName == "DuesReport") {
	
// Close db connection
$conn->close();

echo json_encode($outputArray);
?>
