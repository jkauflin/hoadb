/*==============================================================================
 * (C) Copyright 2015,2016,2017,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version 
 * 2016-05-19 JJK   Modified to get the country web site URL's from config
 * 2016-06-05 JJK   Split Edit modal into 1 and 2Col versions
 * 2016-06-09 JJK	Added duesStatementNotes to the individual dues
 * 					statement and adjusted the format
 * 2016-06-24 JJK	Working on adminExecute (for yearly dues statement)
 * 2016-07-01 JJK	Got progress bar for adminExecute working by moving loop
 * 					processing into an asynchronous recursive function.
 * 2016-07-13 JJK   Finished intial version of yearly dues statements
 * 2016-07-14 JJK   Added Paid Dues Counts report
 * 2016-07-28 JJK	Corrected compound interest problem with a bad start date
 * 					Added print of LienComment after Total Due on Dues Statement
 * 2016-07-30 JJK   Changed the Yearly Dues Statues to just display prior
 * 					years due messages instead of amounts.
 * 					Added yearlyDuesStatementNotice for 2nd notice message.
 * 					Added DateDue to CSV for reports
 * 2016-08-19 JJK	Added UseMail to properties and EmailAddr to owners
 * 2016-08-20 JJK	Implemented email validation check
 * 2016-08-26 JJK   Went live, and Paypal payments working in Prod!!!
 * 2017-06-10 JJK   Added unpaid dues ranking
 * 2017-08-13 JJK	Added a dues email test function, and use of payment
 * 					email for dues statements
 * 2017-08-18 JJK   Added an unsubscribe message to the dues email
 * 2017-08-19 JJK   Added yearly dues statement notice and notes different
 * 					for 1st and Additional notices
 * 2017-08-20 JJK   Added Mark notice mailed function and finished up
 *                  Email logic.
 * 					Added logic to set NoticeDate
 * 2018-01-21 JJK	Corrected set of default firstNotice to false (so 2nd
 * 					notices would correctly use the alternate notes)
 * 2018-10-14 JJK   Re-factored for modules
 * 2018-11-03 JJK   Got update Properties working again with JSON POST
 * 2018-11-04 JJK   (Jackson's 16th birthday)
 * 2018-11-17 JJK   To solve the async loop issue I modified AdminRequest to 
 *                  do all data queries in the PHP module and pass back a 
 *                  large array of data to process in a sync loop
 *============================================================================*/
var admin = (function () {
    'use strict';  // Force declaration of variables before use (among other things)

    //=================================================================================================================
    // Private variables for the Module
    /*
    var commDesc = '';
    var noticeType = '';
    var tempCommDesc = "";
    var sendEmailAddr = "";
    var firstNotice = false;
    var adminRecCntMAX = 0;
    var sendEmail = true;
    var noticeDate = "";
    var noticeYear = "";
    // Global variable for loop counter
    var adminRecCnt = 0;
    var emailRecCnt = 0;
    var adminEmailSkipCnt = 0;
    // Global variable for total number of parcels in the HOA
    var hoaRecList = [];
    */

    // Move this to a config value
    //var hoaPropertyListMAX = config.getVal('numberOfProperties');
    var hoaPropertyListMAX = 542;
    var hoaName;
    var hoaNameShort;
    var hoaAddress1;
    var hoaAddress2;

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $moduleDiv = $('#AdminPage');
    // Figure out a better way to do this
    var $displayPage = $document.find('#navbar a[href="#AdminPage"]');
    var $DuesAmt = $moduleDiv.find("#DuesAmt");
    var $FiscalYear = $moduleDiv.find("#FiscalYear");
    var $ConfirmationModal = $document.find("#ConfirmationModal");
    var $ConfirmationButton = $ConfirmationModal.find("#ConfirmationButton");
    var $ConfirmationMessage = $ConfirmationModal.find("#ConfirmationMessage");
    var $ResultMessage = $moduleDiv.find("#ResultMessage");

    //var $DuesStatementButton = $document.find("#DuesStatementButton");
    //var $DownloadDuesStatement = $document.find("#DownloadDuesStatement");
    var $DuesStatementPage = $document.find("#DuesStatementPage");

    var $DuesStatementPropertyTable = $("#DuesStatementPropertyTable tbody");
    var $DuesStatementAssessmentsTable = $("#DuesStatementAssessmentsTable tbody");

    var duesStatementDownloadLinks = $("#DuesStatementDownloadLinks");

    //=================================================================================================================
    // Bind events
    $moduleDiv.on("click", ".AdminButton", _adminRequest);
    $ConfirmationButton.on("click", "#AdminExecute", _adminExecute);
    
    $document.on("click", "#DuesStatementButton", createDuesStatement);
    $document.on("click", "#DownloadDuesStatement", downloadDuesStatement);
    //$DuesStatementButton.click(createDuesStatement);
    //$DownloadDuesStatement.click(downloadDuesStatement);

    function createDuesStatement(event) {
        //console.log("create dues statement, parcel = " + event.target.getAttribute("data-parcelId") + ", owner = " + event.target.getAttribute("data-ownerId"));
        util.waitCursor();
        $.getJSON("getHoaDbData.php", "parcelId=" + event.target.getAttribute("data-parcelId") + "&ownerId=" + event.target.getAttribute("data-ownerId"), function (hoaRec) {
            // Initialize the PDF object
            pdf.init(config.getVal('hoaNameShort')+' Dues Statement', 'letter');
            formatDuesStatementResults(hoaRec);
            util.defaultCursor();
            $DuesStatementPage.modal();
        });
    };

    function downloadDuesStatement(event) {
        pdf.download(event.target.getAttribute("data-pdfName"));
    };


    //=================================================================================================================
    // Module methods
    function _adminRequest(event) {
        // Validate add assessments (check access permissions, timing, year, and amount)
        // get confirmation message back
        var fy = util.cleanStr($FiscalYear.val());
        var duesAmt = util.cleanStr($DuesAmt.val());
        util.waitCursor();
        $.getJSON("adminValidate.php", "action=" + event.target.getAttribute('id') +
            "&fy=" + fy +
            "&duesAmt=" + duesAmt, function (adminRec) {
            $ConfirmationMessage.html(adminRec.message);
            $ConfirmationButton.empty();
            var buttonForm = $('<form>').prop('class', "form-inline").attr('role', "form");
            // If the action was Valid, append an action button
            if (adminRec.result == "Valid") {
                buttonForm.append($('<button>').prop('id', "AdminExecute").prop('class', "btn btn-danger").attr('type', "button").attr('data-dismiss', "modal").html('Continue')
                    .attr('data-action', event.target.getAttribute('id')).attr('data-fy', fy).attr('data-duesAmt', duesAmt));
            }
            buttonForm.append($('<button>').prop('class', "btn btn-default").attr('type', "button").attr('data-dismiss', "modal").html('Close'));
            $ConfirmationButton.append(buttonForm);
            util.defaultCursor();
            $ConfirmationModal.modal();
        });
    }

    // Respond to the Continue click for an Admin Execute function 
    function _adminExecute(event) {
        $ResultMessage.html("Executing Admin request...(please wait)");
        util.waitCursor();
        var action = event.target.getAttribute("data-action");
        //console.log("in adminExecute, action = "+action);

        hoaName = config.getVal('hoaName');
        hoaNameShort = config.getVal('hoaNameShort');
        hoaAddress1 = config.getVal('hoaAddress1');
        hoaAddress2 = config.getVal('hoaAddress2');

        // Get all the data needed for processing
        // (modify to use POST at some point)
        $.getJSON("adminExecute.php", "action=" + action +
            "&fy=" + event.target.getAttribute("data-fy") +
            "&duesAmt=" + event.target.getAttribute("data-duesAmt"), function (adminRec) {
            util.defaultCursor();
            $ResultMessage.html(adminRec.message);

            if (action == 'DuesNotices') {
                _duesNotices(adminRec.hoaRecList);
            }
            else if (action == 'DuesEmails' || action == 'DuesEmailsTest' || action == 'DuesRank' || action == 'MarkMailed') {

            } // End of if
        }); // $.getJSON("adminExecute.php","action="+action+
    }

    function _duesNotices(hoaRecList) {
        var adminEmailSkipCnt = 0;
        var displayAddress = '';
        var noticeType = '';
        var commType = 'Dues Notice';
        var commDesc = '';

        var firstNotice = false;
        // If list of unpaid properties is the total number of properties, assume it is the 1st Dues Notice
        if (hoaRecList.length == hoaPropertyListMAX) {
            firstNotice = true;
        }

        // Initialize the PDF object
        pdf.init('Member Dues Notice', 'letter');

        console.log("Before adminLoop, hoaRecList.length = " + hoaRecList.length);
        $ResultMessage.html("Executing Admin request...(processing list)");

        $.each(hoaRecList, function (index, hoaRec) {
            //console.log(index + ", ParcelId = " + hoaRec.Parcel_ID + ", OwnerID = " + hoaRec.ownersList[0].OwnerID + ", Owner = " + hoaRec.ownersList[0].Owner_Name1 + ", hoaRec.DuesEmailAddr = " + hoaRec.DuesEmailAddr);

            // When generating DuesNotices for the 1st notice, skip the ones with Property UseEmail set (if there is a valid email)
            if (firstNotice && hoaRec.UseEmail && hoaRec.DuesEmailAddr != '') {
                adminEmailSkipCnt++;
            } else {
                // Get a displayAddress for the Communication record
                displayAddress = hoaRec.Parcel_Location;
                if (hoaRec.ownersList[0].AlternateMailing) {
                    displayAddress = hoaRec.ownersList[0].Alt_Address_Line1;
                }

                noticeType = "Additional";
                if (firstNotice) {
                    noticeType = "1st";
                }

                commDesc = noticeType + " Notice for postal mail created for " + displayAddress;
                // Create the PDF for yearly dues statements
                if (index > 0) {
                    // If not the first record for DuesNotices, then add a new page for the next parcel
                    pdf.addPage();
                }

                // Call function to format the yearly dues statement for an individual property
                _formatYearlyDuesStatement(hoaRec, firstNotice);

                // log communication for notice created
                //communications.LogCommunication(hoaRec.Parcel_ID, hoaRec.ownersList[0].OwnerID, commType, commDesc);
            }

        }); // End of loop through Parcels

        //$ResultMessage.html("Done with loop, cnt = " + adminRec.hoaPropertyRecList.length);
        console.log("Done with loop");
        $("#ResultMessage").html("Yearly dues notices created, total = " + hoaRecList.length + ", (Total skipped for UseEmail = " + adminEmailSkipCnt + ")");
        // Download the PDF file
        pdf.download('YearlyDuesNotices');
    }


    // function to format a Yearly dues statement
    function _formatYearlyDuesStatement(hoaRec, firstNotice) {
        var ownerRec = hoaRec.ownersList[0];
        pdf.setMaxLineChars(95);

        // Set the Notice and Notes field according to 1st or Additional notices
        var noticeYear = '' + parseInt(hoaRec.assessmentsList[0].FY) - 1;
        var noticeDate = util.formatDate();
        var yearlyDuesStatementNotice = config.getVal('yearlyDuesStatementNoticeAdditional');
        var yearlyDuesStatementNotes = config.getVal('yearlyDuesStatementNotesAdditional');
        if (firstNotice) {
            noticeDate = 'September 1st, ' + noticeYear;
            yearlyDuesStatementNotice = config.getVal('yearlyDuesStatementNotice1st');
		    yearlyDuesStatementNotes = config.getVal('yearlyDuesStatementNotes1st');
        }

        pdf.setLineColIncrArray([-4.5]);
        pdf.yearlyDuesStatementAddLine([hoaName], null, 13, 0.5);
        pdf.setLineColIncrArray([4.5, -3.05]);
        pdf.yearlyDuesStatementAddLine([pdf.getTitle() + " for Fiscal Year ", hoaRec.assessmentsList[0].FY], null, 12, 0.8);

        // hoa name and address for return label
        //var pdfLineIncrement = 0.2;
        pdf.setLineIncrement(0.2);
        pdf.setLineColIncrArray([1.0]);
        pdf.yearlyDuesStatementAddLine([hoaName], null, 10, 1.0);
        pdf.yearlyDuesStatementAddLine([hoaAddress1]);
        pdf.yearlyDuesStatementAddLine([hoaAddress2]);

        //pdfLineIncrement = 0.21;
        pdf.setLineIncrement(0.21);
        pdf.setLineColIncrArray([4.5, 1.3]);
        pdf.yearlyDuesStatementAddLine(["For the Period: ", 'Oct 1st, ' + noticeYear + ' thru Sept 30th, ' + hoaRec.assessmentsList[0].FY], null, 11, 1.1);
        pdf.setLineColIncrArray([-4.5, -1.3]);
        pdf.yearlyDuesStatementAddLine(["Notice Date: ", noticeDate]);

        var duesAmount = util.formatMoney(hoaRec.assessmentsList[0].DuesAmt);
        pdf.yearlyDuesStatementAddLine(["Dues Amount: ", '$' + duesAmount]);
        if (duesAmount == hoaRec.TotalDue) {
            pdf.yearlyDuesStatementAddLine(["Due Date: ", 'October 1st, ' + noticeYear]);
            pdf.setLineColIncrArray([-4.5, 1.3]);
            pdf.yearlyDuesStatementAddLine(["Parcel Id: ", hoaRec.Parcel_ID]);
            pdf.yearlyDuesStatementAddLine(["Lot No: ", hoaRec.LotNo]);
        } else {
            pdf.yearlyDuesStatementAddLine(["********************* ", "There are prior year dues owed"]);
            pdf.yearlyDuesStatementAddLine(["********************* ", "Please contact the Treasurer"]);
            pdf.yearlyDuesStatementAddLine(["Due Date: ", 'October 1st, ' + noticeYear]);
            pdf.setLineColIncrArray([-4.5, 1.3]);
            pdf.yearlyDuesStatementAddLine(["Parcel Id: ", hoaRec.Parcel_ID + ", Lot: " + hoaRec.LotNo]);
        }

        pdf.setLineColIncrArray([-4.5]);
        //pdf.yearlyDuesStatementAddLine(['']);
        pdf.yearlyDuesStatementAddLine(['    Contact Information:']);
        pdf.setLineColIncrArray([4.5]);
        pdf.yearlyDuesStatementAddLine([ownerRec.Owner_Name1 + ' ' + ownerRec.Owner_Name2]);
        pdf.yearlyDuesStatementAddLine([hoaRec.Parcel_Location]);
        pdf.yearlyDuesStatementAddLine([hoaRec.Property_City + ', ' + hoaRec.Property_State + ' ' + hoaRec.Property_Zip]);
        pdf.yearlyDuesStatementAddLine(['Phone # ' + ownerRec.Owner_Phone]);
        pdf.yearlyDuesStatementAddLine(['Email: ' + hoaRec.DuesEmailAddr]);

        var displayAddress1 = ownerRec.Mailing_Name;
        var displayAddress2 = hoaRec.Parcel_Location;
        var displayAddress3 = hoaRec.Property_City + ', ' + hoaRec.Property_State + ' ' + hoaRec.Property_Zip;
        var displayAddress4 = "";

        if (hoaRec.ownersList[0].AlternateMailing) {
            if (ownerRec.Alt_Address_Line2 != '') {
                displayAddress2 = ownerRec.Alt_Address_Line1;
                displayAddress3 = ownerRec.Alt_Address_Line2
                displayAddress4 = ownerRec.Alt_City + ', ' + ownerRec.Alt_State + ' ' + ownerRec.Alt_Zip;
            } else {
                displayAddress2 = ownerRec.Alt_Address_Line1;
                displayAddress3 = ownerRec.Alt_City + ', ' + ownerRec.Alt_State + ' ' + ownerRec.Alt_Zip;
            }
        }

        // Display the mailing address
        pdf.setLineIncrement(0.21);
        //pdfLineIncrement = 0.21;
        pdf.setLineColIncrArray([1.0]);
        pdf.yearlyDuesStatementAddLine([displayAddress1], null, 11, 2.5);
        pdf.yearlyDuesStatementAddLine([displayAddress2]);
        pdf.yearlyDuesStatementAddLine([displayAddress3]);
        pdf.yearlyDuesStatementAddLine([displayAddress4]);

        // Address corrections
        //pdfLineIncrement = 0.3;
        pdf.setLineIncrement(0.3);
        pdf.setLineColIncrArray([-0.6]);
        pdf.yearlyDuesStatementAddLine(["Enter any information that needs to be corrected:"], null, 11, 4.3);
        pdf.setLineColIncrArray([0.6]);
        pdf.yearlyDuesStatementAddLine(["Owner Name:"]);
        pdf.yearlyDuesStatementAddLine(["Address Line 1:"]);
        pdf.yearlyDuesStatementAddLine(["Address Line 2:"]);
        pdf.yearlyDuesStatementAddLine(["City State Zip:"]);
        pdf.yearlyDuesStatementAddLine(["Phone Number:"]);
        pdf.yearlyDuesStatementAddLine([""]);
        pdf.yearlyDuesStatementAddLine(["Email:"]);

        // Survey description, questions (1,2,3)
        // Commenting out survey for now
        //pdf.setLineIncrement(0.285);
        //pdf.setLineColIncrArray([-1.0]);
        //pdf.yearlyDuesStatementAddLine([surveyInstructions],null,11,6.28);
        //pdf.setLineColIncrArray([1.0]);
        //pdf.yearlyDuesStatementAddLine([surveyQuestion1]);
        //pdf.yearlyDuesStatementAddLine([surveyQuestion2]);
        //pdf.yearlyDuesStatementAddLine([surveyQuestion3]);

        pdf.setLineIncrement(0.15);
        pdf.setLineColIncrArray([1.0]);
        pdf.yearlyDuesStatementAddLine([""]);
        pdf.setLineIncrement(0.21);
        pdf.setLineColIncrArray([-1.0]);
        pdf.yearlyDuesStatementAddLine(["Go Paperless - check here to turn off mailed paper notices"]);
        pdf.setLineColIncrArray([1.0]);
        pdf.yearlyDuesStatementAddLine(["(Make sure correct Email address is listed in Contact Info or entered above)"]);

        pdf.setLineIncrement(0.21);
        pdf.yearlyDuesStatementAddLine([''], null, 10, 3.9);

        // Print the Notice statement if it exists (2nd notice, etc.)
        if (yearlyDuesStatementNotice.length > 0) {
            pdf.setMaxLineChars(35);
            pdf.setLineColIncrArray([-5.2]);
            pdf.yearlyDuesStatementAddLine([yearlyDuesStatementNotice], null, 12);
            pdf.yearlyDuesStatementAddLine([''], null);
        }

        // If there are notes - print them
        pdf.setMaxLineChars(45);
        if (yearlyDuesStatementNotes.length > 0) {
            pdf.setLineColIncrArray([5.2]);
            pdf.yearlyDuesStatementAddLine([yearlyDuesStatementNotes], null, 10);
        }

        // Print information on the user records portion
        pdf.setLineColIncrArray([-0.5]);
        pdf.yearlyDuesStatementAddLine([hoaName], null, 13, 8.0);
        pdf.setLineColIncrArray([0.5, -3.05]);
        pdf.yearlyDuesStatementAddLine([pdf.getTitle() + " for Fiscal Year ", hoaRec.assessmentsList[0].FY], null, 12, 8.3);

        pdf.setLineIncrement(0.21);
        noticeYear = '' + parseInt(hoaRec.assessmentsList[0].FY) - 1;
        pdf.setLineColIncrArray([0.5, 1.5]);
        pdf.yearlyDuesStatementAddLine(["For the Period: ", 'Oct 1st, ' + noticeYear + ' thru Sept 30th, ' + hoaRec.assessmentsList[0].FY], null, 11, 8.6);
        pdf.setLineColIncrArray([-0.5, -1.5]);
        pdf.yearlyDuesStatementAddLine(["Notice Date: ", noticeDate]);

        pdf.yearlyDuesStatementAddLine(["Dues Amount: ", '$' + duesAmount]);
        if (duesAmount != hoaRec.TotalDue) {
            pdf.yearlyDuesStatementAddLine(["************************ ", "There are prior year dues owed"]);
            pdf.yearlyDuesStatementAddLine(["************************ ", "Please contact the Treasurer"]);
        }
        pdf.yearlyDuesStatementAddLine(["Due Date: ", 'October 1st, ' + noticeYear]);

        pdf.setLineColIncrArray([-0.5, 1.5]);
        pdf.yearlyDuesStatementAddLine(['', '']);
        pdf.yearlyDuesStatementAddLine(["Parcel Id: ", hoaRec.Parcel_ID]);
        pdf.yearlyDuesStatementAddLine(["Lot No: ", hoaRec.LotNo]);
        pdf.yearlyDuesStatementAddLine(["Property Location: ", hoaRec.Parcel_Location]);

        // hoa name and address for payment
        pdf.setLineIncrement(0.21);
        pdf.setLineColIncrArray([5.2]);
        pdf.yearlyDuesStatementAddLine(["Make checks payable to:"], null, 11, 8.0);
        pdf.setLineColIncrArray([-5.2]);
        pdf.yearlyDuesStatementAddLine([hoaName]);
        pdf.yearlyDuesStatementAddLine(['']);
        pdf.setLineColIncrArray([-5.2, 0.8]);
        pdf.yearlyDuesStatementAddLine(["Send to:", hoaNameShort]);
        pdf.yearlyDuesStatementAddLine(["", hoaAddress1]);
        pdf.yearlyDuesStatementAddLine(["", hoaAddress2]);

        pdf.setLineIncrement(0.19);
        pdf.setLineColIncrArray([-5.2]);
        pdf.yearlyDuesStatementAddLine(['']);
        pdf.yearlyDuesStatementAddLine(["Date Paid:"], null, 12);
        pdf.yearlyDuesStatementAddLine(['']);
        pdf.yearlyDuesStatementAddLine(["Check No:"]);

        // Help notes
        pdf.yearlyDuesStatementAddLine([''], null, 10, 10.05);
        pdf.setMaxLineChars(55);
        // If there are notes - print them
        if (yearlyDuesStatementNotes.length > 0) {
            pdf.setLineColIncrArray([4.7]);
            pdf.yearlyDuesStatementAddLine([config.getVal('yearlyDuesHelpNotes')], null);
        }

    } // End of function formatYearlyDuesStatement(hoaRec) {


    function formatDuesStatementResults(hoaRec) {
        var ownerRec = hoaRec.ownersList[0];
        var tr = '';
        var checkedStr = '';
        var duesStatementNotes = config.getVal('duesStatementNotes');
        duesStatementDownloadLinks.empty();
        pdf.setMaxLineChars(95);

        if (duesStatementNotes.length > 0) {
            pdf.setLineColIncrArray([1.4]);
            pdf.duesStatementAddLine([duesStatementNotes], null);
            pdf.duesStatementAddLine([''], null);
        }

        var pdfLineHeaderArray = [
                'Parcel Id',
                'Lot No',
                'Location',
                'Owner and Alt Address',
                'Phone'];
        pdf.setLineColIncrArray([0.6, 1.4, 0.8, 2.2, 1.9]);

        pdf.duesStatementAddLine([hoaRec.Parcel_ID, hoaRec.LotNo, hoaRec.Parcel_Location, ownerRec.Mailing_Name,
        ownerRec.Owner_Phone], pdfLineHeaderArray);

        if (hoaRec.ownersList[0].AlternateMailing) {
            pdf.duesStatementAddLine(['', '', '', ownerRec.Alt_Address_Line1, ''], null);
            if (ownerRec.Alt_Address_Line2 != '') {
                pdf.duesStatementAddLine(['', '', '', ownerRec.Alt_Address_Line2, ''], null);
            }
            pdf.duesStatementAddLine(['', '', '', ownerRec.Alt_City + ', ' + ownerRec.Alt_State + ' ' + ownerRec.Alt_Zip, ''], null);
        }

        tr += '<tr><th>Parcel Id:</th><td>' + hoaRec.Parcel_ID + '</a></td></tr>';
        tr += '<tr><th>Lot No:</th><td>' + hoaRec.LotNo + '</td></tr>';
        tr += '<tr><th>Location: </th><td>' + hoaRec.Parcel_Location + '</td></tr>';
        tr += '<tr><th>City State Zip: </th><td>' + hoaRec.Property_City + ', ' + hoaRec.Property_State + ' ' + hoaRec.Property_Zip + '</td></tr>';
        tr += '<tr><th>Owner Name:</th><td>' + ownerRec.Owner_Name1 + ' ' + ownerRec.Owner_Name2 + '</td></tr>';

        var tempTotalDue = '' + hoaRec.TotalDue;
        tr += '<tr><th>Total Due: </th><td>$' + util.formatMoney(tempTotalDue) + '</td></tr>';
        $DuesStatementPropertyTable.html(tr);

        // If enabled, payment button and instructions will have values, else they will be blank if online payment is not allowed
        if (hoaRec.TotalDue > 0) {
            $("#PayDues").html(hoaRec.paymentButton);
            if (hoaRec.paymentButton != '') {
                $("#PayDuesInstructions").html(config.getVal('onlinePaymentInstructions'));
            } else {
                $("#PayDuesInstructions").html(config.getVal('offlinePaymentInstructions'));
            }
        }

        duesStatementDownloadLinks.append(
            $('<a>').prop('id', 'DownloadDuesStatement')
                .attr('href', '#')
                .attr('class', "btn btn-danger downloadBtn")
                .attr('data-pdfName', 'DuesStatement')
                .html('PDF'));

        pdf.setLineColIncrArray([0.6, 4.2, 0.5]);
        pdf.duesStatementAddLine([''], null);

        tr = '';
        $.each(hoaRec.totalDuesCalcList, function (index, rec) {
            tr = tr + '<tr>';
            tr = tr + '<td>' + rec.calcDesc + '</td>';
            tr = tr + '<td>$</td>';
            tr = tr + '<td align="right">' + parseFloat('' + rec.calcValue).toFixed(2) + '</td>';
            tr = tr + '</tr>';
            pdf.duesStatementAddLine([rec.calcDesc, '$', parseFloat('' + rec.calcValue).toFixed(2)], null);
        });
        tr = tr + '<tr>';
        tr = tr + '<td><b>Total Due:</b></td>';
        tr = tr + '<td><b>$</b></td>';
        tr = tr + '<td align="right"><b>' + parseFloat('' + hoaRec.TotalDue).toFixed(2) + '</b></td>';
        tr = tr + '</tr>';
        pdf.duesStatementAddLine(['Total Due:', '$', parseFloat('' + hoaRec.TotalDue).toFixed(2)], null);

        tr = tr + '<tr>';
        tr = tr + '<td>' + hoaRec.assessmentsList[0].LienComment + '</td>';
        tr = tr + '<td></td>';
        tr = tr + '<td align="right"></td>';
        tr = tr + '</tr>';
        $("#DuesStatementCalculationTable tbody").html(tr);
        pdf.duesStatementAddLine([hoaRec.assessmentsList[0].LienComment, '', ''], null);

        pdf.duesStatementAddLine([''], null);

        var TaxYear = '';
        tr = '';
        var tempDuesAmt = '';
        $.each(hoaRec.assessmentsList, function (index, rec) {
            pdfLineHeaderArray = null;

            if (index == 0) {
                tr = tr + '<tr>';
                tr = tr + '<th>Year</th>';
                tr = tr + '<th>Dues Amt</th>';
                tr = tr + '<th>Date Due</th>';
                tr = tr + '<th>Paid</th>';
                tr = tr + '<th>Non-Collectible</th>';
                tr = tr + '<th>Date Paid</th>';
                tr = tr + '</tr>';
                TaxYear = rec.DateDue.substring(0, 4);

                pdfLineHeaderArray = [
                    'Year',
                    'Dues Amt',
                    'Date Due',
                    'Paid',
                    'Non-Collectible',
                    'Date Paid'];
                pdf.setLineColIncrArray([0.6, 0.8, 1.0, 1.7, 0.8, 1.5]);
            }

            tempDuesAmt = '' + rec.DuesAmt;
            tr = tr + '<tr>';
            tr = tr + '<td>' + rec.FY + '</a></td>';
            tr = tr + '<td>' + util.formatMoney(tempDuesAmt) + '</td>';
            tr = tr + '<td>' + rec.DateDue + '</td>';
            tr = tr + '<td>' + util.setCheckbox(rec.Paid) + '</td>';
            tr = tr + '<td>' + util.setCheckbox(rec.NonCollectible) + '</td>';
            tr = tr + '<td>' + rec.DatePaid + '</td>';
            tr = tr + '</tr>';
            pdf.duesStatementAddLine([rec.FY, rec.DuesAmt, rec.DateDue, util.setBoolText(rec.Paid), util.setBoolText(rec.NonCollectible), rec.DatePaid], pdfLineHeaderArray);
        });

        $DuesStatementAssessmentsTable.html(tr);

    } // End of function formatDuesStatementResults(hoaRec){


    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        //getHoaRec: getHoaRec
    };

})(); // var admin = (function(){
