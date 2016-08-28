<?php
/*==============================================================================
 * (C) Copyright 2015,2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-05-14 JJK 	Initial version to update assessment and payment records 
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

function updAssessmentPaid($parcelId,$ownerId,$fy,$txn_id,$payment_date,$payer_email,$payment_amt,$payment_fee) {

	$conn = getConn();
	
	// Get the HOA record for this Parcel and Owner
	$hoaRec = getHoaRec($conn,$parcelId,$ownerId,'','SKIP-SALES');
	if ($hoaRec == null || $hoaRec->Parcel_ID == null || $hoaRec->Parcel_ID != $parcelId) {
		// ERROR - hoa record not found
		error_log(date('[Y-m-d H:i] ') . 'No HOA rec found for Parcel ' . $parcelId . PHP_EOL, 3, LOG_FILE);
	} else {
		
		// double check total due ???
		
		// Idempotent check - Check for any payment record for this parcel and transaction id
		$hoaPaymentRec = getHoaPaymentRec($conn,$parcelId,$txn_id);
		if ($hoaPaymentRec != null) {
			// Payment transaction already exists - ignore updates or other logic
			error_log(date('[Y-m-d H:i] ') . 'Transaction already recorded for Parcel ' . $parcelId . ', txn_id = ' . $txn_id . PHP_EOL, 3, LOG_FILE);
		} else {
			//error_log(date('[Y-m-d H:i] ') . 'Insert payment for Parcel ' . $parcelId . ', txn_id = ' . $txn_id . PHP_EOL, 3, LOG_FILE);
		
			$sqlStr = 'INSERT INTO hoa_payments (Parcel_ID,OwnerID,FY,txn_id,payment_date,payer_email,payment_amt,payment_fee,LastChangedTs) ';
			$sqlStr = $sqlStr . ' VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP); ';
			$stmt = $conn->prepare($sqlStr);
			$stmt->bind_param("siisssdd",$parcelId,$ownerId,$fy,$txn_id,$payment_date,$payer_email,$payment_amt,$payment_fee);
		
			if (!$stmt->execute()) {
				error_log(date('[Y-m-d H:i] ') . "Add Payment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
			}
		
			$stmt->close();
		
			// Update Assessment record for payment		
			$assessmentsComments = $txn_id;
		
			$paidBoolean = 1;
			$datePaid = date("Y-m-d");
			$paymentMethod = 'Paypal';
			$username = 'ipnHandler';
		
			if (!$stmt = $conn->prepare("UPDATE hoa_assessments SET Paid=?,DatePaid=?,PaymentMethod=?," .
					"Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? AND FY = ? ; ")) {
					error_log("Update Assessment Prepare failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
					//echo "Prepare failed: (" . $stmt->errno . ") " . $stmt->error;
			}
			if (!$stmt->bind_param("isssssi", $paidBoolean,$datePaid,$paymentMethod,$assessmentsComments,$username,$parcelId,$fy)) {
				error_log("Update Assessment Bind failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
				//echo "Bind failed: (" . $stmt->errno . ") " . $stmt->error;
			}
		
			if (!$stmt->execute()) {
				error_log("Update Assessment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
				//echo "Add Assessment Execute failed: (" . $stmt->errno . ") " . $stmt->error;
			}
		
			$stmt->close();
		

			$payerInfo = 'Thank you for your GRHA member dues payment.  Our records have been successfully updated to show that the assessment has been PAID.  ';
			$payerInfo .= 'You can use the Dues Checker on our website (www.grha-dayton.org) to see the updated record. ';
			$payerInfo .= 'Your dues will be used to promote the recreation, health, safety, and welfare of the ';
			$payerInfo .= 'residents in the Properties, and for the improvement and maintenance of the Common Areas. ';

			$treasurerInfo = 'The following payment has been recorded and the assessment has been marked as PAID.';
				
			$paymentInfoStr = '<br><br>Parcel Id: ' . $parcelId;
			$paymentInfoStr .= '<br>Fiscal Year: ' . $fy;
			$paymentInfoStr .= '<br>Transaction Id: ' . $txn_id;
			$paymentInfoStr .= '<br>Payment Date: ' . $payment_date;
			$paymentInfoStr .= '<br>Payer Email: ' . $payer_email;
			$paymentInfoStr .= '<br>Payment Amount: ' . $payment_amt . ' (this includes the $4.00 processing fee) <br>';
			
			$subject = 'GRHA Payment Notification';
			$messageStr = '<h3>GRHA Payment Notification</h3>' . $treasurerInfo . $paymentInfoStr;
			//sendHtmlEMail("johnkauflin@gmail.com",$subject,$messageStr,getConfigVal("fromEmailAddress"));
			sendHtmlEMail(getConfigValDB($conn,"paymentEmailList"),$subject,$messageStr,getConfigVal("fromEmailAddress"));

			$subject = 'GRHA Payment Confirmation';
			$messageStr = '<h3>GRHA Payment Confirmation</h3>' . $payerInfo . $paymentInfoStr;
			//sendHtmlEMail("johnkauflin@gmail.com",$subject,$messageStr,getConfigVal("fromEmailAddress"));
			sendHtmlEMail($payer_email,$subject,$messageStr,getConfigVal("fromEmailAddress"));
					
			
		} // End of if Transaction not found
		
	} // End of if Parcel found
	
	// Close db connection
	$conn->close();
	
	return $hoaRec;
} // End of function updAssessmentPaid($parcelId,$ownerId,$fy,$txn_id,$payment_date,$payer_email,$payment_amt,$payment_fee) {
	
?>
