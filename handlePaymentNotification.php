<?php
/*==============================================================================
 * (C) Copyright 2016,2020 John J Kauflin, All rights reserved.
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
 * 2016-08-26 JJK   Changed from sandbox to live production
 * 2020-08-05 JJK   Modified to include hoaDbCommon and call function there
 *                  to do the update the HOA database
 * 2020-09-08 JJK   Added email to notify of problems (INVALID) for the 
 *                  Access Denied issue
 *============================================================================*/
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Include database connection credentials from an external includes location
require_once getSecretsFilename2();
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./paypal-ipn.log");


// CONFIG: Enable debug mode. This means we'll log requests into 'ipn.log' in the same directory.
// Especially useful if you encounter network errors or other intermittent problems with IPN (validation).
// Set this to 0 once you go live or don't require logging.
define("DEBUG", 1);

// Set to 0 once you're ready to go live
//define("USE_SANDBOX", 1);
define("USE_SANDBOX", 0);

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

error_log(date('[Y-m-d H:i] '). "-" . PHP_EOL, 3, LOG_FILE);
error_log(date('[Y-m-d H:i] '). "======================================================================" . PHP_EOL, 3, LOG_FILE);

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
            error_log(date('[Y-m-d H:i] '). " " . PHP_EOL, 3, LOG_FILE);
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
	$payment_amt = $_POST['mc_gross'];
	error_log(date('[Y-m-d H:i] '). '$payment_amt = ' . $payment_amt . PHP_EOL, 3, LOG_FILE);
	$payment_fee = $_POST['mc_fee'];
	error_log(date('[Y-m-d H:i] '). '$payment_fee = ' . $payment_fee . PHP_EOL, 3, LOG_FILE);
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
	//error_log(date('[Y-m-d H:i] '). '$custom 0 = ' . $customFieldArray[0] . PHP_EOL, 3, LOG_FILE);
	//error_log(date('[Y-m-d H:i] '). '$custom 1 = ' . $customFieldArray[1] . PHP_EOL, 3, LOG_FILE);

	$test_ipn = $_POST['test_ipn'];
	if (!USE_SANDBOX && $test_ipn) {
		// ERROR
		if(DEBUG == true) {
			error_log(date('[Y-m-d H:i] '). "Non-SANDBOX payment should not have test_ipn set ". PHP_EOL, 3, LOG_FILE);
		}
	}
	
	$payment_status = $_POST['payment_status'];
	
	error_log(date('[Y-m-d H:i] ') . '$payment_status = ' . $payment_status . PHP_EOL, 3, LOG_FILE);
	
	if ($payment_status == "Completed") {
		//			$customValues = $parcelId . ',' . $ownerId . ',' . $fyPayment . ',' .$hoaRec->TotalDue;
		$parcelId = $customFieldArray[0];
		$ownerId = $customFieldArray[1];
		$fy = $customFieldArray[2];
		$totalDue = $customFieldArray[3];
		
		// get Total Due
		// compare payment to total due
		// if paid off, update paid flags on assessment(s)

        $conn = getConn($host, $dbadmin, $password, $dbname);
		updAssessmentPaid(
            $conn,
            $parcelId,
            $ownerId,
            $fy,
            $txn_id,
            $payment_date,
            $payer_email,
            $payment_amt,
            $payment_fee,
            $fromEmailAddress);
		
	} // End of if ($payment_status == "Completed") {

	if(DEBUG == true) {
		error_log(date('[Y-m-d H:i] '). "Verified IPN: $req ". PHP_EOL, 3, LOG_FILE);
	}
	
	// End of if VALID
	
} else if (strcmp ($res, "INVALID") == 0) {
	// log for manual investigation
	// Add business logic here which deals with invalid IPN messages
	if(DEBUG == true) {
		error_log(date('[Y-m-d H:i] '). "Invalid IPN: $req" . PHP_EOL, 3, LOG_FILE);
	}
	// Send an email announcing the IPN message is INVALID
    $subject = 'GRHA Payment verification INVALID';
	$messageStr = '<h3>GRHA Payment verification INVALID</h3> Error in updating HOADB from Paypal payment - check paypal log';
    sendHtmlEMail($adminEmailList,$subject,$messageStr,$fromEmailAddress);
} else {
	error_log(date('[Y-m-d H:i] '). "UN-VERIFIED IPN: $req" . PHP_EOL, 3, LOG_FILE);
    $subject = 'GRHA Payment verification ERROR';
	$messageStr = '<h3>GRHA Payment verification ERROR</h3> Error in verifying IPN, and updating HOADB from Paypal payment - check paypal log';
    sendHtmlEMail($adminEmailList,$subject,$messageStr,$fromEmailAddress);
}

?>
