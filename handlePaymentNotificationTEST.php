<?php
require_once 'vendor/autoload.php'; 

// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Include database connection credentials from an external includes location
require_once getSecretsFilename();
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");

$sender = 'hoadb@grha-dayton.org';
$recipient = 'president@grha-dayton.org';

$subject = 'GRHA Payment Notification TEST2';
$messageStr = '<h3>GRHA Payment Notification TEST</h3>' . 'Test email send';

sendHtmlEMail($recipient,$subject,$messageStr,$sender);

?>
