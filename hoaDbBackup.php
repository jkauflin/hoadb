<?php
/*==============================================================================
 * (C) Copyright 2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Scheduled job to get sales information from the county
 * 				auditor site, find parcels in the hoa, update the hoa_sales
 * 				table, and email a report of new sales
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-07-01 JJK 	Initial version to export and email MySQL database 
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

require_once('class.phpmailer.php');

$errorStr = '';
$dbname = "hoaDB";

$backupfile = $dbname . '-' . date("Y-m-d") . '.sql';
$backupzip = $backupfile . '.tar.gz';

//system("mysqldump -h $host -u $dbadmin -p$password $dbname > $backupfile");
mysqldumpHoaDb($backupfile);
system("tar -czvf $backupzip $backupfile");

$bodytext = "Attached is an MYSQLDUMP of the HOA MySQL database";

// Mail the file
$email = new PHPMailer();
$email->From      = getConfigVal("fromEmailAddress");
$email->FromName  = getConfigVal("fromEmailAddress");
$email->Subject   = 'HOA database backup';
$email->Body      = $bodytext;
$email->AddAddress(getConfigVal("adminEmailList"));

//$email->AddAttachment( $file_to_attach , 'NameOfFile.pdf' );
$email->AddAttachment($backupzip, $backupzip);
$email->Send();

// Delete the file from your server
unlink($backupzip);
unlink($backupfile);

//echo 'success';

?>
