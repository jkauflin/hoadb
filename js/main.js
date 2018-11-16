
//==========================================================================================================================
// Main document ready function
//==========================================================================================================================
$(document).ready(function(){
	/*
    $(document).on("click",".docModal",function(){
    	var $this = $(this);
  		$("#docFilename").html($this.attr('data-filename'));
  		$("#docFileDisplay").empty();
  		var iframeHeight = $(window).height()-220;
		var iframeHtml = '<iframe id="docFileFrame" src="'+$this.attr("data-filePath")+'" width="100%" height="'+iframeHeight.toString()+'" frameborder="0" allowtransparency="true"></iframe>';  				
  		$("#docFileDisplay").html(iframeHtml);
  		// Display the modal window with the iframe
    	$("#docModal").modal("show");    	
	});	
	*/
}); // $(document).ready(function(){

//--------------------------------------------------------------------------------------------------------------------------------
// Asynchronous recursive loop to process the list for the AdminExecute
//--------------------------------------------------------------------------------------------------------------------------------
function adminLoop(hoaPropertyRecList,action) {
	
	firstNotice = false;
	// If list of unpaid properties is the total number of properties, assume it is the 1st Dues Notice
	if (hoaPropertyRecList.length == hoaPropertyListMAX) {
		firstNotice = true;
	}

	adminRecCntMAX = hoaPropertyRecList.length;
	// If doing an email TEST, assume 1st notice
	if (action == 'DuesEmailsTest') {
		firstNotice = true;
		adminRecCntMAX = 1;
	}
	sendEmail = true;

	// getJSON to get detail data on each one and call function to add dues statement to a PDF
	$.getJSON("getHoaDbData.php","parcelId="+hoaPropertyRecList[adminRecCnt].parcelId,function(hoaRec){

		// Add a progress bar when starting the processing
		if (adminRecCnt == 0) {
	  		$("#ResultMessage").html('<div id="AdminProgress" class="progress" ></div>');
		}
		
		if (action == 'DuesEmails') {
			// just check for a valid email address (NOT UseEmail - just use that to skip in the else)
			// if (hoaRec.UseEmail || action == 'DuesEmailsTest') {
			if (hoaRec.DuesEmailAddr != '') {
		  		pdf = new jsPDF('p', 'in', 'letter');
		    	pdf.setProperties({
		    	    title: pdfTitle,
		    	    subject: pdfTitle,
		    	    author: hoaName
		    	});
		    	pdfPageCnt = 0;
				pdfLineCnt = 0;

			  	// Call function to format the yearly dues statement for an individual property
			  	formatYearlyDuesStatement(hoaRec);

				tempCommDesc = "";
				sendEmailAddr = hoaRec.DuesEmailAddr;

				// email not blank
				console.log("Cnt = "+adminRecCnt+", ParcelId = "+hoaRec.Parcel_ID+", OwnerID = "+hoaRec.ownersList[0].OwnerID+", Owner = "+hoaRec.ownersList[0].Owner_Name1+", hoaRec.DuesEmailAddr = "+hoaRec.DuesEmailAddr);
				emailRecCnt++;
				/*
				$.get("updHoaComm.php","parcelId="+hoaRec.Parcel_ID+
						"&ownerId="+hoaRec.ownersList[0].OwnerID+
						"&commId=NEW"+
						"&commType=Dues Notice email"+
						"&commDesc="+"Dues Notice being emailed to "+hoaRec.DuesEmailAddr+
						"&CommAction=Edit",function(results){

					$.post("sendMail.php",{ toEmail: hoaRec.DuesEmailAddr,
								subject: hoaNameShort+' Dues Notice', 
								messageStr: 'Attached is the '+hoaName+' Dues Notice.  *** Reply to this email to request unsubscribe ***',
								filename: hoaNameShort+'DuesNotice.pdf',
								filedata: btoa(pdf.output()) },function(response,status){
						console.log("response from sendMail = "+response);
		
						if (response == 'ERROR') {
							// if successful email, log communication
							if (action != 'DuesEmailsTest') {
								$.get("updHoaComm.php","parcelId="+hoaRec.Parcel_ID+
									"&ownerId="+hoaRec.ownersList[0].OwnerID+
									"&commId=NEW"+
									"&commType=Dues Notice email"+
									"&commDesc=ERROR emailing Dues Notice to "+hoaRec.DuesEmailAddr+
									"&CommAction=Edit",function(results){
								}); // End of $.get("updHoaComm.php"
							}
						}
								
					}); // End of $.post("sendMail.php"

				}); // End of $.get("updHoaComm.php"
				*/
			}
		} else if (action == 'DuesRank') {
			if (hoaRec.TotalDue > 0) {
        		hoaRecList.push(hoaRec);
			}

		} else if (action == 'DuesEmailsTest') {
				sendEmailAddr = paymentEmailList;
				// Only send email on the 1st one
				if (action == 'DuesEmailsTest' && adminRecCnt > 0) {
					sendEmail = false;
				}

		} else {
			// When generating DuesNotices for the 1st notice, skip the ones with Property UseEmail set (if there is a valid email)
			if (firstNotice && hoaRec.UseEmail && hoaRec.DuesEmailAddr != '') {
				adminEmailSkipCnt++;
			} else {
				// Get a displayAddress for the Communication record
				displayAddress = hoaRec.Parcel_Location;
				if (hoaRec.ownersList[0].AlternateMailing) {
					displayAddress = hoaRec.ownersList[0].Alt_Address_Line1;
				}

				noticeType = "Additional ";
				if (firstNotice) {
					noticeType = "1st ";
				}

				if (action == 'MarkMailed') {
					commDesc = noticeType + "Notice for postal mail mailed for "+displayAddress;
				} else {
					commDesc = noticeType + "Notice for postal mail created for "+displayAddress;
					// Create the PDF for yearly dues statements
					if (adminRecCnt == 0) {
						pdf = new jsPDF('p', 'in', 'letter');
					  	pdf.setProperties({
						  title: pdfTitle,
						  subject: pdfTitle,
						  author: hoaName
					  });
					  pdfPageCnt = 0;
					  pdfLineCnt = 0;
				  	} else {
					  // If not the first record for DuesNotices, reset the line count and add a new page
					  pdfLineCnt = 0;
					  pdf.addPage('letter','p');
				  	}
  
					// Call function to format the yearly dues statement for an individual property
					formatYearlyDuesStatement(hoaRec);
				}
			  	
	        	// log communication for notice created
		        $.get("updHoaComm.php","parcelId="+hoaRec.Parcel_ID+
							"&ownerId="+hoaRec.ownersList[0].OwnerID+
							"&commId=NEW"+
							"&commType=Dues Notice"+
							"&commDesc="+commDesc+
							"&CommAction=Edit",function(results){
		        });
			} // !if (firstNotice && hoaRec.UseEmail) {
		} // !if (action == 'DuesEmails') {

	  	// Calculate the percent done for the progress bar
		recTotal = hoaPropertyRecList.length-1;
		percentDone = Math.round((adminRecCnt/recTotal)*100);
		//console.log(adminRecCnt+", percentDone = "+percentDone+", Parcel Id = "+hoaRec.Parcel_ID);
		
		// Create the progress bar the first time through
		if (adminRecCnt == 0) {
			// Add progress bar class
			var progressBar = $('<div>').prop('id',"AdminProgressBar").prop('class',"progress-bar").attr('role',"progressbar").attr('aria-valuenow',"0").attr('aria-valuemin',"0").attr('aria-valuemax',"100").css('width',"0%");
			$("#AdminProgress").html(progressBar);
		} else {
		    // update the progress bar width
		    $("#AdminProgressBar").width(percentDone+'%').attr('aria-valuenow', percentDone);
		    // and display the numeric value
		    $("#AdminProgressBar").html(percentDone+'%');
		}

		// Increment the loop counter
		adminRecCnt++;
	    if (adminRecCnt < adminRecCntMAX) {
			// If loop not complete, recursively call the loop function again (with a 0 delay so it starts immediately)
			setTimeout(adminLoop, 0, hoaPropertyRecList, action);
		} else {
			// If loop completed, display a completion message

			if (action == 'DuesEmails' || action == 'DuesEmailsTest') {
				$("#ResultMessage").html("Yearly dues notices emailed, total = "+emailRecCnt);
				// Get real count of emails sent

			} else if (action == 'DuesRank') {
				formatDuesRankList(hoaRecList);
				$("#ResultMessage").html("Unpaid Dues Ranking, total = "+hoaRecList.length);

			} else if (action == 'MarkMailed') {
				formatDuesRankList(hoaRecList);
				$("#ResultMessage").html("Postal dues notices marked mailed, total = "+adminRecCnt);

			} else {
				$("#ResultMessage").html("Yearly dues notices created, total = "+adminRecCnt+", (Total skipped for UseEmail = "+adminEmailSkipCnt+")");
				// Download the PDF file
				pdf.save(formatDate()+"-YearlyDuesNotices.pdf");
			}

		}
	}); // $.getJSON("getHoaDbData.php","parcelId="+hoaPropertyRecList[adminRecCnt].parcelId,function(hoaRec){
	
} // function adminLoop(hoaPropertyRecList,action) {


// function to format a Yearly dues statement
function formatYearlyDuesStatement(hoaRec) {
	ownerRec = hoaRec.ownersList[0];
	pdfMaxLineChars = 95;

	// Set the Notice and Notes field according to 1st or Additional notices
	noticeYear = '' + parseInt(hoaRec.assessmentsList[0].FY) - 1;
	noticeDate = formatDate();
	yearlyDuesStatementNotice = yearlyDuesStatementNoticeAdditional;
	yearlyDuesStatementNotes = yearlyDuesStatementNotesAdditional;
	if (firstNotice) {
		noticeDate = 'September 1st, '+noticeYear;
		yearlyDuesStatementNotice = yearlyDuesStatementNotice1st;
		yearlyDuesStatementNotes = yearlyDuesStatementNotes1st;
	}

	pdfLineColIncrArray = [-4.5];
	yearlyDuesStatementAddLine([hoaName],null,13,0.5); 
	pdfLineColIncrArray = [4.5,-3.05];
	yearlyDuesStatementAddLine([pdfTitle+" for Fiscal Year ",hoaRec.assessmentsList[0].FY],null,12,0.8); 
	
	// hoa name and address for return label
	pdfLineIncrement = 0.2;
	pdfLineColIncrArray = [1.0];
	yearlyDuesStatementAddLine([hoaName],null,10,1.0); 
	yearlyDuesStatementAddLine([hoaAddress1]); 
	yearlyDuesStatementAddLine([hoaAddress2]); 

	pdfLineIncrement = 0.21;
	pdfLineColIncrArray = [4.5,1.3];
	yearlyDuesStatementAddLine(["For the Period: ",'Oct 1st, '+noticeYear+' thru Sept 30th, '+hoaRec.assessmentsList[0].FY],null,11,1.1); 
	pdfLineColIncrArray = [-4.5,-1.3];
	yearlyDuesStatementAddLine(["Notice Date: ",noticeDate]); 
	
	$duesAmt = stringToMoney(hoaRec.assessmentsList[0].DuesAmt); 
	yearlyDuesStatementAddLine(["Dues Amount: ",'$'+$duesAmt]);
	if ($duesAmt == hoaRec.TotalDue) {
		yearlyDuesStatementAddLine(["Due Date: ",'October 1st, '+noticeYear]); 
		pdfLineColIncrArray = [-4.5,1.3];
		yearlyDuesStatementAddLine(["Parcel Id: ",hoaRec.Parcel_ID]); 
		yearlyDuesStatementAddLine(["Lot No: ",hoaRec.LotNo]); 
	} else {
		//yearlyDuesStatementAddLine(["Prior Due: ",'$'+(hoaRec.TotalDue-$duesAmt)]); 
		//yearlyDuesStatementAddLine(["Total Due: ",'$'+hoaRec.TotalDue]);
		yearlyDuesStatementAddLine(["********************* ","There are prior year dues owed"]);
		yearlyDuesStatementAddLine(["********************* ","Please contact the Treasurer"]);
		yearlyDuesStatementAddLine(["Due Date: ",'October 1st, '+noticeYear]); 
		pdfLineColIncrArray = [-4.5,1.3];
		yearlyDuesStatementAddLine(["Parcel Id: ",hoaRec.Parcel_ID+", Lot: "+hoaRec.LotNo]); 
	}

	pdfLineColIncrArray = [-4.5];
	//yearlyDuesStatementAddLine(['']);
	yearlyDuesStatementAddLine(['    Contact Information:']);
	pdfLineColIncrArray = [4.5];
	yearlyDuesStatementAddLine([ownerRec.Owner_Name1+' '+ownerRec.Owner_Name2]);
	yearlyDuesStatementAddLine([hoaRec.Parcel_Location]); 
	yearlyDuesStatementAddLine([hoaRec.Property_City+', '+hoaRec.Property_State+' '+hoaRec.Property_Zip]); 
	yearlyDuesStatementAddLine(['Phone # '+ownerRec.Owner_Phone]); 
	yearlyDuesStatementAddLine(['Email: '+hoaRec.DuesEmailAddr]); 
	
	var displayAddress1 = ownerRec.Mailing_Name;
	var displayAddress2 = hoaRec.Parcel_Location;
	var displayAddress3 = hoaRec.Property_City+', '+hoaRec.Property_State+' '+hoaRec.Property_Zip;
	var displayAddress4 = "";
	
	if (hoaRec.ownersList[0].AlternateMailing) {
		if (ownerRec.Alt_Address_Line2 != '') {
			displayAddress2 = ownerRec.Alt_Address_Line1;
			displayAddress3 = ownerRec.Alt_Address_Line2
			displayAddress4 = ownerRec.Alt_City+', '+ownerRec.Alt_State+' '+ownerRec.Alt_Zip;
		} else {
			displayAddress2 = ownerRec.Alt_Address_Line1;
			displayAddress3 = ownerRec.Alt_City+', '+ownerRec.Alt_State+' '+ownerRec.Alt_Zip;
		}
	}

	// Display the mailing address
	pdfLineIncrement = 0.21;
	pdfLineColIncrArray = [1.0];
	yearlyDuesStatementAddLine([displayAddress1],null,11,2.5);
	yearlyDuesStatementAddLine([displayAddress2]); 
	yearlyDuesStatementAddLine([displayAddress3]); 
	yearlyDuesStatementAddLine([displayAddress4]); 
	
	// Address corrections
	pdfLineIncrement = 0.3;
	pdfLineColIncrArray = [-0.6];
	yearlyDuesStatementAddLine(["Enter any information that needs to be corrected:"],null,11,4.3);
	pdfLineColIncrArray = [0.6];
	yearlyDuesStatementAddLine(["Owner Name:"]);
	yearlyDuesStatementAddLine(["Address Line 1:"]);
	yearlyDuesStatementAddLine(["Address Line 2:"]);
	yearlyDuesStatementAddLine(["City State Zip:"]);
	yearlyDuesStatementAddLine(["Phone Number:"]);
	yearlyDuesStatementAddLine([""]);
	yearlyDuesStatementAddLine(["Email:"]);
	
	// Survey description, questions (1,2,3)
	/* Commenting out survey for now
	pdfLineIncrement = 0.285;
	pdfLineColIncrArray = [-1.0];
	yearlyDuesStatementAddLine([surveyInstructions],null,11,6.28);
	pdfLineColIncrArray = [1.0];
	yearlyDuesStatementAddLine([surveyQuestion1]);
	yearlyDuesStatementAddLine([surveyQuestion2]);
	yearlyDuesStatementAddLine([surveyQuestion3]);
	*/
	pdfLineIncrement = 0.15;
	pdfLineColIncrArray = [1.0];
	yearlyDuesStatementAddLine([""]);
	pdfLineIncrement = 0.21;
	pdfLineColIncrArray = [-1.0];
	yearlyDuesStatementAddLine(["Go Paperless - check here to turn off mailed paper notices"]);
	pdfLineColIncrArray = [1.0];
	yearlyDuesStatementAddLine(["(Make sure correct Email address is listed in Contact Info or entered above)"]);
	
	pdfLineIncrement = 0.21;

	yearlyDuesStatementAddLine([''],null,10,3.9);
	

	// Print the Notice statement if it exists (2nd notice, etc.)
	if (yearlyDuesStatementNotice.length > 0) {
		pdfMaxLineChars = 35;
		pdfLineColIncrArray = [-5.2];
		yearlyDuesStatementAddLine([yearlyDuesStatementNotice],null,12);
		yearlyDuesStatementAddLine([''],null);
	}
	
	// If there are notes - print them
	pdfMaxLineChars = 45;
	if (yearlyDuesStatementNotes.length > 0) {
		pdfLineColIncrArray = [5.2];
		yearlyDuesStatementAddLine([yearlyDuesStatementNotes],null,10);
	}

	// Print information on the user records portion
	pdfLineColIncrArray = [-0.5];
	yearlyDuesStatementAddLine([hoaName],null,13,8.0); 
	pdfLineColIncrArray = [0.5,-3.05];
	yearlyDuesStatementAddLine([pdfTitle+" for Fiscal Year ",hoaRec.assessmentsList[0].FY],null,12,8.3); 
	
	pdfLineIncrement = 0.21;
	var noticeYear = '' + parseInt(hoaRec.assessmentsList[0].FY) - 1;
	pdfLineColIncrArray = [0.5,1.5];
	yearlyDuesStatementAddLine(["For the Period: ",'Oct 1st, '+noticeYear+' thru Sept 30th, '+hoaRec.assessmentsList[0].FY],null,11,8.6); 
	pdfLineColIncrArray = [-0.5,-1.5];
	yearlyDuesStatementAddLine(["Notice Date: ",noticeDate]); 

	yearlyDuesStatementAddLine(["Dues Amount: ",'$'+$duesAmt]);
	if ($duesAmt != hoaRec.TotalDue) {
		//yearlyDuesStatementAddLine(["Prior Due: ",'$'+(hoaRec.TotalDue-$duesAmt)]); 
		//yearlyDuesStatementAddLine(["Total Due: ",'$'+hoaRec.TotalDue]); 
		yearlyDuesStatementAddLine(["************************ ","There are prior year dues owed"]);
		yearlyDuesStatementAddLine(["************************ ","Please contact the Treasurer"]);
	}
	yearlyDuesStatementAddLine(["Due Date: ",'October 1st, '+noticeYear]); 
	
	pdfLineColIncrArray = [-0.5,1.5];
	yearlyDuesStatementAddLine(['','']); 
	yearlyDuesStatementAddLine(["Parcel Id: ",hoaRec.Parcel_ID]); 
	yearlyDuesStatementAddLine(["Lot No: ",hoaRec.LotNo]); 
	yearlyDuesStatementAddLine(["Property Location: ",hoaRec.Parcel_Location]); 
	
	// hoa name and address for payment
	pdfLineIncrement = 0.21;
	pdfLineColIncrArray = [5.2];
	yearlyDuesStatementAddLine(["Make checks payable to:"],null,11,8.0); 
	pdfLineColIncrArray = [-5.2];
	yearlyDuesStatementAddLine([hoaName]); 
	yearlyDuesStatementAddLine(['']); 
	pdfLineColIncrArray = [-5.2,0.8];
	yearlyDuesStatementAddLine(["Send to:",hoaNameShort]); 
	yearlyDuesStatementAddLine(["",hoaAddress1]); 
	yearlyDuesStatementAddLine(["",hoaAddress2]); 

	pdfLineIncrement = 0.19;
	pdfLineColIncrArray = [-5.2];
	yearlyDuesStatementAddLine(['']); 
	yearlyDuesStatementAddLine(["Date Paid:"],null,12); 
	yearlyDuesStatementAddLine(['']); 
	yearlyDuesStatementAddLine(["Check No:"]); 

	// Help notes
	yearlyDuesStatementAddLine([''],null,10,10.05);
	pdfMaxLineChars = 55;
	// If there are notes - print them
	if (yearlyDuesStatementNotes.length > 0) {
		pdfLineColIncrArray = [4.7];
		yearlyDuesStatementAddLine([yearlyDuesHelpNotes],null);
	}
	
} // End of function formatYearlyDuesStatement(hoaRec) {

//Function to add a line to the Yearly Dues Statement PDF
function yearlyDuesStatementAddLine(pdfLineArray,pdfLineHeaderArray,fontSize,lineYStart) {
	pdfLineCnt++;
	var X = 0.0;
	// X (horizontal), Y (vertical)

	/*
	pdf.setTextColor(255,0,0);
	pdf.text(20, 40, 'This is red.');

	pdf.setTextColor(0,255,0);
	pdf.text(20, 50, 'This is green.');

	pdf.setTextColor(0,0,255);
	pdf.text(20, 60, 'This is blue.');
	*/

	// Print header and graphic sections
	if (pdfLineCnt == 1) {
		pdfPageCnt++;

		// X (horizontal), Y (vertical)
		pdf.setFontSize(9);
		pdf.text(8.05, 0.3, pdfPageCnt.toString());
		
		pdf.addImage(pdfLogoImgData, 'JPEG', 0.42, 0.9, 0.53, 0.53);

    	// Tri-fold lines
		pdf.setLineWidth(0.01);
		pdf.line(X, 3.75, 8.5, 3.75);
		pdf.setLineWidth(0.02);
		var segmentLength = 0.2;
		dottedLine(0, 7.5, 8.5, 7.5, segmentLength)
	
		// Text around bottom line
		pdf.setFontSize(9);
		pdf.text(3.0, 7.45, "Detach and mail above portion with your payment");
		pdf.text(3.45, 7.65, "Keep below portion for your records");

		// Lines for address corrections
		pdf.setLineWidth(0.013);
		pdf.rect(0.4, 4.0, 4.4, 2.0); 
		pdf.line(1.7, 4.65, 4.5, 4.65);
		pdf.line(1.7, 4.95, 4.5, 4.95);
		pdf.line(1.7, 5.25, 4.5, 5.25);
		pdf.line(1.7, 5.55, 4.5, 5.55);
		pdf.line(1.7, 5.85, 4.5, 5.85);
		
		// Checkboxes for survey questions
		// empty square (X,Y, X length, Y length)
		pdf.setLineWidth(0.015);
		//pdf.rect(0.5, 6.4, 0.2, 0.2); 
		pdf.rect(0.5, 6.7, 0.2, 0.2); 
		//pdf.rect(0.5, 7.0, 0.2, 0.2); 

		// Date and Check No lines
		pdf.setLineWidth(0.013);
		pdf.line(6.1, 9.5, 7.5, 9.5);
		pdf.line(6.1, 9.9, 7.5, 9.9);
		
		pdfLineY = pdfLineYStart;
		pdfFontSize = pdfFontSizeDefault;
	}

	if (fontSize != null && fontSize !== 'undefined') {
		pdfFontSize = fontSize;
	}
	if (lineYStart != null && lineYStart !== 'undefined') {
		pdfLineY = lineYStart;
	}

	pdf.setFontSize(pdfFontSize);

	if (pdfLineHeaderArray != null && pdfLineHeaderArray !== 'undefined') {
		X = 0.0;
		// Loop through all the column headers in the array
		for (i = 0; i < pdfLineArray.length; i++) {
			if (pdfLineColIncrArray[i] < 0) {
				pdf.setFontType("bold");
			} else {
				pdf.setFontType("normal");
			}
			X += Math.abs(pdfLineColIncrArray[i]);
			pdf.text(X,pdfLineY,''+pdfLineHeaderArray[i]);
		}
		pdfLineY += pdfLineIncrement / 2.0;
		
		X = pdfLineColIncrArray[0];
		pdf.setLineWidth(0.015);
		pdf.line(X,pdfLineY,8,pdfLineY);
		pdfLineY += pdfLineIncrement;
	}
	
	var textLine = '';
	var breakPos = 0;
	var j = 0;
	X = 0.0;
	// Loop through all the columns in the array
	for (i = 0; i < pdfLineArray.length; i++) {
		if (pdfLineColIncrArray[i] < 0) {
			pdf.setFontType("bold");
		} else {
			pdf.setFontType("normal");
		}

		X += Math.abs(pdfLineColIncrArray[i]);
		textLine = ''+pdfLineArray[i];

		while (textLine.length > 0) {
			if (textLine.length > pdfMaxLineChars) {
				breakPos = pdfMaxLineChars;
				j = breakPos;
				for (j; j > 0; j--) {
					if (textLine[j] == ' ') {
						breakPos = j;
						break;
					}
				}

				pdf.text(X,pdfLineY,textLine.substr(0,breakPos));
				pdfLineY += pdfLineIncrement;
				textLine = textLine.substr(breakPos,textLine.length-breakPos);
				
			} else {
				pdf.text(X,pdfLineY,textLine);
				textLine = '';
			} 
		} // while (textLine.length > 0) {
		
	} // for (i = 0; i < pdfLineArray.length; i++) {
	pdfLineY += pdfLineIncrement;
	pdf.setFontType("normal");
	
} // End of function yearlyDuesStatementAddLine(pdfLineArray,pdfLineHeaderArray) {


function formatDuesStatementResults(hoaRec) {
    var tr = '';
    var checkedStr = '';

    pdfMaxLineChars = 95;
    
	var duesStatementDownloadLinks = $("#DuesStatementDownloadLinks");
	duesStatementDownloadLinks.empty();

	ownerRec = hoaRec.ownersList[0];

	var currSysDate = new Date();
	pdfTitle = "Member Dues Statement";
	pdfTimestamp = currSysDate.toString().substr(0,24);
	
	pdfPageCnt = 0;
	pdfLineCnt = 0;

	if (duesStatementNotes.length > 0) {
		pdfLineColIncrArray = [1.4];
		duesStatementPDFaddLine([duesStatementNotes],null);
		duesStatementPDFaddLine([''],null);
	}
	
	pdfLineHeaderArray = [
			'Parcel Id',
			'Lot No',
			'Location',
			'Owner and Alt Address',
			'Phone'];
	pdfLineColIncrArray = [0.6,1.4,0.8,2.2,1.9];
	
	duesStatementPDFaddLine([hoaRec.Parcel_ID,hoaRec.LotNo,hoaRec.Parcel_Location,ownerRec.Mailing_Name,
	                         ownerRec.Owner_Phone],pdfLineHeaderArray); 

	if (hoaRec.ownersList[0].AlternateMailing) {
		duesStatementPDFaddLine(['','','',ownerRec.Alt_Address_Line1,''],null); 
		if (ownerRec.Alt_Address_Line2 != '') {
			duesStatementPDFaddLine(['','','',ownerRec.Alt_Address_Line2,''],null); 
		}
		duesStatementPDFaddLine(['','','',ownerRec.Alt_City+', '+ownerRec.Alt_State+' '+ownerRec.Alt_Zip,''],null); 
	}

	
    tr += '<tr><th>Parcel Id:</th><td>'+hoaRec.Parcel_ID+'</a></td></tr>';
    tr += '<tr><th>Lot No:</th><td>'+hoaRec.LotNo+'</td></tr>';
    //tr += '<tr><th>Sub Division: </th><td>'+hoaRec.SubDivParcel+'</td></tr>';
    tr += '<tr><th>Location: </th><td>'+hoaRec.Parcel_Location+'</td></tr>';
    tr += '<tr><th>City State Zip: </th><td>'+hoaRec.Property_City+', '+hoaRec.Property_State+' '+hoaRec.Property_Zip+'</td></tr>';
    tr += '<tr><th>Owner Name:</th><td>'+ownerRec.Owner_Name1+' '+ownerRec.Owner_Name2+'</td></tr>';
    
    var tempTotalDue = '' + hoaRec.TotalDue;
    tr += '<tr><th>Total Due: </th><td>$'+stringToMoney(tempTotalDue)+'</td></tr>';
    $("#DuesStatementPropertyTable tbody").html(tr);

    // If enabled, payment button and instructions will have values, else they will be blank if online payment is not allowed
    if (hoaRec.TotalDue > 0) {
    	$("#PayDues").html(hoaRec.paymentButton);
    	if (hoaRec.paymentButton != '') {
        	$("#PayDuesInstructions").html(onlinePaymentInstructions);
    	} else {
        	$("#PayDuesInstructions").html(offlinePaymentInstructions);
    	}
    }

    duesStatementDownloadLinks.append(
			$('<a>').prop('id','DownloadDuesStatementPDF')
	    			.attr('href','#')
		    		.attr('class',"btn btn-danger downloadBtn")
		    		.attr('data-pdfName','DuesStatement')
		    		.html('PDF'));

	pdfLineColIncrArray = [0.6,4.2,0.5];
	duesStatementPDFaddLine([''],null);
	
    tr = '';
	$.each(hoaRec.totalDuesCalcList, function(index, rec) {
	    tr = tr + '<tr>';
    	tr = tr +   '<td>'+rec.calcDesc+'</td>';
	    tr = tr +   '<td>$</td>';
	    tr = tr +   '<td align="right">'+parseFloat(''+rec.calcValue).toFixed(2)+'</td>';
	    tr = tr + '</tr>';
	    duesStatementPDFaddLine([rec.calcDesc,'$',parseFloat(''+rec.calcValue).toFixed(2)],null);
	});
    tr = tr + '<tr>';
	tr = tr +   '<td><b>Total Due:</b></td>';
    tr = tr +   '<td><b>$</b></td>';
    tr = tr +   '<td align="right"><b>'+parseFloat(''+hoaRec.TotalDue).toFixed(2)+'</b></td>';
    tr = tr + '</tr>';
    duesStatementPDFaddLine(['Total Due:','$',parseFloat(''+hoaRec.TotalDue).toFixed(2)],null);

    tr = tr + '<tr>';
	tr = tr +   '<td>'+hoaRec.assessmentsList[0].LienComment+'</td>';
    tr = tr +   '<td></td>';
    tr = tr +   '<td align="right"></td>';
    tr = tr + '</tr>';
	$("#DuesStatementCalculationTable tbody").html(tr);
    duesStatementPDFaddLine([hoaRec.assessmentsList[0].LienComment,'',''],null);
	
	duesStatementPDFaddLine([''],null);

	var TaxYear = '';
    tr = '';
    var tempDuesAmt = '';
	$.each(hoaRec.assessmentsList, function(index, rec) {
		pdfLineHeaderArray = null;
		if (index == 0) {
    	    tr = tr +   '<tr>';
    	    tr = tr +     '<th>Year</th>';
    	    tr = tr +     '<th>Dues Amt</th>';
    	    tr = tr +     '<th>Date Due</th>';
    	    tr = tr +     '<th>Paid</th>';
    	    tr = tr +     '<th>Non-Collectible</th>';
    	    tr = tr +     '<th>Date Paid</th>';
    	    tr = tr +   '</tr>';
    	    TaxYear = rec.DateDue.substring(0,4);
    	    
    		pdfLineHeaderArray = [
    			          			'Year',
    			          			'Dues Amt',
    			          			'Date Due',
    			          			'Paid',
    			          			'Non-Collectible',
    			          			'Date Paid'];
    		pdfLineColIncrArray = [0.6,0.8,1.0,1.7,0.8,1.5];
		}

	    tempDuesAmt = '' + rec.DuesAmt;
	    tr = tr + '<tr>';
    	tr = tr +   '<td>'+rec.FY+'</a></td>';
	    tr = tr +   '<td>'+stringToMoney(tempDuesAmt)+'</td>';
	    tr = tr +   '<td>'+rec.DateDue+'</td>';
	    tr = tr +   '<td>'+setCheckbox(rec.Paid)+'</td>';
	    tr = tr +   '<td>'+setCheckbox(rec.NonCollectible)+'</td>';
	    tr = tr +   '<td>'+rec.DatePaid+'</td>';
	    tr = tr + '</tr>';
	    duesStatementPDFaddLine([rec.FY,rec.DuesAmt,rec.DateDue,setBoolText(rec.Paid),setBoolText(rec.NonCollectible),rec.DatePaid],pdfLineHeaderArray);
	});

	$("#DuesStatementAssessmentsTable tbody").html(tr);
	
} // End of function formatDuesStatementResults(hoaRec){

//Function to add a line to the Dues Statement PDF
function duesStatementPDFaddLine(pdfLineArray,pdfLineHeaderArray) {
	pdfLineCnt++;
	var pdfHeader = false;
	var X = 0.0;
	// X (horizontal), Y (vertical)
	
	var hoaName = '';
	var hoaNameShort = '';

	if (pdfLineCnt == 1) {
    	pdf = new jsPDF('p', 'in', 'letter');
    	pdf.setProperties({
    	    title: hoaNameShort+' Dues Statements',
    	    subject: hoaNameShort+' Dues Statements',
    	    author: 'Treasurer',
    	    keywords: 'generated, javascript, web 2.0, ajax',
    	    creator: 'MEEE'
    	});
    	pdfHeader = true;
	}

	//if (pdfLineY > 7.8) {
	if (pdfLineY > 10) {
		pdf.addPage('letter','p');
    	pdfHeader = true;
	}

	if (pdfHeader) {
		pdfPageCnt++;

		// X (horizontal), Y (vertical)
		pdf.setFontSize(15);
		pdf.text(1.5, 0.6, hoaName);
		pdf.setFontSize(13);
		pdf.text(1.5, 0.9, pdfTitle+" - "+pdfTimestamp);
		pdf.setFontSize(10);
		pdf.text(6.5, 0.6, hoaAddress1);
		pdf.text(6.5, 0.8, hoaAddress2);
		
		pdf.addImage(pdfLogoImgData, 'JPEG', 0.4, 0.3, 0.9, 0.9);
    	pdf.setFontSize(10);

		pdfLineY = pdfLineYStart;
	}

	if (pdfLineHeaderArray != null) {
		X = 0.0;
		// Loop through all the column headers in the array
		for (i = 0; i < pdfLineArray.length; i++) {
			X += pdfLineColIncrArray[i];
			pdf.text(X,pdfLineY,''+pdfLineHeaderArray[i]);
		}
		pdfLineY += pdfLineIncrement / 2.0;
		
		X = pdfLineColIncrArray[0];
		pdf.setLineWidth(0.015);
		pdf.line(X,pdfLineY,8,pdfLineY);
		pdfLineY += pdfLineIncrement;
	}
	
	var textLine = '';
	var breakPos = 0;
	var j = 0;
	X = 0.0;
	// Loop through all the columns in the array
	for (i = 0; i < pdfLineArray.length; i++) {
		X += pdfLineColIncrArray[i];
		textLine = ''+pdfLineArray[i];

		while (textLine.length > 0) {
			if (textLine.length > pdfMaxLineChars) {
				breakPos = pdfMaxLineChars;
				j = breakPos;
				for (j; j > 0; j--) {
					if (textLine[j] == ' ') {
						breakPos = j;
						break;
					}
				}

				pdf.text(X,pdfLineY,textLine.substr(0,breakPos));
				pdfLineY += pdfLineIncrement;
				textLine = textLine.substr(breakPos,textLine.length-breakPos);
				
			} else {
				pdf.text(X,pdfLineY,textLine);
				textLine = '';
			} 
		} // while (textLine.length > 0) {
		
	} // for (i = 0; i < pdfLineArray.length; i++) {
	pdfLineY += pdfLineIncrement;
	
} // End of function reportPDFaddLine(pdfLineArray) {


