<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Functions to execute Admin operations
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-04-05 JJK 	Added Add AddAssessments
 * 2016-04-09 JJK	Added Dues Statements
 * 2016-04-15 JJK   Dropped some unused Assessments fields
 * 2016-09-02 JJK   Added NonCollectible field 
 * 2016-11-28 JJK   Added InterestNotPaid and BankFee fields
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

$username = getUsername();

$adminRec = new AdminRec();
$adminRec->result = "Not Valid";
$adminRec->message = "";

$action = getParamVal("action");
$fiscalYear = getParamVal("FY");
$duesAmt = strToUSD(getParamVal("duesAmt"));

$adminLevel = getAdminLevel();
$conn = getConn();

if ($action == "AddAssessments") {
	if ($adminLevel < 2) {
		$adminRec->message = "You do not have permissions to Add Assessments.";
		$adminRec->result = "Not Valid";
	} else {
		// Loop through all the member properties
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Member = 1 AND p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ";		
		$stmt = $conn->prepare($sql);
		$stmt->execute();
		$result = $stmt->get_result();
		$stmt->close();
		
		$cnt = 0;
		if ($result->num_rows > 0) {
			$OwnerID = 0;
			$Parcel_ID = "";
			$FY = intval($fiscalYear);
			$DuesAmt = '$' . strval($duesAmt);
			$DateDue = strval($fiscalYear-1) . "-10-01";
			$Paid = 0;
			$NonCollectible = 0;
			$DatePaid = "";
			$PaymentMethod = "";
			
			$Lien = 0;
			$LienRefNo = "";
			$DateFiled = "";
			$Disposition = "";
			$FilingFee = "";
			$ReleaseFee = "";
			$DateReleased = "";
			$LienDatePaid = "";
			$AmountPaid = "";
			$StopInterestCalc = 0;
			$FilingFeeInterest = "";
			$AssessmentInterest = "";
			$InterestNotPaid = 0;
			$BankFee = "";
			$LienComment = "";
				
			$Comments = "";
		
			$sqlStr = 'INSERT INTO hoa_assessments (OwnerID,Parcel_ID,FY,DuesAmt,DateDue,Paid,NonCollectible,DatePaid,PaymentMethod,
							Lien,LienRefNo,DateFiled,Disposition,FilingFee,ReleaseFee,DateReleased,LienDatePaid,AmountPaid,
							StopInterestCalc,FilingFeeInterest,AssessmentInterest,InterestNotPaid,BankFee,LienComment,Comments,LastChangedBy,LastChangedTs) ';
			$sqlStr = $sqlStr . ' VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP); ';
			$stmt = $conn->prepare($sqlStr);
			$stmt->bind_param("isissiississssssssississss",$OwnerID,$Parcel_ID,$FY,$DuesAmt,$DateDue,$Paid,$NonCollectible,$DatePaid,$PaymentMethod,
					$Lien,$LienRefNo,$DateFiled,$Disposition,$FilingFee,$ReleaseFee,$DateReleased,$LienDatePaid,$AmountPaid,
					$StopInterestCalc,$FilingFeeInterest,$AssessmentInterest,$InterestNotPaid,$BankFee,$LienComment,$Comments,$username);

			// Loop through all member properties, set the statement with new values and execute to insert the Assessments record
			while($row = $result->fetch_assoc()) {
				$cnt = $cnt + 1;

				$Parcel_ID = $row["Parcel_ID"];
				$OwnerID = $row["OwnerID"];

				if (!$stmt->execute()) {
					error_log("Add Assessment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error);
					echo "Add Assessment Execute failed: (" . $stmt->errno . ") " . $stmt->error;
				}
			} // End of while($row = $result->fetch_assoc()) {
		} // End of if ($result->num_rows > 0) {
		
		$stmt->close();
		
		$adminRec->message = "Added assessments for Fiscal Year " . $FY . ' and a Dues Amount of $' . $duesAmt . ' for ' . $cnt . ' members';
		$adminRec->result = "Valid";
	}
// End of if ($action == "AddAssessments") {
} else if ($action == "DuesNotices" || $action == "DuesEmails") {

	$outputArray = array();

	// Get the current Fiscal Year value
	$result = $conn->query("SELECT MAX(FY) AS maxFY FROM hoa_assessments; ");
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$fy = $row["maxFY"];
		}
		$result->close();
	}
	
	// Loop through all the member properties
		//$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Member = 1 AND p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ";		
		
	//"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
	// testing dues statements

	$sql = '';
	if ($action == "DuesEmails") {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
				"WHERE p.UseEmail AND p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
				"AND a.FY = " . $fy . " AND a.Paid = 0 ORDER BY p.Parcel_ID; ";
		
	} else {
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
				"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
				"AND a.FY = " . $fy . " AND a.Paid = 0 ORDER BY p.Parcel_ID; ";
		}
		
		$stmt = $conn->prepare($sql);
		$stmt->execute();
		$result = $stmt->get_result();
		$stmt->close();
		
		$cnt = 0;
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$cnt = $cnt + 1;

				//$Parcel_ID = $row["Parcel_ID"];
				//$OwnerID = $row["OwnerID"];
				//$FY = $row["Own"];
				/*					
				if (!$stmt->execute()) {
					error_log("Execute failed: " . $stmt->errno . ", Error = " . $stmt->error);
					echo "Execute failed: (" . $stmt->errno . ") " . $stmt->error;
				}
				*/
			
				//if ($cnt < 101) {
					//$hoaRec = getHoaRec($conn,$Parcel_ID,$OwnerID,NULL,NULL);
					//array_push($outputArray,$hoaRec);
				//}
				
				$hoaPropertyRec = new HoaPropertyRec();
				
				$hoaPropertyRec->parcelId = $row["Parcel_ID"];
				$hoaPropertyRec->lotNo = $row["LotNo"];
				$hoaPropertyRec->subDivParcel = $row["SubDivParcel"];
				$hoaPropertyRec->parcelLocation = $row["Parcel_Location"];
				$hoaPropertyRec->ownerName = $row["Owner_Name1"] . ' ' . $row["Owner_Name2"];
				$hoaPropertyRec->ownerPhone = $row["Owner_Phone"];
				
				array_push($outputArray,$hoaPropertyRec);
			}
			
			/*
			$serializedArray = serialize($outputArray);
			if (function_exists('mb_strlen')) {
				$size = mb_strlen($serializedArray, '8bit');
			} else {
				$size = strlen($serializedArray);
			}
			
			error_log("END Array cnt = " . count($outputArray) . ', size = ' . round($size/1000,0) . 'K bytes');
			[09-Apr-2016 22:26:04 Europe/Paris] BEG Array
			[09-Apr-2016 22:26:12 Europe/Paris] END Array cnt = 542, size = 5209K bytes				
			*/
			
			$adminRec->hoaPropertyRecList = $outputArray;
		}

		$adminRec->message = "Completed data lookup for Dues Notices";
		$adminRec->result = "Valid";
}
	
	// Close db connection
	$conn->close();

	echo json_encode($adminRec);
?>
