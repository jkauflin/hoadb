<?php
/*==============================================================================
 * (C) Copyright 2016,2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Scheduled job to get sales information from the county
 * 				auditor site, find parcels in the hoa, update the hoa_sales
 * 				table, and email a report of new sales
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-07-01 JJK 	Initial version to export and email MySQL database 
 *============================================================================*/
require_once 'vendor/autoload.php'; 

// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Include database connection credentials from an external includes location
require_once getSecretsFilename();
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");


require_once('class.phpmailer.php');

// Check URL param against secret key for scheduled jobs
if (getParamVal("key") != $scheduledJobKey) {
    echo "Not authorized to execute request";
    exit;
}


$errorStr = '';
$dbname = "hoaDB";

$backupfile = $dbname . '-' . date("Y-m-d") . '.sql';
$backupzip = $backupfile . '.tar.gz';

//mysqldumpHoaDb($host, $dbadmin, $password, $dbname, $backupfile);
system("mysqldump -h $host -u $dbadmin -p$password $dbname > $backupfile");
system("tar -czvf $backupzip $backupfile");

$bodytext = "Attached is an MYSQLDUMP of the HOA MySQL database";

// Mail the file
$email = new PHPMailer();
$email->From      = $fromEmailAddress;
$email->FromName  = $fromEmailAddress;
$email->Subject   = 'HOA database backup';
$email->Body      = $bodytext;
$email->AddAddress($adminEmailList);

//$email->AddAttachment( $file_to_attach , 'NameOfFile.pdf' );
$email->AddAttachment($backupzip, $backupzip);
$email->Send();

// Delete the file from your server
unlink($backupzip);
unlink($backupfile);

//echo 'success';

?>
