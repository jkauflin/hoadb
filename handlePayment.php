<?php
/*==============================================================================
 * (C) Copyright 2016,2020,2021 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION: Handle notification from payment merchant - insert a payment
 * 				transaction record, update paid flags, and send an email to
 * 				the payer.  This service is called from the client after
 *              it has created the order and gotten approval from Paypal
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
 * 2020-09-19 JJK   Corrected email issue by including autoload.php
 * 2020-12-31 JJK   New version (not using IPN), using PHP SDK for Paypal API
 * 2020-01-03 JJK   Modified to go Live with production settings
 *============================================================================*/
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");
require_once 'vendor/autoload.php'; 

// Figure out how many levels up to get to the "public_html" root folder
$webRootDirOffset = substr_count(strstr(dirname(__FILE__),"public_html"),DIRECTORY_SEPARATOR) + 1;
// Get settings and credentials from a file in a directory outside of public_html
// (assume a settings file in the "external_includes" folder one level up from "public_html")
$extIncludePath = dirname(__FILE__, $webRootDirOffset+1).DIRECTORY_SEPARATOR.'external_includes'.DIRECTORY_SEPARATOR;
require_once $extIncludePath.'hoadbSecrets.php';
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';

// Use Paypal API classes
use PayPalCheckoutSdk\Core\PayPalHttpClient;
//use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Core\ProductionEnvironment;
use PayPalCheckoutSdk\Orders\OrdersCaptureRequest;
// Creating an environment (with secrets from the external file included above)
//$environment = new SandboxEnvironment($clientId, $clientSecret);
$environment = new ProductionEnvironment($clientId, $clientSecret);
$client = new PayPalHttpClient($environment);

// Get the id of the order created in the client and paid by the member in paypal
$orderID = getParamVal("orderID");

// OrdersCaptureRequest() creates a POST request to /v2/checkout/orders (to get an order)
$request = new OrdersCaptureRequest($orderID);
$request->prefer('return=representation');
$response = null;
try {
    // Call API with your client and get a response for your call
    $response = $client->execute($request);

    // Error out if the order is NOT completed/approved
    if ($response->result->status != "COMPLETED" || 
        $response->result->purchase_units[0]->payments->captures[0]->status != "COMPLETED") {
        throw new Exception('Status is not COMPLETED', 500);
    }

    // Get the values from the response
    $parcelId = $response->result->purchase_units[0]->reference_id;
    $ownerId = 0;
    $payeeEmail = $response->result->purchase_units[0]->payee->email_address;
    $fy = $response->result->purchase_units[0]->custom_id;
    $txn_id = $response->result->purchase_units[0]->payments->captures[0]->id;
    $totalAmount = $response->result->purchase_units[0]->payments->captures[0]->amount->value;
    $payment_date = $response->result->purchase_units[0]->payments->captures[0]->create_time;
    $payment_amt = $response->result->purchase_units[0]->payments->captures[0]->seller_receivable_breakdown->gross_amount->value;
    $payment_fee = $response->result->purchase_units[0]->payments->captures[0]->seller_receivable_breakdown->paypal_fee->value;
    $payment_net = $response->result->purchase_units[0]->payments->captures[0]->seller_receivable_breakdown->net_amount->value;
    $payer_email = $response->result->payer->email_address;
    $payer_name = $response->result->payer->name->given_name . ' ' . $response->result->payer->name->surname;

    // Get a database connection and call the common function to mark paid
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
        $payment_fee);
	// Close db connection
    $conn->close();

    // Return order details to the client
    echo json_encode($response);

} catch (Exception $e) {
    error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
    error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Request = " . json_encode($request,JSON_PRETTY_PRINT) . PHP_EOL, 3, LOG_FILE);
    error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Response = " . json_encode($response,JSON_PRETTY_PRINT) . PHP_EOL, 3, LOG_FILE);
    echo json_encode($e->getMessage());
}

?>
