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
 * 2020-12-21 JJK   Re-factored to use jjklogin package
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

// Check for the secret key in the arg list
//echo date('[Y-m-d H:i] '). "TOP argv = $argv[1] " . PHP_EOL;
/*
if (!empty($argv[1])) {
    if ($argv[1] != $scheduledJobKey) {
        echo "Not authorized to execute request";
        exit;
    }
} else {
    echo "Not authorized to execute request";
    exit;
}
*/
// Check URL param against secret key for scheduled jobs
//if (getParamVal("key") != $scheduledJobKey) {
//    echo "Not authorized to execute request";
//    exit;
//}

try {
    $userRec = LoginAuth::getUserRec($cookieNameJJKLogin,$cookiePathJJKLogin,$serverKeyJJKLogin);
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 1) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

    $conn = getConn($host, $dbadmin, $password, $dbname);

    //getConfigValDB($conn,'duesEmailTestAddress');
    $subject = getConfigValDB($conn,'hoaNameShort') . ' Dues Notice';

    $sql = "SELECT * FROM hoa_communications WHERE Email = 1 AND SentStatus = 'N' ORDER BY Parcel_ID ";
    $stmt = $conn->prepare($sql);	
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();

    //$firstNotice = false;
    $commType = '';
    $maxRecs = 2;

    $sendMailSuccess = false;
    if ($result->num_rows > 0) {
        $cnt = 0;
        $Parcel_ID = '';
        while($row = $result->fetch_assoc()) {
            $cnt = $cnt + 1;
            if ($cnt > $maxRecs) {
                break;
            }

            $CommID = $row["CommID"];
            $Parcel_ID = $row["Parcel_ID"];
            $hoaRec = getHoaRec($conn,$Parcel_ID);
            $messageStr = createDuesMessage($conn,$hoaRec);

            /*
            $sendMailSuccess = sendHtmlEMail($adminEmailList,$subject,$messageStr,$fromTreasurerEmailAddress);
            // If the Member email was successful, update the flag on the communication record
            if ($sendMailSuccess) {
    // new common function to create the HTML dues email
    // call common function to send the email
    // if successful change sent to 'Y' and update Last changed timestamp
            }
            */

            setCommEmailSent($conn,$CommID,$userRec->userName);

        }
    }

    // Re-query list of the unsent Emails from the Communications table
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

    $conn->close();

    echo json_encode($outputArray);

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
}
?>
