<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Upload county sales file and update sales table
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-10-01 JJK   Initial version
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

$adminRec = new AdminRec();
try {
    $userRec = LoginAuth::getUserRec($cookieNameJJKLogin,$cookiePathJJKLogin,$serverKeyJJKLogin);
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 1) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

	$adminRec->result = "Not Valid";
	$adminRec->message = "";
    $adminRec->userName = $userRec->userName;
    $adminRec->userLevel = $userRec->userLevel;

    $adminLevel = $userRec->userLevel;
	if ($adminLevel < 2) {
		$adminRec->message = "You do not have permissions to Add Assessments.";
        $adminRec->result = "Not Valid";
        exit(json_encode($adminRec));
    }

    $fileName = $_FILES['uploadFilename']['name'];
    if (empty($fileName)) {
		$adminRec->message = "No file selected.";
        $adminRec->result = "Not Valid";
        exit(json_encode($adminRec));
    }

    // get uploaded file's extension
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    $tmp_file = $_FILES['uploadFilename']['tmp_name'];
    //move_uploaded_file(file, dest)

    if (!file_exists($tmp_file)) {
		$adminRec->message = "Upload file not found.";
        $adminRec->result = "Not Valid";
        exit(json_encode($adminRec));
    }

    // Check if upload file is parent ZIP or individual residental sales CSV
    if ($ext == 'zip') {
        $currTimestampStr = date("Y-m-d H:i:s");
        // Get the year from the current system time
        $salesYear = substr($currTimestampStr,0,4);
        // Residential sales file in the Zip collection
        $resFileName = 'SALES_' . $salesYear . '_RES.csv';
        $zipFile = new ZipArchive();
    	if (!$zipFile->open($tmp_file)) {
    		$adminRec->message = "Failed to open ZIP file.";
            $adminRec->result = "Not Valid";
            exit(json_encode($adminRec));
        }

		$file = $zipFile->getStream($resFileName);
		if (!$file) {
            exit("Failed to open file in downloaded, file = $resFileName\n");
        }


    } else {
        // Open the uploaded file from the temporary location
        $file = fopen($tmp_file, "r") or die("Unable to open file!");

    }

    //$action = getParamVal("action");

	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn($host, $dbadmin, $password, $dbname);
        
	// Loop through all the records in the downloaded sales file and compare with HOA database parcels
    $sendMessage = false;
    $addToOutput = false;
    $outputStr = '';
	$recCnt = 0;
	while(!feof($file))
	{
		$recCnt = $recCnt + 1;
			
		// 1st record of CSV files are the column names so just skip them
		if ($recCnt == 1) {
			$salesRecCoumnArray = fgetcsv($file);
			continue;
		}
					
        $salesRecArray = fgetcsv($file);
        if (!$salesRecArray) {
            continue;
        }

	    $parcelId = $salesRecArray[0];

        // Check if the Parcel Id from the sales record matches any in our HOA database
        // (and get the Sales record associated with the Sales Date)
	    // sales now included in this query and in hoaRec
		$hoaRec = getHoaRec($conn,$parcelId,"","",$salesRecArray[2]);
		if (empty($hoaRec->Parcel_ID)) {
			// If the parcel id is not found in the HOA db, then just skip to the next one
			continue;
		}

        $hoaOwnerRec = $hoaRec->ownersList[0];
			
			$addToOutput = false;
            // If the Sales record was not found, insert one
			if ( sizeof($hoaRec->salesList) < 1) {
                $stmt = $conn->prepare("INSERT INTO hoa_sales VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?); ");
				$NotificationFlag = 'Y';
                $ProcessedFlag = 'N';
                $lastChangedby = 'system';
                $WelcomeSent = 'X';
				$stmt->bind_param("sssssssssssssssss",
				    $salesRecArray[0],
					$salesRecArray[1],
					$salesRecArray[2],
					$salesRecArray[3],
					$salesRecArray[4],
					$salesRecArray[5],
					$salesRecArray[6],
					$salesRecArray[7],
					$salesRecArray[8],
					$salesRecArray[9],
					$salesRecArray[10],
					$salesRecArray[11],
					$currTimestampStr,
					$NotificationFlag,
					$ProcessedFlag,
                    $lastChangedby,
                    $WelcomeSent
                );
                
                $stmt->execute();
				$stmt->close();

                $hoaSalesRec = getHoaSalesRec($conn,$hoaRec->Parcel_ID,$salesRecArray[2]);
				$addToOutput = true;
				
			} else {
			    $hoaSalesRec = $hoaRec->salesList[0]; 
				// If the sales record is found but there was no notification, send an email
				if ($hoaSalesRec->NotificationFlag == 'N') {
					$addToOutput = true;
				}
			}
			
			if ($addToOutput) {
				$sendMessage = true;
				
				$outputStr .= '<p><table border=1 class="evenLineHighlight"><tbody>';
				$outputStr .= '<tr><th>Parcel Id:</th><td>' . $parcelId . '</td></tr>';
				$outputStr .= '<tr><th>Parcel Location:</th><td><b>' . $hoaRec->Parcel_Location . '</b></td></tr>';
				$outputStr .= '<tr><th>Old Owner:</th><td>' . $hoaSalesRec->OLDOWN . '</td></tr>';
				$outputStr .= '<tr><th>HOA Owner:</th><td>' . $hoaOwnerRec->Owner_Name1 . ' ' . $hoaOwnerRec->Owner_Name2 . '</td></tr>';
				$outputStr .= '<tr><th>New Owner1:</th><td>' . $hoaSalesRec->OWNERNAME1 . '</td></tr>';
				$outputStr .= '<tr><th>Mailing Name1:</th><td>' . $hoaSalesRec->MAILINGNAME1 . '</td></tr>';
				$outputStr .= '<tr><th>Mailing Name2:</th><td>' . $hoaSalesRec->MAILINGNAME2 . '</td></tr>';
				$outputStr .= '<tr><th>Sale Date:</th><td>' . $hoaSalesRec->SALEDT . '</td></tr>';
				$outputStr .= '</tbody></table></p>';
			}
			
				/*
				 $hoaOwnerRec->OwnerID = $row["OwnerID"];
				 $hoaOwnerRec->Owner_Name1 = $row["Owner_Name1"];
				 $hoaOwnerRec->Owner_Name2 = $row["Owner_Name2"];
				 $hoaOwnerRec->DatePurchased = $row["DatePurchased"];
				 $hoaOwnerRec->Mailing_Name = $row["Mailing_Name"];
				 $hoaOwnerRec->AlternateMailing = $row["AlternateMailing"];
				 $hoaOwnerRec->Alt_Address_Line1 = $row["Alt_Address_Line1"];
				 $hoaOwnerRec->Alt_Address_Line2 = $row["Alt_Address_Line2"];
				 $hoaOwnerRec->Alt_City = $row["Alt_City"];
				 $hoaOwnerRec->Alt_State = $row["Alt_State"];
				 $hoaOwnerRec->Alt_Zip = $row["Alt_Zip"];
				 $hoaOwnerRec->Owner_Phone = $row["Owner_Phone"];
				 */

		//$outputStr .= '<br>' . $valArray[0];
			
	} // End of while(!feof($file))
	fclose($file);

	// Close db connection
	$conn->close();

	if ($sendMessage) {
		$subject = 'HOA Residential Sales in ' . $salesYear;
		$messageStr = '<h2>HOA Residential Sales in ' . $salesYear . '</h2>' . $outputStr;
        $sendMailSuccess = sendHtmlEMail($salesReportEmailList,$subject,$messageStr,$fromEmailAddress);
        if (!$sendMailSuccess) {
            // If fail to send email maybe go back and update the default Y flag back to N ?
        }
	}
        
	$adminRec->message = "Sales upload and update successful.";
	$adminRec->result = "Valid";
	echo json_encode($adminRec);

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
	$adminRec->message = $e->getMessage();
    $adminRec->result = "Not Valid";
    /*
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
    */
    echo json_encode($adminRec);
}
