<?php
/*==============================================================================
 * (C) Copyright 2015,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data
 * 2016-04-10 JJK	Added new lien fields to the update 
 * 2016-07-08 JJK   Added logic to set current date on paid and lien if not 
 * 					specified
 * 2016-09-02 JJK   Added NonCollectible field 
 * 2018-11-04 JJK	Re-factored to use POST and return JSON data of
 *                  re-queried record
 * 2020-08-01 JJK   Re-factored to use jjklogin for authentication
 *============================================================================*/
require_once 'vendor/autoload.php'; 

// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Login Authentication class
require_once 'php_secure/jjklogin.php';
use \jkauflin\jjklogin\LoginAuth;
// Include database connection credentials from an external includes location
require_once getSecretsFilename();
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");

try {
    $userRec = LoginAuth::getUserRec($cookieName,$cookiePath,$serverKey);
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 1) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

	$username = $userRec->userName;

	header("Content-Type: application/json; charset=UTF-8");
	# Get JSON as a string
	$json_str = file_get_contents('php://input');

	# Decode the string to get a JSON object
	$param = json_decode($json_str);

	/*
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, parcelId = " . $param->parcelId . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, ownerId = " . $param->ownerId . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, fy = " . $param->fy . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, duesAmount = " . $param->duesAmount . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, dateDue = " . $param->dateDue . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, paidCheckbox = " . $param->paidCheckbox . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, nonCollectibleCheckbox = " . $param->nonCollectibleCheckbox . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, datePaid = " . $param->datePaid . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, paymentMethod = " . $param->paymentMethod . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, assessmentsComments = " . $param->assessmentsComments . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, lienCheckbox = " . $param->lienCheckbox . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, lienRefNo = " . $param->lienRefNo . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, dateFiled = " . $param->dateFiled . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, disposition = " . $param->disposition . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, filingFee = " . $param->filingFee . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, releaseFee = " . $param->releaseFee . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, dateReleased = " . $param->dateReleased . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, lienDatePaid = " . $param->lienDatePaid . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, amountPaid = " . $param->amountPaid . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, stopInterestCalcCheckbox = " . $param->stopInterestCalcCheckbox . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, filingFeeInterest = " . $param->filingFeeInterest . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, assessmentInterest = " . $param->assessmentInterest . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, interestNotPaidCheckbox = " . $param->interestNotPaidCheckbox . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, bankFee = " . $param->bankFee . PHP_EOL, 3, "hoadb.log");
	error_log(date('[Y-m-d H:i] '). "updHoaProperty, lienComment = " . $param->lienComment . PHP_EOL, 3, "hoadb.log");
	*/
	
	$currDateStr = date("Y-m-d");

	if ($param->lienCheckbox && $param->disposition == '') {
		$param->disposition = 'Open';
	}
	
	// if paid and Date Paid not set - set it to current date?
	if ($param->paidCheckbox && $param->datePaid == '') {
		$param->datePaid = $currDateStr;
	}
	
	// if lien and Date Filed not set - set to current date?
	if ($param->lienCheckbox && $param->dateFiled == '') {
		$param->dateFiled = $currDateStr;
	}

	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn($host, $dbadmin, $password, $dbname);

	if (!$stmt = $conn->prepare("UPDATE hoa_assessments SET OwnerID=?,DuesAmt=?,DateDue=?,Paid=?,NonCollectible=?,DatePaid=?,PaymentMethod=?," .
							"Lien=?,LienRefNo=?,DateFiled=?,Disposition=?,FilingFee=?,ReleaseFee=?,DateReleased=?,LienDatePaid=?,AmountPaid=?," .
							"StopInterestCalc=?,FilingFeeInterest=?,AssessmentInterest=?,InterestNotPaid=?,BankFee=?,LienComment=?," .	
							"Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? AND FY = ? ; ")) {
		error_log("Prepare failed: " . $stmt->errno . ", Error = " . $stmt->error);
		echo "Prepare failed: (" . $stmt->errno . ") " . $stmt->error;
	}
	if (!$stmt->bind_param("issiississssssssississssss", $param->ownerId,$param->duesAmount,$param->dateDue,$param->paidCheckbox,$param->nonCollectibleCheckbox,$param->datePaid,$param->paymentMethod,
						$param->lienCheckbox,$param->lienRefNo,$param->dateFiled,$param->disposition,$param->filingFee,$param->releaseFee,$param->dateReleased,$param->lienDatePaid,$param->amountPaid,
						$param->stopInterestCalcCheckbox,$param->filingFeeInterest,$param->assessmentInterest,$param->interestNotPaidCheckbox,$param->bankFee,$param->lienComment,
						$param->assessmentsComments,$username,$param->parcelId,$param->fy)) {
		error_log("Bind failed: " . $stmt->errno . ", Error = " . $stmt->error);
		echo "Bind failed: (" . $stmt->errno . ") " . $stmt->error;
	}

	if (!$stmt->execute()) {
		error_log("Add Assessment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error);
		echo "Add Assessment Execute failed: (" . $stmt->errno . ") " . $stmt->error;
	}
	
	$stmt->close();
	
	// Re-query the record from the database and return as a JSON structure
	$hoaRec = getHoaRec($conn,$param->parcelId,"","","",$paypalFixedAmtButtonForm,$paypalFixedAmtButtonInput);
	$hoaRec->adminLevel = $userRec->userLevel;
	$conn->close();
	echo json_encode($hoaRec);

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
    exit;
}

?>
