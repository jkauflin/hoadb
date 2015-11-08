<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version with some common utilities 
 * 2015-09-08 JJK	Added getAdminLevel to return an admin level based on
 *                  username to control updates
 * 2015-10-01 JJK	Added $fromEmailAddress to sendHtmlEMail                
 * 2015-10-20 JJK   Added function wildCardStrFromTokens to build a wild
 * 					card parameter string from the tokens in a string
 *============================================================================*/

// common method to return admin level based on authenticated user name from the server
function getAdminLevel() {
	//$adminLevel = 0;
	$adminLevel = 4;
	
	if (isset($_SERVER['PHP_AUTH_USER'])) {
		$username = strtolower(trim($_SERVER['PHP_AUTH_USER']));
		// Just hard-code this check for now and put in the DB later
		if ($username == 'president') {
			$adminLevel = 4;
		} else if ($username == 'treasurer') {
			$adminLevel = 2;
		}
	}
	
	return $adminLevel;
}

function getUsername() {
	$username = 'unknown';
	if (isset($_SERVER['PHP_AUTH_USER'])) {
		$username = strtolower(trim($_SERVER['PHP_AUTH_USER']));
	}
	return $username;
}


// Set 0 or 1 according to the boolean value of a string
function paramBoolVal($paramName) {
	$retBoolean = 0;
	if (strtolower(getParamVal($paramName)) == 'true') {
		$retBoolean = 1;
	}
	return $retBoolean;
}

function getParamVal($paramName) {
	$paramVal = "";
	if (isset($_REQUEST[$paramName])) {
		$paramVal = trim(urldecode($_REQUEST[$paramName]));
		// more input string cleanup ???  invalid characters?
	}
	return $paramVal;
}

function downloadUrlToFile($url, $outFileName)
{
	//file_put_contents($xmlFileName, fopen($link, 'r'));
	//copy($link, $xmlFileName); // download xml file

	if (is_file($url)) {
		copy($url, $outFileName); // download xml file
	} else {
		$options = array(
				CURLOPT_FILE    => fopen($outFileName, 'w'),
				CURLOPT_TIMEOUT =>  30, // set this to 30 minutes so we do not timeout on big files
				CURLOPT_URL     => $url
		);
		//CURLOPT_TIMEOUT =>  28800, // set this to 8 hours so we dont timeout on big files
		
		$ch = curl_init();
		curl_setopt_array($ch, $options);
		curl_exec($ch);
		curl_close($ch);
	}
	
	/* loop through elements in a value array
	 foreach($valArray as $x => $x_value) {
	 echo "Key=" . $x . ", Value=" . $x_value;
	 echo "<br>";
	 }
	 */
			
	
	
}

function sendHtmlEMail($toStr,$subject,$messageStr,$fromEmailAddress) {
	$message = '<html><head><title>' . $subject .'</title></head><body>' . $messageStr . '</body></html>';
	
	// Always set content-type when sending HTML email
	$headers = "MIME-Version: 1.0" . "\r\n";
	$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
	
	// More headers
	$headers .= 'From: ' . $fromEmailAddress . "\r\n";
	/*
	 $headers = 'From: webmaster@example.com' . "\r\n" .
	 'Reply-To: webmaster@example.com' . "\r\n" .
	 'X-Mailer: PHP/' . phpversion();
	 */
	
	mail($toStr,$subject,$message,$headers);
}

function truncDate($inStr) {
	if (strlen($inStr) > 10) {
		return substr($inStr,0,10);
	} else {
		return $inStr;
	}
}

// Create a wild card parameter string from the tokens in a string
function wildCardStrFromTokens($inStr) {
	$string = $inStr;
	$token = strtok($string, " ");
	$paramStr = '';
	while ($token !== false)
	{
		$paramStr = $paramStr . '%' . $token;
		$token = strtok(" ");
	}
	$paramStr = $paramStr . '%';
	//error_log('$paramStr = ' . $paramStr);
	return $paramStr;
}

?>
