<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 * 
 * Service to use swiftmailer library to send dues emails.
 * 				Version 6.3 (Depends on PHP 7)
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-10-16 JJK 	Initial version
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

// Check for the secret key in the arg list
if (!empty($argv[1])) {
    if ($argv[1] != $scheduledJobKey) {
        echo "Not authorized to execute request";
        exit;
    }
} else {
    echo "Not authorized to execute request";
    exit;
}

// Check URL param against secret key for scheduled jobs
/*
if (getParamVal("key") != $scheduledJobKey) {
    echo "Not authorized to execute request";
    exit;
}
*/

$conn = getConn($host, $dbadmin, $password, $dbname);

//getConfigValDB($conn,'duesEmailTestAddress');
$subject = getConfigValDB($conn,'hoaNameShort') . ' Dues Notice';


//$sql = "SELECT * FROM hoa_communications WHERE Email = 1 AND SentStatus = 'N' AND Parcel_ID = 'R72617307 0001' ORDER BY Parcel_ID ";
$sql = "SELECT * FROM hoa_communications WHERE Email = 1 AND SentStatus = 'N' ORDER BY Parcel_ID ";
$stmt = $conn->prepare($sql);	
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

//$firstNotice = false;
$commType = '';
$maxRecs = 1;

$sendMailSuccess = false;
if ($result->num_rows > 0) {
    $cnt = 0;
    $Parcel_ID = '';
	while($row = $result->fetch_assoc()) {
        $cnt = $cnt + 1;
        if ($cnt > $maxRecs) {
            break;
        }
        /*
        $firstNotice = false;
        $commType = $row["CommType"];
        if ($commType == '1st Dues Notice') {
            $firstNotice = true;
        }
        */
        $Parcel_ID = $row["Parcel_ID"];
        $hoaRec = getHoaRec($conn,$Parcel_ID);
        $messageStr = createDuesMessage($conn,$hoaRec);

        // should the FROM be treasurer?
        //$sendMailSuccess = sendHtmlEMail($row["EmailAddr"],$subject,$messageStr,$fromEmailAddress);
        $sendMailSuccess = sendHtmlEMail($adminEmailList,$subject,$messageStr,$fromTreasurerEmailAddress);
        // If the Member email was successful, update the flag on the communication record
        if ($sendMailSuccess) {

        }

        echo 'Parcel Id = ' . $Parcel_ID . '</br>';

    }
}

$conn->close();


    //function sendHtmlEMail($toStr,$subject,$messageStr,$fromEmailAddress) {
/*

                set status to 'E' error?
*/

    // Decode the PDF data stream from character back to binary
    //$filedata = base64_decode($_POST['filedata']);

    // *** assume called by a scheduled process
    // config - MaxRecs to process
    // loop through X (up to maxRecs) from Communication where Email and Send = 'N'
    
    // new common function to create the HTML dues email
    // call common function to send the email
    // if successful change sent to 'Y' and update Last changed timestamp


echo 'SUCCESS';
//echo $messageStr;
?>
