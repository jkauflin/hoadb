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

//http://example.com/?action=getConfigList
//$_GET['action'] == 'getConfigList'
//if($_POST['action'] == "follow") {

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
			array_push($outputArray,$row);
		}
	}
	
	$stmt->close();
	$conn->close();
	
	echo json_encode($outputArray);

?>
