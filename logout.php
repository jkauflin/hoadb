<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Logout to delete the cookie and JWT token
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-07-25 JJK 	Initial version
 *============================================================================*/
require __DIR__ . '/vendor/autoload.php';

// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/dbCommon.php';

// Include database connection credentials from an external includes location
require_once externalIncludes() . getSecretsFilename();

// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");

//error_log(date('[Y-m-d H:i] '). "in logout" . PHP_EOL, 3, LOG_FILE);

deleteUserCookie($cookieName,$cookiePath);

?>
