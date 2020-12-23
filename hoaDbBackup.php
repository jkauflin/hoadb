<?php
/*==============================================================================
 * (C) Copyright 2016,2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Scheduled job to get sales information from the county
 * 				auditor site, find parcels in the hoa, update the hoa_sales
 * 				table, and email a report of new sales
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-07-01 JJK 	Initial version to export and email MySQL database
 * 2020-08-07 JJK   Updated for new 2.0 and replaced mail with swiftmailer
 * 2020-08-08 JJK   Modified to just email the dump file (which is now
 *                  created with a BASH scrip cron job)
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
if (getParamVal("key") != $scheduledJobKey) {
    echo "Not authorized to execute request" . PHP_EOL;
    exit;
}

try {
    $dbname = "hoadb";
    $bodytext = "Attached is an MYSQLDUMP of the HOADB database";

    /*
    sendSwiftMail($toStr,$subject,$messageStr,$fromEmailAddress,
                        $attachmentType='application/pdf',$attachmentPath='',$attachmentFiledata=null,
                        $attachmentFilename='outfilename.pdf',$inlineAttachmentPath='');
    */

    // Create the Transport (using default linux sendmail)
	$transport = new Swift_SendmailTransport();

	// Create the Mailer using your created Transport
	$mailer = new Swift_Mailer($transport);

	// Create a message
	$message = (new Swift_Message('HOA database backup'))
		->setFrom([$fromEmailAddress])
		->setTo([$adminEmailList])
        ->setBody($messageStr)
        ->attach(Swift_Attachment::fromPath($dbDumpFile))
        ;

	// Send the message and check for success
	if ($mailer->send($message)) {
		echo 'SUCCESS';
	} else {
		echo 'ERROR';
	}

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
}

?>
