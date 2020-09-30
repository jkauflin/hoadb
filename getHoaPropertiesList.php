<?php
/*==============================================================================
 * (C) Copyright 2015,2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-09 JJK 	Initial version to get properties list
 * 2015-10-20 JJK	Improved the search by adding wildCardStrFromTokens
 * 					function to build wildcard parameter string from tokens
 * 2017-02-26 JJK	Added a general search to look through all columns
 * 					(someday switch to MySQL full text search for these fields)
 * 2020-07-23 JJK   Modified to require files from a secure location, use a 
 *                  function to get the Credentials file, and pass parameters 
 *                  to the getConn function
 * 2020-08-01 JJK   Re-factored to use jjklogin for authentication
 *============================================================================*/
require_once 'vendor/autoload.php'; 

// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Login Authentication class
require_once 'php_secure/jjklogin.php';
use \jkauflin\jjklogin\LoginAuth;
// Include database connection credentials from an external includes location
require_once getSecretsFilename();
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");

try {
    $userRec = LoginAuth::getUserRec($cookieName,$cookiePath,$serverKey);
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 1) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

	// If they are set, get input parameters from the REQUEST
	$searchStr = getParamVal("searchStr");
	$parcelId = getParamVal("parcelId");
	$lotNo = getParamVal("lotNo");
	$address = getParamVal("address");
	$ownerName = getParamVal("ownerName");
	$phoneNo = getParamVal("phoneNo");
	$altAddress = getParamVal("altAddress");
	$checkNo = getParamVal("checkNo");

	$sql = " ";
	$paramStr = " ";
	
	if (!empty($searchStr)) {
		$paramStr = wildCardStrFromTokens($searchStr);
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE (p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1) AND (";
		$sql = $sql . "UPPER(p.Parcel_ID) LIKE UPPER('" . $paramStr . "')";
		$sql = $sql . " OR p.LotNo LIKE UPPER('" . $paramStr . "')";
		$sql = $sql . " OR UPPER(p.Parcel_Location) LIKE UPPER('" . $paramStr . "')";
		$sql = $sql . " OR UPPER(CONCAT(o.Owner_Name1,' ',o.Owner_Name2,' ',o.Mailing_Name)) LIKE UPPER('" . $paramStr . "')";
		/*			
		$sql = $sql . " OR UPPER(o.Owner_Phone) LIKE UPPER('" . $paramStr . "')";
		$sql = $sql . " OR UPPER(o.Alt_Address_Line1) LIKE UPPER('" . $paramStr . "')";
		} elseif (!empty($checkNo)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a WHERE p.Parcel_ID = o.Parcel_ID AND p.Parcel_ID = a.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(a.Comments) ";
			$paramStr = wildCardStrFromTokens($checkNo);
		*/
		//$sql = $sql . "AND UPPER(a.Comments)";
		$sql = $sql . ") ORDER BY p.Parcel_ID; ";

		//error_log(date('[Y-m-d H:i] '). '$sql = ' . $sql . PHP_EOL, 3, 'php.log');
		
		$conn = getConn($host, $dbadmin, $password, $dbname);
		$stmt = $conn->prepare($sql);
		//$stmt->bind_param("s", $paramStr);
		$stmt->execute();
		$result = $stmt->get_result();
		
		$outputArray = array();
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$hoaPropertyRec = new HoaPropertyRec();
		
				$hoaPropertyRec->parcelId = $row["Parcel_ID"];
				$hoaPropertyRec->lotNo = $row["LotNo"];
				$hoaPropertyRec->subDivParcel = $row["SubDivParcel"];
				$hoaPropertyRec->parcelLocation = $row["Parcel_Location"];
				$hoaPropertyRec->ownerName = $row["Owner_Name1"] . ' ' . $row["Owner_Name2"];
				$hoaPropertyRec->ownerPhone = $row["Owner_Phone"];
		
				array_push($outputArray,$hoaPropertyRec);
			}
		}
		
		$stmt->close();
		$conn->close();
		
	} else {
		// Default SQL
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
		$paramStr = " ";
		
		if (!empty($parcelId)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
			$paramStr = wildCardStrFromTokens($parcelId);
		} elseif (!empty($lotNo)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND p.LotNo ";
			$paramStr = wildCardStrFromTokens($lotNo);
		} elseif (!empty($address)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_Location) ";
			$paramStr = wildCardStrFromTokens($address);
		} elseif (!empty($ownerName)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND UPPER(CONCAT(o.Owner_Name1,' ',o.Owner_Name2,' ',o.Mailing_Name)) ";
			// Check if a tokenized string was entered, break it into token and put wildcards between each token?
			// search need to be bullitproof if you are using it for members
			$paramStr = wildCardStrFromTokens($ownerName);
		} elseif (!empty($phoneNo)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND UPPER(o.Owner_Phone) ";
			$paramStr = wildCardStrFromTokens($phoneNo);
		} elseif (!empty($altAddress)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND UPPER(o.Alt_Address_Line1) ";
			$paramStr = wildCardStrFromTokens($altAddress);
		} elseif (!empty($checkNo)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a WHERE p.Parcel_ID = o.Parcel_ID AND p.Parcel_ID = a.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(a.Comments) ";
			$paramStr = wildCardStrFromTokens($checkNo);
		} else {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
			// Hardcode the default to find all parcels
			$paramStr = '%r%';
		}
		
		$sql = $sql . "LIKE UPPER(?) ORDER BY p.Parcel_ID; ";
		//error_log('$sql = ' . $sql);
		
		$conn = getConn($host, $dbadmin, $password, $dbname);
		$stmt = $conn->prepare($sql);
		$stmt->bind_param("s", $paramStr);
		$stmt->execute();
		$result = $stmt->get_result();
		
		$outputArray = array();
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$hoaPropertyRec = new HoaPropertyRec();
		
				$hoaPropertyRec->parcelId = $row["Parcel_ID"];
				$hoaPropertyRec->lotNo = $row["LotNo"];
				$hoaPropertyRec->subDivParcel = $row["SubDivParcel"];
				$hoaPropertyRec->parcelLocation = $row["Parcel_Location"];
				$hoaPropertyRec->ownerName = $row["Owner_Name1"] . ' ' . $row["Owner_Name2"];
				$hoaPropertyRec->ownerPhone = $row["Owner_Phone"];
		
				array_push($outputArray,$hoaPropertyRec);
			}
		}
		
		$stmt->close();
		$conn->close();
	}
	
	echo json_encode($outputArray);

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
}

?>
