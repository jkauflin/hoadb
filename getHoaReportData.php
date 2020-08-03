<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Get data for reports
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-04-12 JJK 	Initial version
 * 2016-07-30 JJK   Completed query for Paid Dues Count report
 * 2016-09-20 JJK	Added non-collectibel fields for counts
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

class PaidDuesCountsRec
{
	public $fy;
	public $paidCnt;
	public $unpaidCnt;
	public $nonCollCnt;
	public $totalDue;
	public $nonCollDue;
}


$username = getUsername();

$reportName = getParamVal("reportName");

$outputArray = array();
$conn = getConn();

if ($reportName == "SalesReport" || $reportName == "SalesNewOwnerReport") {

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

} else if ($reportName == "PaidDuesCountsReport") {
	
	// get the data for the counts summary by FY
	$parcelId = "";
	$ownerId = "";
	$fy = 0;
	$duesAmt = "";
	$paid = FALSE;
	$nonCollectible = FALSE;
	$saleDate = "SKIP";
	
	//$sql = "SELECT * FROM hoa_assessments WHERE FY > 2006 ORDER BY FY DESC; ";
	$sql = "SELECT * FROM hoa_assessments WHERE FY > 2006 ORDER BY FY,Parcel_ID,OwnerID DESC; ";
	
//  a.FY	
//	a.Paid
	
	$stmt = $conn->prepare($sql);
	$stmt->execute();
	$result = $stmt->get_result();
	$stmt->close();
	
	$paidCnt = 0;
	$unPaidCnt = 0;
	$nonCollCnt = 0;
	$totalDue = 0.0;
	$nonCollDue = 0.0;
	$cnt = 0;
	$prevFY = "";
	$prevParcelId = "";
	$prevOwnerId = "";
	if ($result->num_rows > 0) {
		// Loop through all the member properties
		while($row = $result->fetch_assoc()) {
			$cnt = $cnt + 1;

			//$parcelId = $row["Parcel_ID"];
			//$ownerId = $row["OwnerID"];
				
			$fy = $row["FY"];
			$duesAmt = $row["DuesAmt"];
			$paid = $row["Paid"];
			$nonCollectible = $row["NonCollectible"];
			
			if ($cnt == 1) {
				$prevFY = $fy;
			}

				
			if ($fy != $prevFY) {
				$paidDuesCountsRec = new PaidDuesCountsRec();
				$paidDuesCountsRec->fy = $prevFY;
				$paidDuesCountsRec->paidCnt = $paidCnt;
				$paidDuesCountsRec->unpaidCnt = $unPaidCnt;
				$paidDuesCountsRec->nonCollCnt = $nonCollCnt;
				$paidDuesCountsRec->totalDue = $totalDue;
				$paidDuesCountsRec->nonCollDue = $nonCollDue; 
				array_push($outputArray,$paidDuesCountsRec);
				
				// reset counts
				$paidCnt = 0;
				$unPaidCnt = 0;
				$nonCollCnt = 0;
				$totalDue = 0.0;
				$nonCollDue = 0.0;
				$prevFY = $fy;
				$prevParcelId = $parcelId;
				$prevOwnerId = $ownerId;
			}

			// Find duplicate assessments for the same parcel
			/*
			if ($fy == $prevFY && $parcelId == $prevParcelId) {
				error_log($fy . ", Parcel = " . $parcelId . ", prevOwner = " . $prevOwnerId . ", currOwner = " . $ownerId . PHP_EOL, 3, 'DuplicateAssessments.log');
			}
			$prevParcelId = $parcelId;
			$prevOwnerId = $ownerId;
			*/
			
			if ($paid) {
				$paidCnt++;
			} else {
				if ($nonCollectible) {
					$nonCollCnt++;
					$nonCollDue += stringToMoney($duesAmt);
				} else {
					$unPaidCnt++;
					$totalDue += stringToMoney($duesAmt);
				}
			}

		}
		
		// Get the last bucket
		$paidDuesCountsRec = new PaidDuesCountsRec();
		$paidDuesCountsRec->fy = $prevFY;
		$paidDuesCountsRec->paidCnt = $paidCnt;
		$paidDuesCountsRec->unpaidCnt = $unPaidCnt;
		$paidDuesCountsRec->nonCollCnt = $nonCollCnt;
		$paidDuesCountsRec->totalDue = $totalDue;
		$paidDuesCountsRec->nonCollDue = $nonCollDue;
		array_push($outputArray,$paidDuesCountsRec);
		
	}
	
} else {

	$parcelId = "";
	$ownerId = "";
	$fy = 0;
	$saleDate = "SKIP";

	// *** just use the highest FY - the first assessment record ***
	$result = $conn->query("SELECT MAX(FY) AS maxFY FROM hoa_assessments; ");
	
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$fy = $row["maxFY"];
		}
		$result->close();
	}
	
	// try to get the parameters into the initial select query to limit the records it then tries to get from the getHoaRec
	if ($reportName == "UnpaidDuesReport") {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
				"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
				"AND a.FY = " . $fy . " AND a.Paid = 0 ORDER BY p.Parcel_ID; ";
	} else if ($reportName == "PaidDuesReport") {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
				"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
				"AND a.FY = " . $fy . " AND a.Paid = 1 ORDER BY p.Parcel_ID; ";
	} else {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
			 	"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
			 	"AND a.FY = " . $fy . " ORDER BY p.Parcel_ID; ";
	}

	$stmt = $conn->prepare($sql);
	$stmt->execute();
	$result = $stmt->get_result();
	$stmt->close();
	
	$cnt = 0;
	if ($result->num_rows > 0) {
		// Loop through all the member properties
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
