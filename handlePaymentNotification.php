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
 * 2016-04-30 JJK	Modified to insert payment transaction record
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';


// CONFIG: Enable debug mode. This means we'll log requests into 'ipn.log' in the same directory.
// Especially useful if you encounter network errors or other intermittent problems with IPN (validation).
// Set this to 0 once you go live or don't require logging.
define("DEBUG", 1);

// Set to 0 once you're ready to go live
define("USE_SANDBOX", 1);

define("LOG_FILE", "./ipn.log");


// Read POST data
// reading posted data directly from $_POST causes serialization
// issues with array data in POST. Reading raw POST data from input stream instead.
$raw_post_data = file_get_contents('php://input');
$raw_post_array = explode('&', $raw_post_data);
$myPost = array();
foreach ($raw_post_array as $keyval) {
	$keyval = explode ('=', $keyval);
	if (count($keyval) == 2)
		$myPost[$keyval[0]] = urldecode($keyval[1]);
}
// read the post from PayPal system and add 'cmd'
$req = 'cmd=_notify-validate';
if(function_exists('get_magic_quotes_gpc')) {
	$get_magic_quotes_exists = true;
}
foreach ($myPost as $key => $value) {
	if($get_magic_quotes_exists == true && get_magic_quotes_gpc() == 1) {
		$value = urlencode(stripslashes($value));
	} else {
		$value = urlencode($value);
	}
	$req .= "&$key=$value";
}

// Post IPN data back to PayPal to validate the IPN data is genuine
// Without this step anyone can fake IPN data

if(USE_SANDBOX == true) {
	$paypal_url = "https://www.sandbox.paypal.com/cgi-bin/webscr";
} else {
	$paypal_url = "https://www.paypal.com/cgi-bin/webscr";
}

$ch = curl_init($paypal_url);
if ($ch == FALSE) {
	return FALSE;
}

curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_RETURNTRANSFER,1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $req);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 1);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
curl_setopt($ch, CURLOPT_FORBID_REUSE, 1);

if(DEBUG == true) {
	curl_setopt($ch, CURLOPT_HEADER, 1);
	curl_setopt($ch, CURLINFO_HEADER_OUT, 1);
}

// CONFIG: Optional proxy configuration
//curl_setopt($ch, CURLOPT_PROXY, $proxy);
//curl_setopt($ch, CURLOPT_HTTPPROXYTUNNEL, 1);

// Set TCP timeout to 30 seconds
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Connection: Close'));

// CONFIG: Please download 'cacert.pem' from "http://curl.haxx.se/docs/caextract.html" and set the directory path
// of the certificate as shown below. Ensure the file is readable by the webserver.
// This is mandatory for some environments.

//$cert = __DIR__ . "./cacert.pem";
//curl_setopt($ch, CURLOPT_CAINFO, $cert);

$res = curl_exec($ch);
if (curl_errno($ch) != 0) // cURL error
	{
	if(DEBUG == true) {	
		error_log(date('[Y-m-d H:i] '). "Can't connect to PayPal to validate IPN message: " . curl_error($ch) . PHP_EOL, 3, LOG_FILE);
	}
	curl_close($ch);
	exit;

} else {
		// Log the entire HTTP response if debug is switched on.
		if(DEBUG == true) {
			error_log(date('[Y-m-d H:i] '). "HTTP request of validation request:". curl_getinfo($ch, CURLINFO_HEADER_OUT) ." for IPN payload: $req" . PHP_EOL, 3, LOG_FILE);
			error_log(date('[Y-m-d H:i] '). "HTTP response of validation request: $res" . PHP_EOL, 3, LOG_FILE);
		}
		curl_close($ch);
}

// Inspect IPN validation result and act accordingly

// Split response headers and payload, a better way for strcmp
$tokens = explode("\r\n\r\n", trim($res));
$res = trim(end($tokens));

if (strcmp ($res, "VERIFIED") == 0) {
	// check whether the payment_status is Completed
	// check that txn_id has not been previously processed
	// check that receiver_email is your PayPal email
	// check that payment_amount/payment_currency are correct
	// process payment and mark item as paid.

	// assign posted variables to local variables
	$item_name = $_POST['item_name1'];
	error_log(date('[Y-m-d H:i] '). '$item_name = ' . $item_name . PHP_EOL, 3, LOG_FILE);
	$item_number = $_POST['item_number1'];
	error_log(date('[Y-m-d H:i] '). '$item_number = ' . $item_number . PHP_EOL, 3, LOG_FILE);
	//$payment_status = $_POST['payment_status'];
	$payment_amount = $_POST['mc_gross'];
	error_log(date('[Y-m-d H:i] '). '$payment_amount = ' . $payment_amount . PHP_EOL, 3, LOG_FILE);
	$payment_currency = $_POST['mc_currency'];  // make sure it is USD?
	$txn_id = $_POST['txn_id'];
	$receiver_email = $_POST['receiver_email']; // double check to make sure this is GRHA email address
	$payer_email = $_POST['payer_email'];
	$custom = $_POST['custom'];
	
	$payment_date = $_POST['payment_date'];
	error_log(date('[Y-m-d H:i] '). '$payment_date = ' . $payment_date . PHP_EOL, 3, LOG_FILE);
	//$payment_date = Tue Apr 26 2016 14:04:17 GMT-0400 (Eastern Daylight Time)
	
	error_log(date('[Y-m-d H:i] '). '$custom = ' . $custom . PHP_EOL, 3, LOG_FILE);
	$customFieldArray = explode(',',$custom);
	error_log(date('[Y-m-d H:i] '). '$custom 0 = ' . $customFieldArray[0] . PHP_EOL, 3, LOG_FILE);
	error_log(date('[Y-m-d H:i] '). '$custom 1 = ' . $customFieldArray[1] . PHP_EOL, 3, LOG_FILE);

	$test_ipn = $_POST['test_ipn'];
	if (!USE_SANDBOX && $test_ipn) {
		// ERROR
		if(DEBUG == true) {
			error_log(date('[Y-m-d H:i] '). "Non-SANDBOX payment should not have test_ipn set ". PHP_EOL, 3, LOG_FILE);
		}
	}
	
	$payment_status = $_POST['payment_status'];
	if ($payment_status == "Completed") {
		$parcelId = $customFieldArray[0];
		$ownerId = $customFieldArray[1];
		$fy = $customFieldArray[2];
		$totalDue = $customFieldArray[3];
		
		// apply payment
		
		// get message field values
		// see if you already have a completed payment for this transaction id (idempotent)
		// insert transaction in trans table
		// get Total Due
		// compare payment to total due
		// if paid off, update paid flags on assessment(s)
		
		$conn = getConn();

		$hoaRec = getHoaRec($conn,$parcelId,$ownerId,'','SKIP-SALES');
		// double check total due ???
		
		$username = 'ipnHandler';
		updAssessmentPaid($conn,$parcelId,$fy,$txn_id,$username);
		
		// Close db connection
		$conn->close();
		
		// send email to payee and treasurer
			// thank you for your payment of X, you are all paid up, go here to print a dues statement
			// thank you for your payment of X, you still owe Y, go here to check details and get a dues statement

		$outputStr = $custom;
		$subject = 'HOA Payment Notification ';
		$messageStr = '<h2>HOA Payment Notification</h2>' . $outputStr;
		//sendHtmlEMail(getConfigVal("salesReportEmailList"),$subject,$messageStr,getConfigVal("fromEmailAddress"));
		//sendHtmlEMail("test email",$subject,$messageStr,getConfigVal("fromEmailAddress"));
		
		
	} // End of if ($payment_status == "Completed") {

	
	// JJK - This is where to implement database update or other activities
	// Update database	
	
	if(DEBUG == true) {
		error_log(date('[Y-m-d H:i] '). "Verified IPN: $req ". PHP_EOL, 3, LOG_FILE);
	}
	
	// End of if VALID
	
} else if (strcmp ($res, "INVALID") == 0) {
	// log for manual investigation
	// Add business logic here which deals with invalid IPN messages
	// *** JJK - add logic to send an email to admin ???
	if(DEBUG == true) {
		error_log(date('[Y-m-d H:i] '). "Invalid IPN: $req" . PHP_EOL, 3, LOG_FILE);
	}
	
	// Send an email announcing the IPN message is INVALID
	/*
	$mail_From    = "IPN@example.com";
	$mail_To      = "<var>Your-eMail-Address</var>";
	$mail_Subject = "INVALID IPN";
	$mail_Body    = $req;
	
	mail($mail_To, $mail_Subject, $mail_Body, $mail_From);	
	*/
}

?>
