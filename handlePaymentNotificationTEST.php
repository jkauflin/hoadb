<?php
define("LOG_FILE", "./paypal-ipn-TEST.log");

echo 'LOG_FILE = ' . LOG_FILE . '</br>' . PHP_EOL;

error_log(date('[Y-m-d H:i] '). "Invalid IPN: $req" . PHP_EOL, 3, LOG_FILE);

echo 'At the end ' . '</br>' . PHP_EOL;

?>
