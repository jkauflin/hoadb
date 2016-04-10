<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	$username = getUsername();

	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	$ownerId = getParamVal("ownerId");
	$fy = getParamVal("fy");
	
	$duesAmount = getParamVal("duesAmount");
	$dateDue = getParamVal("dateDue");
	$paidBoolean = paramBoolVal("paidBoolean");
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
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();
	
	error_log("$lienRefNo = ".$lienRefNo);
	
	$stmt = $conn->prepare("UPDATE hoa_assessments SET DuesAmt=?,DateDue=?,Paid=?,DatePaid=?,PaymentMethod=?,"+
							"Lien=?,LienRefNo=?,DateFiled=?,Disposition=?,FilingFee=?,ReleaseFee=?,DateReleased=?,LienDatePaid=?,AmountPaid=?,"+
							"StopInterestCalc=?,FilingFeeInterest=?,AssessmentInterest=?,LienComment=?,"+	
							"Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? AND OwnerID = ? AND FY = ? ; ");
	$stmt->bind_param("ssississssssssissssssss", $duesAmount,$dateDue,$paidBoolean,$datePaid,$paymentMethod,
						$lienBoolean,$lienRefNo,$dateFiled,$disposition,$filingFee,$releaseFee,$dateReleased,$lienDatePaid,$amountPaid,
						$stopInterestCalcBoolean,$filingFeeInterest,$assessmentInterest,$lienComment,
						$assessmentsComments,$username,$parcelId,$ownerId,$fy);
	//$stmt->execute();

				if (!$stmt->execute()) {
					error_log("Add Assessment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error);
					echo "Add Assessment Execute failed: (" . $stmt->errno . ") " . $stmt->error;
				}
	
	
	$stmt->close();
	$conn->close();

	//echo json_encode($hoaRec);
	//echo 'Update Successful - member = ' . $memberBoolean . ', vacant = ' . $vacantBoolean . ', rental = ' . $rentalBoolean . ', managed = ' . $managedBoolean . ', foreclosure = ' . $foreclosureBoolean . ', bankruptcy = ' . $bankruptcyBoolean . ', liens = ' . $liensBoolean;
	echo 'Update Successful - propertyComments = ' . $propertyComments . ', parcelId = ' . $parcelId;
	
?>
