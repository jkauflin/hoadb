<?php

require_once 'php_secure/commonUtil.php';

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
