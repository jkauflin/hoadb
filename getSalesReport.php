<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Scheduled job to get sales information from the county
 * 				auditor site, find parcels in the hoa, update the hoa_sales
 * 				table, and email a report of new sales
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 * 2015-04-28 JJK	Got hoa_sales get and insert working
 * 2015-06-19 JJK	Abstracted some variables
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

$currTimestampStr = date("Y-m-d H:i:s");
//JJK test, date = 2015-04-22 19:45:09
// Get the year from the current system time
$salesYear = substr($currTimestampStr,0,4);

$url = $countySalesDataUrl . $salesYear . '.zip';
$zipFileName = 'SALES_' . $salesYear . '.zip';
downloadUrlToFile($url, $zipFileName);

if (is_file($zipFileName)) {
	$sendMessage = false;
	$addToOutput = false;
	$outputStr = '';
	$fileName = 'SALES_' . $salesYear . '_RES.csv';
	$zipFile = new ZipArchive();
	if ($zipFile->open($zipFileName)) {
		$file = $zipFile->getStream($fileName);
		if(!$file) exit("failed\n");

		//--------------------------------------------------------------------------------------------------------
		// Create connection to the database
		//--------------------------------------------------------------------------------------------------------
		$conn = new mysqli($host, $username, $password, $dbname);
		// Check connection
		if ($conn->connect_error) {
			die("Connection failed: " . $conn->connect_error);
		}
		
		// Loop through all the records in the downloaded sales file and compare with HOA database parcels
		$recCnt = 0;
		while(!feof($file))
		{
			$recCnt = $recCnt + 1;
			
			// 1st record of CSV files are the column names so just skip them
			if ($recCnt == 1) {
				$salesRecCoumnArray = fgetcsv($file);
				continue;
			}
					
			$salesRecArray = fgetcsv($file);
					
			$parcelId = $salesRecArray[0];
			// Check if the Parcel Id from the sales record matches any in our HOA database
			$hoaRec = getHoaRec($conn,$parcelId,"","");
			if (empty($hoaRec->Parcel_ID)) {
				// If the parcel id is not found in the HOA db, then just skip to the next one
				continue;
			}

			$hoaOwnerRec = $hoaRec->ownersList[0];
			$hoaSalesRec = getHoaSalesRec($conn,$hoaRec->Parcel_ID,$salesRecArray[2]);
				
			$addToOutput = false;
			if (empty($hoaSalesRec->PARID)) {
				//$stmt = $conn->prepare("UPDATE hoa_properties SET Member=?,Vacant=?,Rental=?,Managed=?,Foreclosure=?,Bankruptcy=?,Liens_2B_Released=?,Comments=? WHERE Parcel_ID = ? ; ");
				// http://php.net/manual/en/mysqli.quickstart.prepared-statements.php
				if (!( $stmt = $conn->prepare("INSERT INTO hoa_sales VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?); ") )) {
					die("Prepare failed: " . $conn->error);
				}
				
				$NotificationFlag = 'Y';
				if (!(
						$stmt->bind_param("ssssssssssssss",
								$salesRecArray[0],
								$salesRecArray[1],
								$salesRecArray[2],
								$salesRecArray[3],
								$salesRecArray[4],
								$salesRecArray[5],
								$salesRecArray[6],
								$salesRecArray[7],
								$salesRecArray[8],
								$salesRecArray[9],
								$salesRecArray[10],
								$salesRecArray[11],
								$currTimestampStr,
								$NotificationFlag)
				)) {
					die("Bind failed: " . $conn->error);
				}
					
				if (!( $stmt->execute() )) {
					//testMail("getSalesReport, Execute failed: " . $conn->error . ', LINE = ' . __LINE__);
					die("Execute failed: " . $conn->error);
				}
					
				$stmt->close();
				$hoaSalesRec = getHoaSalesRec($conn,$hoaRec->Parcel_ID,$salesRecArray[2]);
				$addToOutput = true;
				
			} else {
				// If the sales record is found but there was no notification, send an email
				if ($hoaSalesRec->NotificationFlag == 'N') {
					$addToOutput = true;
				}
			}
			
			if ($addToOutput) {
				$sendMessage = true;
				
				$outputStr .= '<p><table border=1 class="evenLineHighlight"><tbody>';
				$outputStr .= '<tr><th>Parcel Id:</th><td>' . $parcelId . '</td></tr>';
				$outputStr .= '<tr><th>Parcel Location:</th><td><b>' . $hoaRec->Parcel_Location . '</b></td></tr>';
				$outputStr .= '<tr><th>Old Owner:</th><td>' . $hoaSalesRec->OLDOWN . '</td></tr>';
				$outputStr .= '<tr><th>HOA Owner:</th><td>' . $hoaOwnerRec->Owner_Name1 . ' ' . $hoaOwnerRec->Owner_Name2 . '</td></tr>';
				$outputStr .= '<tr><th>New Owner1:</th><td>' . $hoaSalesRec->OWNERNAME1 . '</td></tr>';
				$outputStr .= '<tr><th>Mailing Name1:</th><td>' . $hoaSalesRec->MAILINGNAME1 . '</td></tr>';
				$outputStr .= '<tr><th>Mailing Name2:</th><td>' . $hoaSalesRec->MAILINGNAME2 . '</td></tr>';
				$outputStr .= '<tr><th>Sale Date:</th><td>' . $hoaSalesRec->SALEDT . '</td></tr>';
				$outputStr .= '</tbody></table></p>';
			}
			
				/*
				 $hoaOwnerRec->OwnerID = $row["OwnerID"];
				 $hoaOwnerRec->Owner_Name1 = $row["Owner_Name1"];
				 $hoaOwnerRec->Owner_Name2 = $row["Owner_Name2"];
				 $hoaOwnerRec->DatePurchased = $row["DatePurchased"];
				 $hoaOwnerRec->Mailing_Name = $row["Mailing_Name"];
				 $hoaOwnerRec->AlternateMailing = $row["AlternateMailing"];
				 $hoaOwnerRec->Alt_Address_Line1 = $row["Alt_Address_Line1"];
				 $hoaOwnerRec->Alt_Address_Line2 = $row["Alt_Address_Line2"];
				 $hoaOwnerRec->Alt_City = $row["Alt_City"];
				 $hoaOwnerRec->Alt_State = $row["Alt_State"];
				 $hoaOwnerRec->Alt_Zip = $row["Alt_Zip"];
				 $hoaOwnerRec->Owner_Phone = $row["Owner_Phone"];
				 */

			//$outputStr .= '<br>' . $valArray[0];
			
		} // End of while(!feof($file))
		fclose($file);

		// Close db connection
		$conn->close();

		if ($sendMessage) {
			$subject = 'HOA Residential Sales in ' . $salesYear;
			$messageStr = '<h2>HOA Residential Sales in ' . $salesYear . '</h2>' . $outputStr;
			sendHtmlEMail($salesReportEmailList,$subject,$messageStr);
		}
		
		
	} // End of If Zip file was opened
	
	//echo $outputStr;
	
} // End of If the zip file was downloaded


	// Delete the downloaded zip file
	//unlink($zipFileName);
	
	/*
	 while (!feof($fp)) {
	//$contents .= fread($fp, 2);
	$contents .= fread($fp, 2);
	}
	*/
	/*
	 while (($buffer = fgets($file, 4096)) !== false) {
	echo $buffer;
	}
	$buffer = fgets($file, 4096);
	$buffer = fgets($file, 4096);
	echo $buffer;
	
	*/
	//Write contents out to a file
	//file_put_contents('t',$contents);
	
?>
