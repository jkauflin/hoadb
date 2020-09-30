<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION: Handle transactions from payment merchant - insert a payment
 * 				transaction record, update paid flags, and send an email to
 * 				the payer.  Executed as part of the payment reconciliation
 *              process.
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-09-26 JJK 	Initial version from handlePaymentNotification.php
 *============================================================================*/
require_once 'vendor/autoload.php'; 
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Login Authentication class
require_once 'php_secure/jjklogin.php';
use \jkauflin\jjklogin\LoginAuth;
// Include database connection credentials from an external includes location
require_once getSecretsFilename();

$adminRec = new AdminRec();
try {
    $userRec = LoginAuth::getUserRec($cookieName,$cookiePath,$serverKey);
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 1) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

	$adminRec->result = "Not Valid";
	$adminRec->message = "";
    $adminRec->userName = $userRec->userName;
    $adminRec->userLevel = $userRec->userLevel;

    $adminLevel = $userRec->userLevel;
	if ($adminLevel < 2) {
		$adminRec->message = "You do not have permissions for this function.";
        $adminRec->result = "Not Valid";
        exit(json_encode($adminRec));
    }

    header("Content-Type: application/json; charset=UTF-8");
	# Get JSON as a string
	$json_str = file_get_contents('php://input');

	# Decode the string to get a JSON object
	$param = json_decode($json_str);

	$conn = getConn($host, $dbadmin, $password, $dbname);

	updAssessmentPaid(
        $conn,
        $param->parcelId,
        $param->ownerId,
        $param->fy,
        $param->txn_id,
        $param->payment_date,
        $param->fromEmail,
        $param->gross,
        $param->fee,
        $fromEmailAddress);

        // After the update, re-query to get the flag values
        $paymentRec = new PaymentRec();
        $paymentRec->TransLogged = false;
        $paymentRec->MarkedPaid = false;
        $paymentRec->EmailSent = false;

        // Get the HOADB data by Parcel Id
    	$hoaRec = getHoaRec($conn,$param->parcelId,'',$param->fy,'SKIP-SALES');
    	if ($hoaRec != null) {
    		//error_log(date('[Y-m-d H:i:s] ') . '$hoaRec->Parcel_ID = ' . $hoaRec->Parcel_ID . ', $hoaRec->ownersList[0]->OwnerID = ' . $hoaRec->ownersList[0]->OwnerID . PHP_EOL, 3, LOG_FILE);
    		// Use the Owner Id of the current owner when recording the payment
            $paymentRec->OwnerID = $hoaRec->ownersList[0]->OwnerID;
            // Get Assessment PAID flag for the given fiscal year (FY)
            $paymentRec->MarkedPaid = $hoaRec->assessmentsList[0]->Paid;
        }

        // Get payment record by the Transaction Id
        $hoaPaymentRec = getHoaPaymentRec($conn,$param->parcelId,$param->txn_id);
        if ($hoaPaymentRec != null) {
            $paymentRec->TransLogged = true;

            // Check the paidEmailSent flag on the transaction record to check if an email was sent to the payee member
            // to confirm that the payment was recorded in the HOADB
            if ($hoaPaymentRec->paidEmailSent == 'Y') {
                $paymentRec->EmailSent = true;
            }
        }

        // Add the payment display record to the list to send back for the display
        $adminRec->paymentList = array();
        array_push($adminRec->paymentList,$paymentRec);

	// Close db connection
	$conn->close();

	$adminRec->message = "(Payment transactions processed successfully)";
	$adminRec->result = "Valid";

    echo json_encode($adminRec);

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
	$adminRec->message = $e->getMessage();
    $adminRec->result = "Not Valid";
    /*
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
    */
    echo json_encode($adminRec);
}
?>
