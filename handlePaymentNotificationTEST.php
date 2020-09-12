<?php
define("LOG_FILE", "./paypal-ipn-TEST.log");

$sender = 'hoadb@grha-dayton.org';
$recipient = 'president@grha-dayton.org';

$subject = "php mail test";
$message = "php test message";
$headers = 'From:' . $sender;

if (mail($recipient, $subject, $message, $headers))
{
    echo "Message accepted";
}
else
{
    echo "Error: Message not accepted";
}

?>
