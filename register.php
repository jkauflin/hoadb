<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Create database user record
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-07-28 JJK 	Initial version
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

    /*
            if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->email = $email;
            } else {
                throw new \InvalidArgumentException('Not a valid email!');
            }
    */

    $userRec = LoginAuth::initUserRec();
    if (empty($param->usernameReg) || empty($param->password_1)) {
        $userRec->userMessage = 'Username and Password are required';
    } else if (empty($param->emailAddrReg)) {
        $userRec->userMessage = 'Email address is required';
    } else if (empty($param->password_2)) {
        $userRec->userMessage = 'Confirmation Password is required';
    } else if ($param->password_2 != $param->password_1) {
        $userRec->userMessage = 'Confirmation Password does not match Password';
    } else {
        $conn = getConn($host, $dbadmin, $password, $dbname);
        $userRec = LoginAuth::registerUser($conn,$cookieName,$cookiePath,$serverKey,$param);
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
    exit;
}
?>
