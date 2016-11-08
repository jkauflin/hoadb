<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-11-06 JJK 	Initial version to send mail with PDF attachment 
 * 2016-11-07 JJK   Modified to use swiftmailer.org library
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
	
	/*
	$subject = 'HOA Residential Sales in ' . $salesYear;
	$messageStr = '<h2>HOA Residential Sales in ' . $salesYear . '</h2>' . $outputStr;
	
	*/
	
	$fromName = "GRHA Treasurer";
	
	//->setTo(array($toEmail, 'other@domain.org' => 'A name'))
	
	// Create the message
	$message = Swift_Message::newInstance()
	->setSubject($subject)
	->setFrom(array(getConfigVal("fromEmailAddress") => $fromName))
	->setTo($toEmail)
	->setBody($messageStr)
	// And optionally an alternative body
	->addPart('<q>Here is the message itself</q>', 'text/html');
	
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
		echo "sendMail SUCCESS \n";
	} else {
		echo "sendMail ERROR \n";
	}

?>
