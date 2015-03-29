<?php
/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version to get data 
 *============================================================================*/

// Include table record classes and db connection parameters
include 'hoaDbCommon.php';

	// If they are set, get input parameters from the REQUEST
	$salesYear = getParamVal("salesYear");

	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
	$conn = new mysqli($host, $username, $password, $dbname);
// Check connection
	if ($conn->connect_error) {
		die("Connection failed: " . $conn->connect_error);
	}

	
	$url = 'http://mctreas.org/data/Yearly/SALES_' . $salesYear . '.zip';
	$zipFileName = 'SALES_' . $salesYear . '.zip';
	downloadUrlToFile($url, $zipFileName);
	$fileName = 'SALES_' . $salesYear . '_RES.csv';
	
	$outputStr = '';
	$zipFile = new ZipArchive();
	if ($zipFile->open($zipFileName)) {
		$file = $zipFile->getStream($fileName);
		if(!$file) exit("failed\n");
	
		//$outputStr .= '<h2>Residential Sales in ' . $year . '</h2>';
		
		$recCnt = 0;
		while(!feof($file))
		{
			$recCnt = $recCnt + 1;
			if ($recCnt > 1) {
				$salesRecArray = fgetcsv($file);

				// Check if the Parcel Id from the sales record matches any in our HOA database
				$parcelId = $salesRecArray[0];
				$hoaRec = getHoaRec($conn,$parcelId,"","");

				/*
				 County Weekly/Monthly/Yearly Sales File Record Layout
				Field Name 		Description
				------------------------------------------------
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
				
				
				if (!empty($hoaRec->Parcel_ID)) {
					$hoaOwnerRec = $hoaRec->ownersList[0];
					
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
						
				}
				
				
				/*
				foreach($valArray as $x => $x_value) {
					echo "Key=" . $x . ", Value=" . $x_value;
					echo "<br>";
				}
				*/
			}
			//$outputStr .= '<br>' . $valArray[0];
		}		
		fclose($file);
	}	

	$conn->close();
	
	testMail($outputStr);
	
	echo $outputStr;
	
	
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
	
	
	//echo 'download successful';
	
function downloadUrlToFile($url, $outFileName)
{
	//file_put_contents($xmlFileName, fopen($link, 'r'));
	//copy($link, $xmlFileName); // download xml file

	if(is_file($url)) {
		copy($url, $outFileName); // download xml file
	} else {
		$options = array(
				CURLOPT_FILE    => fopen($outFileName, 'w'),
				CURLOPT_TIMEOUT =>  28800, // set this to 8 hours so we dont timeout on big files
				CURLOPT_URL     => $url
		);

		$ch = curl_init();
		curl_setopt_array($ch, $options);
		curl_exec($ch);
		curl_close($ch);
	}
}

?>
