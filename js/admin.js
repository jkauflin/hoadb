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
 * 2018-11-25 JJK   Renamed to pdfModule and implemented configuration object
 *                  rather than global variables
 *============================================================================*/
var admin = (function () {
    'use strict';  // Force declaration of variables before use (among other things)

    //=================================================================================================================
    // Private variables for the Module
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

    // ************** MOVE these to a dues module *************************************************************************************
    function createDuesStatement(event) {
        //console.log("create dues statement, parcel = " + event.target.getAttribute("data-parcelId") + ", owner = " + event.target.getAttribute("data-ownerId"));
        util.waitCursor();
        $.getJSON("getHoaDbData.php", "parcelId=" + event.target.getAttribute("data-parcelId") + "&ownerId=" + event.target.getAttribute("data-ownerId"), function (hoaRec) {
            // Initialize the PDF object
            pdfRec.pdf.init(config.getVal('hoaNameShort')+' Dues Statement', 'letter');
            formatDuesStatementResults(hoaRec);
            util.defaultCursor();
            $DuesStatementPage.modal();
        });
    };

    function downloadDuesStatement(event) {
        pdfRec.pdfRec.pdf.save(util.formatDate() + "-" + event.target.getAttribute("data-pdfName") + ".pdf");
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
        $.getJSON("adminExecute.php", "action=" + action +
            "&fy=" + event.target.getAttribute("data-fy") +
            "&duesAmt=" + event.target.getAttribute("data-duesAmt") + 
            "&duesEmailTestParcel=" + config.getVal('duesEmailTestParcel'), function (adminRec) {
            util.defaultCursor();
            $ResultMessage.html(adminRec.message);

            if (action == 'DuesNotices') {
                _duesNotices(adminRec.hoaRecList);
            } else if (action == 'MarkMailed') {
                _markMailed(adminRec.hoaRecList);
            } else if (action == 'DuesEmails' || action == 'DuesEmailsTest') {
                _duesEmails(adminRec.hoaRecList,action);
            }

        }); // $.getJSON("adminExecute.php","action="+action+
    }

    function _markMailed(hoaRecList) {
        var adminEmailSkipCnt = 0;
        var markMailedCnt = 0;
        var displayAddress = '';
        var commType = 'Dues Notice';
        var commDesc = '';

        $ResultMessage.html("Executing Admin request...(processing list)");

        $.each(hoaRecList, function (index, hoaRec) {
            if (hoaRec.UseEmail && hoaRec.DuesEmailAddr != '') {
                adminEmailSkipCnt++;
            } else {
                markMailedCnt++;
                // Get a displayAddress for the Communication record
                displayAddress = hoaRec.Parcel_Location;
                if (hoaRec.ownersList[0].AlternateMailing) {
                    displayAddress = hoaRec.ownersList[0].Alt_Address_Line1;
                }

                commDesc = "Notice for postal mail mailed for " + displayAddress;
                // log communication for notice created
                communications.LogCommunication(hoaRec.Parcel_ID, hoaRec.ownersList[0].OwnerID, commType, commDesc);
            }

        }); // End of loop through Parcels

        $ResultMessage.html("Postal dues notices marked mailed, total = " + markMailedCnt + ", (Total skipped for UseEmail = " + adminEmailSkipCnt + ")");
    }

    function _duesNotices(hoaRecList) {
        var adminEmailSkipCnt = 0;
        var displayAddress = '';
        var commType = 'Dues Notice';
        var commDesc = '';
        var firstNotice = false;
        var noticeType = 'Additional';
        // If list of unpaid properties is the total number of properties, assume it is the 1st Dues Notice
        if (hoaRecList.length == parseInt(config.getVal('numberOfProperties'))) {
            firstNotice = true;
            noticeType = "1st";
        }

        // Create a pdfRec and initialize the PDF object
        var pdfRec = pdfModule.init('Member Dues Notice');

        console.log("_duesNotices, Before adminLoop, hoaRecList.length = " + hoaRecList.length);
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

                commDesc = noticeType + " Notice for postal mail created for " + displayAddress;
                // Create the PDF for yearly dues statements
                if (index > 0) {
                    // If not the first record for DuesNotices, then add a new page for the next parcel
                    pdfRec = pdfModule.addPage(pdfRec);
                }

                // Call function to format the yearly dues statement for an individual property
                pdfRec = pdfModule.formatYearlyDuesStatement(pdfRec, hoaRec, firstNotice);

                // log communication for notice created
                communications.LogCommunication(hoaRec.Parcel_ID, hoaRec.ownersList[0].OwnerID, commType, commDesc);
            }

        }); // End of loop through Parcels

        $("#ResultMessage").html("Yearly dues notices created, total = " + hoaRecList.length + ", (Total skipped for UseEmail = " + adminEmailSkipCnt + ")");
        // Download the PDF file
        pdfRec.pdfRec.pdf.save(util.formatDate() + "-YearlyDuesNotices.pdf");
    }

    function _duesEmails(hoaRecList,action) {
        var emailRecCnt = 0;
        var commType = 'Dues Notice Email';
        var commDesc = '';
        var sendEmailAddr = '';
        var firstNotice = false;
        var noticeType = "Additional";
        // If list of unpaid properties is the total number of properties, assume it is the 1st Dues Notice
        if (hoaRecList.length == parseInt(config.getVal('numberOfProperties'))) {
            firstNotice = true;
            noticeType = "1st";
        }
        // ************************ NEED A BETTER WAY TO FIGURE OUT FIRST NOTICES - date?  number paid against total membership?
        // maybe make it a input set by requestor (like an email to use?)

        console.log("Before adminLoop, hoaRecList.length = " + hoaRecList.length);
        $ResultMessage.html("Executing Admin request...(processing list)");

        $.each(hoaRecList, function (index, hoaRec) {
            /*
            sendEmailAddr = hoaRec.DuesEmailAddr;
            if (action == 'DuesEmailsTest') {
                sendEmailAddr = config.getVal('duesEmailTestAddress');
            }
            */

            // If there is an email address for this property, then create the dues notice attachment
            //???????????????
            // NO - CAN'T USE THE COMMON PDF with the global !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
            if (hoaRec.emailAddrList.length > 0) {
                emailRecCnt++;
                //console.log(index + ", ParcelId = " + hoaRec.Parcel_ID + ", OwnerID = " + hoaRec.ownersList[0].OwnerID + ", Owner = " + hoaRec.ownersList[0].Owner_Name1 + ", sendEmailAddr = " + sendEmailAddr);
                // Initialize the PDF object
                pdfRec.pdf.init('Member Dues Notice', 'letter');
                // Call function to format the yearly dues statement for an individual property
                _formatYearlyDuesStatement(hoaRec, firstNotice);
            }

            // loop through email address list and send to each one
            $.each(hoaRec.emailAddrList, function (index2, emailAddr) {
                sendEmailAddr = emailAddr;
                console.log(index + " " + index2 + ", ParcelId = " + hoaRec.Parcel_ID + ", OwnerID = " + hoaRec.ownersList[0].OwnerID + ", Owner = " + hoaRec.ownersList[0].Owner_Name1 + ", sendEmailAddr = " + sendEmailAddr);
                if (action == 'DuesEmailsTest') {
                    sendEmailAddr = config.getVal('duesEmailTestAddress');
                }

                /*
                var paramMap = new Map();
                paramMap.set('action', event.target.getAttribute("data-ConfigAction"));
                //console.log("util.getJSONfromInputs($EditTable,paramMap) = " + util.getJSONfromInputs($EditTable, paramMap));
                $.ajax("updHoaConfig.php", {
                    type: "POST",
                    contentType: "application/json",
                    data: util.getJSONfromInputs($EditTable, paramMap),
                    dataType: "json",
                    success: function (list) {
                        util.defaultCursor();
                        // Set the newest list from the update into the module variable (for render)
                        hoaConfigRecList = list;
                        _render();
                        $EditPage.modal("hide");
                        $displayPage.tab('show');
                    },
                    error: function () {
                        $editValidationError.html("An error occurred in the update - see log");
                    }
                });
                */
                //.post(URL, data, function (data, status, xhr), dataType)

                $.post("sendMail.php", {
                    toEmail: sendEmailAddr,
                    subject: config.getVal('hoaNameShort') + ' Dues Notice',
                    messageStr: 'Attached is the ' + config.getVal('hoaName') + ' Dues Notice.  *** Reply to this email to request unsubscribe ***',
                    filename: config.getVal('hoaNameShort') + 'DuesNotice.pdf',
                    filedata: btoa(pdfRec.pdf.getOutput())
                }, function (response, status) {
                    console.log("response from sendMail = " + response + ", status = "+status);
                    /*
                    $sendEmailRec -> result = '';
                    $sendEmailRec -> message = '';
                    $sendEmailRec -> sendEmailAddr = $toEmail;
                    if (response.result == 'SUCCESS') {
                        commDesc = noticeType + " Dues Notice emailed to " + response.sendEmailAddr;
                    } else {
                        commDesc = noticeType + " Dues Notice, ERROR emailing to " + response.sendEmailAddr;
                        util.displayError(commDesc + ", ParcelId = " + hoaRec.Parcel_ID);
                    }
                    // log communication for notice created
                    if (action != 'DuesEmailsTest') {
                        communications.LogCommunication(hoaRec.Parcel_ID, hoaRec.ownersList[0].OwnerID, commType, commDesc);
                    }
                    */

                }); // End of $.post("sendMail.php"

            }); // End of loop through Parcels


            // just check for a valid email address (NOT UseEmail - just use that to skip in the else)
            // if (hoaRec.UseEmail || action == 'DuesEmailsTest') {
            /*
            if (sendEmailAddr != '') {
                emailRecCnt++;
                console.log(index + ", ParcelId = " + hoaRec.Parcel_ID + ", OwnerID = " + hoaRec.ownersList[0].OwnerID + ", Owner = " + hoaRec.ownersList[0].Owner_Name1 + ", sendEmailAddr = " + sendEmailAddr);

                // Initialize the PDF object
                pdfRec.pdf.init('Member Dues Notice', 'letter');

                // Call function to format the yearly dues statement for an individual property
                _formatYearlyDuesStatement(hoaRec, firstNotice);

                // swiftmailer PHP read receipt capability
                // $message -> setReadReceiptTo('your@address.tld');
                // When the email is opened, if the mail client supports it a notification will be sent to this address.
                // Read receipts won't work for the majority of recipients since many mail clients auto-disable them. 
                // Those clients that will send a read receipt will make the user aware that one has been requested.

                $.post("sendMail.php", {
                    toEmail: sendEmailAddr,
                    subject: config.getVal('hoaNameShort') + ' Dues Notice',
                    messageStr: 'Attached is the ' + config.getVal('hoaName') + ' Dues Notice.  *** Reply to this email to request unsubscribe ***',
                    filename: config.getVal('hoaNameShort') + 'DuesNotice.pdf',
                    filedata: btoa(pdfRec.pdf.getOutput())
                }, function (response, status) {
                    console.log("response from sendMail = " + response + ", for sendEmailAddr = " + sendEmailAddr);
                    if (response == 'SUCCESS') {
                        commDesc = noticeType + " Dues Notice emailed to " + sendEmailAddr;
                    } else {
                        commDesc = noticeType + " Dues Notice, ERROR emailing to " + sendEmailAddr;
                        util.displayError(commDesc + ", ParcelId = " + hoaRec.Parcel_ID);
                    }
                    // log communication for notice created
                    communications.LogCommunication(hoaRec.Parcel_ID, hoaRec.ownersList[0].OwnerID, commType, commDesc);
                }); // End of $.post("sendMail.php"
            }
            */
        }); // End of loop through Parcels

        //console.log("Done with loop, cnt = " + adminRec.hoaPropertyRecList.length);
        if (action == 'DuesEmailsTest') {
            $("#ResultMessage").html("TEST Yearly dues notices emailed, total = " + emailRecCnt);
        } else {
            $("#ResultMessage").html("Yearly dues notices emailed, total = " + emailRecCnt);
        }
    }

    function formatDuesStatementResults(hoaRec) {
        var ownerRec = hoaRec.ownersList[0];
        var tr = '';
        var checkedStr = '';
        var duesStatementNotes = config.getVal('duesStatementNotes');
        duesStatementDownloadLinks.empty();
        pdfRec.pdf.setMaxLineChars(95);

        if (duesStatementNotes.length > 0) {
            pdfRec.pdf.setLineColIncrArray([1.4]);
            pdfRec.pdf.duesStatementAddLine([duesStatementNotes], null);
            pdfRec.pdf.duesStatementAddLine([''], null);
        }

        var pdfLineHeaderArray = [
                'Parcel Id',
                'Lot No',
                'Location',
                'Owner and Alt Address',
                'Phone'];
        pdfRec.pdf.setLineColIncrArray([0.6, 1.4, 0.8, 2.2, 1.9]);

        pdfRec.pdf.duesStatementAddLine([hoaRec.Parcel_ID, hoaRec.LotNo, hoaRec.Parcel_Location, ownerRec.Mailing_Name,
        ownerRec.Owner_Phone], pdfLineHeaderArray);

        if (hoaRec.ownersList[0].AlternateMailing) {
            pdfRec.pdf.duesStatementAddLine(['', '', '', ownerRec.Alt_Address_Line1, ''], null);
            if (ownerRec.Alt_Address_Line2 != '') {
                pdfRec.pdf.duesStatementAddLine(['', '', '', ownerRec.Alt_Address_Line2, ''], null);
            }
            pdfRec.pdf.duesStatementAddLine(['', '', '', ownerRec.Alt_City + ', ' + ownerRec.Alt_State + ' ' + ownerRec.Alt_Zip, ''], null);
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

        pdfRec.pdf.setLineColIncrArray([0.6, 4.2, 0.5]);
        pdfRec.pdf.duesStatementAddLine([''], null);

        tr = '';
        $.each(hoaRec.totalDuesCalcList, function (index, rec) {
            tr = tr + '<tr>';
            tr = tr + '<td>' + rec.calcDesc + '</td>';
            tr = tr + '<td>$</td>';
            tr = tr + '<td align="right">' + parseFloat('' + rec.calcValue).toFixed(2) + '</td>';
            tr = tr + '</tr>';
            pdfRec.pdf.duesStatementAddLine([rec.calcDesc, '$', parseFloat('' + rec.calcValue).toFixed(2)], null);
        });
        tr = tr + '<tr>';
        tr = tr + '<td><b>Total Due:</b></td>';
        tr = tr + '<td><b>$</b></td>';
        tr = tr + '<td align="right"><b>' + parseFloat('' + hoaRec.TotalDue).toFixed(2) + '</b></td>';
        tr = tr + '</tr>';
        pdfRec.pdf.duesStatementAddLine(['Total Due:', '$', parseFloat('' + hoaRec.TotalDue).toFixed(2)], null);

        tr = tr + '<tr>';
        tr = tr + '<td>' + hoaRec.assessmentsList[0].LienComment + '</td>';
        tr = tr + '<td></td>';
        tr = tr + '<td align="right"></td>';
        tr = tr + '</tr>';
        $("#DuesStatementCalculationTable tbody").html(tr);
        pdfRec.pdf.duesStatementAddLine([hoaRec.assessmentsList[0].LienComment, '', ''], null);

        pdfRec.pdf.duesStatementAddLine([''], null);

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
                pdfRec.pdf.setLineColIncrArray([0.6, 0.8, 1.0, 1.7, 0.8, 1.5]);
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
            pdfRec.pdf.duesStatementAddLine([rec.FY, rec.DuesAmt, rec.DateDue, util.setBoolText(rec.Paid), util.setBoolText(rec.NonCollectible), rec.DatePaid], pdfLineHeaderArray);
        });

        $DuesStatementAssessmentsTable.html(tr);

    } // End of function formatDuesStatementResults(hoaRec){


    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        //getHoaRec: getHoaRec
    };

})(); // var admin = (function(){
