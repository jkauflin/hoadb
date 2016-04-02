<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Scheduled job to get sales information from the county
 * 				auditor site, find parcels in the hoa, update the hoa_sales
 * 				table, and email a report of new sales
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 * 2015-04-28 JJK	Got hoa_sales get and insert working
 * 2015-06-19 JJK	Abstracted some variables
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

$currTimestampStr = date("Y-m-d H:i:s");
//JJK test, date = 2015-04-22 19:45:09

	$notProcessedBoolean = paramBoolVal("notProcessedBoolean");

	$conn = getConn();
	$hoaSalesReportRec = getHoaSalesRecList($conn,$notProcessedBoolean);
	$hoaSalesReportRec->adminLevel = getAdminLevel();
	
	
	// Close db connection
	$conn->close();

	echo json_encode($hoaSalesReportRec);

?>
