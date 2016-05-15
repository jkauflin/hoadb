<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION: Handle notification from payment merchant - insert a payment
 * 				transaction record, update paid flags, and send an email to
 * 				the payer
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-04-26 JJK 	Initial version starting with paypal_ipn.php
 * 2016-05-02 JJK   Modified to update assessment to paid
 * 2016-05-11 JJK	Modified to insert payment transaction record
 * 2016-05-14 JJK   Moved updates to updHoaPayment
 *============================================================================*/

// Include functions to update payments and assessments tables
include 'updHoaPayment.php';


// CONFIG: Enable debug mode. This means we'll log requests into 'ipn.log' in the same directory.
// Especially useful if you encounter network errors or other intermittent problems with IPN (validation).
// Set this to 0 once you go live or don't require logging.
define("DEBUG", 1);

// Set to 0 once you're ready to go live
define("USE_SANDBOX", 1);

define("LOG_FILE", "paypal-ipn.log");


	$parcelId = getParamVal("parcelId");
	$ownerId = getParamVal("ownerId");

	
	$payment_amt = 119.00;
	$payment_fee = 3.75;
	$txn_id = '97K72554DY1400312';
	$payer_email = 'test@gmail.com';
	$payment_date = 'Tue Apr 26 2016 14:04:17 GMT-0400 (Eastern Daylight Time)';
	
	$fy = '2016';
		
	updAssessmentPaid($parcelId,$ownerId,$fy,$txn_id,$payment_date,$payer_email,$payment_amt,$payment_fee);
	

	echo 'End of handlePaymentNotificationTEST';
?>
