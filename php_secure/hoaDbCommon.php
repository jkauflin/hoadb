<?php
/*==============================================================================
 * (C) Copyright 2015,2016,2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 * 2015-03-24 JJK	Included credentials files 
 * 2015-04-28 JJK	Added sales rec
 * 2015-09-08 JJK	Added sales array to main HoaRec structure
 * 2015-11-28 JJK   Added $TotalDue for the total amount due by a property 
 *                  and got it adding the unpaid assessments (using a 
 *                  regular expression replace to convert the string to
 *                  a numberic value)
 * 2016-03-28 JJK	Added getComm to return a database connection and moved
 * 					the hoaDbCred include inside it to access the variables	
 * 2016-04-05 JJK	Added Lien fields to the Assessments record
 * 2016-04-10 JJK	Working on Dues Total calculation (with Lien info)
 * 2016-04-13 JJK	Added sales download filename and email functions
 * 2016-04-29 JJK	Added paypal button script config string
 * 2016-05-02 JJK   Amy's 11th birthday.  
 * 2016-05-14 JJK   Added get Payment function
 * 2016-07-01 JJK	Added MySQL backup function
 * 2016-08-19 JJK   Added UseEmail in Properties and EmailAddr in Owners
 * 2016-09-02 JJK   Added NonCollectible field, and logic to use to 
 * 					exclude assessments from total due calculations
 * 2016-09-11 JJK   Modified to use truncDate when getting dates from
 * 					the assessment record (and added 1st token check)
 * 2016-10-25 JJK	Added HoaCommRec for the Communications records
 * 2016-11-28 JJK   Added $InterestNotPaid and $BankFee to HoaAssessmentRec
 * 					and to the dues calculations in both functions
 * 2017-08-16 JJK   Added $DuesEmailAddr for payment email address.
 *                  If there is an email from the last electronic payment, for the current Owner, 
 *					only use it if they are not going paperless or the paperless email is blank
 * 2018-10-27 JJK   Modified the error_log to write to hoadb.log
 * 2018-11-16 JJK	Added $hoaRecList to AdminRec to store all data needed for dues
 * 2018-11-24 JJK	Added $emailAddrList to store multiple email addresses
 * 2018-11-27 JJK	Added $EmailAddr2 to Owner rec and to emailAddrList
 * 2019-09-22 JJK   Checked logic for dues emails and communications
 * 2020-07-12 JJK   Modified to move the database credentials under an
 *                  external_includes folder above the public root
 *                  (added "../../external_includes/") to get to the file
 * 2020-07-14 JJK   Moved php files to separate /php folder
 * 2020-07-23 JJK   Changed philosophy of connections - always start in 
 *                  upper level calling file, don't try to start at this
 *                  "included functions" level and don't try to include
 *                  credentials at this level.  Just write functions and
 *                  pass them whatever they need.  (enforce thread isolation)
 * 2020-07-23 JJK   Added a function to return the name/location of the
 *                  credentials/secrets file (in the external includes)
 * 2020-08-05 JJK   Removed getConfigVal (get values from DB config table)
 * 2020-08-10 JJK   Added getSecretsFilename2 for includes from parent web
 *                  (Dad's 80th birthday)
 * 2020-08-23 JJK   Added $WelcomeSent to SalesRec
 * 2020-09-19 JJK   Corrected paypal IPN emails
 *                  Modified updAssessmentPaid to handle transaction
 *                  re-sends, update PAID flag and send email if not set
 * 2020-09-30 JJK   Adjusted the email error handling and return from the
 *                  updAssessmentPaid function
 * 2020-10-13 JJK   Added getHoaRecList to return a list of hoaRec objects
 *                  for reports and admin functions
 *============================================================================*/

function externalIncludesDir() {
    return "../../external_includes/";
}

function getSecretsFilename() {
    return "../../external_includes/hoadbSecrets.php";
}
function getSecretsFilename2() {
    return "../external_includes/hoadbSecrets.php";
}

function getConn($host, $dbadmin, $password, $dbname) {
    //error_log(date('[Y-m-d H:i:s] '). "in getConn, dbadmin = $dbadmin" . PHP_EOL, 3, LOG_FILE);

	// User variables set in the db connection credentials include and open a connection
	$conn = new mysqli($host, $dbadmin, $password, $dbname);
	// Check connection
	if ($conn->connect_error) {
		error_log(date('[Y-m-d H:i:s] '). "Connection failed: " . $conn->connect_error . PHP_EOL, 3, LOG_FILE);
		die("Connection failed: " . $conn->connect_error);
	}
	return $conn;
}

// Lookup config values by name from the config database table
function getConfigValDB($conn,$configName) {
	$configVal = "";

	$sql = "SELECT ConfigValue FROM hoa_config WHERE ConfigName = ? ";
	$stmt = $conn->prepare($sql);
	$stmt->bind_param("s", $configName);
	$stmt->execute();
	$result = $stmt->get_result();
	
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$configVal = $row["ConfigValue"];
		}
		$result->close();
		$stmt->close();
	}

	return $configVal;
}


class HoaRec
{
  	public $Parcel_ID;
  	public $LotNo;
  	public $SubDivParcel;
  	public $Parcel_Location;
  	public $Property_Street_No;
  	public $Property_Street_Name;
  	public $Property_City;
  	public $Property_State;
  	public $Property_Zip;
  	public $Member;
  	public $Vacant;
  	public $Rental;
  	public $Managed;
  	public $Foreclosure;
  	public $Bankruptcy;
  	public $Liens_2B_Released;
	public $UseEmail;
	public $DuesEmailAddr;
  	public $Comments;
  	public $LastChangedBy;
  	public $LastChangedTs;
  	 
	public $ownersList;
	public $assessmentsList;
	public $totalDuesCalcList;
	public $salesList;
    public $emailAddrList;
    public $commList;
	
	public $adminLevel;
	public $TotalDue;
	public $paymentButton;
	public $paymentInstructions;
	public $userName;
}

class HoaOwnerRec
{
	public $OwnerID;
  	public $Parcel_ID;
  	public $CurrentOwner;
 	public $Owner_Name1;
  	public $Owner_Name2;
  	public $DatePurchased;
  	public $Mailing_Name;
  	public $AlternateMailing;
  	public $Alt_Address_Line1;
  	public $Alt_Address_Line2;
  	public $Alt_City;
  	public $Alt_State;
  	public $Alt_Zip;
  	public $Owner_Phone;
  	public $EmailAddr;
  	public $EmailAddr2;
  	public $Comments;
  	public $EntryTimestamp;
  	public $UpdateTimestamp;
  	public $LastChangedBy;
  	public $LastChangedTs;
}

class HoaAssessmentRec
{
  	public $OwnerID;
  	public $Parcel_ID;
  	public $FY;
  	public $DuesAmt;
  	public $DateDue;
  	public $DuesDue;
  	public $Paid;
  	public $NonCollectible;
  	public $DatePaid;
  	public $PaymentMethod;
  	
  	public $Lien;
  	public $LienRefNo;
  	public $DateFiled;
  	public $Disposition;
  	public $FilingFee;
  	public $ReleaseFee;
  	public $DateReleased;
  	public $LienDatePaid;
  	public $AmountPaid;
  	public $StopInterestCalc;
  	public $FilingFeeInterest;
  	public $AssessmentInterest;
  	public $InterestNotPaid;
  	public $BankFee;
  	public $LienComment;
  	
  	public $Comments;
  	public $LastChangedBy;
  	public $LastChangedTs;
}

class HoaPropertyRec
{
	public $parcelId;
	public $lotNo;
	public $subDivParcel;
	public $parcelLocation;
	public $ownerName;
	public $ownerPhone;
}

class HoaSalesRec
{
	public $PARID;
	public $CONVNUM;
	public $SALEDT;
	public $PRICE;
	public $OLDOWN;
	public $OWNERNAME1;
	public $PARCELLOCATION;
	public $MAILINGNAME1;
	public $MAILINGNAME2;
	public $PADDR1;
	public $PADDR2;
	public $PADDR3;
	public $CreateTimestamp;
	public $NotificationFlag;
	public $ProcessedFlag;
	public $LastChangedBy;
  	public $LastChangedTs;
	public $adminLevel;
	public $WelcomeSent;
}

class HoaPaymentRec
{
	public $Parcel_ID;
	public $OwnerID;
	public $FY;
	public $txn_id;
	public $payment_date;
	public $payer_email;
	public $payment_amt;
	public $payment_fee;
	public $LastChangedTs;
	public $paidEmailSent;
}

class AdminRec
{
	public $userName;
	public $userLevel;
	public $result;
	public $message;
	
	public $hoaPropertyRecList;
	public $hoaRecList;
	public $paymentList;
	public $commList;
}

class PaymentRec
{
	public $txn_id;
    public $payment_date;
    public $name;
    public $gross;
    public $fee;
    public $fromEmail;
    public $Parcel_ID;
    public $OwnerID;
    public $FY;
    public $DuesAmt;
    public $ContactPhone;
    public $TransLogged;
    public $MarkedPaid;
    public $EmailSent;
}

class SendEmailRec
{
	public $result;
	public $message;
	public $sendEmailAddr;
	public $Parcel_ID;
	public $OwnerID;
}

class TotalDuesCalcRec
{
	public $calcDesc;
	public $calcValue;
}

class HoaConfigRec {
	public $ConfigName;
	public $ConfigDesc;
	public $ConfigValue;
}

class HoaCommRec {
	public $Parcel_ID;
	public $CommID;
	public $CreateTs;
	public $OwnerID;
	public $CommType;
    public $CommDesc;
    public $Mailing_Name;
    public $Email;
    public $EmailAddr;
    public $SentStatus;
    public $LastChangedBy;
    public $LastChangedTs;
}

class PaidDuesCountsRec
{
	public $fy;
	public $paidCnt;
	public $unpaidCnt;
	public $nonCollCnt;
	public $totalDue;
	public $nonCollDue;
}


function getHoaSalesRec($conn,$parcelId,$saleDate) {
	
	$hoaSalesRec = new HoaSalesRec();

	//$conn = getConn($host, $dbadmin, $password, $dbname);
	$stmt = $conn->prepare("SELECT * FROM hoa_sales WHERE PARID = ? AND SALEDT = ?; ");
	$stmt->bind_param("ss", $parcelId,$saleDate);
	$stmt->execute();
	$result = $stmt->get_result();
	
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$hoaSalesRec->PARID = $row["PARID"];
			$hoaSalesRec->CONVNUM = $row["CONVNUM"];
			$hoaSalesRec->SALEDT = $row["SALEDT"];
			$hoaSalesRec->PRICE = $row["PRICE"];
			$hoaSalesRec->OLDOWN = $row["OLDOWN"];
			$hoaSalesRec->OWNERNAME1 = $row["OWNERNAME1"];
			$hoaSalesRec->PARCELLOCATION = $row["PARCELLOCATION"];
			$hoaSalesRec->MAILINGNAME1 = $row["MAILINGNAME1"];
			$hoaSalesRec->MAILINGNAME2 = $row["MAILINGNAME2"];
			$hoaSalesRec->PADDR1 = $row["PADDR1"];
			$hoaSalesRec->PADDR2 = $row["PADDR2"];
			$hoaSalesRec->PADDR3 = $row["PADDR3"];
			$hoaSalesRec->CreateTimestamp = $row["CreateTimestamp"];
			$hoaSalesRec->NotificationFlag = $row["NotificationFlag"];
			$hoaSalesRec->ProcessedFlag = $row["ProcessedFlag"];
			$hoaSalesRec->LastChangedBy = $row["LastChangedBy"];
			$hoaSalesRec->LastChangedTs = $row["LastChangedTs"];
			
			$hoaSalesRec->adminLevel = 1;
		}
		$result->close();
	}
	$stmt->close();
	
	return $hoaSalesRec;
} // End of function getHoaSalesRec($conn,$parcelId,$saleDate) {

function getHoaPaymentRec($conn,$parcelId,$transId) {

	$hoaPaymentRec = null;
	
	$stmt = $conn->prepare("SELECT * FROM hoa_payments WHERE Parcel_ID = ? AND txn_id = ?; ");
	$stmt->bind_param("ss", $parcelId,$transId);
	$stmt->execute();
	$result = $stmt->get_result();

	$cnt = 0;
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$cnt++;
			if ($cnt == 1) {
				$hoaPaymentRec = new HoaPaymentRec();
			}
			$hoaPaymentRec->Parcel_ID = $row["Parcel_ID"];
			$hoaPaymentRec->OwnerID = $row["OwnerID"];
			$hoaPaymentRec->FY = $row["FY"];
			$hoaPaymentRec->txn_id = $row["txn_id"];
			$hoaPaymentRec->payment_date = $row["payment_date"];
			$hoaPaymentRec->payer_email = $row["payer_email"];
			$hoaPaymentRec->payment_amt = $row["payment_amt"];
			$hoaPaymentRec->payment_fee = $row["payment_fee"];
            $hoaPaymentRec->LastChangedTs = $row["LastChangedTs"];
            $hoaPaymentRec->paidEmailSent = $row["paidEmailSent"];
		}
		$result->close();
	}
	$stmt->close();

	return $hoaPaymentRec;
} // End of function getHoaPaymentRec($conn,$parcelId,$transId) {


// Create the dues notice message to be sent in emails
function createDuesMessage($conn,$hoaRec,$firstNotice) {
    $htmlMessageStr = '';
    $title = 'Member Dues Notice';
    $hoaName = getConfigValDB($conn,'hoaName');

    // Current System datetime
    $currSysDate = date_create();

    $FY = 1991;
    // *** just use the highest FY - the first assessment record ***
    $result = $conn->query("SELECT MAX(FY) AS maxFY FROM hoa_assessments; ");
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $FY = $row["maxFY"];
        }
    }
    $result->close();

    $noticeYear = (string) $hoaRec->assessmentsList[0]->FY - 1;
    $noticeDate = date_format($currSysDate,"Y-m-d");

    $htmlMessageStr .= '<b>' . $hoaName . '</b>' . '<br>';
    $htmlMessageStr .= $title . " for Fiscal Year " . '<b>' . $FY . '</b>' . '<br>';
    $htmlMessageStr .= '<b>For the Period:</b> Oct 1st, ' . $noticeYear . ' thru Sept 30th, ' . $FY . '<br><br>';

    $htmlMessageStr .= '<b>Current Dues Amount: </b>$' . stringToMoney($hoaRec->assessmentsList[0]->DuesAmt) . '<br>';
    $htmlMessageStr .= '<b>Total Due (as of ' . $noticeDate . ') :</b> $' . $hoaRec->TotalDue . '<br>';
    $htmlMessageStr .= '<b>Due Date: </b>' . 'October 1st, ' . $noticeYear . '<br>';
    $htmlMessageStr .= '<b>Dues must be paid to avoid a lien and lien fees </b><br><br>';

    $htmlMessageStr .= '<b>Parcel Id: </b>' . $hoaRec->Parcel_ID . '<br>';
    $htmlMessageStr .= '<b>Lot:</b> ' . $hoaRec->LotNo . '<br>';
    $htmlMessageStr .= '<b>Owner: </b>' . $hoaRec->ownersList[0]->Mailing_Name . '<br>';
    $htmlMessageStr .= '<b>Location: </b>' . $hoaRec->Parcel_Location . '<br>';
    $htmlMessageStr .= '<b>Phone: </b>' . $hoaRec->ownersList[0]->Owner_Phone . '<br>';
    $htmlMessageStr .= '<b>Email: </b>' . $hoaRec->DuesEmailAddr . '<br>';
    $htmlMessageStr .= '<b>Email2: </b>' . $hoaRec->ownersList[0]->EmailAddr2 . '<br>';

    $htmlMessageStr .= '<h3><a href="' . getConfigValDB($conn,'duesUrl') . '">Click here to view Dues Statement or PAY online</a></h3>';

    $htmlMessageStr .= 'Send payment checks to:<br>';
    $htmlMessageStr .= '<b>' . getConfigValDB($conn,'hoaNameShort') . '</b>' . '<br>';
    $htmlMessageStr .= '<b>' . getConfigValDB($conn,'hoaAddress1') . '</b>' . '<br>';
    $htmlMessageStr .= '<b>' . getConfigValDB($conn,'hoaAddress2') . '</b>' . '<br>';

    $helpNotes = getConfigValDB($conn,'duesNotes');
    if (!empty($helpNotes)) {
        $htmlMessageStr .= '<br>' . $helpNotes . '<br>';
    }

    return $htmlMessageStr;
}


//--------------------------------------------------------------------------------------------------------------
// Primary function to get all the data for a particular value
//--------------------------------------------------------------------------------------------------------------
function getHoaRec($conn,$parcelId,$ownerId='',$fy='',$saleDate='',$paypalFixedAmtButtonForm='',$paypalFixedAmtButtonInput='') {
	$hoaRec = new HoaRec();

	// Total Due is calculated below
	$hoaRec->TotalDue = 0.00;
	// Payment button will be set if online payment is enabled and allowed for this parcel
	$hoaRec->paymentButton = '';
	$hoaRec->paymentInstructions = '';
	$hoaRec->DuesEmailAddr = '';
	$CurrentOwnerID = 0;
	
	// Get values from database and load into structure that will be returned as JSON
	$stmt = $conn->prepare("SELECT * FROM hoa_properties WHERE Parcel_ID = ? ; ");
	$stmt->bind_param("s", $parcelId);
	$stmt->execute();
	$result = $stmt->get_result();
	
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$hoaRec->Parcel_ID = $row["Parcel_ID"];
			$hoaRec->LotNo = $row["LotNo"];
			$hoaRec->SubDivParcel = $row["SubDivParcel"];
			$hoaRec->Parcel_Location = $row["Parcel_Location"];
			$hoaRec->Property_Street_No = $row["Property_Street_No"];
			$hoaRec->Property_Street_Name = $row["Property_Street_Name"];
			$hoaRec->Property_City = $row["Property_City"];
			$hoaRec->Property_State = $row["Property_State"];
			$hoaRec->Property_Zip = $row["Property_Zip"];
			$hoaRec->Member = $row["Member"];
			$hoaRec->Vacant = $row["Vacant"];
			$hoaRec->Rental = $row["Rental"];
			$hoaRec->Managed = $row["Managed"];
			$hoaRec->Foreclosure = $row["Foreclosure"];
			$hoaRec->Bankruptcy = $row["Bankruptcy"];
			$hoaRec->Liens_2B_Released = $row["Liens_2B_Released"];
			$hoaRec->UseEmail = $row["UseEmail"];
			$hoaRec->Comments = $row["Comments"];
			$hoaRec->LastChangedBy = $row["LastChangedBy"];
			$hoaRec->LastChangedTs = $row["LastChangedTs"];
				
			$hoaRec->ownersList = array();
			$hoaRec->assessmentsList = array();
			$hoaRec->totalDuesCalcList = array();
			$hoaRec->salesList = array();
			$hoaRec->emailAddrList = array();
		}
		$result->close();
		$stmt->close();
	
		if (empty($ownerId)) {
			$stmt = $conn->prepare("SELECT * FROM hoa_owners WHERE Parcel_ID = ? ORDER BY OwnerID DESC ; ");
			//$stmt = $conn->prepare("SELECT * FROM hoa_owners WHERE Parcel_ID = ? ORDER BY DATE(DatePurchased) DESC ; ");
			$stmt->bind_param("s", $parcelId);
		} else {
			$stmt = $conn->prepare("SELECT * FROM hoa_owners WHERE Parcel_ID = ? AND OwnerID = ? ORDER BY OwnerID DESC ; ");
			//$stmt = $conn->prepare("SELECT * FROM hoa_owners WHERE Parcel_ID = ? AND OwnerID = ? ORDER BY DATE(DatePurchased) DESC ; ");
			$stmt->bind_param("ss", $parcelId,$ownerId);
		}
		$stmt->execute();
		$result = $stmt->get_result();
	
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$hoaOwnerRec = new HoaOwnerRec();
				$hoaOwnerRec->OwnerID = $row["OwnerID"];
				$hoaOwnerRec->Parcel_ID = $row["Parcel_ID"];
				$hoaOwnerRec->CurrentOwner = $row["CurrentOwner"];
				$hoaOwnerRec->Owner_Name1 = $row["Owner_Name1"];
				$hoaOwnerRec->Owner_Name2 = $row["Owner_Name2"];
				$hoaOwnerRec->DatePurchased = truncDate($row["DatePurchased"]);
				$hoaOwnerRec->Mailing_Name = $row["Mailing_Name"];
				$hoaOwnerRec->AlternateMailing = $row["AlternateMailing"];
				$hoaOwnerRec->Alt_Address_Line1 = $row["Alt_Address_Line1"];
				$hoaOwnerRec->Alt_Address_Line2 = $row["Alt_Address_Line2"];
				$hoaOwnerRec->Alt_City = $row["Alt_City"];
				$hoaOwnerRec->Alt_State = $row["Alt_State"];
				$hoaOwnerRec->Alt_Zip = $row["Alt_Zip"];
				$hoaOwnerRec->Owner_Phone = $row["Owner_Phone"];
				$hoaOwnerRec->EmailAddr = $row["EmailAddr"];
				$hoaOwnerRec->EmailAddr2 = $row["EmailAddr2"];
				$hoaOwnerRec->Comments = $row["Comments"];
				$hoaOwnerRec->EntryTimestamp = $row["EntryTimestamp"];
				$hoaOwnerRec->UpdateTimestamp = $row["UpdateTimestamp"];
				$hoaOwnerRec->LastChangedBy = $row["LastChangedBy"];
				$hoaOwnerRec->LastChangedTs = $row["LastChangedTs"];
				
				if ($hoaOwnerRec->CurrentOwner) {
					// Get the email address for the current owner
					$hoaRec->DuesEmailAddr = $hoaOwnerRec->EmailAddr;
					// If an email address is specified, add it to the list for the current owner
					if ($hoaOwnerRec->EmailAddr != '') {
						array_push($hoaRec->emailAddrList,$hoaOwnerRec->EmailAddr);
					}
					if ($hoaOwnerRec->EmailAddr2 != '') {
						array_push($hoaRec->emailAddrList,$hoaOwnerRec->EmailAddr2);
					}
					// *** check and add other email addresses here
					$CurrentOwnerID = $hoaOwnerRec->OwnerID;
				}

				array_push($hoaRec->ownersList,$hoaOwnerRec);
			}
		} // End of Owners
		$result->close();
		$stmt->close();

		//--------------------------------------------------------------------------------------------------------------------------
		// Override email address to use if we get the last email used to make an electronic payment
		//--------------------------------------------------------------------------------------------------------------------------
		$stmt = $conn->prepare("SELECT payer_email FROM hoa_payments WHERE Parcel_ID = ? AND OwnerID = ? ORDER BY FY DESC ; ");
		$stmt->bind_param("ss", $parcelId,$CurrentOwnerID);
		$stmt->execute();
		$result = $stmt->get_result();
		$tempEmail = '';
		if ($result->num_rows > 0) {
			if ($row = $result->fetch_assoc()) {
				$tempEmail = $row["payer_email"];
				//error_log(date('[Y-m-d H:i:s] '). " tempEmail = " . $tempEmail . PHP_EOL, 3, "hoadb.log");

				// If there is an email from the last electronic payment, for the current Owner, only use it 
				// if they are not going paperless or the paperless email is blank
				//if (!$hoaRec->UseEmail || $hoaRec->DuesEmailAddr == '') {
				//	$hoaRec->DuesEmailAddr = $row["payer_email"];
				//}

				// If there is an email from the last electronic payment, for the current Owner, 
				// add it to the email list (if not already in the array)
				if (!in_array($tempEmail, $hoaRec->emailAddrList)) {
					//error_log(date('[Y-m-d H:i:s] '). " push tempEmail = " . $tempEmail . PHP_EOL, 3, "hoadb.log");
					array_push($hoaRec->emailAddrList,$tempEmail);
				}
			}
		} // End of Owners
		$result->close();
		$stmt->close();


		if (empty($fy) || $fy == "LATEST") {
			$stmt = $conn->prepare("SELECT * FROM hoa_assessments WHERE Parcel_ID = ? ORDER BY FY DESC ; ");
			$stmt->bind_param("s", $parcelId);
		} else {
			$stmt = $conn->prepare("SELECT * FROM hoa_assessments WHERE Parcel_ID = ? AND FY = ? ORDER BY FY DESC ; ");
			$stmt->bind_param("ss", $parcelId,$fy);
		}
		$stmt->execute();
		$result = $stmt->get_result();

		$fyPayment = '';
		$onlyCurrYearDue = false;
		$cnt = 0;
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$cnt = $cnt + 1;
				if ($fy == "LATEST" && $cnt > 1) {
					continue;
				}
				$hoaAssessmentRec = new HoaAssessmentRec();
				$hoaAssessmentRec->OwnerID = $row["OwnerID"];
				$hoaAssessmentRec->Parcel_ID = $row["Parcel_ID"];
				$hoaAssessmentRec->FY = $row["FY"];
				$hoaAssessmentRec->DuesAmt = $row["DuesAmt"];
				$hoaAssessmentRec->DateDue = truncDate($row["DateDue"]);
				$hoaAssessmentRec->Paid = $row["Paid"];
				$hoaAssessmentRec->NonCollectible = $row["NonCollectible"];
				$hoaAssessmentRec->DatePaid = truncDate($row["DatePaid"]);
				$hoaAssessmentRec->PaymentMethod = $row["PaymentMethod"];
				
				$hoaAssessmentRec->DuesDue = 0;
				if (!$hoaAssessmentRec->Paid && !$hoaAssessmentRec->NonCollectible) {
					if ($cnt == 1) {
						$onlyCurrYearDue = true;
						$fyPayment = $hoaAssessmentRec->FY;
					} else {
						$onlyCurrYearDue = false;
					}

					// check dates???
					
					if ($dateDue=date_create($hoaAssessmentRec->DateDue)) {
						// Current System datetime
						$currSysDate=date_create();
						if ($currSysDate > $dateDue) {
							$hoaAssessmentRec->DuesDue = 1;
						}
						/*
						$diff=date_diff($date1,$date2,true);
						error_log('date1=' . date_format($date1,"Y-m-d") . ', date2=' . date_format($date2,"Y-m-d") . ", diff days = " . $diff->days);
						$diff=date_diff($date1,$date2,false);
						error_log('date1=' . date_format($date1,"Y-m-d") . ', date2=' . date_format($date2,"Y-m-d") . ", diff days = " . $diff->days);
						
						
						$diff=date_diff($date2,$date1,true);
						error_log('date2=' . date_format($date2,"Y-m-d") . ', date1=' . date_format($date1,"Y-m-d") . ", diff days = " . $diff->days);
						$diff=date_diff($date2,$date1,false);
						error_log('date2=' . date_format($date2,"Y-m-d") . ', date1=' . date_format($date1,"Y-m-d") . ", diff days = " . $diff->days);
						
						if ($diff->days > 0) {
							$hoaAssessmentRec->DuesDue = 1;
						}
						*/
					}
				}
				
				$hoaAssessmentRec->Lien = $row["Lien"];
				$hoaAssessmentRec->LienRefNo = $row["LienRefNo"];
				$hoaAssessmentRec->DateFiled = truncDate($row["DateFiled"]);
				$hoaAssessmentRec->Disposition = $row["Disposition"];
				$hoaAssessmentRec->FilingFee = $row["FilingFee"];
				$hoaAssessmentRec->ReleaseFee = $row["ReleaseFee"];
				$hoaAssessmentRec->DateReleased = $row["DateReleased"];
				$hoaAssessmentRec->LienDatePaid = truncDate($row["LienDatePaid"]);
				$hoaAssessmentRec->AmountPaid = $row["AmountPaid"];
				$hoaAssessmentRec->StopInterestCalc = $row["StopInterestCalc"];
				$hoaAssessmentRec->FilingFeeInterest = $row["FilingFeeInterest"];
				$hoaAssessmentRec->AssessmentInterest = $row["AssessmentInterest"];
				$hoaAssessmentRec->InterestNotPaid = $row["InterestNotPaid"];
				$hoaAssessmentRec->BankFee = $row["BankFee"];
				$hoaAssessmentRec->LienComment = $row["LienComment"];
				
				$hoaAssessmentRec->Comments = $row["Comments"];
				$hoaAssessmentRec->LastChangedBy = $row["LastChangedBy"];
				$hoaAssessmentRec->LastChangedTs = $row["LastChangedTs"];
				
				array_push($hoaRec->assessmentsList,$hoaAssessmentRec);
				
				
				// Only do the Total calc if FY is empty - need to check all years
				//if (empty($fy)) {

				//-------------------------------------------------------------------------------------------------------------------------------
				// Logic to calculate the Total Due from assessments and liens
				//-------------------------------------------------------------------------------------------------------------------------------
				$duesAmt = 0.0;
				if (!$hoaAssessmentRec->Paid && !$hoaAssessmentRec->NonCollectible) {
					// Replace every ascii character except decimal and digits with a null
					$duesAmt = stringToMoney($hoaAssessmentRec->DuesAmt); 
					$hoaRec->TotalDue += $duesAmt;
					
					$totalDuesCalcRec = new TotalDuesCalcRec();
					$totalDuesCalcRec->calcDesc = 'FY ' . $hoaAssessmentRec->FY . ' Assessment (due ' . $hoaAssessmentRec->DateDue . ')';
					$totalDuesCalcRec->calcValue = $duesAmt;
					array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);

					//error_log(date('[Y-m-d H:i:s] '). "DateDue = " . $hoaAssessmentRec->DateDue . PHP_EOL, 3, "jjk-hoaDbCommon.log");
						
					// Calculate interest on the assessment (if a Lien has been created and is Open)
					if ($hoaAssessmentRec->Lien && $hoaAssessmentRec->Disposition == 'Open') {
						$onlyCurrYearDue = false;
						// If still calculating interest dynamically calculate the compound interest						
						if (!$hoaAssessmentRec->StopInterestCalc) {
							$hoaAssessmentRec->AssessmentInterest = calcCompoundInterest($duesAmt,$hoaAssessmentRec->DateDue);
						}
						
						$hoaRec->TotalDue = $hoaRec->TotalDue + $hoaAssessmentRec->AssessmentInterest;
						$totalDuesCalcRec = new TotalDuesCalcRec();
						$totalDuesCalcRec->calcDesc = '%6 Interest on FY ' . $hoaAssessmentRec->FY . ' Assessment (since ' . $hoaAssessmentRec->DateDue . ')';
						$totalDuesCalcRec->calcValue = $hoaAssessmentRec->AssessmentInterest;
						array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
					}
				}
				
				// If the Assessment was Paid but the interest was not, then add the interest to the total
				if ($hoaAssessmentRec->Paid && $hoaAssessmentRec->InterestNotPaid) {
					$onlyCurrYearDue = false;
					// If still calculating interest dynamically calculate the compound interest
					if (!$hoaAssessmentRec->StopInterestCalc) {
						$hoaAssessmentRec->AssessmentInterest = calcCompoundInterest($duesAmt,$hoaAssessmentRec->DateDue);
					}
					
					$hoaRec->TotalDue = $hoaRec->TotalDue + $hoaAssessmentRec->AssessmentInterest;
					$totalDuesCalcRec = new TotalDuesCalcRec();
					$totalDuesCalcRec->calcDesc = '%6 Interest on FY ' . $hoaAssessmentRec->FY . ' Assessment (since ' . $hoaAssessmentRec->DateDue . ')';
					$totalDuesCalcRec->calcValue = $hoaAssessmentRec->AssessmentInterest;
					array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
				}
				
				/*
				 Dues Total calculation logic
				 If Assessment NOT Paid, Assessment amount is added
				 Lien
				 Open
				 If Lien is Open (and Stop Interest Calc is NOT set), Assessment Interest (from Date Due) is added
				 Paid
				 Released
				 	Release Fee - added if entered
				 Closed
				
				 Stop Interest Calc
				
				 What if Assessment Paid, but Lien still Open???

					$onlyCurrYearDue = false;  (logical for when to show Paypal button - if just simple current fee dues (no liens or previous)
						*** if this is the case, give a message on the screen to contact Treasurer ***
					
					FilingFeeInterest - interest on the Filing Fee (when Lien Open and NOT stop calculating interest)
						if (!$hoaAssessmentRec->StopInterestCalc) {
							$hoaAssessmentRec->FilingFeeInterest = calcCompoundInterest($hoaAssessmentRec->FilingFee,$hoaAssessmentRec->DateFiled);
						}
				 */
				
				// If there is an Open Lien (not Paid, Released, or Closed)
				if ($hoaAssessmentRec->Lien && $hoaAssessmentRec->Disposition == 'Open' && !$hoaAssessmentRec->NonCollectible) {
				
					// calc interest - start date   WHEN TO CALC INTEREST
					// unpaid fee amount and interest since the Filing Date

					// if there is a Filing Fee (on an Open Lien), then check to calc interest (or use stored value)
					
					if ($hoaAssessmentRec->FilingFee > 0) {
						// shouldn't have to do this for the ones that are stored as Decimal right???  shouldn't have to parse, floatval, or round
						//$numericStr = preg_replace('/[\x01-\x2D\x2F\x3A-\x7F]+/', '', $hoaAssessmentRec->DuesAmt);
						$hoaRec->TotalDue += $hoaAssessmentRec->FilingFee;
						$totalDuesCalcRec = new TotalDuesCalcRec();
						$totalDuesCalcRec->calcDesc = 'FY ' . $hoaAssessmentRec->FY . ' Assessment Lien Filing Fee';
						$totalDuesCalcRec->calcValue = $hoaAssessmentRec->FilingFee;
						array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
						
						// If stopping dynamic interest calculation just take the stored value, else calculate the interest
						if (!$hoaAssessmentRec->StopInterestCalc) {
							$hoaAssessmentRec->FilingFeeInterest = calcCompoundInterest($hoaAssessmentRec->FilingFee,$hoaAssessmentRec->DateFiled);
						}

						$hoaRec->TotalDue += $hoaAssessmentRec->FilingFeeInterest;
						$totalDuesCalcRec = new TotalDuesCalcRec();
						$totalDuesCalcRec->calcDesc = '%6 Interest on Filing Fees (since ' . $hoaAssessmentRec->DateFiled . ')';
						$totalDuesCalcRec->calcValue = $hoaAssessmentRec->FilingFeeInterest;
						array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
						
					} // End of if ($hoaAssessmentRec->FilingFee > 0) {
					
					if ($hoaAssessmentRec->ReleaseFee > 0) {
						$hoaRec->TotalDue += $hoaAssessmentRec->ReleaseFee;
						$totalDuesCalcRec = new TotalDuesCalcRec();
						$totalDuesCalcRec->calcDesc = 'FY ' . $hoaAssessmentRec->FY . ' Assessment Lien Release Fee';
						$totalDuesCalcRec->calcValue = $hoaAssessmentRec->ReleaseFee;
						array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
					}
					
					if ($hoaAssessmentRec->BankFee > 0) {
						$hoaRec->TotalDue += $hoaAssessmentRec->BankFee;
						$totalDuesCalcRec = new TotalDuesCalcRec();
						$totalDuesCalcRec->calcDesc = 'FY ' . $hoaAssessmentRec->FY . ' Assessment Bank Fee';
						$totalDuesCalcRec->calcValue = $hoaAssessmentRec->BankFee;
						array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
					}

				} // if ($hoaAssessmentRec->Lien && $hoaAssessmentRec->Disposition == 'Open') {
				
			} // End of Assessments loop
	
		} // End of if Assessments
		
		$result->close();
		$stmt->close();

		//---------------------------------------------------------------------------------------------------
		// Construct the online payment button and instructions according to what is owed
		//---------------------------------------------------------------------------------------------------
		// Only display payment button if something is owed
		// For now, only set payment button if just the current year dues are owed (no other years or open liens)
		if ($hoaRec->TotalDue > 0) {
			if ($onlyCurrYearDue) {
				$hoaRec->paymentButton = $paypalFixedAmtButtonForm;
                $hoaRec->paymentButton .= $paypalFixedAmtButtonInput;
                
				$customValues = $parcelId . ',' . $ownerId . ',' . $fyPayment . ',' .$hoaRec->TotalDue;
				$hoaRec->paymentButton .= '<input type="hidden" name="custom" value="' . $customValues . '">';
				$hoaRec->paymentButton .= '</form>';
				$hoaRec->paymentInstructions = '($4.00 processing fee will be added for online payment)';
			} else {
				// Non-online Paypal payment instructions
				$hoaRec->paymentInstructions = '(general payment instructions - contact Treasurer)';
				
			}
		} // End of if ($hoaRec->TotalDue > 0) {

		
		// Get sales records for this parcel		
		if (empty($saleDate)) {
			$stmt = $conn->prepare("SELECT * FROM hoa_sales WHERE PARID = ? ORDER BY CreateTimestamp DESC; ");
			$stmt->bind_param("s", $parcelId);
		} else {
			$stmt = $conn->prepare("SELECT * FROM hoa_sales WHERE PARID = ? AND SALEDT = ?; ");
			$stmt->bind_param("ss", $parcelId,$saleDate);
		}
		$stmt->execute();
		$result = $stmt->get_result();
		
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$hoaSalesRec = new HoaSalesRec();
				$hoaSalesRec->PARID = $row["PARID"];
				$hoaSalesRec->CONVNUM = $row["CONVNUM"];
				$hoaSalesRec->SALEDT = $row["SALEDT"];
				$hoaSalesRec->PRICE = $row["PRICE"];
				$hoaSalesRec->OLDOWN = $row["OLDOWN"];
				$hoaSalesRec->OWNERNAME1 = $row["OWNERNAME1"];
				$hoaSalesRec->PARCELLOCATION = $row["PARCELLOCATION"];
				$hoaSalesRec->MAILINGNAME1 = $row["MAILINGNAME1"];
				$hoaSalesRec->MAILINGNAME2 = $row["MAILINGNAME2"];
				$hoaSalesRec->PADDR1 = $row["PADDR1"];
				$hoaSalesRec->PADDR2 = $row["PADDR2"];
				$hoaSalesRec->PADDR3 = $row["PADDR3"];
				$hoaSalesRec->CreateTimestamp = $row["CreateTimestamp"];
				$hoaSalesRec->NotificationFlag = $row["NotificationFlag"];
				$hoaSalesRec->ProcessedFlag = $row["ProcessedFlag"];
				$hoaSalesRec->LastChangedBy = $row["LastChangedBy"];
				$hoaSalesRec->LastChangedTs = $row["LastChangedTs"];
		
				array_push($hoaRec->salesList,$hoaSalesRec);
			}
		
		} // End of Assessments
		$result->close();
		$stmt->close();

	} else {
		$result->close();
		$stmt->close();
	} // End of Properties

	return $hoaRec;
} // End of function getHoaRec($conn,$parcelId,$ownerId,$fy) {


function getHoaRec2($conn,$parcelId,$paypalFixedAmtButtonForm='',$paypalFixedAmtButtonInput='') {
	$ownerId = '';
	$fy = '';
	$saleDate = '';
	
	$hoaRec = new HoaRec();
	
	// Total Due is calculated below
	$hoaRec->TotalDue = 0.00;
	// Payment button will be set if online payment is enabled and allowed for this parcel
	$hoaRec->paymentButton = '';
	$hoaRec->paymentInstructions = '';
	
	// Get values from database and load into structure that will be returned as JSON
	$stmt = $conn->prepare("SELECT * FROM hoa_properties WHERE Parcel_ID = ? ; ");
	$stmt->bind_param("s", $parcelId);
	$stmt->execute();
	$result = $stmt->get_result();
	
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$hoaRec->Parcel_ID = $row["Parcel_ID"];
			$hoaRec->LotNo = $row["LotNo"];
			$hoaRec->SubDivParcel = $row["SubDivParcel"];
			$hoaRec->Parcel_Location = $row["Parcel_Location"];
			$hoaRec->Property_Street_No = $row["Property_Street_No"];
			$hoaRec->Property_Street_Name = $row["Property_Street_Name"];
			$hoaRec->Property_City = $row["Property_City"];
			$hoaRec->Property_State = $row["Property_State"];
			$hoaRec->Property_Zip = $row["Property_Zip"];
			$hoaRec->Member = $row["Member"];
			$hoaRec->Vacant = $row["Vacant"];
			$hoaRec->Rental = $row["Rental"];
			$hoaRec->Managed = $row["Managed"];
			$hoaRec->Foreclosure = $row["Foreclosure"];
			$hoaRec->Bankruptcy = $row["Bankruptcy"];
			$hoaRec->Liens_2B_Released = $row["Liens_2B_Released"];
			$hoaRec->UseEmail = $row["UseEmail"];
			$hoaRec->Comments = $row["Comments"];
			$hoaRec->LastChangedBy = $row["LastChangedBy"];
			$hoaRec->LastChangedTs = $row["LastChangedTs"];
	
			$hoaRec->ownersList = array();
			$hoaRec->assessmentsList = array();
			$hoaRec->totalDuesCalcList = array();
			$hoaRec->salesList = array();
		}
		$result->close();
		$stmt->close();
	
		if (empty($fy) || $fy == "LATEST") {
			$stmt = $conn->prepare("SELECT * FROM hoa_assessments WHERE Parcel_ID = ? ORDER BY FY DESC ; ");
			$stmt->bind_param("s", $parcelId);
		} else {
			$stmt = $conn->prepare("SELECT * FROM hoa_assessments WHERE Parcel_ID = ? AND FY = ? ORDER BY FY DESC ; ");
			$stmt->bind_param("ss", $parcelId,$fy);
		}
		$stmt->execute();
		$result = $stmt->get_result();
	
		$fyPayment = '';
		$onlyCurrYearDue = false;
		$cnt = 0;
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$cnt = $cnt + 1;
				if ($fy == "LATEST" && $cnt > 1) {
					continue;
				}
				$hoaAssessmentRec = new HoaAssessmentRec();
				$hoaAssessmentRec->OwnerID = $row["OwnerID"];
				$hoaAssessmentRec->Parcel_ID = $row["Parcel_ID"];
				$hoaAssessmentRec->FY = $row["FY"];
				$hoaAssessmentRec->DuesAmt = $row["DuesAmt"];
				$hoaAssessmentRec->DateDue = truncDate($row["DateDue"]);
				$hoaAssessmentRec->Paid = $row["Paid"];
				$hoaAssessmentRec->NonCollectible = $row["NonCollectible"];
				$hoaAssessmentRec->DatePaid = truncDate($row["DatePaid"]);
				$hoaAssessmentRec->PaymentMethod = $row["PaymentMethod"];
	
				$hoaAssessmentRec->DuesDue = 0;
				if (!$hoaAssessmentRec->Paid && !$hoaAssessmentRec->NonCollectible) {
					if ($cnt == 1) {
						$onlyCurrYearDue = true;
						$fyPayment = $hoaAssessmentRec->FY;
					} else {
						$onlyCurrYearDue = false;
					}
	
					if ($dateDue=date_create($hoaAssessmentRec->DateDue)) {
						// Current System datetime
						$currSysDate=date_create();
						if ($currSysDate > $dateDue) {
							$hoaAssessmentRec->DuesDue = 1;
						}
						/*
							$diff=date_diff($date1,$date2,true);
							error_log('date1=' . date_format($date1,"Y-m-d") . ', date2=' . date_format($date2,"Y-m-d") . ", diff days = " . $diff->days);
							$diff=date_diff($date1,$date2,false);
							error_log('date1=' . date_format($date1,"Y-m-d") . ', date2=' . date_format($date2,"Y-m-d") . ", diff days = " . $diff->days);
	
	
							$diff=date_diff($date2,$date1,true);
							error_log('date2=' . date_format($date2,"Y-m-d") . ', date1=' . date_format($date1,"Y-m-d") . ", diff days = " . $diff->days);
							$diff=date_diff($date2,$date1,false);
							error_log('date2=' . date_format($date2,"Y-m-d") . ', date1=' . date_format($date1,"Y-m-d") . ", diff days = " . $diff->days);
	
							if ($diff->days > 0) {
							$hoaAssessmentRec->DuesDue = 1;
							}
							*/
					}
				}
	
				$hoaAssessmentRec->Lien = $row["Lien"];
				$hoaAssessmentRec->LienRefNo = $row["LienRefNo"];
				$hoaAssessmentRec->DateFiled = $row["DateFiled"];
				$hoaAssessmentRec->Disposition = $row["Disposition"];
				$hoaAssessmentRec->FilingFee = $row["FilingFee"];
				$hoaAssessmentRec->ReleaseFee = $row["ReleaseFee"];
				$hoaAssessmentRec->DateReleased = $row["DateReleased"];
				$hoaAssessmentRec->LienDatePaid = $row["LienDatePaid"];
				$hoaAssessmentRec->AmountPaid = $row["AmountPaid"];
				$hoaAssessmentRec->StopInterestCalc = $row["StopInterestCalc"];
				$hoaAssessmentRec->FilingFeeInterest = $row["FilingFeeInterest"];
				$hoaAssessmentRec->AssessmentInterest = $row["AssessmentInterest"];
				$hoaAssessmentRec->InterestNotPaid = $row["InterestNotPaid"];
				$hoaAssessmentRec->BankFee = $row["BankFee"];
				$hoaAssessmentRec->LienComment = $row["LienComment"];
	
				$hoaAssessmentRec->Comments = $row["Comments"];
				$hoaAssessmentRec->LastChangedBy = $row["LastChangedBy"];
				$hoaAssessmentRec->LastChangedTs = $row["LastChangedTs"];
	
				array_push($hoaRec->assessmentsList,$hoaAssessmentRec);
	
	
				// Only do the Total calc if FY is empty - need to check all years
				//if (empty($fy)) {
	
				//-------------------------------------------------------------------------------------------------------------------------------
				// Logic to calculate the Total Due from assessments and liens
				//-------------------------------------------------------------------------------------------------------------------------------
				$duesAmt = 0.0;
				if (!$hoaAssessmentRec->Paid && !$hoaAssessmentRec->NonCollectible) {
					// Replace every ascii character except decimal and digits with a null
					$duesAmt = stringToMoney($hoaAssessmentRec->DuesAmt);
					$hoaRec->TotalDue += $duesAmt;
						
					$totalDuesCalcRec = new TotalDuesCalcRec();
					$totalDuesCalcRec->calcDesc = 'FY ' . $hoaAssessmentRec->FY . ' Assessment (due ' . $hoaAssessmentRec->DateDue . ')';
					$totalDuesCalcRec->calcValue = $duesAmt;
					array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
	
					if ($hoaAssessmentRec->Lien && $hoaAssessmentRec->Disposition == 'Open') {
						$onlyCurrYearDue = false;
						// If still calculating interest dynamically calculate the compound interest
						if (!$hoaAssessmentRec->StopInterestCalc) {
							$hoaAssessmentRec->AssessmentInterest = calcCompoundInterest($duesAmt,$hoaAssessmentRec->DateDue);
						}
	
						$hoaRec->TotalDue = $hoaRec->TotalDue + $hoaAssessmentRec->AssessmentInterest;
						$totalDuesCalcRec = new TotalDuesCalcRec();
						$totalDuesCalcRec->calcDesc = '%6 Interest on FY ' . $hoaAssessmentRec->FY . ' Assessment (since ' . $hoaAssessmentRec->DateDue . ')';
						$totalDuesCalcRec->calcValue = $hoaAssessmentRec->AssessmentInterest;
						array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
					}
				}

				// If the Assessment was Paid but the interest was not, then add the interest to the total
				if ($hoaAssessmentRec->Paid && $hoaAssessmentRec->InterestNotPaid) {
					$onlyCurrYearDue = false;
					// If still calculating interest dynamically calculate the compound interest
					if (!$hoaAssessmentRec->StopInterestCalc) {
						$hoaAssessmentRec->AssessmentInterest = calcCompoundInterest($duesAmt,$hoaAssessmentRec->DateDue);
					}
						
					$hoaRec->TotalDue = $hoaRec->TotalDue + $hoaAssessmentRec->AssessmentInterest;
					$totalDuesCalcRec = new TotalDuesCalcRec();
					$totalDuesCalcRec->calcDesc = '%6 Interest on FY ' . $hoaAssessmentRec->FY . ' Assessment (since ' . $hoaAssessmentRec->DateDue . ')';
					$totalDuesCalcRec->calcValue = $hoaAssessmentRec->AssessmentInterest;
					array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
				}
				
				/*
				 Dues Total calculation logic
				 If Assessment NOT Paid, Assessment amount is added
				 Lien
				 Open
				 If Lien is Open (and Stop Interest Calc is NOT set), Assessment Interest (from Date Due) is added
				 Paid
				 Released
				 Release Fee - added if entered
				 Closed
	
				 Stop Interest Calc
	
				 What if Assessment Paid, but Lien still Open???
	
				 $onlyCurrYearDue = false;  (logical for when to show Paypal button - if just simple current fee dues (no liens or previous)
				 *** if this is the case, give a message on the screen to contact Treasurer ***
				 	
				 FilingFeeInterest - interest on the Filing Fee (when Lien Open and NOT stop calculating interest)
				 if (!$hoaAssessmentRec->StopInterestCalc) {
				 $hoaAssessmentRec->FilingFeeInterest = calcCompoundInterest($hoaAssessmentRec->FilingFee,$hoaAssessmentRec->DateFiled);
				 }
				 */
	
				// If there is an Open Lien (not Paid, Released, or Closed)
				if ($hoaAssessmentRec->Lien && $hoaAssessmentRec->Disposition == 'Open' && !$hoaAssessmentRec->NonCollectible) {
	
					// calc interest - start date   WHEN TO CALC INTEREST
					// unpaid fee amount and interest since the Filing Date
	
					// if there is a Filing Fee (on an Open Lien), then check to calc interest (or use stored value)
						
					if ($hoaAssessmentRec->FilingFee > 0) {
						// shouldn't have to do this for the ones that are stored as Decimal right???  shouldn't have to parse, floatval, or round
						//$numericStr = preg_replace('/[\x01-\x2D\x2F\x3A-\x7F]+/', '', $hoaAssessmentRec->DuesAmt);
						$hoaRec->TotalDue += $hoaAssessmentRec->FilingFee;
						$totalDuesCalcRec = new TotalDuesCalcRec();
						$totalDuesCalcRec->calcDesc = 'FY ' . $hoaAssessmentRec->FY . ' Assessment Lien Filing Fee';
						$totalDuesCalcRec->calcValue = $hoaAssessmentRec->FilingFee;
						array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
	
						// If stopping dynamic interest calculation just take the stored value, else calculate the interest
						if (!$hoaAssessmentRec->StopInterestCalc) {
							$hoaAssessmentRec->FilingFeeInterest = calcCompoundInterest($hoaAssessmentRec->FilingFee,$hoaAssessmentRec->DateFiled);
						}
	
						$hoaRec->TotalDue += $hoaAssessmentRec->FilingFeeInterest;
						$totalDuesCalcRec = new TotalDuesCalcRec();
						$totalDuesCalcRec->calcDesc = '%6 Interest on Filing Fees (since ' . $hoaAssessmentRec->DateFiled . ')';
						$totalDuesCalcRec->calcValue = $hoaAssessmentRec->FilingFeeInterest;
						array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
	
					} // End of if ($hoaAssessmentRec->FilingFee > 0) {
						
					if ($hoaAssessmentRec->ReleaseFee > 0) {
						$hoaRec->TotalDue += $hoaAssessmentRec->ReleaseFee;
						$totalDuesCalcRec = new TotalDuesCalcRec();
						$totalDuesCalcRec->calcDesc = 'FY ' . $hoaAssessmentRec->FY . ' Assessment Lien Release Fee';
						$totalDuesCalcRec->calcValue = $hoaAssessmentRec->ReleaseFee;
						array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
					}

					if ($hoaAssessmentRec->BankFee > 0) {
						$hoaRec->TotalDue += $hoaAssessmentRec->BankFee;
						$totalDuesCalcRec = new TotalDuesCalcRec();
						$totalDuesCalcRec->calcDesc = 'FY ' . $hoaAssessmentRec->FY . ' Assessment Bank Fee';
						$totalDuesCalcRec->calcValue = $hoaAssessmentRec->BankFee;
						array_push($hoaRec->totalDuesCalcList,$totalDuesCalcRec);
					}
						
				} // if ($hoaAssessmentRec->Lien && $hoaAssessmentRec->Disposition == 'Open') {
	
			} // End of Assessments loop
	
		} // End of if Assessments
	
		$result->close();
		$stmt->close();
	
		//---------------------------------------------------------------------------------------------------
		// Construct the online payment button and instructions according to what is owed
		//---------------------------------------------------------------------------------------------------
		// Only display payment button if something is owed
		// For now, only set payment button if just the current year dues are owed (no other years or open liens)
		if ($hoaRec->TotalDue > 0) {
			if ($onlyCurrYearDue) {
				$hoaRec->paymentButton = $paypalFixedAmtButtonForm;
                $hoaRec->paymentButton .= $paypalFixedAmtButtonInput;
                
				$customValues = $parcelId . ',' . $ownerId . ',' . $fyPayment . ',' .$hoaRec->TotalDue;
				$hoaRec->paymentButton .= '<input type="hidden" name="custom" value="' . $customValues . '">';
				$hoaRec->paymentButton .= '</form>';
				$hoaRec->paymentInstructions = '($4.00 processing fee will be added for online payment)';
			} else {
				// Non-online Paypal payment instructions
				$hoaRec->paymentInstructions = '(general payment instructions - contact Treasurer)';
	
			}
		} // End of if ($hoaRec->TotalDue > 0) {
	
	
		// Get sales records for this parcel
		if (empty($saleDate)) {
			$stmt = $conn->prepare("SELECT * FROM hoa_sales WHERE PARID = ? ORDER BY CreateTimestamp DESC; ");
			$stmt->bind_param("s", $parcelId);
		} else {
			$stmt = $conn->prepare("SELECT * FROM hoa_sales WHERE PARID = ? AND SALEDT = ?; ");
			$stmt->bind_param("ss", $parcelId,$saleDate);
		}
		$stmt->execute();
		$result = $stmt->get_result();
	
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$hoaSalesRec = new HoaSalesRec();
				$hoaSalesRec->PARID = $row["PARID"];
				$hoaSalesRec->CONVNUM = $row["CONVNUM"];
				$hoaSalesRec->SALEDT = $row["SALEDT"];
				$hoaSalesRec->PRICE = $row["PRICE"];
				$hoaSalesRec->OLDOWN = $row["OLDOWN"];
				$hoaSalesRec->OWNERNAME1 = $row["OWNERNAME1"];
				$hoaSalesRec->PARCELLOCATION = $row["PARCELLOCATION"];
				$hoaSalesRec->MAILINGNAME1 = $row["MAILINGNAME1"];
				$hoaSalesRec->MAILINGNAME2 = $row["MAILINGNAME2"];
				$hoaSalesRec->PADDR1 = $row["PADDR1"];
				$hoaSalesRec->PADDR2 = $row["PADDR2"];
				$hoaSalesRec->PADDR3 = $row["PADDR3"];
				$hoaSalesRec->CreateTimestamp = $row["CreateTimestamp"];
				$hoaSalesRec->NotificationFlag = $row["NotificationFlag"];
				$hoaSalesRec->ProcessedFlag = $row["ProcessedFlag"];
				$hoaSalesRec->LastChangedBy = $row["LastChangedBy"];
				$hoaSalesRec->LastChangedTs = $row["LastChangedTs"];
	
				array_push($hoaRec->salesList,$hoaSalesRec);
			}
	
		} // End of Assessments
		$result->close();
		$stmt->close();
	
	} else {
		$result->close();
		$stmt->close();
	} // End of Properties
	
	return $hoaRec;
} // End of function getHoaRec2($conn,$parcelId) {

//----------------------------------------------------------------------------------------------------------------
//  Function to return an array of full hoaRec objects (with a couple of parameters to filter list)
//----------------------------------------------------------------------------------------------------------------
function getHoaRecList($conn,$duesOwed=false,$skipEmail=false,$salesWelcome=false,
    $currYearPaid=false,$currYearUnpaid=false,$testEmail=false) {
    
    $outputArray = array();

    if ($testEmail) {
        $testEmailParcel = getConfigValDB($conn,'duesEmailTestParcel');
        $sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = '$testEmailParcel' AND p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ";
    } else {
        $fy = 0;
        if ($currYearPaid || $currYearUnpaid) {
            // *** just use the highest FY - the first assessment record ***
            $result = $conn->query("SELECT MAX(FY) AS maxFY FROM hoa_assessments; ");
            if ($result->num_rows > 0) {
                while($row = $result->fetch_assoc()) {
                    $fy = $row["maxFY"];
                }
                $result->close();
            }
        }

        // try to get the parameters into the initial select query to limit the records it then tries to get from the getHoaRec
        if ($salesWelcome) {
            $sql = "SELECT p.Parcel_ID,o.OwnerID FROM hoa_properties p, hoa_owners o, hoa_sales s" .
                            " WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND p.Parcel_ID = s.PARID" .
                            " AND s.WelcomeSent = 'S' ORDER BY s.CreateTimestamp DESC; ";
        } else if ($currYearUnpaid) {
            $sql = "SELECT p.Parcel_ID,o.OwnerID FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
                        "WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
                        "AND a.FY = " . $fy . " AND a.Paid = 0 ORDER BY p.Parcel_ID; ";
                        // current owner?
        } else if ($currYearPaid) {
            $sql = "SELECT p.Parcel_ID,o.OwnerID FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
                        "WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
                        "AND a.FY = " . $fy . " AND a.Paid = 1 ORDER BY p.Parcel_ID; ";
                        // current owner?
        } else {
            // All properties and current owner
            $sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ". 
                            "ORDER BY p.Parcel_ID; ";
        }
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $result = $stmt->get_result();
    $stmt->close();
    	
    $cnt = 0;
    if ($result->num_rows > 0) {
    	// Loop through all the member properties
    	while($row = $result->fetch_assoc()) {
    		$cnt = $cnt + 1;
    	
    		$parcelId = $row["Parcel_ID"];
    		$ownerId = $row["OwnerID"];
        
            // Don't include FY because you want all assessments to calculate Total Due
    		//$hoaRec = getHoaRec($conn,$parcelId,$ownerId,$fy);
    		$hoaRec = getHoaRec($conn,$parcelId,$ownerId);

            // If creating Dues Letters, skip properties that don't owe anything
            if ($duesOwed && $hoaRec->TotalDue < 0.01) {
                continue;
            }
            // Skip postal mail for 1st Notices if Member has asked to use Email
            if ($skipEmail && $hoaRec->UseEmail) {
                continue;
            }

    	    array_push($outputArray,$hoaRec);
    	}
    }

    return $outputArray;
}

function insertCommRec($conn,$Parcel_ID,$OwnerID,$CommType,$CommDesc,
    $Mailing_Name='',$Email=0,$EmailAddr='',$SentStatus='N',$LastChangedBy='') {

    $sql = 'INSERT INTO hoa_communications (Parcel_ID,CommID,CreateTs,OwnerID,CommType,CommDesc,'
            .'Mailing_Name,Email,EmailAddr,SentStatus,LastChangedBy,LastChangedTs)'.
            ' VALUES(?,null,CURRENT_TIMESTAMP,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP); ';
	$stmt = $conn->prepare($sql);
    $stmt->bind_param("sisssisss",$Parcel_ID,$OwnerID,$CommType,$CommDesc,
                                    $Mailing_Name,$Email,$EmailAddr,$SentStatus,$LastChangedBy);
    $stmt->execute();
	$stmt->close();
}


//----------------------------------------------------------------------------------------------------------------
// Common function to take the payment transaction information and update the HOA database for PAID, etc.
//----------------------------------------------------------------------------------------------------------------
function updAssessmentPaid($conn,$parcelId,$ownerId,$fy,$txn_id,$payment_date,$payer_email,$payment_amt,$payment_fee,$fromEmailAddress) {
	// Get the HOA record for this Parcel and Owner
	$hoaRec = getHoaRec($conn,$parcelId,$ownerId,'');
	if ($hoaRec == null || $hoaRec->Parcel_ID == null || $hoaRec->Parcel_ID != $parcelId) {
		// ERROR - hoa record not found
		error_log(date('[Y-m-d H:i:s] ') . 'No HOA rec found for Parcel ' . $parcelId . PHP_EOL, 3, LOG_FILE);
	} else {
		//error_log(date('[Y-m-d H:i:s] ') . '$hoaRec->Parcel_ID = ' . $hoaRec->Parcel_ID . ', $hoaRec->ownersList[0]->OwnerID = ' . $hoaRec->ownersList[0]->OwnerID . PHP_EOL, 3, LOG_FILE);
		// Use the Owner Id of the current owner when recording the payment
		$ownerId = $hoaRec->ownersList[0]->OwnerID;
		
		// Idempotent check - Check for any payment record for this parcel and transaction id
		$hoaPaymentRec = getHoaPaymentRec($conn,$parcelId,$txn_id);
		if ($hoaPaymentRec != null) {
			// Payment transaction already exists - ignore updates or other logic
            error_log(date('[Y-m-d H:i:s] ') . 'Transaction already recorded for Parcel ' . $parcelId . ', txn_id = ' . $txn_id . PHP_EOL, 3, LOG_FILE);
		} else {
			//error_log(date('[Y-m-d H:i:s] ') . 'Insert payment for Parcel ' . $parcelId . ', txn_id = ' . $txn_id . PHP_EOL, 3, LOG_FILE);
			$sqlStr = 'INSERT INTO hoa_payments (Parcel_ID,OwnerID,FY,txn_id,payment_date,payer_email,payment_amt,payment_fee,LastChangedTs) ';
			$sqlStr = $sqlStr . ' VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP); ';
			$stmt = $conn->prepare($sqlStr);
			$stmt->bind_param("siisssdd",$parcelId,$ownerId,$fy,$txn_id,$payment_date,$payer_email,$payment_amt,$payment_fee);
			if (!$stmt->execute()) {
				error_log(date('[Y-m-d H:i:s] ') . "Add Payment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
			}
			$stmt->close();
		    $hoaPaymentRec = getHoaPaymentRec($conn,$parcelId,$txn_id);
        }

        // get assessment record first and check PAID (and mail flags?)
        $assessmentPaid = 0;
		$stmt = $conn->prepare("SELECT * FROM hoa_assessments WHERE Parcel_ID = ? AND FY = ? ; ");
		$stmt->bind_param("ss", $parcelId,$fy);
		$stmt->execute();
        $result = $stmt->get_result();
		while($row = $result->fetch_assoc()) {
            $assessmentPaid = $row["Paid"];
		}
		$result->close();
		$stmt->close();

        // If the Assessment has not been marked as PAID, mark it and check to send emails
        // (this will handle the transaction re-send case in an Idempotent manner)
        if (!$assessmentPaid) {
			// Update Assessment record for payment		
			$assessmentsComments = $txn_id;
		
			$paidBoolean = 1;
			$datePaid = date("Y-m-d");
			$paymentMethod = 'Paypal';
			$username = 'ipnHandler';
        
			if (!$stmt = $conn->prepare("UPDATE hoa_assessments SET Paid=?,DatePaid=?,PaymentMethod=?," .
					"Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? AND FY = ? ; ")) {
					error_log("Update Assessment Prepare failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
					//echo "Prepare failed: (" . $stmt->errno . ") " . $stmt->error;
			}
			if (!$stmt->bind_param("isssssi", $paidBoolean,$datePaid,$paymentMethod,$assessmentsComments,$username,$parcelId,$fy)) {
				error_log("Update Assessment Bind failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
				//echo "Bind failed: (" . $stmt->errno . ") " . $stmt->error;
			}
			if (!$stmt->execute()) {
				error_log("Update Assessment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
				//echo "Add Assessment Execute failed: (" . $stmt->errno . ") " . $stmt->error;
			}
			$stmt->close();
        }

        // Send email notifications (if they have not been sent)
        if ($hoaPaymentRec->paidEmailSent != 'Y') {
        // Set notification emails
			$payerInfo = 'Thank you for your GRHA member dues payment.  Our records have been successfully updated to show that the assessment has been PAID.  ';
			$payerInfo .= 'You can use the Dues Checker on our website (www.grha-dayton.org) to see the updated record. ';
			$payerInfo .= 'Your dues will be used to promote the recreation, health, safety, and welfare of the ';
			$payerInfo .= 'residents in the Properties, and for the improvement and maintenance of the Common Areas. ';

			$treasurerInfo = 'The following payment has been recorded and the assessment has been marked as PAID.';
				
			$paymentInfoStr = '<br><br>Parcel Id: ' . $parcelId;
			$paymentInfoStr .= '<br>Fiscal Year: ' . $fy;
			$paymentInfoStr .= '<br>Transaction Id: ' . $txn_id;
			$paymentInfoStr .= '<br>Payment Date: ' . $payment_date;
			$paymentInfoStr .= '<br>Payer Email: ' . $payer_email;
			$paymentInfoStr .= '<br>Payment Amount: ' . $payment_amt . ' (this includes the $4.00 PayPal processing fee) <br>';
			
            $sendMailSuccess = false;

			$subject = 'GRHA Payment Confirmation';
			$messageStr = '<h3>GRHA Payment Confirmation</h3>' . $payerInfo . $paymentInfoStr;
			$sendMailSuccess = sendHtmlEMail($payer_email,$subject,$messageStr,$fromEmailAddress);
            // If the Member email was successful, send the Treasurer notification
            if ($sendMailSuccess) {
                $subject = 'GRHA Payment Notification';
			    $messageStr = '<h3>GRHA Payment Notification</h3>' . $treasurerInfo . $paymentInfoStr;
			    $sendMailSuccess = sendHtmlEMail(getConfigValDB($conn,"paymentEmailList"),$subject,$messageStr,$fromEmailAddress);
            }

            // Update the paidEmailSent flag on the Payment record
            if ($sendMailSuccess) {
                $hoaPaymentRec->paidEmailSent = 'Y';
    			if (!$stmt = $conn->prepare("UPDATE hoa_payments SET paidEmailSent=? WHERE Parcel_ID = ? AND FY = ? AND txn_id = ? ; ")) {
    					error_log("Update Payments Prepare failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
    					//echo "Prepare failed: (" . $stmt->errno . ") " . $stmt->error;
    			}
    			if (!$stmt->bind_param("ssis",$hoaPaymentRec->paidEmailSent,$parcelId,$fy,$txn_id)) {
    				error_log("Update Assessment Bind failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
    				//echo "Bind failed: (" . $stmt->errno . ") " . $stmt->error;
    			}
    			if (!$stmt->execute()) {
    				error_log("Update Assessment Execute failed: " . $stmt->errno . ", Error = " . $stmt->error . PHP_EOL, 3, LOG_FILE);
    				//echo "Add Assessment Execute failed: (" . $stmt->errno . ") " . $stmt->error;
    			}
    			$stmt->close();
            }
        }

	} // End of if Parcel found
	
} // End of function updAssessmentPaid($parcelId,$ownerId,$fy,$txn_id,$payment_date,$payer_email,$payment_amt,$payment_fee) {

?>
