<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-11-06 JJK 	Initial version to send mail with PDF attachment 
 * 2016-11-07 JJK   Modified to use swiftmailer.org library
 * 2018-11-25 JJK	Modified to return a JSON record which includes the
 * 					email address for the send and the send result
 *============================================================================*/
	require_once 'swiftmailer/lib/swift_required.php';

	include 'commonUtil.php';
	// Include table record classes and db connection parameters
	include 'hoaDbCommon.php';

	$toEmail = $_POST['toEmail'];
	$subject = $_POST['subject'];
	$messageStr = $_POST['messageStr'];
	$filename = $_POST['filename'];
	// Decode the PDF data stream from character back to binary
	$filedata = base64_decode($_POST['filedata']);
	
	// Create the message
	$message = Swift_Message::newInstance()
	->setSubject($subject)
	->setFrom(getConfigVal("fromTreasurerEmailAddress"))
	->setTo($toEmail)
	->setBody($messageStr);
	// And optionally an alternative body
	//	->addPart($messageStr, 'text/plain');

	// Create the record to send back as a result of the POST
	$sendEmailRec = new SendEmailRec();
	$sendEmailRec->result = '';
	$sendEmailRec->message = '';
	$sendEmailRec->sendEmailAddr = $toEmail;

    // swiftmailer PHP read receipt capability
    // $message -> setReadReceiptTo('your@address.tld');
    // When the email is opened, if the mail client supports it a notification will be sent to this address.
    // Read receipts won't work for the majority of recipients since many mail clients auto-disable them. 
    // Those clients that will send a read receipt will make the user aware that one has been requested.

	// Create the attachment with your data
	$attachment = Swift_Attachment::newInstance($filedata, $filename, 'application/pdf');
	// Attach it to the message
	$message->attach($attachment);
	
	// Create the Transport
	$transport = Swift_MailTransport::newInstance();
	// Create the Mailer using your created Transport
	$mailer = Swift_Mailer::newInstance($transport);

	// Send the message and check for success
	if ($mailer->send($message)) {
		//echo "SUCCESS";
		$sendEmailRec->result = 'SUCCESS';
		$sendEmailRec->message = 'Email sent successfully to ' . $toEmail;
	} else {
		//echo "ERROR";
		$sendEmailRec->result = 'ERROR';
		$sendEmailRec->message = 'Error sending Email to ' . $toEmail;
	}

	echo json_encode($sendEmailRec);
?>
