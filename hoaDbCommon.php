<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 * 2015-03-24 JJK	Included credentials files 
 * 2015-04-28 JJK	Added sales rec
 *============================================================================*/

// Include db connection credentials
include 'hoaDbCred.php';
//$host = '127.0.0.1';
//$username = "root";
//$password = "";
//$dbname = "<name of the mysql database>";

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
	
	public $ownersList;
	public $assessmentsList;
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
}

class HoaAssessmentRec
{
  	public $OwnerID;
  	public $Parcel_ID;
  	public $FY;
  	public $DuesAmt;
  	public $DateDue;
  	public $Paid;
  	public $DatePaid;
  	public $PaymentMethod;
  	public $Comments;
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
}

function getHoaSalesRec($conn,$parcelId,$saleDate) {
	$hoaSalesRec = new HoaSalesRec();
	
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
		}
		$result->close();
		$stmt->close();
	}
	
	return $hoaSalesRec;
} // End of function getHoaSalesRec($conn,$parcelId,$saleDate) {


function getHoaRec($conn,$parcelId,$ownerId,$fy) {

	$hoaRec = new HoaRec();
	
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
	
			$hoaRec->ownersList = array();
			$hoaRec->assessmentsList = array();
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
	
				array_push($hoaRec->ownersList,$hoaOwnerRec);
			}
		} // End of Owners
		$result->close();
		$stmt->close();
	
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
	
				array_push($hoaRec->assessmentsList,$hoaAssessmentRec);
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

?>
