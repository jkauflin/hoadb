<?php
/*==============================================================================
 * (C) Copyright 2016,2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-05-17 JJK 	Initial version to get config list
 * 2020-08-01 JJK   Re-factored to use jjklogin for authentication
 *============================================================================*/
//
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
	$configName = getParamVal("ConfigName");

	// Get a connection to the database
	$conn = getConn($host, $dbadmin, $password, $dbname);

	if (!empty($configName)) {
		$sql = "SELECT * FROM hoa_config WHERE ConfigName = ? ";
		$stmt = $conn->prepare($sql);
		$stmt->bind_param("s", $configName);
	} else {
		$sql = "SELECT * FROM hoa_config ORDER BY ConfigName ";
		$stmt = $conn->prepare($sql);
	}
	
	$stmt->execute();
    $result = $stmt->get_result();
	$stmt->close();
    $outputArray = array();
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
            if (!empty($row['ConfigName'])) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", $i = " . $row['ConfigName'] . PHP_EOL, 3, LOG_FILE);
			    array_push($outputArray,$row);
            }
		}
    }
	$conn->close();
	
	echo json_encode($outputArray);

} catch(Exception $e) {
    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
    exit;
}

?>
