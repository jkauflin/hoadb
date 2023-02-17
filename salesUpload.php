<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION: Upload county sales file and update sales table
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-10-01 JJK   Initial version - using this instead of getSalesFromCounty.php
 * 2020-12-21 JJK   Re-factored to use jjklogin package
 * 2021-04-24 JJK   Corrected filename bug by looking at the file in the ZIP
 *                  and updated error handling by replacing exit() with throw()
 * 2021-05-08 JJK   Corrected sales table insert issue
 * 2022-05-13 JJK   Modified to accept the monthly and weekly sales files
 *                  by just looking for a single file in the ZIP
 * 2023-02-17 JJK   Refactor for non-static jjklogin class and settings from DB
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
    $loginAuth = new LoginAuth($hostJJKLogin, $dbadminJJKLogin, $passwordJJKLogin, $dbnameJJKLogin);
    $userRec = $loginAuth->getUserRec();
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
        throw new Exception('You do not have permissions for this function', 500);
    }

    $fileName = $_FILES['uploadFilename']['name'];
    if (empty($fileName)) {
        throw new Exception('No file selected', 500);
    }

    // get uploaded file's extension
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    $tmp_file = $_FILES['uploadFilename']['tmp_name'];
    //move_uploaded_file(file, dest)

    if (!file_exists($tmp_file)) {
        throw new Exception('Upload file not found', 500);
    }

    // Check if upload file is parent ZIP or individual residental sales CSV
    $file = null;
    if ($ext == 'zip') {
        $zipFile = new ZipArchive();
    	if (!$zipFile->open($tmp_file)) {
            throw new Exception('Failed to open uploaded ZIP file', 500);
        }

        for ($i = 0; $i < $zipFile->numFiles; $i++) {
            // Get the file name in the zip
            $fileInZip = $zipFile->getNameIndex($i);
            // Look for the Residential sales file in the Zip collection (if there are more than 1 files)
            if (strstr($fileInZip,'_RES.csv')) {
                break;
            }
        }

        $file = $zipFile->getStream($fileInZip);
        if (!$file) {
            throw new Exception("Failed to open file in ZIP, file = $fileInZip", 500);
        }

    } else {
        // Open the uploaded file from the temporary location
        $file = fopen($tmp_file, "r");
    }

    if (!$file) {
        throw new Exception('Unable to open file', 500);
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
    $hoaRecsFound = 0;
    $newSalesFound = 0;
    $saleDate = '';
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

        $saleDate = $salesRecArray[2];
		$hoaRec = getHoaRec($conn,$parcelId,"","",$saleDate);
		if (empty($hoaRec->Parcel_ID)) {
			// If the parcel id is not found in the HOA db, then just skip to the next one
			continue;
		}

        $hoaRecsFound = $hoaRecsFound + 1;
        $hoaOwnerRec = $hoaRec->ownersList[0];

			$addToOutput = false;
            // If the Sales record was not found, insert one
			if ( sizeof($hoaRec->salesList) < 1) {
                $newSalesFound = $newSalesFound + 1;

                $stmt = $conn->prepare("INSERT INTO hoa_sales VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?,?,?,CURRENT_TIMESTAMP,?); ");
				$NotificationFlag = 'Y';
                $ProcessedFlag = 'N';
                $lastChangedby = 'system';
                $WelcomeSent = 'X';
				$stmt->bind_param("ssssssssssssssss",
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
					$NotificationFlag,
					$ProcessedFlag,
                    $lastChangedby,
                    $WelcomeSent
                );

                $stmt->execute();
				$stmt->close();

                $hoaSalesRec = getHoaSalesRec($conn,$hoaRec->Parcel_ID,$saleDate);
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

		//$outputStr .= '<br>' . $valArray[0];

	} // End of while(!feof($file))
	fclose($file);

    $fromEmailAddress = getConfigValDB($conn,"fromEmailAddress");
    $salesReportEmailList = getConfigValDB($conn,"salesReportEmailList");

	// Close db connection
	$conn->close();

	if ($sendMessage) {
		$subject = 'HOA Residential Sales';
		$messageStr = '<h2>HOA Residential Sales</h2>' . $outputStr;
        $sendMailSuccess = sendHtmlEMail($salesReportEmailList,$subject,$messageStr,$fromEmailAddress);
        if (!$sendMailSuccess) {
            // If fail to send email maybe go back and update the default Y flag back to N ?
        }
	}

    $adminRec->message = "County Sales file processed successfully (Check Sales Report) </br>".
                         " Total records = $recCnt, HOA records found = $hoaRecsFound, New HOA sales found = $newSalesFound";
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
