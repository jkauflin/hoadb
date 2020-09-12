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


ini_set( 'display_errors', 1 );
error_reporting( E_ALL );

define("LOG_FILE", "./paypal-ipn-TEST.log");

$sender = 'hoadb@grha-dayton.org';
$recipient = 'president@grha-dayton.org';

$subject = 'GRHA Payment Notification TEST';
$messageStr = '<h3>GRHA Payment Notification TEST</h3>' . 'Test email send';

if ( sendHtmlEMail($recipient,$subject,$messageStr,$sender) ) 
{
    echo "Message accepted";
}
else
{
    echo "Error: Message not accepted";
}

?>
