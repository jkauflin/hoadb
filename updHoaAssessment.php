<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	$username = getUsername();

	// If they are set, get input parameters from the REQUEST
	$parcelId = getParamVal("parcelId");
	$ownerId = getParamVal("ownerId");
	$fy = getParamVal("fy");
	
	$duesAmount = getParamVal("duesAmount");
	$dateDue = getParamVal("dateDue");
	$paidBoolean = paramBoolVal("paidBoolean");
	$datePaid = getParamVal("datePaid");
	$paymentMethod = getParamVal("paymentMethod");
	$assessmentsComments = getParamVal("assessmentsComments");
	
	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = getConn();
	$stmt = $conn->prepare("UPDATE hoa_assessments SET DuesAmt=?,DateDue=?,Paid=?,DatePaid=?,PaymentMethod=?,Comments=?,LastChangedBy=?,LastChangedTs=CURRENT_TIMESTAMP WHERE Parcel_ID = ? AND OwnerID = ? AND FY = ? ; ");
	$stmt->bind_param("ssisssssss", $duesAmount,$dateDue,$paidBoolean,$datePaid,$paymentMethod,$assessmentsComments,$username,$parcelId,$ownerId,$fy);
	$stmt->execute();
	$stmt->close();
	$conn->close();

	//echo json_encode($hoaRec);
	//echo 'Update Successful - member = ' . $memberBoolean . ', vacant = ' . $vacantBoolean . ', rental = ' . $rentalBoolean . ', managed = ' . $managedBoolean . ', foreclosure = ' . $foreclosureBoolean . ', bankruptcy = ' . $bankruptcyBoolean . ', liens = ' . $liensBoolean;
	echo 'Update Successful - propertyComments = ' . $propertyComments . ', parcelId = ' . $parcelId;
	
?>
