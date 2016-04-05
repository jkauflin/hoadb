<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Functions to validate Admin operations (i.e. check permissions
 * 				parameters, timing, etc.)
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-04-05 JJK 	Added check for AddAssessments 
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

$username = getUsername();

$adminRec = new AdminRec();
$adminRec->result = "Not Valid";
$adminRec->message = "";

$action = getParamVal("action");
$FY = getParamVal("FY");
$duesAmt = getParamVal("duesAmt");

$adminLevel = getAdminLevel();

if ($action == "AddAssessments") {
	if ($adminLevel < 2) {
		$adminRec->message = "You do not have permissions to Add Assessments.";
		$adminRec->result = "Not Valid";
	} else {

		// Make new owners the current owner
		$currentOwnerBoolean = 1;
		$sqlStr = 'INSERT INTO hoa_owners (OwnerID,Parcel_ID,CurrentOwner,Owner_Name1,Owner_Name2,DatePurchased,Mailing_Name,AlternateMailing,Alt_Address_Line1,Alt_Address_Line2,Alt_City,Alt_State,Alt_Zip,Owner_Phone,Comments,LastChangedBy,LastChangedTs) ';
		$sqlStr = $sqlStr . ' VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP); ';
		$stmt = $conn->prepare($sqlStr);
		$stmt->bind_param("ssissssissssssss",$maxOwnerID,$parcelId,$currentOwnerBoolean,$ownerName1,$ownerName2,$datePurchased,$mailingName,$alternateMailingBoolean,$addrLine1,$addrLine2,$altCity,$altState,$altZip,$ownerPhone,$ownerComments,$username);

				
//		`OwnerID`, `Parcel_ID`, `FY`, `LienRefNo`, `DateFiled`, `Disposition`, `FilingFee`, `ReleaseFee`, `DateReleased`, `DatePaid`, `AmountPaid`, `FilingFeeInterest`, `AssessmentInterest`, `Comments`, `LastChangedBy`, `LastChangedTs
		
		$stmt->execute();
		$stmt->close();
		$conn->close();		
		
		$adminRec->message = "Added assessments for Fiscal Year " . $FY . ' and a Dues Amount of ' . $duesAmt;
		$adminRec->result = "Valid";
	}
// End of if ($action == "AddAssessments") {
} else if ($action == "new action") {
	
}
	/*
	$conn = getConn();
	$hoaSalesReportRec = getHoaSalesRecList($conn,$notProcessedBoolean);
	
	
	// Close db connection
	$conn->close();
	*/

	echo json_encode($adminRec);
?>
