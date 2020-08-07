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
 *============================================================================*/
require_once 'vendor/autoload.php'; 

// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Include database connection credentials from an external includes location
require_once getSecretsFilename();
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");


//require_once('class.phpmailer.php');

// Check URL param against secret key for scheduled jobs
if (getParamVal("key") != $scheduledJobKey) {
    echo "Not authorized to execute request";
    exit;
}

try {
    $errorStr = '';
    $dbname = "hoadb";

    $backupfile = $dbname . '-' . date("Y-m-d") . '.sql';
    $backupzip = $backupfile . '.tar.gz';

    system("mysqldump -h $host -u $dbadmin -p$password $dbname > $backupfile");
    system("tar -czvf $backupzip $backupfile");

    $bodytext = "Attached is an MYSQLDUMP of the HOA MySQL database";

    // Mail the file
    /*
    $email = new PHPMailer();
    $email->From      = $fromEmailAddress;
    $email->FromName  = $fromEmailAddress;
    $email->Subject   = 'HOA database backup';
    $email->Body      = $bodytext;
    $email->AddAddress($adminEmailList);

    //$email->AddAttachment( $file_to_attach , 'NameOfFile.pdf' );
    $email->AddAttachment($backupzip, $backupzip);
    $email->Send();
    */


    // Create the Transport (using default linux sendmail)
	$transport = new Swift_SendmailTransport();

	// Create the Mailer using your created Transport
	$mailer = new Swift_Mailer($transport);

	// Create a message
	$message = (new Swift_Message('HOA database backup'))
		->setFrom([$fromEmailAddress])
		->setTo([$adminEmailList])
		->setBody($messageStr);

	// swiftmailer PHP read receipt capability
	// $message -> setReadReceiptTo('your@address.tld');
	// When the email is opened, if the mail client supports it a notification will be sent to this address.
	// Read receipts won't work for the majority of recipients since many mail clients auto-disable them. 
	// Those clients that will send a read receipt will make the user aware that one has been requested.

	// Create the attachment with your data
    $attachment = new Swift_Attachment(null,$backupzip);
    //($filedata, $filename, 'application/pdf');
    
    //$email->AddAttachment( $file_to_attach , 'NameOfFile.pdf' );
    //$email->AddAttachment($backupzip, $backupzip);


	// Attach it to the message
	$message->attach($attachment);

	// Send the message and check for success
	if ($mailer->send($message)) {
		echo 'SUCCESS';
	} else {
		echo 'ERROR';
	}

    // Delete the file from your server
    unlink($backupzip);
    unlink($backupfile);

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
    exit;
}

?>
