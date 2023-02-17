<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION: Upload payments file and compare records with database
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-09-25 JJK   Initial version
 * 2020-12-21 JJK   Re-factored to use jjklogin package
 * 2021-02-13 JJK   Modified for new paypal express payment values
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
    //$ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    $tmp_file = $_FILES['uploadFilename']['tmp_name'];
    //move_uploaded_file(file, dest)

    if (!file_exists($tmp_file)) {
		$adminRec->message = "Upload file not found.";
        $adminRec->result = "Not Valid";
        exit(json_encode($adminRec));
    }

    // Open the uploaded file from the temporary location
    $file = fopen($tmp_file, "r") or die("Unable to open file!");

    // Byte Order Mark (BOM) as a string for comparison.
    $bom = "\xef\xbb\xbf";
    // Progress file pointer and get first 3 characters to compare to the BOM string.
    // (needed to do this so it doesn't put double quotes around the first column name)
    if (fgets($file, 4) !== $bom) {
        // BOM not found - rewind pointer to start of file.
        rewind($file);
    }

    $adminRec->paymentList = array();

    // Initialize the column indexes
    $DateCol = -1;
    $TimeCol = -1;
    $TimeZoneCol = -1;
    $NameCol = -1;
    $TypeCol = -1;
    $GrossCol = -1;
    $FeeCol = -1;
    $FromEmailAddressCol = -1;
    $TransactionIDCol = -1;
    //$ItemTitleCol = -1;
    $CustomNumberCol = -1;
    $ContactPhoneNumberCol = -1;
    $ExpectedColsNotFound = '';
    $AllColsFound = true;

    // Loop through all the records in the downloaded sales file and compare with HOA database parcels
	$conn = getConn($host, $dbadmin, $password, $dbname);
	$recCnt = 0;
	while(!feof($file))
	{
		$recCnt = $recCnt + 1;

		// 1st record of CSV files are the column names
		if ($recCnt == 1) {
            $paymentCoumnArray = fgetcsv($file);

            // Confirm the columns in the spreadsheet to make sure they equal the ones we are looking for
            // and set the column numbers to access the array
            for ($i = 0; $i < count($paymentCoumnArray); $i++)  {
                if ($paymentCoumnArray[$i] == 'Date') {
                    $DateCol = $i;
                } else if ($paymentCoumnArray[$i] == 'Time') {
                    $TimeCol = $i;
                } else if ($paymentCoumnArray[$i] == 'TimeZone') {
                    $TimeZoneCol = $i;
                } else if ($paymentCoumnArray[$i] == 'Name') {
                    $NameCol = $i;
                } else if ($paymentCoumnArray[$i] == 'Type') {
                    $TypeCol = $i;
                } else if ($paymentCoumnArray[$i] == 'Gross') {
                    $GrossCol = $i;
                } else if ($paymentCoumnArray[$i] == 'Fee') {
                    $FeeCol = $i;
                } else if ($paymentCoumnArray[$i] == 'From Email Address') {
                    $FromEmailAddressCol = $i;
                } else if ($paymentCoumnArray[$i] == 'Transaction ID') {
                    $TransactionIDCol = $i;
                } else if ($paymentCoumnArray[$i] == 'Item Title') {
                    $ItemTitleCol = $i;
                } else if ($paymentCoumnArray[$i] == 'Custom Number') {
                    $CustomNumberCol = $i;
                } else if ($paymentCoumnArray[$i] == 'Contact Phone Number') {
                    $ContactPhoneNumberCol = $i;
                }
            }

            // Exit out with an error if we don't find all the columns we were expecting
            if ($DateCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'Date, ';
            }
            if ($TimeCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'Time, ';
            }
            if ($TimeZoneCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'TimeZone, ';
            }
            if ($NameCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'Name, ';
            }
            if ($TypeCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'Type, ';
            }
            if ($GrossCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'Gross, ';
            }
            if ($FeeCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'Fee, ';
            }
            if ($FromEmailAddressCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'From Email Address, ';
            }
            if ($TransactionIDCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'Transaction ID, ';
            }
            if ($ItemTitleCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'Item Title, ';
            }
            if ($CustomNumberCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'Custom Number, ';
            }
            if ($ContactPhoneNumberCol < 0) {
                $AllColsFound = false;
                $ExpectedColsNotFound .= 'Contact Phone Number';
            }

            if (!$AllColsFound) {
                // Exit out with an error
		        $adminRec->message = "Expected column names not found.  Missing Columns: " . $ExpectedColsNotFound;
                $adminRec->result = "Not Valid";
                exit(json_encode($adminRec));
            }

			continue;
		}

        $paymentArray = fgetcsv($file);
        if (!$paymentArray) {
            continue;
        }

        // Only want to check the current year dues payments
//Item Title
//2021 Dues and processing fee for property at <parcel location>
        //if ($paymentArray[$ItemTitleCol] != "Current Year Dues") {
        //    continue;
        //}
        if ($paymentArray[$TypeCol] != "Express Checkout Payment") {
            continue;
        }

        $paymentRec = new PaymentRec();
        $paymentRec->txn_id = $paymentArray[$TransactionIDCol];
        $paymentRec->payment_date = $paymentArray[$DateCol] . ' ' . $paymentArray[$TimeCol] . ' ' . $paymentArray[$TimeZoneCol];
        $paymentRec->name = $paymentArray[$NameCol];
        $paymentRec->fromEmail = $paymentArray[$FromEmailAddressCol];
        $paymentRec->gross = $paymentArray[$GrossCol];
        $paymentRec->fee = $paymentArray[$FeeCol];

        $strArray = explode(",",$paymentArray[$CustomNumberCol]);
        $paymentRec->FY = $strArray[0];
        $paymentRec->Parcel_ID = $strArray[1];

        $paymentRec->ContactPhone = $paymentArray[$ContactPhoneNumberCol];

        $paymentRec->TransLogged = false;
        $paymentRec->MarkedPaid = false;
        $paymentRec->EmailSent = false;

        // Get the HOADB data by Parcel Id
    	$hoaRec = getHoaRec($conn,$paymentRec->Parcel_ID,'',$paymentRec->FY);
    	if ($hoaRec != null) {
    		//error_log(date('[Y-m-d H:i:s] ') . '$hoaRec->Parcel_ID = ' . $hoaRec->Parcel_ID . ', $hoaRec->ownersList[0]->OwnerID = ' . $hoaRec->ownersList[0]->OwnerID . PHP_EOL, 3, LOG_FILE);
    		// Use the Owner Id of the current owner when recording the payment
            $paymentRec->OwnerID = $hoaRec->ownersList[0]->OwnerID;
            // Get Assessment PAID flag for the given fiscal year (FY)
            $paymentRec->MarkedPaid = $hoaRec->assessmentsList[0]->Paid;
        }

        // Get payment record by the Transaction Id
        $hoaPaymentRec = getHoaPaymentRec($conn,$paymentRec->Parcel_ID,$paymentRec->txn_id);
        if ($hoaPaymentRec != null) {
            $paymentRec->TransLogged = true;

            // Check the paidEmailSent flag on the transaction record to check if an email was sent to the payee member
            // to confirm that the payment was recorded in the HOADB
            if ($hoaPaymentRec->paidEmailSent == 'Y') {
                $paymentRec->EmailSent = true;
            }
        }

        // Add the payment display record to the list to send back for the display
        array_push($adminRec->paymentList,$paymentRec);

	} // End of while(!feof($file))
	fclose($file);

    if (count($adminRec->paymentList) == 0) {
		$adminRec->message = "No records in upload file";
    }
	$adminRec->result = "Valid";

	// Close db connection
	$conn->close();

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
