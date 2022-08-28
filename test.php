<?php
/*==============================================================================
 * (C) Copyright 2021 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:  Scrip to test functions
 *----------------------------------------------------------------------------
 * Modification History
 * 2021-09-06 JJK 	Initial version to test mail functions
 *
 *============================================================================*/
require_once 'vendor/autoload.php';
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");
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


// Check URL param against secret key for scheduled jobs
/*
if (getParamVal("key") != $scheduledJobKey) {
    echo "Not authorized to execute request";
    exit;
}
*/

	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn($host, $dbadmin, $password, $dbname);

    /*
    $fromEmailAddress = getConfigValDB($conn,"fromEmailAddress");
    $treasurerEmail = getConfigValDB($conn,"treasurerEmail");
    $paymentEmailList = getConfigValDB($conn,"paymentEmailList");

    $subject = 'GRHA Test email ';
    $messageStr = '<h2>This is a test of email from GRHA</h2>';
    error_log(date('[Y-m-d H:i:s] '). "in " . basename(__FILE__,".php") . ", email = $paymentEmailList" . PHP_EOL, 3, LOG_FILE);

    $sendMailSuccess = sendHtmlEMail($paymentEmailList,$subject,$messageStr,$fromEmailAddress);
    $sendMailSuccessStr = $sendMailSuccess ? 'true' : 'false';

    $resultStr = "After payment email sent to:  $paymentEmailList, sendMailSuccess = $sendMailSuccessStr";
    error_log($resultStr . PHP_EOL, 3, LOG_FILE);
    */

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


echo $resultStr;
?>
