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
    var $ReportListDisplay = $("#ReportListDisplay tbody");
    var $ReportRecCnt = $("#ReportRecCnt");
    var $ReportDownloadLinks = $("#ReportDownloadLinks");
    
    //=================================================================================================================
    // Bind events
    $moduleDiv.on("click", ".reportRequest", _reportRequest);
    $moduleDiv.on("click", "#DownloadReportCSV", _downloadReportCSV);
    $moduleDiv.on("click", "#DownloadReportPDF", _downloadReportPDF);
    $moduleDiv.on("click", ".SalesNewOwnerIgnore", _salesNewOwnerIgnore);

    function _reportRequest(event) {
        var reportName = event.target.getAttribute("id");
        var reportTitle = event.target.getAttribute("data-reportTitle");
        $ReportHeader.html("");
        $ReportListDisplay.html("");
        $ReportRecCnt.html("");
        $ReportDownloadLinks.html("");

        if (reportName == 'UnpaidDuesRankingReport') {
            $ReportRecCnt.html("Executing request...(please wait)");
             
            // Get all the data needed for processing
            $.getJSON("adminExecute.php", "action=DuesRank", function (adminRec) {
                $ReportRecCnt.html(adminRec.message);
                _duesRank(adminRec.hoaRecList, reportName);
            });
        } else {
            $.getJSON("getHoaReportData.php", "reportName=" + reportName, function (result) {
                if (result.error) {
                    console.log("error = " + result.error);
                    $ajaxError.html("<b>" + result.error + "</b>");
                } else {
                    var reportList = result;
                    _formatReportList(reportName, reportTitle, reportList);
                }
            });
        }
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
                .attr('class', "btn btn-warning")
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

    function _salesNewOwnerIgnore() {
         
        var reportName = event.target.getAttribute('id');
        var reportTitle = event.target.getAttribute("data-reportTitle");
        var paramMap = new Map();
        paramMap.set('PARID', event.target.getAttribute("data-parcelId"));
        paramMap.set('SALEDT', event.target.getAttribute("data-saleDate"));

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

    //=================================================================================================================
    // Module methods
    function _formatReportList(reportName, reportTitle, reportList) {
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
                    $('<tr>')
                        .append($('<th>').html('Row'))
                        .append($('<th>').html('Sale Date'))
                        .append($('<th>').html('Parcel Location'))
                        .append($('<th>').html('Old Owner Name'))
                        .append($('<th>').html('New Owner Name'))
                        .append($('<th>').html('Mailing Name1'))
                        .append($('<th>').html('Mailing Name2'))
                        .appendTo($ReportListDisplay);
                }

                tr = $('<tr>');
                tr.append($('<td>').html(index + 1))
                if (hoaSalesRec.adminLevel > 1 && reportName == "SalesNewOwnerReport") {
                    tr.append($('<td>')
                        .append($('<a>').attr('href', "#")
                            .attr('class', "SalesNewOwnerProcess")
                            .attr('data-parcelId', hoaSalesRec.PARID)
                            .attr('data-saleDate', hoaSalesRec.SALEDT)
                            .attr('data-Action', "Process")
                            .prop('style', 'margin-right:7px;')
                            .html(hoaSalesRec.SALEDT))
                        .append($('<a>').prop('id', reportName)
                            .attr('data-reportTitle', "County Reported Sales of HOA properties (for New Owner maintenance)")
                            .attr('data-parcelId', hoaSalesRec.PARID)
                            .attr('data-saleDate', hoaSalesRec.SALEDT)
                            .attr('data-Action', "Ignore")
                            .attr('href', "#")
                            .attr('class', "btn btn-warning btn-xs SalesNewOwnerIgnore")
                            .attr('role', "button")
                            .html("Ignore")));
                } else {
                    tr.append($('<td>').html(hoaSalesRec.SALEDT));
                }

                tr.append($('<td>').html(hoaSalesRec.PARCELLOCATION))
                    .append($('<td>').html(hoaSalesRec.OLDOWN))
                    .append($('<td>').html(hoaSalesRec.OWNERNAME1))
                    .append($('<td>').html(hoaSalesRec.MAILINGNAME1))
                    .append($('<td>').html(hoaSalesRec.MAILINGNAME2));

                tr.appendTo($ReportListDisplay);

            }); // $.each(reportList, function(index, hoaSalesRec) {
            // End of if (reportName == "SalesReport" || reportName == "SalesNewOwnerReport") {

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
                    .append($('<td>').html(parseFloat('' + cntsRec.totalDue).toFixed(2)))
                    .append($('<td>').html(parseFloat('' + cntsRec.nonCollDue).toFixed(2)));
                tr.appendTo($ReportListDisplay);

                csvLine = util.csvFilter(cntsRec.fy);
                csvLine += ',' + util.csvFilter(cntsRec.paidCnt);
                csvLine += ',' + util.csvFilter(cntsRec.unpaidCnt);
                csvLine += ',' + util.csvFilter(cntsRec.nonCollCnt);
                csvLine += ',' + util.csvFilter(parseFloat('' + cntsRec.totalDue).toFixed(2))
                csvLine += ',' + util.csvFilter(parseFloat('' + cntsRec.nonCollDue).toFixed(2));
                csvContent += csvLine + '\n';

            }); // $.each(reportList, function(index, cntsRec) {

            $ReportDownloadLinks.append(
                $('<a>').prop('id', 'DownloadReportCSV')
                    .attr('href', '#')
                    .attr('class', "btn btn-warning")
                    .attr('data-reportName', util.formatDate() + '-' + reportName)
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
                    .attr('class', "btn btn-warning")
                    .attr('data-reportName', util.formatDate() + '-' + reportName)
                    .html('Download CSV'));

            // Include downloadBtn class to add space to left margin
            $ReportDownloadLinks.append(
                $('<a>').prop('id', 'DownloadReportPDF')
                    .attr('href', '#')
                    .attr('class', "btn btn-danger downloadBtn")
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
