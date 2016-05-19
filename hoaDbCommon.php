<?php
/*==============================================================================
 * (C) Copyright 2015,2016 John J Kauflin, All rights reserved. 
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
 *============================================================================*/

function getConn() {
	// Include db connection credentials
	include 'hoaDbCred.php';
	// This include will have the following variable set
	//$host = 'localhost';
	//$dbadmin = "username";
	//$password = "password";
	//$dbname = "<name of the mysql database>";
	
	// User variables set in the db connection credentials include and open a connection
	$conn = new mysqli($host, $dbadmin, $password, $dbname);
	// Check connection
	if ($conn->connect_error) {
		error_log("Connection failed: " . $conn->connect_error);
		die("Connection failed: " . $conn->connect_error);
	}
	return $conn;
}

function getConfigVal($configName) {
	// Include db connection credentials (use for site specific config values for now)
	include 'hoaDbCred.php';
	
	$configVal = "";
	
	if ($configName == "countySalesDataUrl") {
		$configVal = $countySalesDataUrl;	
	} elseif ($configName == "fromEmailAddress") {
		$configVal = $fromEmailAddress;
	} elseif ($configName == "salesReportEmailList") {
		$configVal = $salesReportEmailList;
	} elseif ($configName == "adminEmailList") {
		$configVal = $adminEmailList;
		
	} elseif ($configName == "paypalFixedAmtButtonForm") {
		$configVal = $paypalFixedAmtButtonForm;
	} elseif ($configName == "paypalFixedAmtButtonInput") {
		$configVal = $paypalFixedAmtButtonInput;
	} elseif ($configName == "paypalVariableAmtButtonForm") {
		$configVal = $paypalVariableAmtButtonForm;
	} elseif ($configName == "paypalVariableAmtButtonInput") {
		$configVal = $paypalVariableAmtButtonInput;
	}
	
	return $configVal;
}

// Lookup config values by name from the config database table
function getConfigValDB($conn,$configName) {
	$configVal = "";

	// Check if a database connection was passed or if it needs to be started
	$connPassed = true;
	if ($conn == NULL) {
		$connPassed = false;
		$conn = getConn();
	}
	
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

	if (!$connPassed) {
		$conn->close();
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
  	public $Comments;
  	public $LastChangedBy;
  	public $LastChangedTs;
  	 
	public $ownersList;
	public $assessmentsList;
	public $totalDuesCalcList;
	public $salesList;
	
	public $adminLevel;
	public $TotalDue;
	public $paymentButton;
	public $paymentInstructions;
	public $countyTreasurerUrl;
	public $countyAuditorUrl;
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
}


class AdminRec
{
	public $result;
	public $message;
	
	public $hoaPropertyRecList;
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


function getHoaSalesRec($conn,$parcelId,$saleDate) {
	
	$hoaSalesRec = new HoaSalesRec();

	$conn = getConn();
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
			
			$hoaSalesRec->adminLevel = getAdminLevel();
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
		}
		$result->close();
	}
	$stmt->close();

	return $hoaPaymentRec;
} // End of function getHoaPaymentRec($conn,$parcelId,$transId) {


//--------------------------------------------------------------------------------------------------------------
// Primary function to get all the data for a particular value
//--------------------------------------------------------------------------------------------------------------
function getHoaRec($conn,$parcelId,$ownerId,$fy,$saleDate) {
	// Include to get paypal button scripts
	include 'hoaDbCred.php';
	
	$hoaRec = new HoaRec();

	// Total Due is calculated below
	$hoaRec->TotalDue = 0.00;
	// Payment button will be set if online payment is enabled and allowed for this parcel
	$hoaRec->paymentButton = '';
	$hoaRec->paymentInstructions = '';
	
	// Check if a database connection was passed or if it needs to be started
	$connPassed = true;
	if ($conn == NULL) {
		$connPassed = false;
		$conn = getConn();
	}

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
	
		if (empty($ownerId)) {
			$stmt = $conn->prepare("SELECT * FROM hoa_owners WHERE Parcel_ID = ? ORDER BY OwnerID DESC ; ");
			$stmt->bind_param("s", $parcelId);
		} else {
			$stmt = $conn->prepare("SELECT * FROM hoa_owners WHERE Parcel_ID = ? AND OwnerID = ? ORDER BY OwnerID DESC ; ");
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
				$hoaOwnerRec->Comments = $row["Comments"];
				$hoaOwnerRec->EntryTimestamp = $row["EntryTimestamp"];
				$hoaOwnerRec->UpdateTimestamp = $row["UpdateTimestamp"];
				$hoaOwnerRec->LastChangedBy = $row["LastChangedBy"];
				$hoaOwnerRec->LastChangedTs = $row["LastChangedTs"];
				
				array_push($hoaRec->ownersList,$hoaOwnerRec);
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
				$hoaAssessmentRec->DatePaid = truncDate($row["DatePaid"]);
				$hoaAssessmentRec->PaymentMethod = $row["PaymentMethod"];
				
				$hoaAssessmentRec->DuesDue = 0;
				if (!$hoaAssessmentRec->Paid) {
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
				if (!$hoaAssessmentRec->Paid) {
					// Replace every ascii character except decimal and digits with a null
					$duesAmt = round(floatval( preg_replace('/[\x01-\x2D\x2F\x3A-\x7F]+/', '', $hoaAssessmentRec->DuesAmt) ),2);
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
				
				// If there is an Open Lien (not Paid, Released, or Closed)
				if ($hoaAssessmentRec->Lien && $hoaAssessmentRec->Disposition == 'Open') {
				
					// calc interest - start date   WHEN TO CALC INTEREST
					// unpaid fee amount and interest since the Filing Date

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
		if ($hoaRec->TotalDue > 0 && $onlyCurrYearDue) {
			// Get the payment button form from the hoaDbCred.php file (site specific)
			$hoaRec->paymentButton = $paypalFixedAmtButtonForm;
			$hoaRec->paymentButton .= $paypalFixedAmtButtonInput;
			$customValues = $parcelId . ',' . $ownerId . ',' . $fyPayment . ',' .$hoaRec->TotalDue;
			$hoaRec->paymentButton .= '<input type="hidden" name="custom" value="' . $customValues . '">';
			$hoaRec->paymentButton .= '</form>';
			$hoaRec->paymentInstructions = '($4.00 processing fee will be added for online payment)';
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

	// Get configuration values
	$hoaRec->countyTreasurerUrl = getConfigValDB($conn,"countyTreasurerUrl");
	$hoaRec->countyAuditorUrl = getConfigValDB($conn,"countyAuditorUrl");
	
	// Close the database connection if started in this function
	if (!$connPassed) {
		$conn->close();
	}
	
	return $hoaRec;
} // End of function getHoaRec($conn,$parcelId,$ownerId,$fy) {


function getHoaRec2($conn,$parcelId) {

	$hoaRec = new HoaRec();

	// TBD - calculate
	$hoaRec->TotalDue = 0.00;

	$conn = getConn();
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

			$hoaRec->ownersList = array();
			$hoaRec->assessmentsList = array();
			$hoaRec->salesList = array();
		}
		$result->close();
		$stmt->close();

		/*
		if (empty($ownerId)) {
			$stmt = $conn->prepare("SELECT * FROM hoa_owners WHERE Parcel_ID = ? ORDER BY OwnerID DESC ; ");
			$stmt->bind_param("s", $parcelId);
		} else {
			$stmt = $conn->prepare("SELECT * FROM hoa_owners WHERE Parcel_ID = ? AND OwnerID = ? ORDER BY OwnerID DESC ; ");
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
				$hoaOwnerRec->Comments = $row["Comments"];
				$hoaOwnerRec->EntryTimestamp = $row["EntryTimestamp"];
				$hoaOwnerRec->UpdateTimestamp = $row["UpdateTimestamp"];
				$hoaOwnerRec->LastChangedBy = $row["LastChangedBy"];
				$hoaOwnerRec->LastChangedTs = $row["LastChangedTs"];

				array_push($hoaRec->ownersList,$hoaOwnerRec);
			}
		} // End of Owners
		$result->close();
		$stmt->close();
		*/
		
		if (empty($fy)) {
			$stmt = $conn->prepare("SELECT * FROM hoa_assessments WHERE Parcel_ID = ? ORDER BY FY DESC ; ");
			$stmt->bind_param("s", $parcelId);
		} else {
			$stmt = $conn->prepare("SELECT * FROM hoa_assessments WHERE Parcel_ID = ? AND FY = ? ORDER BY FY DESC ; ");
			$stmt->bind_param("ss", $parcelId,$fy);
		}
		$stmt->execute();
		$result = $stmt->get_result();

		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$hoaAssessmentRec = new HoaAssessmentRec();
				$hoaAssessmentRec->OwnerID = $row["OwnerID"];
				$hoaAssessmentRec->Parcel_ID = $row["Parcel_ID"];
				$hoaAssessmentRec->FY = $row["FY"];
				$hoaAssessmentRec->DuesAmt = $row["DuesAmt"];
				$hoaAssessmentRec->DateDue = truncDate($row["DateDue"]);
				$hoaAssessmentRec->Paid = $row["Paid"];
				$hoaAssessmentRec->DatePaid = truncDate($row["DatePaid"]);
				$hoaAssessmentRec->PaymentMethod = $row["PaymentMethod"];
				$hoaAssessmentRec->Comments = $row["Comments"];
				$hoaAssessmentRec->LastChangedBy = $row["LastChangedBy"];
				$hoaAssessmentRec->LastChangedTs = $row["LastChangedTs"];

				array_push($hoaRec->assessmentsList,$hoaAssessmentRec);

				// TBD - finish this logic 11/28/2015 JJK
				if (!$hoaAssessmentRec->Paid) {
					//error_log('gettype($hoaAssessmentRec->DuesAmt) = '.gettype($hoaAssessmentRec->DuesAmt));
					//error_log('DuesAmt = '.$hoaAssessmentRec->DuesAmt);
					//$str = '$$1\09.0/1::a/bb';
					//error_log('BEFORE = '.$str);
					// Replace every ascii character except decimal and digits with a null
					$numericStr = preg_replace('/[\x01-\x2D\x2F\x3A-\x7F]+/', '', $hoaAssessmentRec->DuesAmt);
					//error_log('AFTER = '.$numericStr);
					// add to toal
					$hoaRec->TotalDue = $hoaRec->TotalDue + floatval($numericStr);
				}
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

?>
