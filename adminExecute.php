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
 * 2020-12-21 JJK   Re-factored to use jjklogin package
 * 2022-08-29 JJK   Added PHPMailer for outgoing email sends
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
require_once $extIncludePath.'jjkloginSettings.php';
// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';

use \jkauflin\jjklogin\LoginAuth;

/*
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
//use PHPMailer\PHPMailer\Exception;
*/
/*
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mime\Email;
*/

$adminRec = new AdminRec();
try {
    $userRec = LoginAuth::getUserRec($cookieNameJJKLogin,$cookiePathJJKLogin,$serverKeyJJKLogin);
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 2) {
        throw new Exception('User does not have Admin permissions', 500);
    }

	$adminRec->result = "Not Valid";
	$adminRec->message = "";
    $adminRec->userName = $userRec->userName;
    $adminRec->userLevel = $userRec->userLevel;

    $action = getParamVal("action");
	$fiscalYear = getParamVal("fy");
	$duesAmt = strToUSD(getParamVal("duesAmt"));
	$parcelId = getParamVal("parcelId");

    $adminLevel = $userRec->userLevel;

	$conn = getConn($host, $dbadmin, $password, $dbname);

	if ($action == "AddAssessments") {
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

	// End of if ($action == "AddAssessments") {
	} else if ($action == "PaymentReconcile") {

        $fileName = 'payments.CSV';

	} else if ($action == "SalesDownload") {
        // *** 2020-12-24 Still can't get this working, the cURL won't work from host server ***
        // *** just added a manual download (to local computer), and upload function ***

        $currTimestampStr = date("Y-m-d H:i:s");
        $salesYear = substr($currTimestampStr,0,4);
        $url = getConfigValDB($conn,'countySalesDataUrl') . $salesYear . '.ZIP';
        //$zipFileName = 'SALES_' . $salesYear . '.ZIP';
        //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Sales file url = $url " . PHP_EOL, 3, LOG_FILE);
        $zipFileName = downloadUrlToFile($url);
        //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", After download " . PHP_EOL, 3, LOG_FILE);

        // get file's extension
        $ext = strtolower(pathinfo($zipFileName, PATHINFO_EXTENSION));

        if (!file_exists($zipFileName)) {
    		$adminRec->message = "County Sales file not found - check URL in Config";
            $adminRec->result = "Not Valid";
            exit(json_encode($adminRec));
        }

        // Check if upload file is parent ZIP or individual residental sales CSV
        if ($ext == 'zip') {
            $currTimestampStr = date("Y-m-d H:i:s");
            // Get the year from the current system time
            $salesYear = substr($currTimestampStr,0,4);
            // Residential sales file in the Zip collection
            $resFileName = 'SALES_' . $salesYear . '_RES.csv';
            $zipFile = new ZipArchive();
        	if (!$zipFile->open($zipFileName)) {
        		$adminRec->message = "Failed to open ZIP file.";
                $adminRec->result = "Not Valid";
                exit(json_encode($adminRec));
            }
    		$file = $zipFile->getStream($resFileName);
    		if (!$file) {
                exit("Failed to open file in downloaded, file = $resFileName\n");
            }
        } else {
            // Open the uploaded file from the temporary location
            $file = fopen($tmp_file, "r") or die("Unable to open file!");
        }

    	// Loop through all the records in the downloaded sales file and compare with HOA database parcels
        $sendMessage = false;
        $addToOutput = false;
        $outputStr = '';
        $recCnt = 0;
        $hoaRecsFound = 0;
        $newSalesFound = 0;
    	while(!feof($file))
    	{
    		$recCnt = $recCnt + 1;
    		// 1st record of CSV files are the column names so just skip them
    		if ($recCnt == 1) {
    			$salesRecCoumnArray = fgetcsv($file);
    			continue;
    		}

            $salesRecArray = fgetcsv($file);
            if (!$salesRecArray) {
                continue;
            }

    	    $parcelId = $salesRecArray[0];

            // Check if the Parcel Id from the sales record matches any in our HOA database
            // (and get the Sales record associated with the Sales Date)
    	    // sales now included in this query and in hoaRec
    		$hoaRec = getHoaRec($conn,$parcelId,"","",$salesRecArray[2]);
    		if (empty($hoaRec->Parcel_ID)) {
    			// If the parcel id is not found in the HOA db, then just skip to the next one
    			continue;
    		}

            $hoaRecsFound = $hoaRecsFound + 1;
            $hoaOwnerRec = $hoaRec->ownersList[0];

    			$addToOutput = false;
                // If the Sales record was not found, insert one
    			if ( sizeof($hoaRec->salesList) < 1) {
                    $newSalesFound = $newSalesFound +1;

                    $stmt = $conn->prepare("INSERT INTO hoa_sales VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?); ");
    				$NotificationFlag = 'Y';
                    $ProcessedFlag = 'N';
                    $lastChangedby = 'system';
                    $WelcomeSent = 'X';
    				$stmt->bind_param("sssssssssssssssss",
    				    $salesRecArray[0],
    					$salesRecArray[1],
    					$salesRecArray[2],
    					$salesRecArray[3],
    					$salesRecArray[4],
    					$salesRecArray[5],
    					$salesRecArray[6],
    					$salesRecArray[7],
    					$salesRecArray[8],
    					$salesRecArray[9],
    					$salesRecArray[10],
    					$salesRecArray[11],
    					$currTimestampStr,
    					$NotificationFlag,
    					$ProcessedFlag,
                        $lastChangedby,
                        $WelcomeSent
                    );

                    $stmt->execute();
    				$stmt->close();

                    $hoaSalesRec = getHoaSalesRec($conn,$hoaRec->Parcel_ID,$salesRecArray[2]);
    				$addToOutput = true;

    			} else {
    			    $hoaSalesRec = $hoaRec->salesList[0];
    				// If the sales record is found but there was no notification, send an email
    				if ($hoaSalesRec->NotificationFlag == 'N') {
    					$addToOutput = true;
    				}
    			}

    			if ($addToOutput) {
    				$sendMessage = true;

    				$outputStr .= '<p><table border=1 class="evenLineHighlight"><tbody>';
    				$outputStr .= '<tr><th>Parcel Id:</th><td>' . $parcelId . '</td></tr>';
    				$outputStr .= '<tr><th>Parcel Location:</th><td><b>' . $hoaRec->Parcel_Location . '</b></td></tr>';
    				$outputStr .= '<tr><th>Old Owner:</th><td>' . $hoaSalesRec->OLDOWN . '</td></tr>';
    				$outputStr .= '<tr><th>HOA Owner:</th><td>' . $hoaOwnerRec->Owner_Name1 . ' ' . $hoaOwnerRec->Owner_Name2 . '</td></tr>';
    				$outputStr .= '<tr><th>New Owner1:</th><td>' . $hoaSalesRec->OWNERNAME1 . '</td></tr>';
    				$outputStr .= '<tr><th>Mailing Name1:</th><td>' . $hoaSalesRec->MAILINGNAME1 . '</td></tr>';
    				$outputStr .= '<tr><th>Mailing Name2:</th><td>' . $hoaSalesRec->MAILINGNAME2 . '</td></tr>';
    				$outputStr .= '<tr><th>Sale Date:</th><td>' . $hoaSalesRec->SALEDT . '</td></tr>';
    				$outputStr .= '</tbody></table></p>';
    			}

    		//$outputStr .= '<br>' . $valArray[0];

    	} // End of while(!feof($file))
    	fclose($file);

        /*
    	if ($sendMessage) {
    		$subject = 'HOA Residential Sales in ' . $salesYear;
    		$messageStr = '<h2>HOA Residential Sales in ' . $salesYear . '</h2>' . $outputStr;
            $sendMailSuccess = sendHtmlEMail($salesReportEmailList,$subject,$messageStr,$fromEmailAddress);
            if (!$sendMailSuccess) {
                // If fail to send email maybe go back and update the default Y flag back to N ?
            }
        }
        */

        $adminRec->message = "County Sales file downloaded and processed successfully (Check Sales Report) </br>".
                                " Total recs = $recCnt, HOA recs found = $hoaRecsFound, New HOA sales found = $newSalesFound";
    	$adminRec->result = "Valid";


    } else if (substr( $action,0,10) == "DuesEmails") {
        $testMessage = '';
        if ($action == "DuesEmailsTest") {
            $subject = getConfigValDB($conn,'hoaNameShort') . ' Dues Notice TEST';
            $EmailAddr = getConfigValDB($conn,'duesEmailTestAddress');
            $messageStr = createDuesMessage($conn,$parcelId);
            $sendMailSuccess = sendHtmlEMail($EmailAddr,$subject,$messageStr,$fromTreasurerEmailAddress);
            $testMessage = ' (Test email sent for Parcel Id = ' . $parcelId . ')';

            // 2022-08-27 JJK
            error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", $testMessage, success = $sendMailSuccess " . PHP_EOL, 3, LOG_FILE);


        } else if ($action == "DuesEmailsCreateList") {
            // Delete the previous list of any outstanding dues emails to send
            $sql = "DELETE FROM hoa_communications WHERE Email = 1 AND SentStatus = 'N' ";
    		$stmt = $conn->prepare($sql);
    	    $stmt->execute();
            $stmt->close();

            // Create new list of dues emails to send
            $commType = 'Dues Notice';
            $commDesc = "Sent to Owner email";
            // If creating Dues Letters, skip properties that don't owe anything
            $duesOwed = true;
            $hoaRecList = getHoaRecList($conn,$duesOwed);

            // Loop through the list, find the ones with an email address
            $cnt = 0;
            foreach ($hoaRecList as $hoaRec)  {
                $cnt = $cnt + 1;
                foreach ($hoaRec->emailAddrList as $EmailAddr) {
                    insertCommRec($conn,$hoaRec->Parcel_ID,$hoaRec->ownersList[0]->OwnerID,$commType,$commDesc,
                        $hoaRec->ownersList[0]->Mailing_Name,1,$EmailAddr,'N',$userRec->userName);
                }
            }

        } else if ($action == "DuesEmailsSendList") {
            // Get list of outstanding dues emails to send
            $sql = "SELECT * FROM hoa_communications WHERE Email = 1 AND SentStatus = 'N' ORDER BY Parcel_ID ";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->get_result();
            $stmt->close();

            $subject = getConfigValDB($conn,'hoaNameShort') . ' Dues Notice';
            //$firstNotice = false;
            $maxRecs = (int) getConfigValDB($conn,'duesEmailBatchMax');

            // 2022-08-27 JJK
            error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", DuesEmailsSendList maxRecs = $maxRecs " . PHP_EOL, 3, LOG_FILE);

            $sendMailSuccess = false;
            if ($result->num_rows > 0) {
                // 2022-08-27 JJK
                error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", DuesEmailsSendList $result->num_rows = $result->num_rows " . PHP_EOL, 3, LOG_FILE);

                $cnt = 0;
                $Parcel_ID = '';
                while($row = $result->fetch_assoc()) {
                    $cnt = $cnt + 1;
                    if ($cnt > $maxRecs) {
                        break;
                    }

                    $CommID = $row["CommID"];
                    $Parcel_ID = $row["Parcel_ID"];
                    $EmailAddr = $row["EmailAddr"];
                    $messageStr = createDuesMessage($conn,$Parcel_ID);

                    /*
                    $sendMailSuccess = sendHtmlEMail($EmailAddr,$subject,$messageStr,$fromTreasurerEmailAddress);
                    // If the Member email was successful, update the flag on the communication record
                    if ($sendMailSuccess) {
                        // if successful change sent to 'Y' and update Last changed timestamp
                        setCommEmailSent($conn,$Parcel_ID,$CommID,$userRec->userName);
                    }
                    */

                }
            }
        }

        // After all actions, Get a list of the unsent Emails from the Communications table
        $sql = "SELECT * FROM hoa_communications WHERE Email = 1 AND SentStatus = 'N' ORDER BY Parcel_ID ";
		$stmt = $conn->prepare($sql);
	    $stmt->execute();
	    $result = $stmt->get_result();
	    $outputArray = array();
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
        		array_push($outputArray,$row);
        	}
        }
        $stmt->close();
        $adminRec->commList = $outputArray;
        $adminRec->message = "Number of unsent Dues Notice Emails = " . count($adminRec->commList) . $testMessage;
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
}

?>
