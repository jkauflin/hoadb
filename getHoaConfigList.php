<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-05-17 JJK 	Initial version to get config list
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	// If they are set, get input parameters from the REQUEST
	$configName = getParamVal("ConfigName");

	$conn = getConn();

	if (!empty($configName)) {
		$sql = "SELECT * FROM hoa_config WHERE ConfigName = ? ";
		$stmt = $conn->prepare($sql);
		$stmt->bind_param("s", $configName);
	} else {
		$sql = "SELECT * FROM hoa_config ORDER BY ConfigName ";
		$stmt = $conn->prepare($sql);
	}
	
	//error_log('$sql = ' . $sql);
	
	$stmt->execute();
	$result = $stmt->get_result();
	
	$outputArray = array();
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$hoaConfigRec = new HoaConfigRec();
	
			$hoaConfigRec->ConfigName = $row["ConfigName"];
			$hoaConfigRec->ConfigDesc = $row["ConfigDesc"];
			$hoaConfigRec->ConfigValue = $row["ConfigValue"];
	
			array_push($outputArray,$hoaConfigRec);
		}
	} else {
		$hoaConfigRec = new HoaConfigRec();
		
		$hoaConfigRec->ConfigName = '';
		$hoaConfigRec->ConfigDesc = '';
		$hoaConfigRec->ConfigValue = '';
		
		array_push($outputArray,$hoaConfigRec);
	}
	
	$stmt->close();
	$conn->close();
	
	echo json_encode($outputArray);

?>
