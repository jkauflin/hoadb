<?php
/*==============================================================================
 * (C) Copyright 2015,2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data
 * 2016-04-10 JJK	Added new lien fields to the update 
 * 2016-07-08 JJK   Added logic to set current date on paid and lien if not 
 * 					specified
 * 2016-09-02 JJK   Added NonCollectible field 
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	$currDateStr = date("Y-m-d");
	$username = getUsername();

	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	$fy = getParamVal("fy");
	
	$ownerId = getParamVal("ownerId");
	$duesAmount = getParamVal("duesAmount");
	$dateDue = getParamVal("dateDue");
	$paidBoolean = paramBoolVal("paidBoolean");
	$nonCollectibleBoolean = paramBoolVal("nonCollectibleBoolean");
	$datePaid = getParamVal("datePaid");
	$paymentMethod = getParamVal("paymentMethod");
	$assessmentsComments = getParamVal("assessmentsComments");

	$lienBoolean = paramBoolVal("lienBoolean");
	$lienRefNo = getParamVal("lienRefNo");
	$dateFiled = getParamVal("dateFiled");
	$disposition = getParamVal("disposition");
	$filingFee = getParamVal("filingFee");
	$releaseFee = getParamVal("releaseFee");
	$dateReleased = getParamVal("dateReleased");
	$lienDatePaid = getParamVal("lienDatePaid");
	$amountPaid = getParamVal("amountPaid");
	$stopInterestCalcBoolean = paramBoolVal("stopInterestCalcBoolean");
	$filingFeeInterest = getParamVal("filingFeeInterest");
	$assessmentInterest = getParamVal("assessmentInterest");
	$lienComment = getParamVal("lienComment");
	
	if ($lienBoolean && $disposition == '') {
		$disposition = 'Open';
	}
	
	// if paid and Date Paid not set - set it to current date?
	if ($paidBoolean && $datePaid == '') {
		$datePaid = $currDateStr;
	}
	
	// if lien and Date Filed not set - set to current date?
	if ($lienBoolean && $dateFiled == '') {
		$dateFiled = $currDateStr;
	}

	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();

	if (!$stmt = $conn->prepare("UPDATE hoa_assessments SET OwnerID=?,DuesAmt=?,DateDue=?,Paid=?,NonCollectible=?,DatePaid=?,PaymentMethod=?," .
							"Lien=?,LienRefNo=?,DateFiled=?,Disposition=?,FilingFee=?,ReleaseFee=?,DateReleased=?,LienDatePaid=?,AmountPaid=?," .
							"StopInterestCalc=?,FilingFeeInterest=?,AssessmentInterest=?,LienComment=?," .	
							"Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? AND FY = ? ; ")) {
		error_log("Prepare failed: " . $stmt->errno . ", Error = " . $stmt->error);
		echo "Prepare failed: (" . $stmt->errno . ") " . $stmt->error;
	}
	if (!$stmt->bind_param("issiississssssssisssssss", $ownerId,$duesAmount,$dateDue,$paidBoolean,$nonCollectibleBoolean,$datePaid,$paymentMethod,
						$lienBoolean,$lienRefNo,$dateFiled,$disposition,$filingFee,$releaseFee,$dateReleased,$lienDatePaid,$amountPaid,
						$stopInterestCalcBoolean,$filingFeeInterest,$assessmentInterest,$lienComment,
						$assessmentsComments,$username,$parcelId,$fy)) {
		error_log("Bind failed: " . $stmt->errno . ", Error = " . $stmt->error);
		echo "Bind failed: (" . $stmt->errno . ") " . $stmt->error;
	}

	if (!$stmt->execute()) {
		error_log("Add Assessment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error);
		echo "Add Assessment Execute failed: (" . $stmt->errno . ") " . $stmt->error;
	}
	
	$stmt->close();
	$conn->close();

	echo 'Update Successful, parcelId = ' . $parcelId;
	
?>
