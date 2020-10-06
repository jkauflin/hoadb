<?php
/*==============================================================================
 * (C) Copyright 2016,2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Get data for reports
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-04-12 JJK 	Initial version
 * 2016-07-30 JJK   Completed query for Paid Dues Count report
 * 2016-09-20 JJK	Added non-collectibel fields for counts
 * 2020-08-01 JJK   Re-factored to use jjklogin for authentication
 * 2020-08-25 JJK   Added WelcomeSent
 * 2020-10-03 JJK   Added query logic for Mailing List reports
 *============================================================================*/
require_once 'vendor/autoload.php'; 

// Common functions
require_once 'php_secure/commonUtil.php';
// Common database functions and table record classes
require_once 'php_secure/hoaDbCommon.php';
// Login Authentication class
require_once 'php_secure/jjklogin.php';
use \jkauflin\jjklogin\LoginAuth;
// Include database connection credentials from an external includes location
require_once getSecretsFilename();
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");

try {
    $userRec = LoginAuth::getUserRec($cookieName,$cookiePath,$serverKey);
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 1) {
        throw new Exception('User is NOT authorized (contact Administrator)', 500);
    }

    $username = $userRec->userName;
    $reportName = getParamVal("reportName");
    $mailingListName = getParamVal("mailingListName");
    $logDuesLetterSend = paramBoolVal("logDuesLetterSend");

    $outputArray = array();
    $conn = getConn($host, $dbadmin, $password, $dbname);

    if ($reportName == "SalesReport" || $reportName == "SalesNewOwnerReport") {
        $sql = "";
    	if ($reportName == "SalesNewOwnerReport") {
    		$sql = "SELECT * FROM hoa_sales WHERE ProcessedFlag != 'Y' ORDER BY CreateTimestamp DESC; ";
    	} else {
    		$sql = "SELECT * FROM hoa_sales ORDER BY CreateTimestamp DESC; ";
    	}
		$stmt = $conn->prepare($sql);
    	$stmt->execute();
    	$result = $stmt->get_result();
    	$stmt->close();

    	if ($result->num_rows > 0) {
    		while($row = $result->fetch_assoc()) {
    			$hoaSalesRec = new HoaSalesRec();
    			$hoaSalesRec->PARID = $row["PARID"];
    			$hoaSalesRec->CONVNUM = $row["CONVNUM"];
    			$hoaSalesRec->SALEDT = $row["SALEDT"];
    			$hoaSalesRec->PRICE = $row["PRICE"];
    			$hoaSalesRec->OLDOWN = $row["OLDOWN"];
    			$hoaSalesRec->OWNERNAME1 = $row["OWNERNAME1"];
    			$hoaSalesRec->PARCELLOCATION = $row["PARCELLOCATION"];
    			$hoaSalesRec->MAILINGNAME1 = $row["MAILINGNAME1"];
    			$hoaSalesRec->MAILINGNAME2 = $row["MAILINGNAME2"];
    			$hoaSalesRec->PADDR1 = $row["PADDR1"];
    			$hoaSalesRec->PADDR2 = $row["PADDR2"];
    			$hoaSalesRec->PADDR3 = $row["PADDR3"];
    			$hoaSalesRec->CreateTimestamp = $row["CreateTimestamp"];
    			$hoaSalesRec->NotificationFlag = $row["NotificationFlag"];
    			$hoaSalesRec->ProcessedFlag = $row["ProcessedFlag"];
    			$hoaSalesRec->LastChangedBy = $row["LastChangedBy"];
    			$hoaSalesRec->LastChangedTs = $row["LastChangedTs"];
    			$hoaSalesRec->WelcomeSent = $row["WelcomeSent"];
    	
    			$hoaSalesRec->adminLevel = $userRec->userLevel;

                array_push($outputArray,$hoaSalesRec);
    		}
    		$result->close();
    	}
    	// End of if ($reportName == "SalesReport" || $reportName == "SalesNewOwnerReport") {

    } else if ($reportName == "IssuesReport") {
		$sql = "SELECT * FROM hoa_communications WHERE CommType='Issue' ORDER BY CommID DESC ";
		$stmt = $conn->prepare($sql);
    	$stmt->execute();
    	$result = $stmt->get_result();
    	$stmt->close();
    	$cnt = 0;

        if ($result->num_rows > 0) {
    		// Loop through all the member properties
    		while($row = $result->fetch_assoc()) {
                $cnt = $cnt + 1;
                
                $hoaCommRec = new HoaCommRec();
                $hoaCommRec->Parcel_ID = $row["Parcel_ID"];
                $hoaCommRec->CommID = $row["CommID"];
                $hoaCommRec->CreateTs = $row["CreateTs"];
                $hoaCommRec->OwnerID = $row["OwnerID"];
                $hoaCommRec->CommType = $row["CommType"];
                $hoaCommRec->CommDesc = $row["CommDesc"];

    			$hoaRec = getHoaRec($conn,$hoaCommRec->Parcel_ID,$hoaCommRec->OwnerID);
                $hoaRec->commList = array();
				array_push($hoaRec->commList,$hoaCommRec);
    			array_push($outputArray,$hoaRec);
    		}
        }

    } else if ($reportName == "PaidDuesCountsReport") {
    	
    	// get the data for the counts summary by FY
    	$parcelId = "";
    	$ownerId = "";
    	$fy = 0;
    	$duesAmt = "";
    	$paid = FALSE;
    	$nonCollectible = FALSE;
    	
    	//$sql = "SELECT * FROM hoa_assessments WHERE FY > 2006 ORDER BY FY DESC; ";
    	$sql = "SELECT * FROM hoa_assessments WHERE FY > 2006 ORDER BY FY,Parcel_ID,OwnerID DESC; ";
    	
    //  a.FY	
    //	a.Paid
    	
    	$stmt = $conn->prepare($sql);
    	$stmt->execute();
    	$result = $stmt->get_result();
    	$stmt->close();
    	
    	$paidCnt = 0;
    	$unPaidCnt = 0;
    	$nonCollCnt = 0;
    	$totalDue = 0.0;
    	$nonCollDue = 0.0;
    	$cnt = 0;
    	$prevFY = "";
    	$prevParcelId = "";
    	$prevOwnerId = "";
    	if ($result->num_rows > 0) {
    		// Loop through all the member properties
    		while($row = $result->fetch_assoc()) {
    			$cnt = $cnt + 1;

    			//$parcelId = $row["Parcel_ID"];
    			//$ownerId = $row["OwnerID"];
    				
    			$fy = $row["FY"];
    			$duesAmt = $row["DuesAmt"];
    			$paid = $row["Paid"];
    			$nonCollectible = $row["NonCollectible"];
    			
    			if ($cnt == 1) {
    				$prevFY = $fy;
    			}

    				
    			if ($fy != $prevFY) {
    				$paidDuesCountsRec = new PaidDuesCountsRec();
    				$paidDuesCountsRec->fy = $prevFY;
    				$paidDuesCountsRec->paidCnt = $paidCnt;
    				$paidDuesCountsRec->unpaidCnt = $unPaidCnt;
    				$paidDuesCountsRec->nonCollCnt = $nonCollCnt;
    				$paidDuesCountsRec->totalDue = $totalDue;
    				$paidDuesCountsRec->nonCollDue = $nonCollDue; 
    				array_push($outputArray,$paidDuesCountsRec);
    				
    				// reset counts
    				$paidCnt = 0;
    				$unPaidCnt = 0;
    				$nonCollCnt = 0;
    				$totalDue = 0.0;
    				$nonCollDue = 0.0;
    				$prevFY = $fy;
    				$prevParcelId = $parcelId;
    				$prevOwnerId = $ownerId;
    			}

    			// Find duplicate assessments for the same parcel
    			/*
    			if ($fy == $prevFY && $parcelId == $prevParcelId) {
    				error_log($fy . ", Parcel = " . $parcelId . ", prevOwner = " . $prevOwnerId . ", currOwner = " . $ownerId . PHP_EOL, 3, 'DuplicateAssessments.log');
    			}
    			$prevParcelId = $parcelId;
    			$prevOwnerId = $ownerId;
    			*/
    			
    			if ($paid) {
    				$paidCnt++;
    			} else {
    				if ($nonCollectible) {
    					$nonCollCnt++;
    					$nonCollDue += stringToMoney($duesAmt);
    				} else {
    					$unPaidCnt++;
    					$totalDue += stringToMoney($duesAmt);
    				}
    			}

    		}
    		
    		// Get the last bucket
    		$paidDuesCountsRec = new PaidDuesCountsRec();
    		$paidDuesCountsRec->fy = $prevFY;
    		$paidDuesCountsRec->paidCnt = $paidCnt;
    		$paidDuesCountsRec->unpaidCnt = $unPaidCnt;
    		$paidDuesCountsRec->nonCollCnt = $nonCollCnt;
    		$paidDuesCountsRec->totalDue = $totalDue;
    		$paidDuesCountsRec->nonCollDue = $nonCollDue;
    		array_push($outputArray,$paidDuesCountsRec);
    		
    	}
    	
    } else {
        // The general Reports query - creating a list of HoaRec records (with all data for the Property)
        // This PHP service is about getting the list of HOA records, then the JS will decide what to use 
        // and the logic for each particular report
    	$parcelId = "";
    	$ownerId = "";
    	$fy = 0;

        if ($reportName == "UnpaidDuesReport" || $reportName == "PaidDuesReport") {
        	// *** just use the highest FY - the first assessment record ***
        	$result = $conn->query("SELECT MAX(FY) AS maxFY FROM hoa_assessments; ");
        	if ($result->num_rows > 0) {
        		while($row = $result->fetch_assoc()) {
        			$fy = $row["maxFY"];
        		}
        		$result->close();
        	}
        }


    	// try to get the parameters into the initial select query to limit the records it then tries to get from the getHoaRec
        if ($mailingListName == 'WelcomeLetters') {
        	$sql = "SELECT p.Parcel_ID,o.OwnerID FROM hoa_properties p, hoa_owners o, hoa_sales s" .
        				" WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND p.Parcel_ID = s.PARID" .
        				" AND s.WelcomeSent = 'S' ORDER BY s.CreateTimestamp DESC; ";
        } else if ($reportName == "UnpaidDuesReport") {
    		$sql = "SELECT p.Parcel_ID,o.OwnerID FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
    				"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
                    "AND a.FY = " . $fy . " AND a.Paid = 0 ORDER BY p.Parcel_ID; ";
                    // current owner?
    	} else if ($reportName == "PaidDuesReport") {
    		$sql = "SELECT p.Parcel_ID,o.OwnerID FROM hoa_properties p, hoa_owners o, hoa_assessments a " .
    				"WHERE p.Parcel_ID = o.Parcel_ID AND a.OwnerID = o.OwnerID AND p.Parcel_ID = a.Parcel_ID " .
                    "AND a.FY = " . $fy . " AND a.Paid = 1 ORDER BY p.Parcel_ID; ";
                    // current owner?
    	} else {
            // All properties and current owner
            $sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 ORDER BY p.Parcel_ID; ";
    	}

    	$stmt = $conn->prepare($sql);
    	$stmt->execute();
    	$result = $stmt->get_result();
    	$stmt->close();
    	
    	$cnt = 0;
    	if ($result->num_rows > 0) {
    		// Loop through all the member properties
    		while($row = $result->fetch_assoc()) {
    			$cnt = $cnt + 1;
    	
    			$parcelId = $row["Parcel_ID"];
    			$ownerId = $row["OwnerID"];
    	
    			//$hoaRec = getHoaRec($conn,$parcelId,$ownerId,$fy);
    			$hoaRec = getHoaRec($conn,$parcelId,$ownerId);
    	
    			array_push($outputArray,$hoaRec);
    		}
    	}
    	
    } // End of } else if ($reportName == "DuesReport") {
    	
    // Close db connection
    $conn->close();

    echo json_encode($outputArray);

} catch(Exception $e) {
    error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
    echo json_encode(
        array(
            'error' => $e->getMessage(),
            'error_code' => $e->getCode()
        )
    );
}

?>
