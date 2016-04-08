<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Functions to validate Admin operations (i.e. check permissions
 * 				parameters, timing, etc.)
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-04-05 JJK 	Added Add AddAssessments
 * 2016-04-07 JJK	Added new Lien fields 
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
$duesAmt = getParamVal("duesAmt");

$adminLevel = getAdminLevel();

if ($action == "AddAssessments") {
	if ($adminLevel < 2) {
		$adminRec->message = "You do not have permissions to Add Assessments.";
		$adminRec->result = "Not Valid";
	} else {

		// Loop through all the member properties
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Member = 1 AND p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ";		
		$conn = getConn();
		$stmt = $conn->prepare($sql);
		$stmt->execute();
		$result = $stmt->get_result();
		$stmt->close();
		
		$cnt = 0;
		if ($result->num_rows > 0) {

			
			$OwnerID = 0;
			$Parcel_ID = "";
			$FY = intval($fiscalYear);
			$DuesAmt = strval($duesAmt);
			$DateDue = strval($fiscalYear) . "-10-01";
			$Paid = 0;
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
			$LienComment = "";
				
			$LotNo = 0;
			$SubDivParcel = 0;
			$Parcel_Location = "";
			$Mailing_Name = "";
			$Address_Line1 = "";
			$Address_Line2 = "";
			$Address_City = "";
			$Address_State = "";
			$Address_Zip = "";
			$Property_Street_No = 0;
			$Property_Street_Name = "";
			$Property_City = "";
			$Property_State = "";
			$Property_Zip = "";
			$Comments = "";
		
			$sqlStr = 'INSERT INTO hoa_assessments (OwnerID,Parcel_ID,FY,DuesAmt,DateDue,Paid,DatePaid,PaymentMethod,
							Lien,LienRefNo,DateFiled,Disposition,FilingFee,ReleaseFee,DateReleased,LienDatePaid,AmountPaid,StopInterestCalc,FilingFeeInterest,AssessmentInterest,LienComment,
							LotNo,SubDivParcel,Parcel_Location,Mailing_Name,Address_Line1,Address_Line2,Address_City,Address_State,Address_Zip,Property_Street_No,Property_Street_Name,
							Property_City,Property_State,Property_Zip,Comments,LastChangedBy,LastChangedTs) ';
			$sqlStr = $sqlStr . ' VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP); ';
			$stmt = $conn->prepare($sqlStr);
			//error_log("stmt = ".$stmt);
			$stmt->bind_param("isissississssssssisssiisssssssissssss",$OwnerID,$Parcel_ID,$FY,$DuesAmt,$DateDue,$Paid,$DatePaid,$PaymentMethod,
					$Lien,$LienRefNo,$DateFiled,$Disposition,$FilingFee,$ReleaseFee,$DateReleased,$LienDatePaid,$AmountPaid,$StopInterestCalc,$FilingFeeInterest,$AssessmentInterest,$LienComment,
					$LotNo,$SubDivParcel,$Parcel_Location,$Mailing_Name,$Address_Line1,$Address_Line2,$Address_City,$Address_State,$Address_Zip,$Property_Street_No,$Property_Street_Name,$Property_City,$Property_State,$Property_Zip,$Comments,$username);
			
			while($row = $result->fetch_assoc()) {
				$cnt = $cnt + 1;

				$Parcel_ID = $row["Parcel_ID"];
				$OwnerID = $row["OwnerID"];
					
				if (!$stmt->execute()) {
					error_log("Add Assessment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error);
					echo "Add Assessment Execute failed: (" . $stmt->errno . ") " . $stmt->error;
				}
			}
		}		
		
		$stmt->close();
		$conn->close();		
		
		$adminRec->message = "Added assessments for Fiscal Year " . $FY . ' and a Dues Amount of ' . $duesAmt . ' for ' . $cnt . ' members, OwnerID = ' . $OwnerID;
		$adminRec->result = "Valid";
	}
// End of if ($action == "AddAssessments") {
} else if ($action == "new action") {
	
}
	/*
	$conn = getConn();
	$hoaSalesReportRec = getHoaSalesRecList($conn,$notProcessedBoolean);
	
	
	// Close db connection
	$conn->close();
	*/

	echo json_encode($adminRec);
?>
