<?php
/*==============================================================================
 * (C) Copyright 2015,2020 John J Kauflin, All rights reserved.
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
 * 2016-04-10 JJK	Added calcCompoundInterest to calculate compound
 * 					interests for the total dues calculation
 * 2016-09-11 JJK   Corrected handling of bad dates for interest calculation
 * 2016-09-11 JJK   Modified the truncDate routine to take the 1st token
 * 					before truncating to 10 characters (to handle bad dates
 * 					like "4/7/2007 0"
 * 2020-08-05 JJK   Removed getAdminLevel and getUsername (in favor of new
 *                  Login/Authentication logic)
 * 2020-09-19 JJK   If using SwiftMailer don't forget to include autoload.php\
 * 2022-08-27 JJK   Corrected convert input to string in csvFilter
 * 2022-08-29 JJK   Updated sendHtmlEMail to use PHPMailer and SMTP account
 *                  for outgoing email
 *============================================================================*/

function strToUSD($inStr) {
	// Replace every ascii character except decimal and digits with a null
	$numericStr = preg_replace('/[\x01-\x2D\x2F\x3A-\x7F]+/', '', $inStr);
	// Convert to a float value and round down to 2 digits
	//return round(floatval($numericStr),2,PHP_ROUND_HALF_DOWN);
	return round(floatval($numericStr),2);
}

// Replace comma with null so you can use it as a CSV value
function csvFilter($inVal) {
    $inStr = (string) $inVal;
	//return preg_replace('/[\x2C]+/', '', String($inVal));
	return preg_replace('/[\x2C]+/', '', $inStr);
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

function downloadUrlToFile($url)
{
    try {
        $currTimestampStr = date("YmdHis");
        $tempFilename = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $currTimestampStr . 'jjktemp.zip';
	    $tempFile = fopen($tempFilename, 'w');

        // create a new cURL resource
        $ch = curl_init();
        // set URL and other appropriate options
        curl_setopt($ch, CURLOPT_URL, $url);        // URL to call
        curl_setopt($ch, CURLOPT_FILE, $tempFile);  // Write output to this file
        curl_setopt($ch, CURLOPT_HEADER, false);
        //curl_setopt($ch, CURLOPT_USERAGENT, 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36');
        curl_setopt($ch, CURLOPT_POST, 0); // Don't use HTTP POST (use default of HTTP GET)
        // CURLOPT_HTTPGET is default
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);  // Don't check SSL
        // CURL_HTTP_VERSION_1_1
		//curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);  // return actual data for:  $file_content = curl_exec($ch);

        // grab URL and pass it to the browser
        curl_exec($ch);
		//$file_content = curl_exec($ch);

        // close cURL resource, and free up system resources
        curl_close($ch);
        fclose($tempFile);

        /*
		$downloaded_file = fopen($outFileName, 'w');
		fwrite($downloaded_file, $file_content);
        fclose($downloaded_file);
        */

        return $tempFilename;

    } catch(Exception $e) {
        error_log(date('[Y-m-d H:i:s] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
        return false;
    }
}

function sendHtmlEMail($toStr,$subject,$messageStr,$fromEmailAddress) {
    try {
    	$message = '<html><head><title>' . $subject .'</title></head><body>' . $messageStr . '</body></html>';
        // Always set content-type when sending HTML email
    	$headers = "MIME-Version: 1.0" . "\r\n";
    	$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    	// More headers
        $headers .= 'From: ' . $fromEmailAddress . "\r\n";

        if (!function_exists('mail'))
        {
            error_log(date('[Y-m-d H:i:s] '). "in " . basename(__FILE__,".php") . ", mail() has been disabled " . PHP_EOL, 3, LOG_FILE);
            return false;
        }

    	if (mail($toStr,$subject,$message,$headers)) {
            return true;
        } else {
            return false;
        }


    } catch(Exception $e) {
        error_log(date('[Y-m-d H:i:s] '). "in " . basename(__FILE__,".php") . ", sendHtmlEMail Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
        return false;
    }
}

function sendSwiftMail($toStr,$subject,$messageStr,$fromEmailAddress,
                        $attachmentType='application/pdf',$attachmentPath='',$attachmentFiledata=null,
                        $attachmentFilename='outfilename.pdf',$inlineAttachmentPath='') {
    try {
	    $message = '<html><head><title>' . $subject .'</title></head><body>' . $messageStr . '</body></html>';
        $mimeType = 'text/html';

        /*
    	// Create the Transport (using default linux sendmail)
    	$transport = new Swift_SendmailTransport();
    	// Create the Mailer using your created Transport
    	$mailer = new Swift_Mailer($transport);

    	// Create a message
    	$message = (new Swift_Message($subject))
    		->setFrom([$fromEmailAddress])
    		->setTo([$toStr])
    		->setBody($messageStr,$mimeType);

        if ($attachmentFiledata != null || $attachmentPath != '') {
            $attachment = null;
            if ($attachmentFiledata != null) {
                // Create the attachment with your data
    	        $attachment = new Swift_Attachment($attachmentFiledata, $attachmentFilename, 'application/pdf');
            } else {
                // Create an attachment from a path
                $attachment = Swift_Attachment::fromPath($attachmentPath);
                $attachment->setFilename($attachmentFilename);
            }
    	    // Attach it to the message
            $message->attach($attachment);
        }

        if ($inlineAttachmentPath != '') {
            // Add inline "Image"
            $inline_attachment = Swift_Image::fromPath($inlineAttachmentPath);
            $cid = $message->embed($inline_attachment);
        }

    	// Send the message and check for success
    	if ($mailer->send($message)) {
            //error_log(date('[Y-m-d H:i:s] '). "in " . basename(__FILE__,".php") . ", sendSwiftMail SUCCESS " . PHP_EOL, 3, LOG_FILE);
            return true;
    	} else {
            error_log(date('[Y-m-d H:i:s] '). "in " . basename(__FILE__,".php") . ", sendSwiftEMail ERROR " . PHP_EOL, 3, LOG_FILE);
            return false;
    	}
        */

    } catch(Exception $e) {
        error_log(date('[Y-m-d H:i:s] '). "in " . basename(__FILE__,".php") . ", sendSwiftMail Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
        return false;
    }
}

function truncDate($inStr) {
	$outStr = "";
	if ($inStr != null) {
		$outStr = strtok($inStr," ");
		if (strlen($outStr) > 10) {
			$outStr = substr($outStr,0,10);
		}
	}
	return $outStr;
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

// Replace every ascii character except decimal and digits with a null, and round to 2 decimal places
function stringToMoney($inAmountStr) {
	return round(floatval( preg_replace('/[\x01-\x2D\x2F\x3A-\x7F]+/', '', $inAmountStr) ),2);
}

// Calculate compound interest from a principal and a start date
function calcCompoundInterest($principal,$startDate) {
				/*
				 A = the future value of the investment/loan, including interest
				 P = the principal investment amount (the initial deposit or loan amount)
				 r = the annual interest rate (decimal)
				 n = the number of times that interest is compounded per year
				 t = the number of years the money is invested or borrowed for
				 A = P(1+r/n)^nt
				 */
	$interestAmount = 0.0;
	// Annaul percentage rate (i.e. 6%)
	$rate = 0.06;
	// Starting principal value
	// Frequency of compounding (1 = yearly, 12 = monthly)
	$annualFrequency = 12.0;

	//error_log(date('[Y-m-d H:i:s] '). "StartDate = " . $startDate . PHP_EOL, 3, "jjk-commonUtil.log");
	if ($startDate != null && $startDate != '' && $startDate != '0000-00-00') {

		// Convert the 1st start date string token (i.e. till space) into a DateTime object (to check the date)
		if ($startDateTime = date_create( strtok($startDate," ") )) {
			// Difference between passed date and current system date
			$diff = date_diff($startDateTime,date_create(),true);

			// Time in fractional years
			$time = floatval($diff->days) / 365.0;

			$A = floatval($principal) * pow((1+($rate/$annualFrequency)),($annualFrequency*$time));
			// Subtract the original principal to get just the interest
			$interestAmount = round(($A - $principal),2);

		} else {
			// Error in date_create
			error_log(date('[Y-m-d H:i:s] '). "Problem with StartDate = " . $startDate . PHP_EOL, 3, "jjk-commonUtil.log");
		}
	}
	//error_log("diff days = " . $diff->days . ", time = " . $time . ", A = " . $A . ", interest = " . $interestAmount);

				/*
//Monthly
	for ($time = 1; $time <= 10; $time++) {
		$interestAmount = round($principal * pow((1+($rate/$annualFrequency)),($annualFrequency*$time)),2,PHP_ROUND_HALF_DOWN);
		//echo "<br>Year = $time ($principal * pow((1+($rate/$annualFrequency)),($annualFrequency*$time)) = " . $principalWithInterest;
	}

				$annualFrequency = 1.0;
				echo "<br><br>Compounded Yearly";
				for ($time = 1; $time <= 10; $time++) {
					$principalWithInterest = round($principal * pow((1+($rate/$annualFrequency)),($annualFrequency*$time)),2,PHP_ROUND_HALF_DOWN);
					echo "<br>Year = $time ($principal * pow((1+($rate/$annualFrequency)),($annualFrequency*$time)) = " . $principalWithInterest;
				}
				*/

	return $interestAmount;

} // End of function calcCompoundInterest($principal,$startDate) {

?>
