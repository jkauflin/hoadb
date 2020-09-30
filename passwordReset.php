<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Create database user record
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-08-04 JJK 	Initial version
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
    header("Content-Type: application/json; charset=UTF-8");
    $json_str = file_get_contents('php://input');
    $param = json_decode($json_str);

    $userRec = LoginAuth::initUserRec();
    if (empty($param->usernameReset) && empty($param->emailAddrReset)) {
        $userRec->userMessage = 'Username or Email address is required';
    } else {
        $conn = getConn($host, $dbadmin, $password, $dbname);
        $userRec = LoginAuth::resetPassword($conn,$cookieName,$cookiePath,$serverKey,$param,$fromEmailAddress,$passwordResetUrl);
        $conn->close();
    }

    echo json_encode($userRec);

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
