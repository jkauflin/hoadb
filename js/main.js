/*==============================================================================
 * (C) Copyright 2015,2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version 
 * 2015-03-26 JJK	Solved initial DetailPage checkbox display problem by
 * 					moving format after the pagecontainer change (instead of
 * 					before it.  Let the page initialize first, then fill it.
 * 2015-04-09 JJK   Added Regular Expressions and functions for validating
 * 					email addresses and replacing non-printable characters
 * 2015-08-03 JJK	Modified to put the data parameters on the "a" element
 * 					and only response to clicks to the anchor
 * 2015-09-08 JJK   Added GetSalesReport to show sales to HOA properties
 * 2015-09-25 JJK	Added adminLevel to HoaRec to control updates
 * 2015-09-30 JJK	Added Search button
 * 2015-10-01 JJK	Added Create New Owner functionality
 * 					add check to make sure current owner is set on new owners
 * 					and removed from others
 * 2016-02-09 JJK	Switching from JQuery Mobile to Twitter Bootstrap
 * 2016-02-21 JJK   Test new Git
 * 2016-02-26 JJK   Added search by Lot No and adjusted displays for mobile
 * 2016-04-03 JJK	Working on input fields
 * 2016-04-05 JJK   Adding Admin function for adding yearly dues assessments
 * 					Adding Liens
 * 2016-04-09 JJK   Adding Dues Statement calculation display logic
 * 2016-04-14 JJK   Adding Dues Report (working on csv and pdf downloads)
 * 2016-04-20 JJK   Completed test Dues Statement PDF
 * 2016-04-22 JJK	Finishing up reports (added formatDate and csvFilter)
 * 2016-04-30 JJK   Implemented initial payment button functionality if
 *  				only current year dues are owed
 * 2016-05-17 JJK   Implemented Config update page
 * 2016-05-18 JJK   Added setTextArea
 * 2016-05-19 JJK   Modified to get the country web site URL's from config
 * 2016-06-05 JJK   Split Edit modal into 1 and 2Col versions
 * 2016-06-09 JJK	Added duesStatementNotes to the individual dues 
 * 					statement and adjusted the format
 * 2016-06-10 JJK   Corrected reports query to remove current owner condition
 * 					Working on yearly dues statements
 * 2016-06-24 JJK	Working on adminExecute (for yearly dues statement)
 * 2016-07-01 JJK	Got progress bar for adminExecute working by moving loop
 * 					processing into an asynchronous recursive function.
 * 2016-07-07 JJK   Increased database field lengths for text fields and 
 * 					updated UI. Checked comments word wrap.
 * 					Corrected CSV output for reports to have one set of
 * 					MailingAddress fields set from parcel location or
 * 					Alt mailing address (if specified)
 * 2016-07-08 JJK   Modified to get all config list values on page load
 * 2016-07-13 JJK   Finished intial version of yearly dues statements
 * 2016-07-14 JJK   Added Paid Dues Counts report
 * 2016-07-28 JJK	Corrected compound interest problem with a bad start date
 * 					Added print of LienComment after Total Due on Dues Statement
 * 2016-07-30 JJK   Changed the Yearly Dues Statues to just display prior 
 * 					years due messages instead of amounts.
 * 					Added yearlyDuesStatementNotice for 2nd notice message.
 * 					Added DateDue to CSV for reports
 * 2016-08-14 JJK   Imported data from Access backup of 8/12/2016
 * 2016-08-19 JJK	Added UseMail to properties and EmailAddr to owners
 * 2016-08-20 JJK	Implemented email validation check
 * 2016-08-26 JJK   Went live, and Paypal payments working in Prod!!!
 * 2016-09-01 JJK   Corrected Owner order by year not id
 * 2016-09-02 JJK   Added NonCollectible field 
 *============================================================================*/

var hoaName = '';
var hoaNameShort = '';
var hoaAddress1 = '';
var hoaAddress2 = '';
var countyTreasurerUrl = '';
var countyAuditorUrl = '';
var duesStatementNotes = '';
var yearlyDuesStatementNotes = '';
var yearlyDuesStatementNotice = '';
var yearlyDuesHelpNotes = '';
var onlinePaymentInstructions = '';
var offlinePaymentInstructions = '';
var surveyInstructions = '';
var surveyQuestion1 = '';
var surveyQuestion2 = '';
var surveyQuestion3 = '';
// Global variable for loop counter
var adminRecCnt = 0;

function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
	    if ((new Date().getTime() - start) > milliseconds){
	      break;
	    }
	}
}

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}
/*
example.com?param1=name&param2=&id=6
		$.urlParam('param1'); // name
		$.urlParam('id');        // 6
		$.urlParam('param2');   // null
*/

var validEmailAddrRegExStr = "^((\"([ !#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\]^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])*\"|([!#$%&'*+\\-/0-9=?A-Z^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])+)(\\.(\"([ !#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\]^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])*\"|([!#$%&'*+\\-/0-9=?A-Z^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])+))*)@([a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?)*\\.(?![0-9]*\\.?$)[a-zA-Z0-9]{2,}\\.?)$";
var validEmailAddr = new RegExp(validEmailAddrRegExStr,"g"); 
/*
if (validEmailAddr.test(inStr)) {
	resultStr = '<b style="color:green;">VALID</b>';
} else {
	resultStr = '<b style="color:red;">INVALID</b>';
}
*/

//Non-Printable characters - Hex 01 to 1F, and 7F
var nonPrintableCharsStr = "[\x01-\x1F\x7F]";
//"g" global so it does more than 1 substitution
var regexNonPrintableChars = new RegExp(nonPrintableCharsStr,"g");

function cleanStr(inStr) {
	return inStr.replace(regexNonPrintableChars,'');
}

var commaHexStr = "[\x2C]";
var regexCommaHexStr = new RegExp(commaHexStr,"g");
function csvFilter(inVal) {
	return inVal.toString().replace(regexCommaHexStr,'');
}

//var.replace(/[^0-9]+\\.?[0-9]*/g, '');
/*
parseFloat()
//Non-Printable characters - Hex 01 to 1F, and 7F
var nonPrintableCharsStr = "[\x01-\x2D \x2F \x3A-\x7F]";
//"g" global so it does more than 1 substitution
var regexNonPrintableChars = new RegExp(nonPrintableCharsStr,"g");
function cleanStr(inStr) {
	return inStr.replace(regexNonPrintableChars,'');
}
*/

//Replace every ascii character except decimal and digits with a null, and round to 2 decimal places
var nonMoneyCharsStr = "[\x01-\x2D\x2F\x3A-\x7F]";
//"g" global so it does more than 1 substitution
var regexNonMoneyChars = new RegExp(nonMoneyCharsStr,"g");
function stringToMoney(inAmount) {
	var inAmountStr = ''+inAmount;
	inAmountStr = inAmountStr.replace(regexNonMoneyChars,'');
	return parseFloat(inAmountStr).toFixed(2);
}

function formatDate(inDate) {
	var tempDate = inDate;
	if (tempDate == null) {
		tempDate = new Date();
	}
	var tempMonth = tempDate.getMonth() + 1;
	if (tempDate.getMonth() < 9) {
		tempMonth = '0' + (tempDate.getMonth() + 1);
	}
	var tempDay = tempDate.getDate();
	if (tempDate.getDate() < 10) {
		tempDay = '0' + tempDate.getDate();
	}
	return tempDate.getFullYear()+'-'+tempMonth+'-'+tempDay;
}


function waitCursor() {
    $('*').css('cursor', 'progress');
    $(".ajaxError").html("");
}

/*
commented out because it messed up the cursor in other functions - put it individually around JSON services
$(document).ajaxComplete(function(event, request, settings) {
    $('*').css('cursor', 'default');
});
*/

// General AJAX error handler to log the exception and set a message in DIV tags with a ajaxError class
$(document).ajaxError(function(e, xhr, settings, exception) {
	console.log("ajax exception = "+exception);
	console.log("ajax exception xhr.responseText = "+xhr.responseText);
    $(".ajaxError").html("An Error has occurred (see console log)");
});

// Helper functions for setting UI components from data
function setBoolText(inBool) {
	var outBoolStr = "NO";
	if (inBool) {
		outBoolStr = "YES";
	}
	return outBoolStr;
}
function setCheckbox(checkVal){
	var checkedStr = '';
	if (checkVal == 1) {
		checkedStr = 'checked=true';
	}
	return '<input type="checkbox" '+checkedStr+' disabled="disabled">';
}
function setCheckboxEdit(checkVal,idName){
	var checkedStr = '';
	if (checkVal == 1) {
		checkedStr = 'checked=true';
	}
	return '<input id="'+idName+'" type="checkbox" '+checkedStr+'>';
}
function setInputText(idName,textVal,textSize){
	return '<input id="'+idName+'" type="text" class="form-control input-sm resetval" value="'+textVal+'" size="'+textSize+'" maxlength="'+textSize+'">';
}
function setTextArea(idName,textVal,rows){
	return '<textarea id="'+idName+'" class="form-control input-sm" rows="'+rows+'">'+textVal+'</textarea>';
}
function setInputDate(idName,textVal,textSize){
	return '<input id="'+idName+'" type="text" class="form-control input-sm Date" value="'+textVal+'" size="'+textSize+'" maxlength="'+textSize+'" placeholder="YYYY-MM-DD">';
}
function setSelectOption(optVal,displayVal,selected,bg) {
	var outOpt = '';
	if (selected) {
		outOpt = '<option class="'+bg+'" value="'+optVal+'" selected>'+displayVal+'</option>';
	} else {
		outOpt = '<option class="'+bg+'" value="'+optVal+'">'+displayVal+'</option>';
	}
	return outOpt;
}

//==========================================================================================================================
// Main document ready function
//==========================================================================================================================
$(document).ready(function(){
	// Auto-close the collapse menu after clicking a non-dropdown menu item (in the bootstrap nav header)
	$(document).on('click','.navbar-collapse.in',function(e) {
	    if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
	        $(this).collapse('hide');
	    }
	});

    // Using addClear plug-in function to add a clear button on input text fields
	$(".resetval").addClear();

    $(".Date").datetimepicker({
        timepicker:false,
        format:'Y-m-d'
    });

    // When the javascript initializes do a one time get of the logo image data (for PDF writes)
	$.get("getLogoImgData.php",function(logoImgDataResults){
		pdfLogoImgData = logoImgDataResults;
	});

	// When the page loads, get the Config values from the database table
	$.getJSON("getHoaConfigList.php","",function(hoaConfigRecList){
		$.each(hoaConfigRecList, function(index, configRec) {
			if (configRec.ConfigName == "hoaName") {
				hoaName = configRec.ConfigValue;
			} else if (configRec.ConfigName == "hoaNameShort") {
				hoaNameShort = configRec.ConfigValue;
			} else if (configRec.ConfigName == "hoaAddress1") {
				hoaAddress1 = configRec.ConfigValue;
			} else if (configRec.ConfigName == "hoaAddress2") {
				hoaAddress2 = configRec.ConfigValue;
			} else if (configRec.ConfigName == "duesStatementNotes") {
				duesStatementNotes = configRec.ConfigValue;
			} else if (configRec.ConfigName == "yearlyDuesStatementNotice") {
				yearlyDuesStatementNotice = configRec.ConfigValue;
			} else if (configRec.ConfigName == "yearlyDuesStatementNotes") {
				yearlyDuesStatementNotes = configRec.ConfigValue;
			} else if (configRec.ConfigName == "yearlyDuesHelpNotes") {
				yearlyDuesHelpNotes = configRec.ConfigValue;
			} else if (configRec.ConfigName == "countyTreasurerUrl") {
				countyTreasurerUrl = configRec.ConfigValue;
			} else if (configRec.ConfigName == "countyAuditorUrl") {
				countyAuditorUrl = configRec.ConfigValue;
			} else if (configRec.ConfigName == "OnlinePaymentInstructions") {
				onlinePaymentInstructions = configRec.ConfigValue;
			} else if (configRec.ConfigName == "OfflinePaymentInstructions") {
				offlinePaymentInstructions = configRec.ConfigValue;
			} else if (configRec.ConfigName == "SurveyInstructions") {
				surveyInstructions = configRec.ConfigValue;
			} else if (configRec.ConfigName == "SurveyQuestion1") {
				surveyQuestion1 = configRec.ConfigValue;
			} else if (configRec.ConfigName == "SurveyQuestion2") {
				surveyQuestion2 = configRec.ConfigValue;
			} else if (configRec.ConfigName == "SurveyQuestion3") {
				surveyQuestion3 = configRec.ConfigValue;
			}
		});
	});

	
	// Respond to any change in values and call service
    $("#SearchInput").change(function() {
        waitCursor();
        $("#PropertyListDisplay tbody").html("");
    	// Get the list
    	$.getJSON("getHoaPropertiesList.php","parcelId="+cleanStr($("#parcelId").val())+
											"&lotNo="+cleanStr($("#lotNo").val())+
											//"&checkNo="+cleanStr($("#checkNo").val())+
    										"&address="+cleanStr($("#address").val())+
    										"&ownerName="+cleanStr($("#ownerName").val())+
    										"&phoneNo="+cleanStr($("#phoneNo").val())+
    										"&altAddress="+cleanStr($("#altAddress").val()),function(hoaPropertyRecList){
    	    $('*').css('cursor', 'default');
    		displayPropertyList(hoaPropertyRecList);
    	});
        event.stopPropagation();
    });

    // Respond to the Search button click (because I can't figure out how to combine it with input change)
    $(document).on("click","#SearchButton",function(){
        waitCursor();
        $("#PropertyListDisplay tbody").html("");
    	// Get the list
    	$.getJSON("getHoaPropertiesList.php","parcelId="+cleanStr($("#parcelId").val())+
    										"&lotNo="+cleanStr($("#lotNo").val())+
    										//"&checkNo="+cleanStr($("#checkNo").val())+
    										"&address="+cleanStr($("#address").val())+
    										"&ownerName="+cleanStr($("#ownerName").val())+
    										"&phoneNo="+cleanStr($("#phoneNo").val())+
    										"&altAddress="+cleanStr($("#altAddress").val()),function(hoaPropertyRecList){
    	    $('*').css('cursor', 'default');
    		displayPropertyList(hoaPropertyRecList);
    	});
        event.stopPropagation();
    });

    
    // Respond to clicking on a property by reading details and display on detail tab
    $(document).on("click","#PropertyListDisplay tr td a",function(){
        waitCursor();
        $("#PropertyDetail tbody").html("");
    	$("#PropertyOwners tbody").html("");
        $("#PropertyAssessments tbody").html("");
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-parcelId"),function(hoaRec){
        	formatPropertyDetailResults(hoaRec);
    	    $('*').css('cursor', 'default');
	        $('#navbar a[href="#DetailPage"]').tab('show');
        });
    });

    // Response to Detail link clicks
	// *** 8/3/2015 fix so it only reacts to the clicks on the property one
    $(document).on("click","#PropertyDetail tr td a",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-ParcelId"),function(hoaRec){
            formatPropertyDetailEdit(hoaRec);
    	    $('*').css('cursor', 'default');
            $("#EditPage").modal();
        });
    });	

    $(document).on("click","#PropertyOwners tr td a",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-ParcelId")+"&ownerId="+$this.attr("data-OwnerId"),function(hoaRec){
    		createNew = false;
            formatOwnerDetailEdit(hoaRec,createNew);
    	    $('*').css('cursor', 'default');
            $("#EditPage2Col").modal();
        });
    });	

    $(document).on("click","#DuesStatementButton",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-ParcelId")+"&ownerId="+$this.attr("data-OwnerId"),function(hoaRec){
        	//console.log("Format Dues Statement, parcel = "+$this.attr("data-ParcelId")+", OwnerId = "+hoaRec.ownersList[0].OwnerID);
            formatDuesStatementResults(hoaRec);
    	    $('*').css('cursor', 'default');
            $("#DuesStatementPage").modal();
        });
    });	
    
	$(document).on("click","#DownloadDuesStatementPDF",function(){
	    var $this = $(this);
		pdf.save(formatDate()+"-"+$this.attr("data-pdfName")+".pdf");
	});	
    
    $(document).on("click","#NewOwnerButton",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-ParcelId")+"&ownerId="+$this.attr("data-OwnerId"),function(hoaRec){
    		createNew = true;
            formatOwnerDetailEdit(hoaRec,createNew);
    	    $('*').css('cursor', 'default');
            $("#EditPage2Col").modal();
        });
    });	
	
    $(document).on("click","#PropertyAssessments tr td a",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-ParcelId")+"&fy="+$this.attr("data-FY"),function(hoaRec){
            formatAssessmentDetailEdit(hoaRec);
    	    $('*').css('cursor', 'default');
            $("#EditPage2Col").modal();
        });
    });	
    

	// Functions for EditPage - respond to requests for update
	$(document).on("click","#SavePropertyEdit",function(){
        waitCursor();
    	
        var $this = $(this);
        var $parcelId = $this.attr("data-parcelId");
        var $memberBoolean = $("#MemberCheckbox").is(":checked");
        var $vacantBoolean = $("#VacantCheckbox").is(":checked");
        var $rentalBoolean = $("#RentalCheckbox").is(":checked");
        var $managedBoolean = $("#ManagedCheckbox").is(":checked");
        var $foreclosureBoolean = $("#ForeclosureCheckbox").is(":checked");
        var $bankruptcyBoolean = $("#BankruptcyCheckbox").is(":checked");
        var $liensBoolean = $("#LiensCheckbox").is(":checked");
        var $useEmailBoolean = $("#UseEmailCheckbox").is(":checked");

        //$.getJSON("updHoaDbData.php","parcelId="+$this.attr("data-parcelId"),function(hoaRec){
        $.get("updHoaProperty.php","parcelId="+$parcelId+
        						 "&memberBoolean="+$memberBoolean+
        						 "&vacantBoolean="+$vacantBoolean+
        						 "&rentalBoolean="+$rentalBoolean+
        						 "&managedBoolean="+$managedBoolean+
        						 "&foreclosureBoolean="+$foreclosureBoolean+
        						 "&bankruptcyBoolean="+$bankruptcyBoolean+
        						 "&liensBoolean="+$liensBoolean+
        						 "&useEmailBoolean="+$useEmailBoolean+
        						 "&propertyComments="+cleanStr($("#PropertyComments").val()),function(results){
        	
        	// Re-read the updated data for the Detail page display
            $.getJSON("getHoaDbData.php","parcelId="+$parcelId,function(hoaRec){
                formatPropertyDetailResults(hoaRec);
   	    	    $('*').css('cursor', 'default');
                $("#EditPage").modal("hide");
   	         	$('#navbar a[href="#DetailPage"]').tab('show');
            });
        }); // End of $.get("updHoaDbData.php","parcelId="+$parcelId+
    });	// End of $(document).on("click","#SavePropertyEdit",function(){

    $(document).on("click","#SaveOwnerEdit",function(){
        waitCursor();
        var $this = $(this);
        var $parcelId = $this.attr("data-parcelId");
        var $ownerId = $this.attr("data-OwnerId");

        //var $currentOwnerBoolean = $("#CurrentOwnerCheckbox").is(":checked");
        var $alternateMailingBoolean = $("#AlternateMailingCheckbox").is(":checked");

        /*
        var tempEmailAddr = cleanStr($("#EmailAddr").val());
        if (tempEmailAddr.length > 0 && !validEmailAddr.test(tempEmailAddr)) {
            console.log('email address is NOT VALID');
			$('*').css('cursor', 'default');
            $(".editValidationError").text("Email Address is NOT VALID");
        } else {
        } // End of empty or valid email address
        */
        
        	//console.log('email address is empty or valid');
            $.get("updHoaOwner.php","parcelId="+$parcelId+
					 "&ownerId="+$ownerId+
					 //"&currentOwnerBoolean="+$currentOwnerBoolean+
					 "&ownerName1="+cleanStr($("#OwnerName1").val())+
					 "&ownerName2="+cleanStr($("#OwnerName2").val())+
					 "&datePurchased="+cleanStr($("#DatePurchased").val())+
					 "&mailingName="+cleanStr($("#MailingName").val())+
					 "&alternateMailingBoolean="+$alternateMailingBoolean+
					 "&addrLine1="+cleanStr($("#AddrLine1").val())+
					 "&addrLine2="+cleanStr($("#AddrLine2").val())+
					 "&altCity="+cleanStr($("#AltCity").val())+
					 "&altState="+cleanStr($("#AltState").val())+
					 "&altZip="+cleanStr($("#AltZip").val())+
					 "&ownerPhone="+cleanStr($("#OwnerPhone").val())+
					 "&emailAddr="+cleanStr($("#EmailAddr").val())+
					 "&ownerComments="+cleanStr($("#OwnerComments").val()),function(results){

	            // Re-read the updated data for the Detail page display
				$.getJSON("getHoaDbData.php","parcelId="+$parcelId,function(hoaRec){
					formatPropertyDetailResults(hoaRec);
					$('*').css('cursor', 'default');
					$("#EditPage2Col").modal("hide");
				   	$('#navbar a[href="#DetailPage"]').tab('show');
				});
            }); // End of $.get("updHoaDbData.php","parcelId="+$parcelId+
            

    });	// End of $(document).on("click","#SaveOwnerEdit",function(){

    $(document).on("click","#SaveAssessmentEdit",function(){
        waitCursor();
        var $this = $(this);
        var $parcelId = $this.attr("data-parcelId");
        //var $ownerId = $this.attr("data-OwnerId");
        var $fy = $this.attr("data-FY");
        var $paidBoolean = $("#PaidCheckbox").is(":checked");
        var $nonCollectibleBoolean = $("#NonCollectibleCheckbox").is(":checked");
        var $lienBoolean = $("#LienCheckbox").is(":checked");
        var $stopInterestCalcBoolean = $("#StopInterestCalcCheckbox").is(":checked");

        $.get("updHoaAssessment.php","parcelId="+$parcelId+
				 					 "&fy="+$fy+
				 					 "&ownerId="+cleanStr($("#OwnerID").val())+
				 					 "&duesAmount="+cleanStr($("#DuesAmount").val())+
				 					 "&dateDue="+cleanStr($("#DateDue").val())+
				 					 "&paidBoolean="+$paidBoolean+
				 					 "&nonCollectibleBoolean="+$nonCollectibleBoolean+
				 					 "&datePaid="+cleanStr($("#DatePaid").val())+
				 					 "&paymentMethod="+cleanStr($("#PaymentMethod").val())+
				 					 "&assessmentsComments="+cleanStr($("#AssessmentsComments").val())+
				 					 "&lienBoolean="+$lienBoolean+
				 					 "&lienRefNo="+cleanStr($("#LienRefNo").val())+
				 					 "&dateFiled="+cleanStr($("#DateFiled").val())+
				 					 "&disposition="+cleanStr($("#Disposition").val())+
				 					 "&filingFee="+cleanStr($("#FilingFee").val())+
				 					 "&releaseFee="+cleanStr($("#ReleaseFee").val())+
				 					 "&dateReleased="+cleanStr($("#DateReleased").val())+
				 					 "&lienDatePaid="+cleanStr($("#LienDatePaid").val())+
				 					 "&amountPaid="+cleanStr($("#AmountPaid").val())+
				 					 "&stopInterestCalcBoolean="+$stopInterestCalcBoolean+
				 					 "&filingFeeInterest="+cleanStr($("#FilingFeeInterest").val())+
				 					 "&assessmentInterest="+cleanStr($("#AssessmentInterest").val())+
				 					 "&lienComment="+cleanStr($("#LienComment").val()),function(results){

        	// Re-read the updated data for the Detail page display
            $.getJSON("getHoaDbData.php","parcelId="+$parcelId,function(hoaRec){
                formatPropertyDetailResults(hoaRec);
   	    	    $('*').css('cursor', 'default');
                $("#EditPage2Col").modal("hide");
   	         	$('#navbar a[href="#DetailPage"]').tab('show');
            });
        }); // End of $.get("updHoaDbData.php","parcelId="+$parcelId+

    });	// End of $(document).on("click","#SaveAssessmentEdit",function(){


    // Report requests
	$(document).on("click",".reportRequest",function(){
        waitCursor();
    	var $this = $(this);
    	var reportName = $this.attr('id');
            
        $("#ReportHeader").html("");
		$("#ReportListDisplay tbody").html("");
		$("#ReportRecCnt").html("");
		$("#ReportDownloadLinks").html("");
		
    	$.getJSON("getHoaReportData.php","reportName="+reportName,function(reportList){
    	    formatReportList(reportName,$this.attr('data-reportTitle'),reportList);
    	    $('*').css('cursor', 'default');
    	});
        event.stopPropagation();
    });

	$(document).on("click","#DownloadReportCSV",function(){
	    var $this = $(this);
		var blob = new Blob([csvContent],{type: 'text/csv;charset=utf-8;'});
		var pom = document.createElement('a');
		var url = URL.createObjectURL(blob);
		pom.href = url;
		pom.setAttribute('download', $this.attr("data-reportName")+".csv");
		pom.click();
	});	

	$(document).on("click","#DownloadReportPDF",function(){
	    var $this = $(this);
		pdf.save($this.attr("data-reportName")+".pdf");
	});	

	$(document).on("click",".SalesNewOwnerProcess",function(){
	    waitCursor();
	    var $this = $(this);
	    $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-ParcelId")+"&saleDate="+$this.attr("data-SaleDate"),function(hoaRec){
	    	formatOwnerDetailEdit(hoaRec,true);
	    	$('*').css('cursor', 'default');
	    	$("#EditPage2Col").modal();
	    });
	});

	$(document).on("click",".SalesNewOwnerIgnore",function(){
	    waitCursor();
	    var $this = $(this);
	    var $parcelId = $this.attr("data-ParcelId");
	    var $saleDate = $this.attr("data-SaleDate");

	    $.get("updHoaSales.php","PARID="+$parcelId+"&SALEDT="+$saleDate,function(results){
	    	// Re-read the update data and re-display sales new owner list
	    	
	    	//var reportName = "SalesNewOwnerReport";
	    	var reportName = $this.attr('id');
	    	var reportTitle = $this.attr("data-reportTitle");
	    	
	    	/*
	        var onscreenDisplay = $('#onscreenDisplay').is(':checked');
	        var csvDownload = $('#csvDownload').is(':checked');
	        var pdfDownload = $('#pdfDownload').is(':checked');
	        var reportYear = $('#ReportYear').val();
			*/
			$("#ReportListDisplay tbody").html("");
			$("#ReportRecCnt").html("");
			$("#ReportDownloadLinks").html("");
			
			/*
	    	$.getJSON("getHoaReportData.php","reportName="+reportName+
					"&reportYear="+reportYear,function(reportList){
			*/
	    	$.getJSON("getHoaReportData.php","reportName="+reportName,function(reportList){
	    	    //formatReportList(reportName,reportList,onscreenDisplay,csvDownload,pdfDownload);
	    	    formatReportList(reportName,reportTitle,reportList);
	    	    $('*').css('cursor', 'default');
	    	});
	    });
        event.stopPropagation();
	});
	

	$(document).on("click",".AdminButton",function(){
        waitCursor();
	    var $this = $(this);

        // Validate add assessments (check access permissions, timing, year, and amount)
        // get confirmation message back
        var FY = cleanStr($("#FiscalYear").val());
        var duesAmt = cleanStr($("#DuesAmt").val());
        
    	$.getJSON("adminValidate.php","action="+$this.attr('id')+
    										"&FY="+FY+
    										"&duesAmt="+duesAmt,function(adminRec){
    	    $("#ConfirmationMessage").html(adminRec.message);
    	    
    	    var confirmationButton = $("#ConfirmationButton");
    	    confirmationButton.empty();
    	    var buttonForm = $('<form>').prop('class',"form-inline").attr('role',"form");
    	    // If the action was Valid, append an action button
    	    if (adminRec.result == "Valid") {
        	    buttonForm.append($('<button>').prop('id',"AdminExecute").prop('class',"btn btn-danger").attr('type',"button").attr('data-dismiss',"modal").html('Continue')
	    								.attr('data-action',$this.attr('id')).attr('data-FY',FY).attr('data-duesAmt',duesAmt));
    	    }
    	    buttonForm.append($('<button>').prop('class',"btn btn-default").attr('type',"button").attr('data-dismiss',"modal").html('Close'));
    	    confirmationButton.append(buttonForm);
    	    
    	    $('*').css('cursor', 'default');
            $("#ConfirmationModal").modal();
    	});
        event.stopPropagation();
    });

    // Respond to the Continue click for an Admin Execute function 
    $(document).on("click","#AdminExecute",function(){
        waitCursor();
        var $this = $(this);
  	  	var action = $this.attr("data-action");
  	  	
    	$.getJSON("adminExecute.php","action="+action+
				"&FY="+$this.attr("data-FY")+
				"&duesAmt="+$this.attr("data-duesAmt"),function(adminRec){
    		$('*').css('cursor', 'default');
		
    		if (action == 'DuesStatements') {
    			var currSysDate = new Date();
    			pdfTitle = "Member Dues Statement";
    			pdfTimestamp = currSysDate.toString().substr(0,24);
    			
        		// Reset the loop counter
        		adminRecCnt = 0;
				// Start asynchronous recursive loop to process the list and create Yearly Dues Statment PDF's
				setTimeout(adminLoop, 5, adminRec.hoaPropertyRecList);

    		} // End of if ($action == 'DuesStatements')
    		else {
    			//  If not doing an asynchronous recursive loop, just use the message from the adminExecute
        		$("#ResultMessage").html(adminRec.message);
    		}
		
		}); // $.getJSON("adminExecute.php","action="+action+

    	event.stopPropagation();
        
    }); // $(document).on("click","#AdminExecute",function(){

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

    $(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
    	var activatedTab = e.target;
		//console.log("tab = "+activatedTab);
		//http://127.0.0.1:8080/hoadb/#ConfigPage
       	var configPage = activatedTab.toString().indexOf("ConfigPage");
       	if (configPage) {
            waitCursor();
        	// Get the list
            $.getJSON("getHoaConfigList.php",function(hoaConfigRecList){
        	    $('*').css('cursor', 'default');
        		displayConfigList(hoaConfigRecList);
        	});
            event.stopPropagation();
       	}
    })

    $(document).on("click",".NewConfig",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaConfigList.php","ConfigName="+$this.attr("data-ConfigName"),function(hoaConfigRecList){
            formatConfigEdit(hoaConfigRecList[0]);
    	    $('*').css('cursor', 'default');
            $("#EditPage").modal();
        });
    });	

    $(document).on("click",".SaveConfigEdit",function(){
        waitCursor();
        var $this = $(this);
        
        $.get("updHoaConfig.php","ConfigName="+cleanStr($("#ConfigName").val())+
        						 "&ConfigDesc="+cleanStr($("#ConfigDesc").val())+
        						 "&ConfigValue="+cleanStr($("#ConfigValue").val())+
			 					 "&ConfigAction="+$this.attr("data-ConfigAction"),function(results){

            $.getJSON("getHoaConfigList.php",function(hoaConfigRecList){
        	    $('*').css('cursor', 'default');
        		displayConfigList(hoaConfigRecList);
                $("#EditPage").modal("hide");
   	         	$('#navbar a[href="#ConfigPage"]').tab('show');
        	});

        }); // End of 
        event.stopPropagation();
    });	// End of $(document).on("click","#SaveConfigEdit",function(){
    
    
}); // $(document).ready(function(){


function displayConfigList(hoaConfigRecList) {
	//var tr = '<tr><td>No records found - try different search parameters</td></tr>';
	var tr = '';
	$.each(hoaConfigRecList, function(index, hoaConfigRec) {
		if (index == 0) {
    		tr = '';
    	    tr +=    '<tr>';
        	tr +=      '<th>Name</th>';
        	tr +=      '<th>Description</th>';
        	tr +=      '<th>Value</th>';
    	    tr +=    '</tr>';
		}
	    tr +=  '<tr>';
	    tr +=    '<td><a data-ConfigName="'+hoaConfigRec.ConfigName+'" class="NewConfig" href="#">'+hoaConfigRec.ConfigName+'</a></td>';
	    tr +=    '<td>'+hoaConfigRec.ConfigDesc+'</td>';
	    tr +=    '<td>'+hoaConfigRec.ConfigValue.substring(0,80)+'</td>';
	    tr +=  '</tr>';
	});

    $("#ConfigListDisplay tbody").html(tr);
}

function formatConfigEdit(hoaConfigRec){
    var tr = '';
    var tr2 = '';
    var checkedStr = '';
    var buttonStr = '';
    $(".editValidationError").empty();

    $("#EditPageHeader").text("Edit Configuration");

    //console.log("hoaConfigRec.ConfigName = "+hoaConfigRec.ConfigName);
    
	tr = '';
	tr += '<div class="form-group">';
    tr += '<tr><th>Name:</th><td>'+ setInputText("ConfigName",hoaConfigRec.ConfigName,"80")+'</td></tr>';
    tr += '<tr><th>Description:</th><td>'+ setInputText("ConfigDesc",hoaConfigRec.ConfigDesc,"100")+'</td></tr>';
    tr += '<tr><th>Value:</th><td>'+ setTextArea("ConfigValue",hoaConfigRec.ConfigValue,"15")+'</td></tr>';
	tr += '</div>';
	
	$("#EditTable tbody").html(tr);
	//$("#EditTable2 tbody").html(tr2);

	tr = '<form class="form-inline" role="form">';
	tr += '<a data-ConfigAction="Edit" href="#" class="btn btn-primary SaveConfigEdit" role="button">Save</a>';
	tr += '<a data-ConfigAction="Delete" href="#" class="btn btn-primary SaveConfigEdit" role="button">Delete</a>';
	tr += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button></form>';
	$("#EditPageButton").html(tr);

} // End of function formatConfigEdit(hoaConfigRec){

function displayPropertyList(hoaPropertyRecList) {
	var tr = '<tr><td>No records found - try different search parameters</td></tr>';
	$.each(hoaPropertyRecList, function(index, hoaPropertyRec) {
		if (index == 0) {
    		tr = '';
    	    tr +=    '<tr>';
        	tr +=      '<th>Row</th>';
        	tr +=      '<th>Parcel Id</th>';
	    	tr +=  	   '<th class="hidden-xs hidden-sm">Lot No</th>';
        	tr +=      '<th>Location</th>';
        	tr +=      '<th class="hidden-xs">Owner Name</th>';
            tr +=      '<th class="visible-lg">Owner Phone</th>';
    	    tr +=    '</tr>';
		}
	    tr +=  '<tr>';
	    tr +=    '<td>'+(index+1)+'</td>';
	    tr +=    '<td><a data-parcelId="'+hoaPropertyRec.parcelId+'" href="#">'+hoaPropertyRec.parcelId+'</a></td>';
	    tr +=    '<td class="hidden-xs hidden-sm">'+hoaPropertyRec.lotNo+'</td>';
	    tr +=    '<td>'+hoaPropertyRec.parcelLocation+'</td>';
		tr +=    '<td class="hidden-xs">'+hoaPropertyRec.ownerName+'</td>';
	    tr +=    '<td class="visible-lg">'+hoaPropertyRec.ownerPhone+'</td>';
	    tr +=  '</tr>';
	});

    $("#PropertyListDisplay tbody").html(tr);
} // function displayPropertyList(hoaPropertyRecList) {

function formatPropertyDetailResults(hoaRec){
    var tr = '';
    var checkedStr = '';

    // Get the admin level to see if user is allowed to edit data
	if (hoaRec.adminLevel > 1) {
	    tr += '<tr><th>Parcel Id:</th><td><a data-ParcelId="'+hoaRec.Parcel_ID+'" href="#">'+hoaRec.Parcel_ID+'</a></td></tr>';
	} else {
	    tr += '<tr><th>Parcel Id:</th><td>'+hoaRec.Parcel_ID+'</a></td></tr>';
	}
    tr += '<tr><th>Lot No:</th><td>'+hoaRec.LotNo+'</td></tr>';
    //tr += '<tr><th class="hidden-xs hidden-sm">Sub Division: </th><td class="hidden-xs hidden-sm">'+hoaRec.SubDivParcel+'</td></tr>';
    tr += '<tr><th>Location: </th><td>'+hoaRec.Parcel_Location+'</td></tr>';
    tr += '<tr><th class="hidden-xs hidden-sm">Street No: </th><td class="hidden-xs hidden-sm">'+hoaRec.Property_Street_No+'</td></tr>';
    tr += '<tr><th class="hidden-xs hidden-sm">Street Name: </th><td class="hidden-xs hidden-sm">'+hoaRec.Property_Street_Name+'</td></tr>';
    tr += '<tr><th class="hidden-xs">City: </th><td class="hidden-xs">'+hoaRec.Property_City+'</td></tr>';
    tr += '<tr><th class="hidden-xs">State: </th><td class="hidden-xs">'+hoaRec.Property_State+'</td></tr>';
    tr += '<tr><th class="hidden-xs">Zip Code: </th><td class="hidden-xs">'+hoaRec.Property_Zip+'</td></tr>';
    //tr += '<tr><th>Total Due: </th><td>$'+hoaRec.TotalDue+'</td></tr>';
    var tempTotalDue = '' + hoaRec.TotalDue;
    tr += '<tr><th>Total Due: </th><td>$'+stringToMoney(tempTotalDue)+'</td></tr>';
    
    tr += '<tr><th class="hidden-xs hidden-sm">Member: </th><td class="hidden-xs hidden-sm">'+setCheckbox(hoaRec.Member)+'</td></tr>';
    tr += '<tr><th>Vacant: </th><td>'+setCheckbox(hoaRec.Vacant)+'</td></tr>';
    tr += '<tr><th>Rental: </th><td>'+setCheckbox(hoaRec.Rental)+'</td></tr>';
    tr += '<tr><th>Managed: </th><td>'+setCheckbox(hoaRec.Managed)+'</td></tr>';
    tr += '<tr><th>Foreclosure: </th><td>'+setCheckbox(hoaRec.Foreclosure)+'</td></tr>';
    tr += '<tr><th>Bankruptcy: </th><td>'+setCheckbox(hoaRec.Bankruptcy)+'</td></tr>';
    tr += '<tr><th>ToBe Released: </th><td>'+setCheckbox(hoaRec.Liens_2B_Released)+'</td></tr>';
    tr += '<tr><th>Use Email: </th><td>'+setCheckbox(hoaRec.UseEmail)+'</td></tr>';
    tr += '<tr><th>Comments: </th><td>'+hoaRec.Comments+'</td></tr>';
    
    $("#PropertyDetail tbody").html(tr);
    
    var own1 = '';
    var currOwnerID = '';
    tr = '';
	$.each(hoaRec.ownersList, function(index, rec) {
		if (index == 0) {
    	    tr = tr +   '<tr>';
        	tr = tr +     '<th>OwnId</th>';
        	tr = tr +     '<th>Owner</th>';
        	tr = tr +     '<th>Phone</th>';
        	tr = tr +     '<th class="hidden-xs">Date Purchased</th>';
        	tr = tr +     '<th class="hidden-xs">Alt Address</th>';
        	tr = tr +     '<th class="hidden-xs">Comments</th>';
    	    tr = tr +   '</tr>';
    	    //ownName1 = rec.Owner_Name1;
    	    //currOwnerID = rec.OwnerID;
		}
	    tr = tr + '<tr>';
	    //tr = tr +   '<td data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+rec.OwnerID+'"><a href="#EditPage">'+rec.OwnerID+'</a></td>';
	    tr = tr +   '<td>'+rec.OwnerID+'</td>';

	    if (rec.CurrentOwner) {
    	    ownName1 = rec.Owner_Name1;
    	    currOwnerID = rec.OwnerID;
	    }
	    
    	if (hoaRec.adminLevel > 1) {
    	    tr = tr +   '<td><a data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+rec.OwnerID+'" href="#">'+rec.Owner_Name1+' '+rec.Owner_Name2+'</a></td>';
    	} else {
    	    tr = tr +   '<td>'+rec.Owner_Name1+' '+rec.Owner_Name2+'</a></td>';
    	}
	    tr = tr +   '<td>'+rec.Owner_Phone+'</td>';
		tr = tr +   '<td class="hidden-xs">'+rec.DatePurchased.substring(0,10)+'</td>';
		tr = tr +   '<td class="hidden-xs">'+rec.Alt_Address_Line1+'</td>';
		tr = tr +   '<td class="hidden-xs">'+rec.Comments+'</td>';
	    tr = tr + '</tr>';
	});
	$("#PropertyOwners tbody").html(tr);

	var TaxYear = '';
	var LienButton = '';
	var ButtonType = '';
    tr = '';
	$.each(hoaRec.assessmentsList, function(index, rec) {
		LienButton = '';
		ButtonType = '';
		
		if (index == 0) {
    	    tr = tr +   '<tr>';
        	tr = tr +     '<th>OwnId</th>';
        	tr = tr +     '<th>FY</th>';
        	tr = tr +     '<th>Dues Amt</th>';
        	tr = tr +     '<th>Lien</th>';
        	tr = tr +     '<th>Paid</th>';
        	tr = tr +     '<th>Non-Collectible</th>';
        	tr = tr +     '<th class="hidden-xs">Date Paid</th>';
        	tr = tr +     '<th class="hidden-xs hidden-sm">Date Due</th>';
        	tr = tr +     '<th class="hidden-xs">Payment</th>';
        	tr = tr +     '<th class="hidden-xs">Comments</th>';
    	    tr = tr +   '</tr>';
    	    TaxYear = rec.DateDue.substring(0,4);
		}
		
	    tr = tr + '<tr>';
	    tr = tr +   '<td>'+rec.OwnerID+'</td>';
    	if (hoaRec.adminLevel > 1) {
    	    tr = tr +   '<td><a data-ParcelId="'+hoaRec.Parcel_ID+'" data-FY="'+rec.FY+'" href="#">'+rec.FY+'</a></td>';
    	} else {
    	    tr = tr +   '<td>'+rec.FY+'</a></td>';
    	}

    	// Check to add the Lien button
    	if (rec.Lien) {
    		if (rec.Disposition == 'Open') {
        		ButtonType = 'btn-danger';
    		} else if (rec.Disposition == 'Paid') {
        		ButtonType = 'btn-success';
    		} else {
        		ButtonType = 'btn-default';
    		}
    	    LienButton = '<a data-ParcelId="'+hoaRec.Parcel_ID+'" data-FY="'+rec.FY+'" href="#" class="btn '+ButtonType+' btn-xs" role="button">Lien</a>';
    	} else {
    		// If NOT PAID and past the due date, add a Create Lien button to go to edit
        	if (!rec.Paid && rec.DuesDue && !rec.NonCollectible) {
        	    LienButton = '<a data-ParcelId="'+hoaRec.Parcel_ID+'" data-FY="'+rec.FY+'" href="#" class="btn btn-warning btn-xs" role="button">Create Lien</a>';
        	}
    	}
		//tr = tr +   '<td>'+rec.DuesAmt+' '+LienButton+'</td>';
    	
        var tempDuesAmt = '' + rec.DuesAmt;
		tr = tr +   '<td>'+stringToMoney(tempDuesAmt)+'</td>';
		tr = tr +   '<td>'+LienButton+'</td>';

	    tr = tr +   '<td>'+setCheckbox(rec.Paid)+'</td>';
	    tr = tr +   '<td>'+setCheckbox(rec.NonCollectible)+'</td>';
	    tr = tr +   '<td class="hidden-xs">'+rec.DatePaid.substring(0,10)+'</td>';
		tr = tr +   '<td class="hidden-xs hidden-sm">'+rec.DateDue.substring(0,10)+'</td>';
	    tr = tr +   '<td class="hidden-xs">'+rec.PaymentMethod+'</td>';
	    tr = tr +   '<td class="hidden-xs">'+rec.Comments+' '+rec.LienComment+'</td>';
	    tr = tr + '</tr>';
	});
    $("#PropertyAssessments tbody").html(tr);
    
    // Set the buttons from configuration values and current parcel id
    var mcTreasURI = countyTreasurerUrl + '?parid='+hoaRec.Parcel_ID+'&taxyr='+TaxYear+'&own1='+ownName1;
    $("#MCTreasLink").html('<a href="'+encodeURI(mcTreasURI)+'" class="btn btn-primary" role="button" target="_blank">County<br>Treasurer</a>');    

    var mcAuditorURI = countyAuditorUrl + '?mode=PARID';
    $("#MCAuditorLink").html('<a href="'+encodeURI(mcAuditorURI)+'" class="btn btn-primary" role="button" target="_blank">County<br>Property</a>');    

    $("#DuesStatement").html('<a id="DuesStatementButton" data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+currOwnerID+'" href="#" class="btn btn-success" role="button">Dues Statement</a>');

    if (hoaRec.adminLevel > 1) {
	    $("#NewOwner").html('<a id="NewOwnerButton" data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+currOwnerID+'" href="#" class="btn btn-warning" role="button">New Owner</a>');
	    //$("#AddAssessment").html('<a id="AddAssessmentButton" href="#" class="btn btn-default" role="button">Add Assessment</a>');
	}

} // End of function formatDetailResults(hoaRec){

function formatPropertyDetailEdit(hoaRec){
    var tr = '';
    var checkedStr = '';
    $(".editValidationError").empty();

    // action or type of update
    $("#EditPageHeader").text("Edit Property");
    
	tr += '<div class="form-group">';
    tr += '<tr><th>Parcel Id:</th><td>'+hoaRec.Parcel_ID+'</td></tr>';
    tr += '<tr><th>Lot No:</th><td>'+hoaRec.LotNo+'</td></tr>';
    tr += '<tr><th>Sub Division: </th><td>'+hoaRec.SubDivParcel+'</td></tr>';
    tr += '<tr><th>Location: </th><td>'+hoaRec.Parcel_Location+'</td></tr>';
    tr += '<tr><th>Street No: </th><td>'+hoaRec.Property_Street_No+'</td></tr>';
    tr += '<tr><th>Street Name: </th><td>'+hoaRec.Property_Street_Name+'</td></tr>';
    tr += '<tr><th>City: </th><td>'+hoaRec.Property_City+'</td></tr>';
    tr += '<tr><th>State: </th><td>'+hoaRec.Property_State+'</td></tr>';
    tr += '<tr><th>Zip Code: </th><td>'+hoaRec.Property_Zip+'</td></tr>';
    //tr += '<tr><th>Member: </th><td>'+setCheckboxEdit(hoaRec.Member,'MemberCheckbox')+'</td></tr>';
    tr += '<tr><th>Member: </th><td>'+setCheckbox(hoaRec.Member,'MemberCheckbox')+'</td></tr>';
    tr += '<tr><th>Vacant: </th><td>'+setCheckboxEdit(hoaRec.Vacant,'VacantCheckbox')+'</td></tr>';
    tr += '<tr><th>Rental: </th><td>'+setCheckboxEdit(hoaRec.Rental,'RentalCheckbox')+'</td></tr>';
    tr += '<tr><th>Managed: </th><td>'+setCheckboxEdit(hoaRec.Managed,'ManagedCheckbox')+'</td></tr>';
    tr += '<tr><th>Foreclosure: </th><td>'+setCheckboxEdit(hoaRec.Foreclosure,'ForeclosureCheckbox')+'</td></tr>';
    tr += '<tr><th>Bankruptcy: </th><td>'+setCheckboxEdit(hoaRec.Bankruptcy,'BankruptcyCheckbox')+'</td></tr>';
    tr += '<tr><th>ToBe Released: </th><td>'+setCheckboxEdit(hoaRec.Liens_2B_Released,'LiensCheckbox')+'</td></tr>';
    tr += '<tr><th>Use Email: </th><td>'+setCheckboxEdit(hoaRec.UseEmail,'UseEmailCheckbox')+'</td></tr>';
    tr += '<tr><th>Comments: </th><td >'+setInputText("PropertyComments",hoaRec.Comments,"90")+'</td></tr>';
	tr += '</div>'
	$("#EditTable tbody").html(tr);
	//$("#EditTable2 tbody").html('');

	tr = '<form class="form-inline" role="form">'+
		 '<a id="SavePropertyEdit" data-ParcelId="'+hoaRec.Parcel_ID+'" href="#" class="btn btn-primary" role="button">Save</a>'+
		          		'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'+
		          		'</form>';
    $("#EditPageButton").html(tr);

} // End of function formatPropertyDetailEdit(hoaRec){

function formatOwnerDetailEdit(hoaRec,createNew){
    var tr = '';
    var tr2 = '';
    var checkedStr = '';
    var buttonStr = '';
    var ownerId = '';
    $(".editValidationError").empty();

    // action or type of update
	if (createNew) {
	    $("#EditPage2ColHeader").text("New Owner");
	} else {
	    $("#EditPage2ColHeader").text("Edit Owner");
	}

	rec = hoaRec.ownersList[0];
	salesRec = null;
	if (hoaRec.salesList[0] != null) {
		salesRec = hoaRec.salesList[0];
	}

	ownerId = rec.OwnerID;
	tr = '';
	tr += '<div class="form-group">';
	if (createNew) {
	    tr += '<tr><th>Owner Id:</th><td>CREATE NEW OWNER</td></tr>';
	} else {
	    tr += '<tr><th>Owner Id:</th><td>'+rec.OwnerID+'</td></tr>';
	}
    tr += '<tr><th>Location:</th><td>'+hoaRec.Parcel_Location+'</td></tr>';

    tr += '<tr><th>Current Owner: </th><td>'+setCheckbox(rec.CurrentOwner,'CurrentOwnerCheckbox')+'</td></tr>';
    tr += '<tr><th>Owner Name1:</th><td>'+ setInputText("OwnerName1",rec.Owner_Name1,"50")+'</td></tr>';
    tr += '<tr><th>Owner Name2:</th><td>'+ setInputText("OwnerName2",rec.Owner_Name2,"50")+'</td></tr>';
    tr += '<tr><th>Date Purchased:</th><td>'+ setInputDate("DatePurchased",rec.DatePurchased,"10")+'</td></tr>';
    tr += '<tr><th>Mailing Name:</th><td>'+ setInputText("MailingName",rec.Mailing_Name,"50")+'</td></tr>';
    tr += '<tr><th>Alternate Mailing: </th><td>'+setCheckboxEdit(rec.AlternateMailing,'AlternateMailingCheckbox')+'</td></tr>';
    tr += '<tr><th>Address Line1:</th><td>'+ setInputText("AddrLine1",rec.Alt_Address_Line1,"50")+'</td></tr>';
    tr += '<tr><th>Address Line2:</th><td>'+ setInputText("AddrLine2",rec.Alt_Address_Line2,"50")+'</td></tr>';
    tr += '<tr><th>City:</th><td>'+ setInputText("AltCity",rec.Alt_City,"40")+'</td></tr>';
    tr += '<tr><th>State:</th><td>'+ setInputText("AltState",rec.Alt_State,"20")+'</td></tr>';
    tr += '<tr><th>Zip:</th><td>'+ setInputText("AltZip",rec.Alt_Zip,"20")+'</td></tr>';
    tr += '<tr><th>Owner Phone:</th><td>'+ setInputText("OwnerPhone",rec.Owner_Phone,"30")+'</td></tr>';
    tr += '<tr><th>Email Addr: </th><td>'+setInputText("EmailAddr",rec.EmailAddr,"90")+'</td></tr>';
    tr += '<tr><th>Comments: </th><td>'+setInputText("OwnerComments",rec.Comments,"90")+'</td></tr>';
    tr += '<tr><th>Last Changed:</th><td>'+rec.LastChangedTs+'</td></tr>';
    tr += '<tr><th>Changed by:</th><td>'+rec.LastChangedBy+'</td></tr>';
	tr += '</div>';
    
	$("#EditTable2Col tbody").html(tr);
	
    if (salesRec != null) {
    	tr2 += '<div class="form-group">';
        tr2 += '<tr><td><h3>Sales Information</h3></td></tr>';
        tr2 += '<tr><th>Sales Owner Name: </th><td>'+salesRec.OWNERNAME1+'</td></tr>';
        tr2 += '<tr><th>Sale Date: </th><td>'+salesRec.SALEDT+'</td></tr>';
        tr2 += '<tr><th>Sales Mailing Name1: </th><td>'+salesRec.MAILINGNAME1+'</td></tr>';
        tr2 += '<tr><th>Sales Mailing Name2: </th><td>'+salesRec.MAILINGNAME2+'</td></tr>';
        tr2 += '<tr><th>Sales Address1: </th><td>'+salesRec.PADDR1+'</td></tr>';
        tr2 += '<tr><th>Sales Address2: </th><td>'+salesRec.PADDR2+'</td></tr>';
        tr2 += '<tr><th>Sales Address3: </th><td>'+salesRec.PADDR3+'</td></tr>';
    	tr2 += '</div>';
    }
	
	$("#EditTable2Col2 tbody").html(tr2);

	tr = '<form class="form-inline" role="form">';
	if (createNew) {
//	    tr += '<tr><th></th><td>'+
		tr += '<a id="SaveOwnerEdit" data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="NEW" href="#" class="btn btn-primary" role="button">Create New</a>';
//	  	  '</td></tr>';
	} else {
//	    tr += '<tr><th></th><td>'+
		tr += '<a id="SaveOwnerEdit" data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+ownerId+'" href="#" class="btn btn-primary" role="button">Save</a>';
//	  	  '</td></tr>';
	}
	tr += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button></form>';
	$("#EditPage2ColButton").html(tr);

    $(".Date").datetimepicker({
        timepicker:false,
        format:'Y-m-d'
    });

} // End of function formatOwnerDetailEdit(hoaRec){

function formatAssessmentDetailEdit(hoaRec){
    var tr = '';
    var checkedStr = '';
    var buttonStr = '';
    //var ownerId = '';
    var fy = '';
    $(".editValidationError").empty();

    // action or type of update
    $("#EditPage2ColHeader").text("Edit Assessment");

    //console.log("hoaRec.ownersList.length = "+hoaRec.ownersList.length);
    rec = hoaRec.assessmentsList[0];
	
	fy = rec.FY;
	tr = '';
	tr += '<div class="form-group">';
    tr += '<tr><th>Fiscal Year: </th><td>'+rec.FY+'</td></tr>';
    tr += '<tr><th>Parcel Id: </th><td>'+rec.Parcel_ID+'</td></tr>';

    var ownerSelect = '<select class="form-control" id="OwnerID">'
	$.each(hoaRec.ownersList, function(index, rec) {
    	ownerSelect += setSelectOption(rec.OwnerID,rec.OwnerID+" - "+rec.Owner_Name1+" "+rec.Owner_Name2,(index == 0),"");
	});
	ownerSelect += '</select>';                    		
    tr += '<tr><th>Owner: </th><td>'+ownerSelect+'</td></tr>';
    //tr += '<tr><th>Owner Id: </th><td>'+rec.OwnerID+'</td></tr>';
    
    var tempDuesAmt = '' + rec.DuesAmt;
    tr += '<tr><th>Dues Amount: </th><td>'+setInputText("DuesAmount",stringToMoney(tempDuesAmt),"10")+'</td></tr>';
    
    tr += '<tr><th>Date Due: </th><td>'+setInputDate("DateDue",rec.DateDue,"10")+'</td></tr>';
    tr += '<tr><th>Paid: </th><td>'+setCheckboxEdit(rec.Paid,'PaidCheckbox')+'</td></tr>';
    tr += '<tr><th>Non-Collectible: </th><td>'+setCheckboxEdit(rec.NonCollectible,'NonCollectibleCheckbox')+'</td></tr>';
    tr += '<tr><th>Date Paid: </th><td>'+setInputDate("DatePaid",rec.DatePaid,"10")+'</td></tr>';
    tr += '<tr><th>Payment Method: </th><td>'+setInputText("PaymentMethod",rec.PaymentMethod,"50")+'</td></tr>';
    tr += '<tr><th>Comments: </th><td>'+setInputText("AssessmentsComments",rec.Comments,"90")+'</td></tr>';
    tr += '<tr><th>Last Changed: </th><td>'+rec.LastChangedTs+'</td></tr>';
    tr += '<tr><th>Changed by: </th><td>'+rec.LastChangedBy+'</td></tr>';
	tr += '</div>';
	$("#EditTable2Col tbody").html(tr);

	tr = '';
	tr += '<div class="form-group">';
    tr += '<tr><th>Lien: </th><td>'+setCheckboxEdit(rec.Lien,'LienCheckbox')+'</td></tr>';
    tr += '<tr><th>LienRefNo: </th><td>'+setInputText("LienRefNo",rec.LienRefNo,"15")+'</td></tr>';
    tr += '<tr><th>DateFiled: </th><td>'+setInputDate("DateFiled",rec.DateFiled,"10")+'</td></tr>';

    var selectOption = '<select class="form-control" id="Disposition">'
        					+setSelectOption("","",("" == rec.Disposition),"")
        					+setSelectOption("Open","Open",("Open" == rec.Disposition),"bg-danger")
        					+setSelectOption("Paid","Paid",("Paid" == rec.Disposition),"bg-success")
        					+setSelectOption("Released","Released",("Released" == rec.Disposition),"bg-info")
        					+setSelectOption("Closed","Closed",("Closed" == rec.Disposition),"bg-warning")
        					+'</select>';                    		
    tr += '<tr><th>Disposition: </th><td>'+selectOption+'</td></tr>';
    //tr += '<tr><th>Disposition: </th><td>'+setInputText("Disposition",rec.Disposition,"10")+'</td></tr>';
    
    tr += '<tr><th>FilingFee: </th><td>'+setInputText("FilingFee",rec.FilingFee,"10")+'</td></tr>';
    tr += '<tr><th>ReleaseFee: </th><td>'+setInputText("ReleaseFee",rec.ReleaseFee,"10")+'</td></tr>';
    tr += '<tr><th>DateReleased: </th><td>'+setInputDate("DateReleased",rec.DateReleased,"10")+'</td></tr>';
    tr += '<tr><th>LienDatePaid: </th><td>'+setInputDate("LienDatePaid",rec.LienDatePaid,"10")+'</td></tr>';
    tr += '<tr><th>AmountPaid: </th><td>'+setInputText("AmountPaid",rec.AmountPaid,"10")+'</td></tr>';
    tr += '<tr><th>StopInterestCalc: </th><td>'+setCheckboxEdit(rec.StopInterestCalc,'StopInterestCalcCheckbox')+'</td></tr>';
    tr += '<tr><th>FilingFeeInterest: </th><td>'+setInputText("FilingFeeInterest",rec.FilingFeeInterest,"10")+'</td></tr>';
    tr += '<tr><th>AssessmentInterest: </th><td>'+setInputText("AssessmentInterest",rec.AssessmentInterest,"10")+'</td></tr>';
    tr += '<tr><th>LienComment: </th><td>'+setInputText("LienComment",rec.LienComment,"90")+'</td></tr>';
	tr += '</div>';
	$("#EditTable2Col2 tbody").html(tr);

	/*
	var editTable2Col2 = $("#EditTable2 tbody");
	editTable2Col2.empty();
	editTable2Col2.append($('<div>').prop('class',"form-group")
			.append($('<tr>')
					.append($('<th>').html('Lien: ')).append($('<td>').html(setCheckboxEdit(rec.Lien,'Lien')))
					.append($('<th>').html('Lien Ref No: ')).append($('<td>').html(setInputText("LienRefNo",rec.LienRefNo,"15")))
					.append($('<th>').html('Date Filed: ')).append($('<td>').html(setInputDate("DateFiled",rec.DateFiled,"10")))
					.append($('<th>').html('Disposition: ')).append($('<td>').html(setInputText("Disposition",rec.Disposition,"10")))
					.append($('<th>').html('Filing Fee: ')).append($('<td>').html(setInputText("FilingFee",rec.FilingFee,"10")))
					.append($('<th>').html('Release Fee: ')).append($('<td>').html(setInputText("ReleaseFee",rec.ReleaseFee,"10")))
					.append($('<th>').html('Date Released: ')).append($('<td>').html(setInputDate("DateReleased",rec.DateReleased,"10")))
					.append($('<th>').html('Lien Date Paid: ')).append($('<td>').html(setInputDate("LienDatePaid",rec.LienDatePaid,"10")))
					.append($('<th>').html('Amount Paid: ')).append($('<td>').html(setInputText("AmountPaid",rec.AmountPaid,"10")))
					.append($('<th>').html('Stop Interest Calc: ')).append($('<td>').html(setCheckboxEdit(rec.StopInterestCalc,'StopInterestCalc')))
					.append($('<th>').html('Filing Fee Interest: ')).append($('<td>').html(setInputText("FilingFeeInterest",rec.FilingFeeInterest,"10")))
					.append($('<th>').html('Assessment Interest: ')).append($('<td>').html(setInputText("AssessmentInterest",rec.AssessmentInterest,"10")))
					.append($('<th>').html('Lien Comment: ')).append($('<td>').html(setInputText("LienComment",rec.LienComment,"10")))
			)
	);
	*/

	tr = '<form class="form-inline" role="form">'+
	  '<a id="SaveAssessmentEdit" data-ParcelId="'+hoaRec.Parcel_ID+'" data-FY="'+fy+'" href="#" class="btn btn-primary" role="button">Save</a>' +
	          		'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'+
	          		'</form>';
	$("#EditPage2ColButton").html(tr);

    $(".Date").datetimepicker({
        timepicker:false,
        format:'Y-m-d'
    });    
	
} // End of function formatAssessmentDetailEdit(hoaRec){


//--------------------------------------------------------------------------------------------------------------------------------
// Asynchronous recursive loop to process the list for the AdminExecute
//--------------------------------------------------------------------------------------------------------------------------------
function adminLoop(hoaPropertyRecList) {
	// getJSON to get detail data on each one and call function to add dues statement to a PDF
	$.getJSON("getHoaDbData.php","parcelId="+hoaPropertyRecList[adminRecCnt].parcelId,function(hoaRec){

		// Create the PDF for yearly dues statements
		if (adminRecCnt == 0) {
			// Add a progress bar 
	  		$("#ResultMessage").html('<div id="AdminProgress" class="progress" ></div>');
	
	  		pdf = new jsPDF('p', 'in', 'letter');
	    	pdf.setProperties({
	    	    title: pdfTitle,
	    	    subject: pdfTitle,
	    	    author: hoaName
	    	});
	    	pdfPageCnt = 0;
			pdfLineCnt = 0;
		} else {
			// If not the first record, reset the line count and add a new page
			pdfLineCnt = 0;
			pdf.addPage('letter','p');
		}
	
	  	// Call function to format the yearly dues statement for an individual property
	  	formatYearlyDuesStatement(hoaRec);
	
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
	    //if (adminRecCnt < 2) {
		if (adminRecCnt < hoaPropertyRecList.length) {
			// If loop not complete, recursively call the loop function (with a 0 delay so it starts immediately)
			setTimeout(adminLoop, 0, hoaPropertyRecList);
		} else {
			// If loop completed, display a completion message and download the PDF file
			$("#ResultMessage").html("Yearly dues statements completed, total = "+adminRecCnt);
			pdf.save(formatDate()+"-YearlyDuesStatements.pdf");
		}
	}); // $.getJSON("getHoaDbData.php","parcelId="+hoaPropertyRecList[adminRecCnt].parcelId,function(hoaRec){
	
} // function adminLoop(hoaPropertyRecList) {

// function to format a Yearly dues statement
function formatYearlyDuesStatement(hoaRec) {
	ownerRec = hoaRec.ownersList[0];
	pdfMaxLineChars = 95;

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
	var noticeYear = '' + parseInt(hoaRec.assessmentsList[0].FY) - 1;
	pdfLineColIncrArray = [4.5,1.3];
	yearlyDuesStatementAddLine(["For the Period: ",'Oct 1st, '+noticeYear+' thru Sept 30th, '+hoaRec.assessmentsList[0].FY],null,11,1.1); 
	pdfLineColIncrArray = [-4.5,-1.3];
	yearlyDuesStatementAddLine(["Notice Date: ",'September 1st, '+noticeYear]); 
	
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

	pdfLineColIncrArray = [4.5];
	yearlyDuesStatementAddLine(['']);
	yearlyDuesStatementAddLine([ownerRec.Owner_Name1+' '+ownerRec.Owner_Name2]);
	yearlyDuesStatementAddLine([hoaRec.Parcel_Location]); 
	yearlyDuesStatementAddLine([hoaRec.Property_City+', '+hoaRec.Property_State+' '+hoaRec.Property_Zip]); 
	yearlyDuesStatementAddLine([ownerRec.Owner_Phone]); 

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

	// Survey description, questions (1,2,3)
	pdfLineIncrement = 0.285;
	pdfLineColIncrArray = [-1.0];
	yearlyDuesStatementAddLine([surveyInstructions],null,11,6.28);
	pdfLineColIncrArray = [1.0];
	yearlyDuesStatementAddLine([surveyQuestion1]);
	yearlyDuesStatementAddLine([surveyQuestion2]);
	yearlyDuesStatementAddLine([surveyQuestion3]);

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
	yearlyDuesStatementAddLine(["Notice Date: ",'September 1st, '+noticeYear]); 

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
		pdf.rect(0.5, 6.4, 0.2, 0.2); 
		pdf.rect(0.5, 6.7, 0.2, 0.2); 
		pdf.rect(0.5, 7.0, 0.2, 0.2); 

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
    	    tr = tr +     '<th>Date Paid</th>';
    	    tr = tr +   '</tr>';
    	    TaxYear = rec.DateDue.substring(0,4);
    	    
    		pdfLineHeaderArray = [
    			          			'Year',
    			          			'Dues Amt',
    			          			'Date Due',
    			          			'Paid',
    			          			'Date Paid'];
    		pdfLineColIncrArray = [0.6,1.3,0.8,2.3,2.1];
		}

	    tempDuesAmt = '' + rec.DuesAmt;
	    tr = tr + '<tr>';
    	tr = tr +   '<td>'+rec.FY+'</a></td>';
	    tr = tr +   '<td>'+stringToMoney(tempDuesAmt)+'</td>';
	    tr = tr +   '<td>'+rec.DateDue.substring(0,10)+'</td>';
	    tr = tr +   '<td>'+setCheckbox(rec.Paid)+'</td>';
	    tr = tr +   '<td>'+rec.DatePaid.substring(0,10)+'</td>';
	    tr = tr + '</tr>';
	    duesStatementPDFaddLine([rec.FY,rec.DuesAmt,rec.DateDue.substring(0,10),setBoolText(rec.Paid),rec.DatePaid.substring(0,10)],pdfLineHeaderArray);
	});

	$("#DuesStatementAssessmentsTable tbody").html(tr);
	
} // End of function formatDuesStatementResults(hoaRec){

//Function to add a line to the Dues Statement PDF
function duesStatementPDFaddLine(pdfLineArray,pdfLineHeaderArray) {
	pdfLineCnt++;
	var pdfHeader = false;
	var X = 0.0;
	// X (horizontal), Y (vertical)
	
	if (pdfLineCnt == 1) {
    	pdf = new jsPDF('p', 'in', 'letter');
    	pdf.setProperties({
    	    title: 'Test JJK Doc',
    	    subject: 'This is the subject',
    	    author: 'John Kauflin',
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


//---------------------------------------------------------------------------------------------------------------
// Format reports
//---------------------------------------------------------------------------------------------------------------
function formatReportList(reportName,reportTitle,reportList){

	var currSysDate = new Date();
	var reportTitleFull = '';
	var reportYear = '';
	var reportListDisplay = $("#ReportListDisplay tbody");
	reportListDisplay.empty();
	$("#ReportRecCnt").html("");
	var reportDownloadLinks = $("#ReportDownloadLinks");
	reportDownloadLinks.empty();

	pdfPageCnt = 0;
	pdfLineCnt = 0;
	var csvLine = "";
	csvContent = "";
	paidCnt = 0;
	unpaidCnt = 0;

	var tr;
	rowId = 0;
	if (reportName == "SalesReport" || reportName == "SalesNewOwnerReport") {
		reportTitleFull = reportTitle;

		$.each(reportList, function(index, hoaSalesRec) {
			rowId = index + 1;
		    
			if (index == 0) {
				$('<tr>')
				.append($('<th>').html('Row'))
				.append($('<th>').html('Sale Date'))
				.append($('<th>').html('Parcel Location'))
				.append($('<th>').html('Old Owner Name'))
				.append($('<th>').html('New Owner Name'))
				.append($('<th>').html('Mailing Name1'))
				.append($('<th>').html('Mailing Name2'))
				.appendTo(reportListDisplay);		
			}

			tr = $('<tr>');
			tr.append($('<td>').html(index+1))
	    	if (hoaSalesRec.adminLevel > 1 && reportName == "SalesNewOwnerReport") {
    			tr.append($('<td>')
    					.append($('<a>').attr('href',"#")
										.attr('class',"SalesNewOwnerProcess")
    									.attr('data-ParcelId',hoaSalesRec.PARID)
    									.attr('data-SaleDate',hoaSalesRec.SALEDT)
    									.attr('data-Action',"Process")
    									.prop('style','margin-right:7px;')
    									.html(hoaSalesRec.SALEDT))
    					.append($('<a>').prop('id',reportName)
    									.attr('data-reportTitle',"County Reported Sales of HOA properties (for New Owner maintenance)")
    									.attr('data-ParcelId',hoaSalesRec.PARID)
    									.attr('data-SaleDate',hoaSalesRec.SALEDT)
    									.attr('data-Action',"Ignore")
    									.attr('href',"#")
    									.attr('class',"btn btn-warning btn-xs SalesNewOwnerIgnore")
    									.attr('role',"button")
    									.html("Ignore")) );
	    	} else {
    			tr.append($('<td>').html(hoaSalesRec.SALEDT));
	    	}

			tr.append($('<td>').html(hoaSalesRec.PARCELLOCATION))
			.append($('<td>').html(hoaSalesRec.OLDOWN))
			.append($('<td>').html(hoaSalesRec.OWNERNAME1))
			.append($('<td>').html(hoaSalesRec.MAILINGNAME1))
			.append($('<td>').html(hoaSalesRec.MAILINGNAME2));

			tr.appendTo(reportListDisplay);		

		}); // $.each(reportList, function(index, hoaSalesRec) {
		// End of if (reportName == "SalesReport" || reportName == "SalesNewOwnerReport") {

	} else if (reportName == "PaidDuesCountsReport") {

		var pdfLineArray = [];
		$.each(reportList, function(index, cntsRec) {
			rowId = index + 1;

			if (index == 0) {
				$('<tr>')
				.append($('<th>').html('Fiscal Year'))
				.append($('<th>').html('Paid Count'))
				.append($('<th>').html('UnPaid Count'))
				.append($('<th>').html('Total UnPaid Dues'))
				.appendTo(reportListDisplay);		
				
				reportTitleFull = reportTitle;
				pdfTitle = reportTitleFull;
				pdfTimestamp = currSysDate.toString().substr(0,24);
				
				csvLine = csvFilter("FiscalYear");
				csvLine += ',' + csvFilter("PaidCount");
				csvLine += ',' + csvFilter("UnPaidCount");
				csvLine += ',' + csvFilter("TotalUnPaidDues");
		    	csvContent += csvLine + '\n';
			}

			tr = $('<tr>');
			tr.append($('<td>').html(cntsRec.fy))
			.append($('<td>').html(cntsRec.paidCnt))
			.append($('<td>').html(cntsRec.unpaidCnt))
			.append($('<td>').html(parseFloat(''+cntsRec.totalDue).toFixed(2)));
			tr.appendTo(reportListDisplay);		

			csvLine = csvFilter(cntsRec.fy);
			csvLine += ',' + csvFilter(cntsRec.paidCnt);
			csvLine += ',' + csvFilter(cntsRec.unpaidCnt);
			csvLine += ',' + csvFilter(parseFloat(''+cntsRec.totalDue).toFixed(2));
	    	csvContent += csvLine + '\n';

		}); // $.each(reportList, function(index, cntsRec) {

		reportDownloadLinks.append(
				$('<a>').prop('id','DownloadReportCSV')
		    			.attr('href','#')
			    		.attr('class',"btn btn-warning")
			    		.attr('data-reportName',formatDate()+'-'+reportName)
			    		.html('CSV'));

	} else {
		
		var pdfLineArray = [];
    	// Loop through the list of properties / current owner
		$.each(reportList, function(index, hoaRec) {
			rowId = index + 1;
			
			if (hoaRec.assessmentsList[0].Paid) {
				paidCnt++;
			} else {
				unpaidCnt++;
			}
			
				if (index == 0) {
					$('<tr>')
					.append($('<th>').html('Row'))
					.append($('<th>').html('Parcel Id'))
					.append($('<th>').html('Lot No'))
					.append($('<th>').html('Location'))
					.append($('<th>').html('Owner and Alt Address'))
					.append($('<th>').html('Phone'))
					.append($('<th>').html('Dues Amt'))
					.append($('<th>').html('Paid'))
					.appendTo(reportListDisplay);		
					
					reportYear = hoaRec.assessmentsList[0].FY;
					reportTitleFull = reportTitle+" for Fiscal Year "+reportYear+" (Oct. 1, "+(reportYear-1)+" to Sept. 30, "+reportYear+")";
					pdfTitle = reportTitleFull;
					pdfTimestamp = currSysDate.toString().substr(0,24)+", Number of records = "+reportList.length;
					
					pdfLineHeaderArray = [
							'Row',
							'Parcel Id',
							'Lot No',
							'Location',
							'Owner and Alt Address',
							'Phone',
							'Dues Amt',
							'Paid'];
					pdfLineColIncrArray = [0.75,0.5,1.3,0.8,2.2,2.5,1.2,0.8];
					
					// maybe for CSV just 1 set of mailing address fields (with either parcel location or Alt. address)
					
					csvLine = csvFilter("RecId");
					csvLine += ',' + csvFilter("ParcelID");
					csvLine += ',' + csvFilter("LotNo");
					csvLine += ',' + csvFilter("ParcelLocation");
					csvLine += ',' + csvFilter("OwnerName1");
					csvLine += ',' + csvFilter("OwnerName2");
					csvLine += ',' + csvFilter("OwnerPhone");
					csvLine += ',' + csvFilter("MailingName");
					csvLine += ',' + csvFilter("MailingAddressLine1");
					csvLine += ',' + csvFilter("MailingAddressLine2");
					csvLine += ',' + csvFilter("MailingCity");
					csvLine += ',' + csvFilter("MailingState");
					csvLine += ',' + csvFilter("MailingZip");
					csvLine += ',' + csvFilter("FiscalYear");
					csvLine += ',' + csvFilter("DuesAmt");
					csvLine += ',' + csvFilter("Paid");
					csvLine += ',' + csvFilter("NonCollectible");
					csvLine += ',' + csvFilter("DateDue");
			    	csvContent += csvLine + '\n';
				}

				//.append($('<td>').html(hoaRec.ownersList[0].Owner_Name1+" "+hoaRec.ownersList[0].Owner_Name2))

				tr = $('<tr>');
				tr.append($('<td>').html(index+1))
				.append($('<td>').html(hoaRec.Parcel_ID))
				.append($('<td>').html(hoaRec.LotNo))
				.append($('<td>').html(hoaRec.Parcel_Location))
				.append($('<td>').html(hoaRec.ownersList[0].Mailing_Name))
				.append($('<td>').html(hoaRec.ownersList[0].Owner_Phone))
				.append($('<td>').html(hoaRec.assessmentsList[0].DuesAmt))
				.append($('<td>').html(setBoolText(hoaRec.assessmentsList[0].Paid)));
				tr.appendTo(reportListDisplay);		

				reportPDFaddLine([index+1,hoaRec.Parcel_ID,hoaRec.LotNo,hoaRec.Parcel_Location,hoaRec.ownersList[0].Mailing_Name,
				                  hoaRec.ownersList[0].Owner_Phone,hoaRec.assessmentsList[0].DuesAmt,setBoolText(hoaRec.assessmentsList[0].Paid)]); 
				
				if (hoaRec.ownersList[0].AlternateMailing) {
					var tr3 = $('<tr>');
					tr3.append($('<td>').html(''))
					.append($('<td>').html(''))
					.append($('<td>').html(''))
					.append($('<td>').html(''))
					.append($('<td>').html(hoaRec.ownersList[0].Alt_Address_Line1))
					.append($('<td>').html(''))
					.append($('<td>').html(''))
					.append($('<td>').html(''));
					tr3.appendTo(reportListDisplay);		

					reportPDFaddLine(['','','','',hoaRec.ownersList[0].Alt_Address_Line1,'','','']);
					
					if (hoaRec.ownersList[0].Alt_Address_Line2 != '') {
						var tr4 = $('<tr>');
						tr4.append($('<td>').html(''))
						.append($('<td>').html(''))
						.append($('<td>').html(''))
						.append($('<td>').html(''))
						.append($('<td>').html(hoaRec.ownersList[0].Alt_Address_Line2))
						.append($('<td>').html(''))
						.append($('<td>').html(''))
						.append($('<td>').html(''));
						tr4.appendTo(reportListDisplay);		

						reportPDFaddLine(['','','','',hoaRec.ownersList[0].Alt_Address_Line2,'','','']);
					}
					
					var tr5 = $('<tr>');
					tr5.append($('<td>').html(''))
					.append($('<td>').html(''))
					.append($('<td>').html(''))
					.append($('<td>').html(''))
					.append($('<td>').html(hoaRec.ownersList[0].Alt_City+', '+hoaRec.ownersList[0].Alt_State+' '+hoaRec.ownersList[0].Alt_Zip))
					.append($('<td>').html(''))
					.append($('<td>').html(''))
					.append($('<td>').html(''));
					tr5.appendTo(reportListDisplay);		
					
					reportPDFaddLine(['','','','',hoaRec.ownersList[0].Alt_City+', '+hoaRec.ownersList[0].Alt_State+' '+hoaRec.ownersList[0].Alt_Zip,'','','']);
				}

				csvLine = csvFilter(index+1);
				csvLine += ',' + csvFilter(hoaRec.Parcel_ID);
				csvLine += ',' + csvFilter(hoaRec.LotNo);
				csvLine += ',' + csvFilter(hoaRec.Parcel_Location);
				csvLine += ',' + csvFilter(hoaRec.ownersList[0].Owner_Name1);
				csvLine += ',' + csvFilter(hoaRec.ownersList[0].Owner_Name2);
				csvLine += ',' + csvFilter(hoaRec.ownersList[0].Owner_Phone);
				csvLine += ',' + csvFilter(hoaRec.ownersList[0].Mailing_Name);

				if (hoaRec.ownersList[0].AlternateMailing) {
					csvLine += ',' + csvFilter(hoaRec.ownersList[0].Alt_Address_Line1);
					csvLine += ',' + csvFilter(hoaRec.ownersList[0].Alt_Address_Line2);
					csvLine += ',' + csvFilter(hoaRec.ownersList[0].Alt_City);
					csvLine += ',' + csvFilter(hoaRec.ownersList[0].Alt_State);
					csvLine += ',' + csvFilter(hoaRec.ownersList[0].Alt_Zip);
					
				} else {
					csvLine += ',' + csvFilter(hoaRec.Parcel_Location);
					csvLine += ',' + csvFilter("");
					csvLine += ',' + csvFilter(hoaRec.Property_City);
					csvLine += ',' + csvFilter(hoaRec.Property_State);
					csvLine += ',' + csvFilter(hoaRec.Property_Zip);
				}

				csvLine += ',' + csvFilter(reportYear);
				csvLine += ',' + csvFilter(hoaRec.assessmentsList[0].DuesAmt);
				csvLine += ',' + csvFilter(setBoolText(hoaRec.assessmentsList[0].Paid));
				csvLine += ',' + csvFilter(setBoolText(hoaRec.assessmentsList[0].NonCollectible));
				csvLine += ',' + csvFilter(hoaRec.assessmentsList[0].DateDue);
		    	csvContent += csvLine + '\n';
		    
		}); // $.each(reportList, function(index, hoaRec) {

		reportDownloadLinks.append(
				$('<a>').prop('id','DownloadReportCSV')
		    			.attr('href','#')
			    		.attr('class',"btn btn-warning")
			    		.attr('data-reportName',formatDate()+'-'+reportName)
			    		.html('CSV'));
	    
		// Include downloadBtn class to add space to left margin
		reportDownloadLinks.append(
				$('<a>').prop('id','DownloadReportPDF')
		    			.attr('href','#')
			    		.attr('class',"btn btn-danger downloadBtn")
			    		.attr('data-reportName',formatDate()+'-'+reportName)
			    		.html('PDF'));
		
	} // End of Properties / current owner reports

    $("#ReportHeader").html(reportTitleFull);
	$("#ReportRecCnt").html(currSysDate.toString().substr(0,24)+", Number of records = "+rowId);

	if (reportName == "PropertyOwnerReport") {
		$("#ReportRecCnt").append(" (Paid = " + paidCnt + ", Unpaid = " + unpaidCnt + ")");
	}

	if (reportName == "SalesNewOwnerReport") {
		$("#ReportRecCnt").append(", (Click on <b>Sale Date</b> to Create a New Owner, or <b>Ignore</b> to bypass)");
	}
		
} // function formatReportList(reportName,reportList){

// Global variable to hold CSV content for downloading
var csvContent;

//---------------------------------------------------------------------------------------------------------------------------
//Global variable to hold the PDF file created during report formatting (for downloading)
//---------------------------------------------------------------------------------------------------------------------------
var pdf;
var pdfLogoImgData = '';
var pdfTitle = "";
var pdfTimestamp = "";
var pdfTotals = "";
var pdfLineHeaderArray = [];
var pdfLineColIncrArray = [];
var pdfPageCnt = 0;
var pdfLineCnt = 0;
var pdfLineYStart = 1.5;
var pdfLineY = pdfLineYStart;
var pdfLineIncrement = 0.25;
var pdfColIncrement = 1.5;
var pdfMaxLineChars = 95;
var pdfFontSizeDefault = 11;

// Function to add a line to the report PDF
function reportPDFaddLine(pdfLineArray) {
	pdfLineCnt++;
	var pdfHeader = false;
	var X = 0.0;
	
	if (pdfLineCnt == 1) {
    	pdf = new jsPDF('l', 'in', 'letter');
    	pdf.setProperties({
    	    title: pdfTitle,
    	    author: hoaNameShort
    	});
    	pdfHeader = true;
	}

	if (pdfLineY > 7.8) {
		pdf.addPage('letter','l');
    	pdfHeader = true;
	}

	if (pdfHeader) {
		pdfPageCnt++;
		pdf.setFontSize(9);
		pdf.text(10.2, 0.4, 'Page '+pdfPageCnt);
		pdf.setFontSize(15);
		pdf.text(3.6, 0.45, hoaName);
		pdf.setFontSize(13);
		pdf.text(2.5, 0.75, pdfTitle);
		pdf.setFontSize(10);
		pdf.text(3.8, 1.1, pdfTimestamp);
		
		pdf.addImage(pdfLogoImgData, 'JPEG', 0.4, 0.3, 0.9, 0.9);
    	pdf.setFontSize(10);

		pdfLineY = pdfLineYStart;
		X = 0.0;
		for (i = 0; i < pdfLineArray.length; i++) {
			X += pdfLineColIncrArray[i];
			pdf.text(X,pdfLineY,''+pdfLineHeaderArray[i]);
		}
		pdfLineY += pdfLineIncrement / 2.0;
		
		X = 0.65;
		pdf.setLineWidth(0.02);
		pdf.line(X,pdfLineY,10.5,pdfLineY);
		pdfLineY += pdfLineIncrement;
	}

	X = 0.0;
	for (i = 0; i < pdfLineArray.length; i++) {
		X += pdfLineColIncrArray[i];
		pdf.text(X,pdfLineY,''+pdfLineArray[i]);
	}
	pdfLineY += pdfLineIncrement;

} // End of function reportPDFaddLine(pdfLineArray) {

/**
 * Draws a dotted line on a jsPDF doc between two points.
 * Note that the segment length is adjusted a little so
 * that we end the line with a drawn segment and don't
 * overflow.
 */
function dottedLine(xFrom, yFrom, xTo, yTo, segmentLength)
{
    // Calculate line length (c)
    var a = Math.abs(xTo - xFrom);
    var b = Math.abs(yTo - yFrom);
    var c = Math.sqrt(Math.pow(a,2) + Math.pow(b,2));

    // Make sure we have an odd number of line segments (drawn or blank)
    // to fit it nicely
    var fractions = c / segmentLength;
    var adjustedSegmentLength = (Math.floor(fractions) % 2 === 0) ? (c / Math.ceil(fractions)) : (c / Math.floor(fractions));

    // Calculate x, y deltas per segment
    var deltaX = adjustedSegmentLength * (a / c);
    var deltaY = adjustedSegmentLength * (b / c);

    var curX = xFrom, curY = yFrom;
    while (curX <= xTo && curY <= yTo)
    {
        pdf.line(curX, curY, curX + deltaX, curY + deltaY);
        curX += 2*deltaX;
        curY += 2*deltaY;
    }
}

