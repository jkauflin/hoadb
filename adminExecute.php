<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Functions to execute Admin operations
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-04-09 JJK	Added Dues Statements
 * 2016-04-15 JJK   Dropped some unused Assessments fields
 * 2016-09-02 JJK   Added NonCollectible field 
 * 2016-11-28 JJK   Added InterestNotPaid and BankFee fields
 * 2017-06-10 JJK	Added unpaid dues ranking
 * 2017-08-13 JJK   Added Dues email TEST, and addition of Paypal emails
 *                  to the member list of who to send emails to
 * 2018-11-14 JJK	Re-factor fror modules
 * 2018-11-16 JJK	Modified Dues queries to return all data needed (to fix
 * 					issues with async loop processing)
 * 2018-11-21 JJK	Modified to accept a Parcel Id for the due email test
 * 2019-09-22 JJK   Checked logic for dues emails and communications
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

    $action = getParamVal("action");
	$fiscalYear = getParamVal("fy");
	$duesAmt = strToUSD(getParamVal("duesAmt"));
	$duesEmailTestParcel = getParamVal("duesEmailTestParcel");

    $adminLevel = $userRec->userLevel;

	$conn = getConn($host, $dbadmin, $password, $dbname);

	if ($action == "AddAssessments") {
		if ($adminLevel < 2) {
			$adminRec->message = "You do not have permissions to Add Assessments.";
			$adminRec->result = "Not Valid";
		} else {
			// Loop through all the member properties
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Member = 1 AND p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ";		
			$stmt = $conn->prepare($sql);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
			
			$cnt = 0;
			if ($result->num_rows > 0) {
				$OwnerID = 0;
				$Parcel_ID = "";
				$FY = intval($fiscalYear);
				$DuesAmt = '$' . strval($duesAmt);
				$DateDue = strval($fiscalYear-1) . "-10-01";
				$Paid = 0;
				$NonCollectible = 0;
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
				$InterestNotPaid = 0;
				$BankFee = "";
				$LienComment = "";
					
				$Comments = "";

				$sqlStr = 'INSERT INTO hoa_assessments (OwnerID,Parcel_ID,FY,DuesAmt,DateDue,Paid,NonCollectible,DatePaid,PaymentMethod,
								Lien,LienRefNo,DateFiled,Disposition,FilingFee,ReleaseFee,DateReleased,LienDatePaid,AmountPaid,
								StopInterestCalc,FilingFeeInterest,AssessmentInterest,InterestNotPaid,BankFee,LienComment,Comments,LastChangedBy,LastChangedTs) ';
				$sqlStr = $sqlStr . ' VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP); ';
				$stmt = $conn->prepare($sqlStr);
				$stmt->bind_param("isissiississssssssississss",$OwnerID,$Parcel_ID,$FY,$DuesAmt,$DateDue,$Paid,$NonCollectible,$DatePaid,$PaymentMethod,
						$Lien,$LienRefNo,$DateFiled,$Disposition,$FilingFee,$ReleaseFee,$DateReleased,$LienDatePaid,$AmountPaid,
						$StopInterestCalc,$FilingFeeInterest,$AssessmentInterest,$InterestNotPaid,$BankFee,$LienComment,$Comments,$userRec->userName);

				// Loop through all member properties, set the statement with new values and execute to insert the Assessments record
				while($row = $result->fetch_assoc()) {
					$cnt = $cnt + 1;

					$Parcel_ID = $row["Parcel_ID"];
					$OwnerID = $row["OwnerID"];

					if (!$stmt->execute()) {
						error_log("Add Assessment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error);
						echo "Add Assessment Execute failed: (" . $stmt->errno . ") " . $stmt->error;
					}

				} // End of while($row = $result->fetch_assoc()) {
			} // End of if ($result->num_rows > 0) {
			
			$stmt->close();
			
			$adminRec->message = "Added assessments for Fiscal Year " . $FY . ' and a Dues Amount of $' . $duesAmt . ' for ' . $cnt . ' members';
			$adminRec->result = "Valid";
		}
	// End of if ($action == "AddAssessments") {
	} else if ($action == "AdminFix") {

		if ($adminLevel < 2) {
			$adminRec->message = "You do not have permissions to run this command.";
			$adminRec->result = "Not Valid";
		} else {
			// Loop through all the member properties
			$sql = "SELECT * FROM hoa_properties p, hoa_payments y, hoa_owners o WHERE p.Member = 1 AND p.Parcel_ID = y.Parcel_ID AND p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ";		
			$stmt = $conn->prepare($sql);
			$stmt->execute();
			$result = $stmt->get_result();
			$stmt->close();
									
			$cnt = 0;
			if ($result->num_rows > 0) {
				$Parcel_ID = "";
				$OwnerID = 0;
										
				// Loop through all member properties, set the statement with new values and execute to insert the Assessments record
				while($row = $result->fetch_assoc()) {
					$cnt = $cnt + 1;
					$Parcel_ID = $row["Parcel_ID"];
					$OwnerID = $row["OwnerID"];

					if (!$stmt = $conn->prepare("UPDATE hoa_payments SET OwnerID=? WHERE Parcel_ID = ? ; ")) {
						error_log("Update Payment Prepare failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
						//echo "Prepare failed: (" . $stmt->errno . ") " . $stmt->error;
					}
					if (!$stmt->bind_param("is", $OwnerID,$Parcel_ID)) {
						error_log("Update Payment Bind failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
						//echo "Bind failed: (" . $stmt->errno . ") " . $stmt->error;
					}
		
					error_log(date('[Y-m-d H:i] '). "AdminFix Cnt = " . $cnt . ", ParcelId = " . $Parcel_ID . ", OwnerId = " . $OwnerID . ", Email = " . $row["payer_email"] . PHP_EOL, 3, "jjk-AdminFix.log");
					if (!$stmt->execute()) {
						error_log("Add Assessment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error);
						echo "Add Assessment Execute failed: (" . $stmt->errno . ") " . $stmt->error;
					}
					$stmt->close();
											
				} // End of while($row = $result->fetch_assoc()) {
			} // End of if ($result->num_rows > 0) {
									
			$adminRec->message = 'Successfully updated Payments';
			$adminRec->result = "Valid";
		}
		
	} else if ($action == "DuesNotices" || $action == "DuesEmails" || $action == "DuesEmailsTest" || $action == "DuesRank" || $action == "MarkMailed") {

		$outputArray = array();
		$adminRec->hoaRecList = array();

		// Get the current Fiscal Year value
		$result = $conn->query("SELECT MAX(FY) AS maxFY FROM hoa_assessments; ");
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$fy = $row["maxFY"];
			}
			$result->close();
		}
		
		// Loop through all the member properties
			//$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Member = 1 AND p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ";		
			
		//"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
		// testing dues statements

		$sql = '';
		if ($action == "DuesEmails" || $action == "DuesEmailsTest") {
            // 2/15/2020 JJK - Removed the TEST parcel functionality - just query the same list and send a test email for the 1st one
			//if ($action == "DuesEmailsTest") {
			//	$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
			//			"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
			//			"AND a.FY = " . $fy . " AND p.Parcel_ID = '".$duesEmailTestParcel."'; ";
			//} else {
				$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
						"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
						"AND a.FY = " . $fy . " AND a.Paid = 0 ORDER BY p.Parcel_ID; ";
				/* Can't just use UseEmail as a flag because we want to send emails to every email address we have, regardless if they say use specifically
						$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
						"WHERE p.UseEmail AND p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
						"AND a.FY = " . $fy . " AND a.Paid = 0 ORDER BY p.Parcel_ID; ";
				*/
			//}
			$adminRec->message = "Completed data lookup for Dues Emails";
		} else if ($action == "DuesRank") {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Member = 1 AND p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ";
			$adminRec->message = "Completed data lookup for Unpaid Dues Ranking";
		} else {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
					"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
					"AND a.FY = " . $fy . " AND a.Paid = 0 ORDER BY p.Parcel_ID; ";
			$adminRec->message = "Completed data lookup for Dues Notices";
		}

		$stmt = $conn->prepare($sql);
		$stmt->execute();
		$result = $stmt->get_result();
		$stmt->close();
			
		$cnt = 0;
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$cnt = $cnt + 1;

				$Parcel_ID = $row["Parcel_ID"];
				$OwnerID = $row["OwnerID"];
				//$FY = $row["Own"];

				//if ($cnt < 101) {
					//$hoaRec = getHoaRec($conn,$Parcel_ID,$OwnerID,NULL,NULL);
					//array_push($outputArray,$hoaRec);
				//}
					
				// Get all detail information and calculations for the given Parcel Id
				$hoaRec = getHoaRec($conn,$Parcel_ID,$OwnerID,NULL,NULL);
				array_push($adminRec->hoaRecList,$hoaRec);
				
				/*
				$hoaPropertyRec = new HoaPropertyRec();
					
				$hoaPropertyRec->parcelId = $row["Parcel_ID"];
				$hoaPropertyRec->lotNo = $row["LotNo"];
				$hoaPropertyRec->subDivParcel = $row["SubDivParcel"];
				$hoaPropertyRec->parcelLocation = $row["Parcel_Location"];
				$hoaPropertyRec->ownerName = $row["Owner_Name1"] . ' ' . $row["Owner_Name2"];
				$hoaPropertyRec->ownerPhone = $row["Owner_Phone"];
					
				array_push($outputArray,$hoaPropertyRec);
				*/
			}
				
			//$serializedArray = serialize($outputArray);
			/* add this as a common utility routine
			$serializedArray = serialize($adminRec);
			if (function_exists('mb_strlen')) {
				$size = mb_strlen($serializedArray, '8bit');
			} else {
				$size = strlen($serializedArray);
			}
			error_log(date('[Y-m-d H:i] '). "Array cnt = " . count($adminRec->hoaRecList) . ', size = ' . round($size/1000,0) . 'K bytes' . PHP_EOL, 3, "hoadb.log");
			*/
				
			//$adminRec->hoaPropertyRecList = $outputArray;
		}

		$adminRec->result = "Valid";
	}

	// Close db connection
	$conn->close();

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
    exit;
}
    
?>
