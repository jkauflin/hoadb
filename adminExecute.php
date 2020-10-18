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
 * 2020-10-13 JJK   Re-did dues emails logic
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
    $firstNotice = paramBoolVal("firstNotice");

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
	} else if ($action == "PaymentReconcile") {

        $fileName = 'payments.CSV';

    } else if ($action == "DuesEmails" || $action == "DuesEmailsTest") {
        $commType = '2nd Dues Notice';
        $commDesc = "Dues Notice emailed";

        // If creating Dues Letters, skip properties that don't owe anything
        $duesOwed = true;
        // Skip postal mail for 1st Notices if Member has asked to use Email
        $skipEmail = false;
        if ($firstNotice) {
            $skipEmail = true;
            $commType = '1st Dues Notice';
        }

        $adminRec->hoaRecList = getHoaRecList($conn,$duesOwed,$skipEmail);

        // Loop through the list, find the ones with an email address (maybe add a parameter to the common function)
        // and create a Communication record to get the email sent

        // get the dues email create into a common function and add a manual Send Dues Email for a particular Property???
        $testEmailAddr = '';
        if ($action == "DuesEmailsTest") {
            //var testEmailAddr = config.getVal('duesEmailTestAddress');
            $testEmailAddr = getConfigValDB($conn,'duesEmailTestAddress');
        }

        $cnt = 0;
        foreach ($adminRec->hoaRecList as $hoaRec)  {
            //echo $hoaRec->Parcel_ID;
            $cnt = $cnt + 1;

            // email list

            if ($action == "DuesEmailsTest") {

                // test a direct create & send

                if ($cnt > 0) {
                    break;
                }
            } else {
                foreach ($hoaRec->emailAddrList as $EmailAddr) {
                    insertCommRec($conn,$hoaRec->Parcel_ID,$hoaRec->ownersList[0]->OwnerID,$commType,$commDesc,
                        $hoaRec->ownersList[0]->Mailing_Name,true,$EmailAddr,'N',$userRec->userName);
                }
            }



        }

		$adminRec->message = "Completed data lookup for Dues Emails cnt = $cnt";

		$adminRec->result = "Valid";
	}

	// Close db connection
	$conn->close();

	echo json_encode($adminRec);

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
	$adminRec->message = $e->getMessage();
    $adminRec->result = "Not Valid";
	echo json_encode($adminRec);
    /*
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
    */
}
    
?>
