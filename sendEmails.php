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

// Check URL param against secret key for scheduled jobs
if (getParamVal("key") != $scheduledJobKey) {
    echo "Not authorized to execute request";
    exit;
}

$conn = getConn($host, $dbadmin, $password, $dbname);

			//$subject = 'HOA Residential Sales in ' . $salesYear;
            //$messageStr = '<h2>HOA Residential Sales in ' . $salesYear . '</h2>' . $outputStr;
            
            /*
                toEmail: emailAddr,
                subject: config.getVal('hoaNameShort') + ' Dues Notice',
                messageStr: 'Attached is the ' + config.getVal('hoaName') + ' Dues Notice.  *** Reply to this email to request unsubscribe ***',
                parcelId: hoaRec.Parcel_ID,
                ownerId: hoaRec.ownersList[0].OwnerID,
                filename: config.getVal('hoaNameShort') + 'DuesNotice.pdf',
            */

//$sql = "SELECT * FROM hoa_communications WHERE Email = 1 AND SentStatus = 'N' AND Parcel_ID = 'R72617307 0001' ORDER BY Parcel_ID ";
$sql = "SELECT * FROM hoa_communications WHERE Email = 1 AND SentStatus = 'N' AND Parcel_ID = 'R72617307 0002' ORDER BY Parcel_ID ";
$stmt = $conn->prepare($sql);	
$stmt->execute();
$result = $stmt->get_result();
$stmt->close();

$firstNotice = false;
$commType = '';

$sendMailSuccess = false;
if ($result->num_rows > 0) {
	while($row = $result->fetch_assoc()) {

        $firstNotice = false;
        $commType = $row["CommType"];
        if ($commType == '1st Dues Notice') {
            $firstNotice = true;
        }

        $hoaRec = getHoaRec($conn,$row["Parcel_ID"]);

        $messageStr = createDuesMessage($conn,$hoaRec,$firstNotice);

//            
        /*
        $sendMailSuccess = sendHtmlEMail($row["EmailAddr"],$subject,$messageStr,$fromEmailAddress);
        // If the Member email was successful, update the flag on the communication record
        if ($sendMailSuccess) {

        }
        */

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


//echo 'SUCCESS';
echo $messageStr;
?>