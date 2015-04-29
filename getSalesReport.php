<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 *============================================================================*/

include 'commonUtil.php';
// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

// If they are set, get input parameters from the REQUEST
//$salesYear = getParamVal("salesYear");

// Linux command for executing from a Cron job
//php -q /home/grhada5/public_html/hoadb/testCron.php

$outstr = "JJK test, date = " . date("Y-m-d H:i:s");
$currTimestampStr = date("Y-m-d H:i:s");
//JJK test, date = 2015-04-22 19:45:09
//testMail($outstr);


$salesYear = '2015';

$url = 'http://mctreas.org/data/Yearly/SALES_' . $salesYear . '.zip';
$zipFileName = 'SALES_' . $salesYear . '.zip';
downloadUrlToFile($url, $zipFileName);

if (is_file($zipFileName)) {

	// TODO - make sure the zip file is value
	
	$outputStr = '';
	$fileName = 'SALES_' . $salesYear . '_RES.csv';
	$zipFile = new ZipArchive();
	if ($zipFile->open($zipFileName)) {
		$file = $zipFile->getStream($fileName);
		if(!$file) exit("failed\n");
	
		//$outputStr .= '<h2>Residential Sales in ' . $year . '</h2>';

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
			/*
			 County Weekly/Monthly/Yearly Sales File Record Layout
			 Field Name 		Description
			 ------------------------------------------------
			
			 $outputStr .= '<tr><th>Old Owner:</th><td>' . $salesRecArray[4] . '</td></tr>';
			 $outputStr .= '<tr><th>HOA Owner:</th><td>' . $hoaOwnerRec->Owner_Name1 . ' ' . $hoaOwnerRec->Owner_Name2 . '</td></tr>';
			 $outputStr .= '<tr><th>New Owner1:</th><td>' . $salesRecArray[5] . '</td></tr>';
			 $outputStr .= '<tr><th>Mailing Name1:</th><td>' . $salesRecArray[7] . '</td></tr>';
			 $outputStr .= '<tr><th>Mailing Name2:</th><td>' . $salesRecArray[8] . '</td></tr>';
			 $outputStr .= '<tr><th>Sale Date:</th><td>' . $salesRecArray[2] . '</td></tr>';
			
			 PARID 			Parcel Identification Number
			 CONVNUM 		Conveyance Number
			 SALEDT 			Sale Date
			 PRICE 			Sale Price
			 OLDOWN 			Old Owner Name
			 OWNERNAME1 		New Owner Name
			 PARCELLOCATION 	Parcel Location
			 MAILINGNAME1 	Mailing Name 1
			 MAILINGNAME2 	Mailing Name 2
			 PADDR1 			Mailing Address Line 1
			 PADDR2 			Mailing Address Line 2
			 PADDR3 			Mailing Address Line 3
			 CreateTimestamp
			
			 CLASS 			Parcel Class
			 A=Agricultural
			 C=Commercial
			 E=Exempt
			 I-Industrial
			 R=Residential
			 U=Utilities
			 ACRES 			Parcel Acreage
			 TAXABLELAND 	35% Taxable Land Value
			 TAXABLEBLDG 	35% Taxable Building Value
			 TAXABLETOTAL 	35% Taxable Total Value
			 ASMTLAND 		100% Assessed Land Value
			 ASMTBLDG 		100% Assessed Building Value
			 ASMTTOTAL 		100% Assessed Total Value
			 SALETYPE 		Type of Sale (Land Only, Building Only, Land & Building)
			 SALEVALIDITY 	Sale Validity
			 DYTNCRDT 		Indicator whether parcel is flagged for Dayton Credit
			 */
					
			$parcelId = $salesRecArray[0];
			// Check if the Parcel Id from the sales record matches any in our HOA database
			$hoaRec = getHoaRec($conn,$parcelId,"","");
			if (empty($hoaRec->Parcel_ID)) {
				// If the parcel id is not found in the HOA db, then just skip to the next one
				continue;
			}

			$hoaOwnerRec = $hoaRec->ownersList[0];

			
			$hoaSalesRec = getHoaSalesRec($conn,$hoaRec->Parcel_ID,$salesRecArray[2]);
			
			if (empty($hoaSalesRec->PARID)) {
				//$stmt = $conn->prepare("UPDATE hoa_properties SET Member=?,Vacant=?,Rental=?,Managed=?,Foreclosure=?,Bankruptcy=?,Liens_2B_Released=?,Comments=? WHERE Parcel_ID = ? ; ");
				// http://php.net/manual/en/mysqli.quickstart.prepared-statements.php
				if (!( $stmt = $conn->prepare("INSERT INTO hoa_sales VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?); ") )) {
					die("Prepare failed: " . $conn->error);
				}
				
				$NotificationFlag = 'N';
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
					testMail("getSalesReport, Execute failed: " . $conn->error . ', LINE = ' . __LINE__);
					die("Execute failed: " . $conn->error);
				}
					
				$stmt->close();
				
			} else {
				
			}
			
			
			/*
			 PARID 			Parcel Identification Number
			 CONVNUM 		Conveyance Number
			 SALEDT 			Sale Date
			 PRICE 			Sale Price
			 OLDOWN 			Old Owner Name
			 OWNERNAME1 		New Owner Name
			 PARCELLOCATION 	Parcel Location
			 MAILINGNAME1 	Mailing Name 1
			 MAILINGNAME2 	Mailing Name 2
			 PADDR1 			Mailing Address Line 1
			 PADDR2 			Mailing Address Line 2
			 PADDR3 			Mailing Address Line 3
			 CreateTimestamp
			 NotificationFlag
			*/
					
	
			/*
				$outputStr .= '<p><table border=1 class="evenLineHighlight"><tbody>';
				$outputStr .= '<tr><th>Parcel Id:</th><td>' . $parcelId . '</td></tr>';
				$outputStr .= '<tr><th>Parcel Location:</th><td><b>' . $hoaRec->Parcel_Location . '</b></td></tr>';
				$outputStr .= '<tr><th>Old Owner:</th><td>' . $salesRecArray[4] . '</td></tr>';
				$outputStr .= '<tr><th>HOA Owner:</th><td>' . $hoaOwnerRec->Owner_Name1 . ' ' . $hoaOwnerRec->Owner_Name2 . '</td></tr>';
				$outputStr .= '<tr><th>New Owner1:</th><td>' . $salesRecArray[5] . '</td></tr>';
				$outputStr .= '<tr><th>Mailing Name1:</th><td>' . $salesRecArray[7] . '</td></tr>';
				$outputStr .= '<tr><th>Mailing Name2:</th><td>' . $salesRecArray[8] . '</td></tr>';
				$outputStr .= '<tr><th>Sale Date:</th><td>' . $salesRecArray[2] . '</td></tr>';
				$outputStr .= '</tbody></table></p>';
				*/
				
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
		
	} // End of If Zip file was opened
	
	//testMail($outputStr);
	
	echo $outputStr;
	
	
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
