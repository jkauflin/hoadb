<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Service to use swiftmailer library to send dues emails.
 * 				Version 6.3 (Depends on PHP 7)
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-11-06 JJK 	Initial version to send mail with PDF attachment 
 * 2016-11-07 JJK   Modified to use swiftmailer.org library
 * 2018-11-25 JJK	Modified to return a JSON record which includes the
 * 					email address for the send and the send result
 * 2018-11-26 JJK	Modifying to use the newest version of swiftmailer
 * 					and trapped exceptions to return error message
 * 2020-07-04 JJK   Modified to use PHP Composer and switched require
 *                  to "vendor/autoload.php"
 *============================================================================*/
require_once __DIR__ . '/vendor/autoload.php';

	include 'commonUtil.php';
	// Include table record classes and db connection parameters
	include 'hoaDbCommon.php';

	$toEmail = $_POST['toEmail'];
	$subject = $_POST['subject'];
	$messageStr = $_POST['messageStr'];
	$parcelId = $_POST['parcelId'];
	$ownerId = $_POST['ownerId'];
	$filename = $_POST['filename'];
	// Decode the PDF data stream from character back to binary
	$filedata = base64_decode($_POST['filedata']);

		// Create the record to send back as a result of the POST
	$sendEmailRec = new SendEmailRec();
	$sendEmailRec->result = '';
	$sendEmailRec->message = '';
	$sendEmailRec->sendEmailAddr = $toEmail;
	$sendEmailRec->Parcel_ID = $parcelId;
	$sendEmailRec->OwnerID = $ownerId;

	try {
		// Create the Transport (using default linux sendmail)
		$transport = new Swift_SendmailTransport();

		// Create the Mailer using your created Transport
		$mailer = new Swift_Mailer($transport);

		// Create a message
		$message = (new Swift_Message($subject))
		->setFrom([getConfigVal("fromTreasurerEmailAddress")])
		->setTo([$toEmail])
		->setBody($messageStr);

		// swiftmailer PHP read receipt capability
		// $message -> setReadReceiptTo('your@address.tld');
		// When the email is opened, if the mail client supports it a notification will be sent to this address.
		// Read receipts won't work for the majority of recipients since many mail clients auto-disable them. 
		// Those clients that will send a read receipt will make the user aware that one has been requested.

		// Create the attachment with your data
		$attachment = new Swift_Attachment($filedata, $filename, 'application/pdf');
		// Attach it to the message
		$message->attach($attachment);

		// Send the message and check for success
		if ($mailer->send($message)) {
			$sendEmailRec->result = 'SUCCESS';
			$sendEmailRec->message = 'Email sent successfully to ' . $toEmail;
		} else {
			$sendEmailRec->result = 'ERROR';
			$sendEmailRec->message = 'Error sending Email to ' . $toEmail;
		}
	} catch (Exception $e) {
		$sendEmailRec->result = 'ERROR';
		$sendEmailRec->message = $e->getMessage();
	}

	echo json_encode($sendEmailRec);
?>
