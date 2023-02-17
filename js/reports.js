/*==============================================================================
 * (C) Copyright 2015,2016,2017,2018 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-09-08 JJK   Added GetSalesReport to show sales to HOA properties
 * 2016-04-14 JJK   Adding Dues Report (working on csv and pdf downloads)
 * 2016-04-20 JJK   Completed test Dues Statement PDF
 * 2016-04-22 JJK	Finishing up reports (added util.formatDate and util.csvFilter)
 * 2016-06-10 JJK   Corrected reports query to remove current owner condition
 * 2017-06-10 JJK   Added unpaid dues ranking
 * 2016-07-07 JJK   Increased database field lengths for text fields and
 * 					updated UI. Checked comments word wrap.
 * 					Corrected CSV output for reports to have one set of
 * 					MailingAddress fields set from parcel location or
 * 					Alt mailing address (if specified)
 * 2018-11-13 JJK   Re-factored for modules
 * 2019-01-19 JJK   Added Parcel Id to the unpaid dues ranking list
 * 2020-08-03 JJK   Re-factored for new error handling
 * 2020-08-15 JJK   Added Issues Report
 * 2020-08-25 JJK   Added WelcomeSent flag set (from the Sales report)
 * 2020-10-02 JJK   Started Mailing List development
 * 2020-10-10 JJK   Added checkboxes to log mailed and moved the filter
 *                  logic to the PHP query
 * 2020-10-14 JJK   Modified to use common getHoaRecList function and
 *                  removed call to AdminExecute for dues rank list
 * 2020-12-22 JJK   Re-factored for Bootstrap 4
 * 2021-02-02 JJK   Added fields to the mailing list for dues letters
 * 2021-05-13 JJK   Updated the Issues Report format to include name
 *============================================================================*/
var reports = (function () {
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    // Global variable to hold CSV content for downloading
    var csvContent;
    var pdf;
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

    //=================================================================================================================
    // Variables cached from the DOM
    var $moduleDiv = $('#ReportsPage');
    var $ajaxError = $moduleDiv.find(".ajaxError");
    var $ReportHeader = $moduleDiv.find("#ReportHeader");
    var $ReportFilter = $moduleDiv.find("#ReportFilter");
    var $ReportListDisplay = $("#ReportListDisplay tbody");
    var $ReportRecCnt = $("#ReportRecCnt");
    var $ReportDownloadLinks = $("#ReportDownloadLinks");

    //=================================================================================================================
    // Bind events
    $moduleDiv.on("click", ".reportRequest", _reportRequest);
    $moduleDiv.on("click", ".reportFilter", _reportFilter);
    $moduleDiv.on("click", "#DownloadReportCSV", _downloadReportCSV);
    $moduleDiv.on("click", "#DownloadReportPDF", _downloadReportPDF);
    $moduleDiv.on("click", ".SalesFlagUpdate", _salesFlagUpdate);

    //=================================================================================================================
    // Module methods

    function _reportFilter(event) {
        var reportTitle = event.target.getAttribute("data-reportTitle");
        $ReportListDisplay.html("");
        $ReportRecCnt.html("");
        $ReportDownloadLinks.html("");

        $ReportHeader.html(reportTitle);
        $ReportFilter.empty();

        // check user logged in
            $ReportFilter
                .append($('<input>')
                    .prop('id', "MailingListName")
                    .attr('name', "MailingListName")
                    .attr('type', "radio")
                    .attr('checked', "checked")
                    .attr('value', "WelcomeLetters")).append($('<label class="ml-2">').html("Welcome Letters (property addresses, Sales WelcomeSent = S)"))
                $ReportFilter.append($('<input class="ml-4">')
                    .prop('id', "LogWelcomeLetters")
                    .attr('name', "LogWelcomeLetters")
                    .attr('type', "checkbox"))
                    .append($('<label>').html("&nbsp; Mark Welcome Letters as MAILED"))
            $ReportFilter.append($('</br>'))
            $ReportFilter.append($('<input>')
                    .prop('id', "MailingListName")
                    .attr('name', "MailingListName")
                    .attr('type', "radio")
                    .attr('value', "Newsletter")).append($('<label class="ml-2">').html("Newsletter (ALL property addresses)")).append($('</br>'))
                .append($('<input>')
                    .prop('id', "MailingListName")
                    .attr('name', "MailingListName")
                    .attr('type', "radio")
                    .attr('value', "Duesletter1")).append($('<label class="ml-2">').html("Dues Letter 1st Notice (ALL owner addresses using ALT if set, skipping UseEmail)"))
            $ReportFilter.append($('</br>'))
                .append($('<input>')
                    .prop('id', "MailingListName")
                    .attr('name', "MailingListName")
                    .attr('type', "radio")
                    .attr('value', "Duesletter2")).append($('<label class="ml-2">').html("Dues Letter 2nd Notice (Unpaid owner addresses using ALT if set)"))
                $ReportFilter.append($('<input class="ml-4">')
                    .prop('id', "LogDuesLetterSend")
                    .attr('name', "LogDuesLetterSend")
                    .attr('type', "checkbox"))
                    .append($('<label class="ml-2">').html("Mark Dues Letters (1 or 2) as MAILED"))
            $ReportFilter.append($('</br>'))
            $ReportFilter.append($('<a class="m-2">')
                    .prop('id', "MailingListReport")
                    .attr('href', "#")
                    .attr('class', "btn btn-primary reportRequest")
                    .attr('data-reportTitle', reportTitle)
                    .attr('role', "button")
                    .html("Create List")).append($('</br>'))
    }

    function _reportRequest(event) {
        var reportName = event.target.getAttribute("id");
        var reportTitle = event.target.getAttribute("data-reportTitle");
        $ReportHeader.html("Executing report query...");
        $ReportListDisplay.html("");
        $ReportRecCnt.html("");
        $ReportDownloadLinks.html("");

        // check user logged in
            var mailingListName = '';
            var logWelcomeLetters = '';
            var logDuesLetterSend = '';
            if (reportName == 'MailingListReport') {
                mailingListName = $('input:radio[name=MailingListName]:checked').val();
                logDuesLetterSend = $('#LogDuesLetterSend').is(":checked");
                logWelcomeLetters = $('#LogWelcomeLetters').is(":checked");
            } else {
                $ReportFilter.empty();
            }

            $.getJSON("getHoaReportData.php", "reportName=" + reportName + "&mailingListName="
                  + mailingListName + "&logDuesLetterSend=" + logDuesLetterSend+"&logWelcomeLetters="+logWelcomeLetters, function (result) {
                if (result.error) {
                    console.log("error = " + result.error);
                    $ajaxError.html("<b>" + result.error + "</b>");
                } else {
                    var reportList = result;
                    if (reportName == 'UnpaidDuesRankingReport') {
                        _duesRank(reportList, reportName);
                    } else {
                        _formatReportList(reportName, reportTitle, reportList, mailingListName);
                    }
                }
            });

    }

    function _duesRank(hoaRecList, reportName) {
        var unpaidDuesCnt = 0;
        var csvLine = "";
        csvContent = "";

        // Sort the array by the TotalDue for the property
        hoaRecList.sort(function (a, b) {
            // Sort descending
            return b.TotalDue - a.TotalDue;
        });

        // Create the CSV header/column name line
        csvLine = "ParcelId";
        csvLine += ',' + "ParcelLocation";
        csvLine += ',' + "TotalDue";
        csvContent += csvLine + '\n';

        $.each(hoaRecList, function (index, hoaRec) {
            if (hoaRec.TotalDue > 0) {
                unpaidDuesCnt++;
                csvLine = util.csvFilter(hoaRec.Parcel_ID);
                csvLine += ',' + util.csvFilter(hoaRec.Parcel_Location);
                csvLine += ',' + util.csvFilter(hoaRec.TotalDue);
                csvContent += csvLine + '\n';
            }
        }); // End of loop through Parcels

        $ReportDownloadLinks.append(
            $('<a>').prop('id', 'DownloadReportCSV')
                .attr('href', '#')
                .attr('class', "btn btn-small btn-warning")
                .attr('data-reportName', util.formatDate() + '-' + reportName)
                .html('Download CSV'));

        $ReportRecCnt.html("Unpaid Dues Ranking, total = " + unpaidDuesCnt);
    }

    function _downloadReportCSV(event) {
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var pom = document.createElement('a');
        var url = URL.createObjectURL(blob);
        pom.href = url;
        pom.setAttribute('download', event.target.getAttribute("data-reportName") + ".csv");
        pom.click();
    };

    function _downloadReportPDF(event) {
        pdf.save(event.target.getAttribute("data-reportName") + ".pdf");
    };

    function _salesFlagUpdate(event) {
        var reportName = event.target.getAttribute('id');
        var reportTitle = event.target.getAttribute("data-reportTitle");
        var paramMap = new Map();
        paramMap.set('PARID', event.target.getAttribute("data-parcelId"));
        paramMap.set('SALEDT', event.target.getAttribute("data-saleDate"));
        paramMap.set('ACTION', event.target.getAttribute("data-Action"));

        //console.log("util.getJSONfromInputs(null,paramMap) = " + util.getJSONfromInputs(null, paramMap));

        $.ajax("updHoaSales.php", {
            type: "POST",
            contentType: "application/json",
            data: util.getJSONfromInputs(null, paramMap),
            dataType: "text",
            success: function (results) {
                // Re-query and re-display the report list
                $ReportHeader.html("");
                $ReportListDisplay.html("");
                $ReportRecCnt.html("");
                $ReportDownloadLinks.html("");

                $.getJSON("getHoaReportData.php", "reportName=" + reportName, function (reportList) {
                    _formatReportList(reportName, reportTitle, reportList);
                });
            },
            error: function () {
                console.log("An error occurred in the Sales update");
            }
        });
    }

    function _formatReportList(reportName, reportTitle, reportList, mailingListName) {
        var currSysDate = new Date();
        var reportTitleFull = '';
        var reportYear = '';
        $ReportListDisplay.empty();
        $ReportRecCnt.html("");
        $ReportDownloadLinks.empty();

        pdfPageCnt = 0;
        pdfLineCnt = 0;
        var csvLine = "";
        csvContent = "";
        var paidCnt = 0;
        var unpaidCnt = 0;

        var tr = '';
        var rowId = 0;

        if (reportName == "SalesReport" || reportName == "SalesNewOwnerReport") {
            reportTitleFull = reportTitle;

            $.each(reportList, function (index, hoaSalesRec) {
                rowId = index + 1;

                if (index == 0) {
                    if (reportName == "SalesNewOwnerReport") {
                        $('<tr>')
                            .append($('<th>').html('Row'))
                            .append($('<th>').html('Sale Date'))
                            .append($('<th>').html('Parcel Location'))
                            .append($('<th>').html('Old Owner Name'))
                            .append($('<th>').html('New Owner Name'))
                            .append($('<th>').html('Mailing Name'))
                            .appendTo($ReportListDisplay);
                    } else {
                        $('<tr>')
                            .append($('<th>').html('Row'))
                            .append($('<th>').html('Welcome Sent'))
                            .append($('<th>').html('Sale Date'))
                            .append($('<th>').html('Parcel Location'))
                            .append($('<th>').html('Old Owner Name'))
                            .append($('<th>').html('New Owner Name'))
                            .append($('<th>').html('Mailing Name'))
                            .appendTo($ReportListDisplay);
                    }
                }

                tr = $('<tr class="small">');
                tr.append($('<td>').html(index + 1))

                if (reportName == "SalesReport") {
                    // If WelcomeSent has not been set, offer the buttons to set the value
                    if (hoaSalesRec.adminLevel > 1 &&
                        (hoaSalesRec.WelcomeSent == null || hoaSalesRec.WelcomeSent == 'X' || hoaSalesRec.WelcomeSent == ' ' || hoaSalesRec.WelcomeSent == '')) {
                        // offer buttons for Send and Ignore
                        tr.append($('<td>')
                            .append($('<a>').prop('id', reportName)
                                .attr('data-reportTitle', reportTitleFull)
                                .attr('data-parcelId', hoaSalesRec.PARID)
                                .attr('data-saleDate', hoaSalesRec.SALEDT)
                                .attr('data-Action', "WelcomeSend")
                                .attr('href', "#")
                                .attr('class', "btn btn-success btn-sm SalesFlagUpdate")
                                .attr('role', "button")
                                .html("Send"))
                            .append($('<a>').prop('id', reportName)
                                .attr('data-reportTitle', reportTitleFull)
                                .attr('data-parcelId', hoaSalesRec.PARID)
                                .attr('data-saleDate', hoaSalesRec.SALEDT)
                                .attr('data-Action', "WelcomeIgnore")
                                .attr('href', "#")
                                .attr('class', "btn btn-warning btn-sm SalesFlagUpdate")
                                .attr('role', "button")
                                .html("Ignore"))
                        );
                    } else {
                        tr.append($('<td>').html(hoaSalesRec.WelcomeSent));
                    }
                }

                if (hoaSalesRec.adminLevel > 1 && reportName == "SalesNewOwnerReport") {
                    tr.append(
                        $('<td>').append($('<a>')
                                .attr('href', "#")
                                .attr('class', "SalesNewOwnerProcess")
                                .attr('data-parcelId', hoaSalesRec.PARID)
                                .attr('data-saleDate', hoaSalesRec.SALEDT)
                                .attr('data-Action', "Process")
                                .prop('style', 'margin-right:7px;')
                                .html(hoaSalesRec.SALEDT))
                            .append($('<a>').prop('id', reportName)
                                .attr('data-reportTitle', reportTitleFull)
                                .attr('data-parcelId', hoaSalesRec.PARID)
                                .attr('data-saleDate', hoaSalesRec.SALEDT)
                                .attr('data-Action', "NewOwnerIgnore")
                                .attr('href', "#")
                                .attr('class', "btn btn-warning btn-sm SalesFlagUpdate")
                                .attr('role', "button")
                                .html("Ignore"))
                    );
                } else {
                    tr.append($('<td>').html(hoaSalesRec.SALEDT));
                }

                tr.append($('<td>').html(hoaSalesRec.PARCELLOCATION))
                    .append($('<td>').html(hoaSalesRec.OLDOWN))
                    .append($('<td>').html(hoaSalesRec.OWNERNAME1))
                    .append($('<td>').html(hoaSalesRec.MAILINGNAME1 + ' ' + hoaSalesRec.MAILINGNAME2));

                tr.appendTo($ReportListDisplay);

            }); // $.each(reportList, function(index, hoaSalesRec) {
            // End of if (reportName == "SalesReport" || reportName == "SalesNewOwnerReport") {

        } else if (reportName == "IssuesReport") {
            $.each(reportList, function (index, hoaRec) {
                rowId = index + 1;

                if (index == 0) {
                    $('<tr>')
                        .append($('<th>').html('Rec'))
                        .append($('<th>').html('Location'))
                        .append($('<th>').html('Name'))
                        .append($('<th>').html('CommDesc'))
                        .appendTo($ReportListDisplay);
                }

                tr = $('<tr>');
                tr.append($('<td>').html(index + 1))
                    .append($('<td>').html(hoaRec.Parcel_Location))
                    .append($('<td>').html(hoaRec.ownersList[0].Mailing_Name))
                    //.append($('<td>').html(hoaRec.commList[0].CommDesc.substr(0,80)))
                    .append($('<td>').html(hoaRec.commList[0].CommDesc))
                tr.appendTo($ReportListDisplay);

            }); // $.each(reportList, function(index, hoaRec) {

        } else if (reportName == "PaidDuesCountsReport") {

            $.each(reportList, function (index, cntsRec) {
                rowId = index + 1;

                if (index == 0) {
                    $('<tr>')
                        .append($('<th>').html('Fiscal Year'))
                        .append($('<th>').html('Paid Count'))
                        .append($('<th>').html('UnPaid Count'))
                        .append($('<th>').html('Non-collectible Count'))
                        .append($('<th>').html('Total UnPaid Dues'))
                        .append($('<th>').html('Total Non-collectible Dues'))
                        .appendTo($ReportListDisplay);

                    reportTitleFull = reportTitle;
                    pdfTitle = reportTitleFull;
                    pdfTimestamp = currSysDate.toString().substr(0, 24);

                    csvLine = util.csvFilter("FiscalYear");
                    csvLine += ',' + util.csvFilter("PaidCount");
                    csvLine += ',' + util.csvFilter("UnPaidCount");
                    csvLine += ',' + util.csvFilter("NonCollCount");
                    csvLine += ',' + util.csvFilter("TotalUnPaidDues");
                    csvLine += ',' + util.csvFilter("TotalNonCollDues");
                    csvContent += csvLine + '\n';
                }

                tr = $('<tr>');
                tr.append($('<td>').html(cntsRec.fy))
                  .append($('<td>').html(cntsRec.paidCnt))
                  .append($('<td>').html(cntsRec.unpaidCnt))
                  .append($('<td>').html(cntsRec.nonCollCnt))
                  .append($('<td>').html( util.formatMoney(cntsRec.totalDue) ))
                  .append($('<td>').html( util.formatMoney(cntsRec.nonCollDue) ))
                tr.appendTo($ReportListDisplay);

                csvLine = util.csvFilter(cntsRec.fy);
                csvLine += ',' + util.csvFilter(cntsRec.paidCnt);
                csvLine += ',' + util.csvFilter(cntsRec.unpaidCnt);
                csvLine += ',' + util.csvFilter(cntsRec.nonCollCnt);
                csvLine += ',' + util.csvFilter(util.formatMoney(cntsRec.totalDue));
                csvLine += ',' + util.csvFilter(util.formatMoney(cntsRec.nonCollDue));
                csvContent += csvLine + '\n';

            }); // $.each(reportList, function(index, cntsRec) {

            $ReportDownloadLinks.append(
                $('<a>').prop('id', 'DownloadReportCSV')
                    .attr('href', '#')
                    .attr('class', "btn btn-sm btn-warning")
                    .attr('data-reportName', util.formatDate() + '-' + reportName)
                    .html('Download CSV'));

        } else if (reportName == "MailingListReport") {
            // Loop through the list of properties / current owner
            var totalDue = 0.0;
            var recCnt = 0;
            var DateDue2 = config.getVal('dueDate2');
            var noticeDate = util.formatDateMonth();
            $.each(reportList, function (index, hoaRec) {
                totalDue = util.formatMoney(hoaRec.TotalDue);
                //console.log('TotalDue = ' + util.formatMoney(hoaRec.TotalDue));

                /* >>> moved this logic to the PHP query
                // If creating Dues Letters, skip properties that don't owe anything
                if (mailingListName.startsWith('Duesletter') && totalDue < 0.01) {
                    return true;
                }
                // Skip postal mail for 1st Notices if Member has asked to use Email
                if (mailingListName == 'Duesletter1' && hoaRec.UseEmail) {
                    return true;
                }
                */

                recCnt = recCnt + 1;
                rowId = recCnt;

                if (recCnt == 1) {
                    tr = $('<tr>');
                    tr.append($('<th>').html('Rec'))
                        .append($('<th>').html('Parcel Id'))
                        .append($('<th>').html('Name'))
                        .append($('<th>').html('Address'))
                        .append($('<th>').html('City'))
                        .append($('<th>').html('State'))
                        .append($('<th>').html('Zip'))
                        .append($('<th>').html('Total Due'));
                    tr.appendTo($ReportListDisplay);

                    reportYear = hoaRec.assessmentsList[0].FY;
                    reportTitleFull = reportTitle + " - " + mailingListName;

                    csvLine = util.csvFilter("RecId");
                    csvLine += ',' + util.csvFilter("ParcelID");
                    csvLine += ',' + util.csvFilter("ParcelLocation");
                    csvLine += ',' + util.csvFilter("MailingName");
                    csvLine += ',' + util.csvFilter("MailingAddressLine1");
                    csvLine += ',' + util.csvFilter("MailingAddressLine2");
                    csvLine += ',' + util.csvFilter("MailingCity");
                    csvLine += ',' + util.csvFilter("MailingState");
                    csvLine += ',' + util.csvFilter("MailingZip");
                    csvLine += ',' + util.csvFilter("OwnerPhone");
                    csvLine += ',' + util.csvFilter("FiscalYear");
                    csvLine += ',' + util.csvFilter("DuesAmt");
                    csvLine += ',' + util.csvFilter("TotalDue");
                    csvLine += ',' + util.csvFilter("Paid");
                    csvLine += ',' + util.csvFilter("NonCollectible");
                    csvLine += ',' + util.csvFilter("DateDue");
                    csvLine += ',' + util.csvFilter("UseEmail");
                    csvLine += ',' + util.csvFilter("FiscalYearPrev");
                    csvLine += ',' + util.csvFilter("DateDue2");
                    csvLine += ',' + util.csvFilter("NoticeDate");
                    csvLine += ',' + util.csvFilter("Email");
                    csvLine += ',' + util.csvFilter("Email2");
                    csvContent += csvLine + '\n';
                }

                tr = $('<tr>');
                tr.append($('<td>').html(recCnt))
                    .append($('<td>').html(hoaRec.Parcel_ID))
                    .append($('<td>').html(hoaRec.ownersList[0].Mailing_Name))

                if (mailingListName.startsWith('Duesletter') && hoaRec.ownersList[0].AlternateMailing) {
                    tr.append($('<td>').html(hoaRec.ownersList[0].Alt_Address_Line1 + ' ' + hoaRec.ownersList[0].Alt_Address_Line2))
                        .append($('<td>').html(hoaRec.ownersList[0].Alt_City))
                        .append($('<td>').html(hoaRec.ownersList[0].Alt_State))
                        .append($('<td>').html(hoaRec.ownersList[0].Alt_Zip));
                } else {
                    tr.append($('<td>').html(hoaRec.Parcel_Location))
                        .append($('<td>').html(hoaRec.Property_City))
                        .append($('<td>').html(hoaRec.Property_State))
                        .append($('<td>').html(hoaRec.Property_Zip));
                }
                tr.append($('<td>').html(totalDue));
                tr.appendTo($ReportListDisplay);

                csvLine = util.csvFilter(recCnt);
                csvLine += ',' + util.csvFilter(hoaRec.Parcel_ID);
                csvLine += ',' + util.csvFilter(hoaRec.Parcel_Location);
                csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Mailing_Name);

                if (mailingListName.startsWith('Duesletter') && hoaRec.ownersList[0].AlternateMailing) {
                    csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Alt_Address_Line1);
                    csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Alt_Address_Line2);
                    csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Alt_City);
                    csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Alt_State);
                    csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Alt_Zip);
                } else {
                    csvLine += ',' + util.csvFilter(hoaRec.Parcel_Location);
                    csvLine += ',' + util.csvFilter("");
                    csvLine += ',' + util.csvFilter(hoaRec.Property_City);
                    csvLine += ',' + util.csvFilter(hoaRec.Property_State);
                    csvLine += ',' + util.csvFilter(hoaRec.Property_Zip);
                }

                csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Owner_Phone);
                csvLine += ',' + util.csvFilter(reportYear);
                if (hoaRec.assessmentsList[0].Paid) {
                    csvLine += ',$0';
                } else {
                    csvLine += ',' + util.csvFilter(hoaRec.assessmentsList[0].DuesAmt);
                }
                csvLine += ',' + util.csvFilter(totalDue);
                csvLine += ',' + util.csvFilter(util.setBoolText(hoaRec.assessmentsList[0].Paid));
                csvLine += ',' + util.csvFilter(util.setBoolText(hoaRec.assessmentsList[0].NonCollectible));
                csvLine += ',' + util.csvFilter(hoaRec.assessmentsList[0].DateDue);
                csvLine += ',' + util.csvFilter(hoaRec.UseEmail);
                csvLine += ',' + util.csvFilter(reportYear-1);
                //var tempDate = new Date(hoaRec.assessmentsList[0].DateDue);
                //var DateDue2 = util.formatDate2(tempDate);
                csvLine += ',' + util.csvFilter(DateDue2);
                csvLine += ',' + util.csvFilter(noticeDate);
                csvLine += ',' + util.csvFilter(hoaRec.DuesEmailAddr);
                csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].EmailAddr2);
                csvContent += csvLine + '\n';

            }); // $.each(reportList, function(index, hoaRec) {

            $ReportDownloadLinks.append(
                $('<a>').prop('id', 'DownloadReportCSV')
                    .attr('href', '#')
                    .attr('class', "btn btn-sm btn-warning")
                    .attr('data-reportName', util.formatDate() + '-' + reportName +'-'+ mailingListName)
                    .html('Download CSV'));

        } else {

            // Loop through the list of properties / current owner
            $.each(reportList, function (index, hoaRec) {
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
                        .appendTo($ReportListDisplay);

                    reportYear = hoaRec.assessmentsList[0].FY;
                    reportTitleFull = reportTitle + " for Fiscal Year " + reportYear + " (Oct. 1, " + (reportYear - 1) + " to Sept. 30, " + reportYear + ")";
                    pdfTitle = reportTitleFull;
                    pdfTimestamp = currSysDate.toString().substr(0, 24) + ", Number of records = " + reportList.length;

                    pdfLineHeaderArray = [
                        'Row',
                        'Parcel Id',
                        'Lot No',
                        'Location',
                        'Owner and Alt Address',
                        'Phone',
                        'Dues Amt',
                        'Paid'];
                    pdfLineColIncrArray = [0.75, 0.5, 1.3, 0.8, 2.2, 2.5, 1.2, 0.8];

                    // maybe for CSV just 1 set of mailing address fields (with either parcel location or Alt. address)

                    csvLine = util.csvFilter("RecId");
                    csvLine += ',' + util.csvFilter("ParcelID");
                    csvLine += ',' + util.csvFilter("LotNo");
                    csvLine += ',' + util.csvFilter("ParcelLocation");
                    csvLine += ',' + util.csvFilter("OwnerName1");
                    csvLine += ',' + util.csvFilter("OwnerName2");
                    csvLine += ',' + util.csvFilter("OwnerPhone");
                    csvLine += ',' + util.csvFilter("MailingName");
                    csvLine += ',' + util.csvFilter("MailingAddressLine1");
                    csvLine += ',' + util.csvFilter("MailingAddressLine2");
                    csvLine += ',' + util.csvFilter("MailingCity");
                    csvLine += ',' + util.csvFilter("MailingState");
                    csvLine += ',' + util.csvFilter("MailingZip");
                    csvLine += ',' + util.csvFilter("FiscalYear");
                    csvLine += ',' + util.csvFilter("DuesAmt");
                    csvLine += ',' + util.csvFilter("Paid");
                    csvLine += ',' + util.csvFilter("NonCollectible");
                    csvLine += ',' + util.csvFilter("DateDue");
                    csvLine += ',' + util.csvFilter("UseEmail");
                    csvContent += csvLine + '\n';
                }

                //.append($('<td>').html(hoaRec.ownersList[0].Owner_Name1+" "+hoaRec.ownersList[0].Owner_Name2))

                tr = $('<tr>');
                tr.append($('<td>').html(index + 1))
                    .append($('<td>').html(hoaRec.Parcel_ID))
                    .append($('<td>').html(hoaRec.LotNo))
                    .append($('<td>').html(hoaRec.Parcel_Location))
                    .append($('<td>').html(hoaRec.ownersList[0].Mailing_Name))
                    .append($('<td>').html(hoaRec.ownersList[0].Owner_Phone))
                    .append($('<td>').html(hoaRec.assessmentsList[0].DuesAmt))
                    .append($('<td>').html(util.setBoolText(hoaRec.assessmentsList[0].Paid)));
                tr.appendTo($ReportListDisplay);

                _reportPDFaddLine([index + 1, hoaRec.Parcel_ID, hoaRec.LotNo, hoaRec.Parcel_Location, hoaRec.ownersList[0].Mailing_Name,
                hoaRec.ownersList[0].Owner_Phone, hoaRec.assessmentsList[0].DuesAmt, util.setBoolText(hoaRec.assessmentsList[0].Paid)]);

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
                    tr3.appendTo($ReportListDisplay);

                    _reportPDFaddLine(['', '', '', '', hoaRec.ownersList[0].Alt_Address_Line1, '', '', '']);

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
                        tr4.appendTo($ReportListDisplay);

                        _reportPDFaddLine(['', '', '', '', hoaRec.ownersList[0].Alt_Address_Line2, '', '', '']);
                    }

                    var tr5 = $('<tr>');
                    tr5.append($('<td>').html(''))
                        .append($('<td>').html(''))
                        .append($('<td>').html(''))
                        .append($('<td>').html(''))
                        .append($('<td>').html(hoaRec.ownersList[0].Alt_City + ', ' + hoaRec.ownersList[0].Alt_State + ' ' + hoaRec.ownersList[0].Alt_Zip))
                        .append($('<td>').html(''))
                        .append($('<td>').html(''))
                        .append($('<td>').html(''));
                    tr5.appendTo($ReportListDisplay);

                    _reportPDFaddLine(['', '', '', '', hoaRec.ownersList[0].Alt_City + ', ' + hoaRec.ownersList[0].Alt_State + ' ' + hoaRec.ownersList[0].Alt_Zip, '', '', '']);
                }

                csvLine = util.csvFilter(index + 1);
                csvLine += ',' + util.csvFilter(hoaRec.Parcel_ID);
                csvLine += ',' + util.csvFilter(hoaRec.LotNo);
                csvLine += ',' + util.csvFilter(hoaRec.Parcel_Location);
                csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Owner_Name1);
                csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Owner_Name2);
                csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Owner_Phone);
                csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Mailing_Name);

                if (hoaRec.ownersList[0].AlternateMailing) {
                    csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Alt_Address_Line1);
                    csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Alt_Address_Line2);
                    csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Alt_City);
                    csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Alt_State);
                    csvLine += ',' + util.csvFilter(hoaRec.ownersList[0].Alt_Zip);

                } else {
                    csvLine += ',' + util.csvFilter(hoaRec.Parcel_Location);
                    csvLine += ',' + util.csvFilter("");
                    csvLine += ',' + util.csvFilter(hoaRec.Property_City);
                    csvLine += ',' + util.csvFilter(hoaRec.Property_State);
                    csvLine += ',' + util.csvFilter(hoaRec.Property_Zip);
                }

                csvLine += ',' + util.csvFilter(reportYear);
                csvLine += ',' + util.csvFilter(hoaRec.assessmentsList[0].DuesAmt);
                csvLine += ',' + util.csvFilter(util.setBoolText(hoaRec.assessmentsList[0].Paid));
                csvLine += ',' + util.csvFilter(util.setBoolText(hoaRec.assessmentsList[0].NonCollectible));
                csvLine += ',' + util.csvFilter(hoaRec.assessmentsList[0].DateDue);
                csvLine += ',' + util.csvFilter(hoaRec.UseEmail);
                csvContent += csvLine + '\n';

            }); // $.each(reportList, function(index, hoaRec) {

            $ReportDownloadLinks.append(
                $('<a>').prop('id', 'DownloadReportCSV')
                    .attr('href', '#')
                    .attr('class', "btn btn-sm btn-warning")
                    .attr('data-reportName', util.formatDate() + '-' + reportName)
                    .html('Download CSV'));

            $ReportDownloadLinks.append(
                $('<a>').prop('id', 'DownloadReportPDF')
                    .attr('href', '#')
                    .attr('class', "btn btn-sm btn-danger ml-2")
                    .attr('data-reportName', util.formatDate() + '-' + reportName)
                    .html('Download PDF'));

        } // End of Properties / current owner reports

        $ReportHeader.html(reportTitleFull);
        $ReportRecCnt.html(currSysDate.toString().substr(0, 24) + ", Number of records = " + rowId);

        if (reportName == "PropertyOwnerReport") {
            $ReportRecCnt.append(" (Paid = " + paidCnt + ", Unpaid = " + unpaidCnt + ")");
        }

        if (reportName == "SalesNewOwnerReport") {
            $ReportRecCnt.append(", (Click on <b>Sale Date</b> to Create a New Owner, or <b>Ignore</b> to bypass)");
        }

    } // function formatReportList(reportName,reportList){


    // Function to add a line to the report PDF
    function _reportPDFaddLine(pdfLineArray) {
        pdfLineCnt++;
        var pdfHeader = false;
        var X = 0.0;

        if (pdfLineCnt == 1) {
            pdf = new jsPDF('l', 'in', 'letter');
            pdf.setProperties({
                title: pdfTitle,
                author: config.getVal('hoaNameShort')
            });
            pdfHeader = true;
        }

        if (pdfLineY > 7.8) {
            pdf.addPage('letter', 'l');
            pdfHeader = true;
        }

        if (pdfHeader) {
            pdfPageCnt++;
            pdf.setFontSize(9);
            pdf.text(10.2, 0.4, 'Page ' + pdfPageCnt);
            pdf.setFontSize(15);
            pdf.text(3.6, 0.45, config.getVal('hoaName'));
            pdf.setFontSize(13);
            pdf.text(2.5, 0.75, pdfTitle);
            pdf.setFontSize(10);
            pdf.text(3.8, 1.1, pdfTimestamp);
            pdf.addImage(config.getLogoImgData(), 'JPEG', 0.4, 0.3, 0.9, 0.9);
            pdf.setFontSize(10);

            pdfLineY = pdfLineYStart;
            X = 0.0;
            var i = 0;
            for (i = 0; i < pdfLineArray.length; i++) {
                X += pdfLineColIncrArray[i];
                pdf.text(X, pdfLineY, '' + pdfLineHeaderArray[i]);
            }
            pdfLineY += pdfLineIncrement / 2.0;

            X = 0.65;
            pdf.setLineWidth(0.02);
            pdf.line(X, pdfLineY, 10.5, pdfLineY);
            pdfLineY += pdfLineIncrement;
        }

        X = 0.0;
        for (i = 0; i < pdfLineArray.length; i++) {
            X += pdfLineColIncrArray[i];
            pdf.text(X, pdfLineY, '' + pdfLineArray[i]);
        }
        pdfLineY += pdfLineIncrement;

    } // End of function _reportPDFaddLine(pdfLineArray) {

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
    };

})(); // var reports = (function(){
