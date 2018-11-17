/*==============================================================================
 * (C) Copyright 2015,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION:  Configuration data and functions around the creation of
 *               a PDF file.  Depends on the following javascript library
 *                  jsPDF (https://github.com/MrRio/jsPDF)
 * 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version 
 * 2018-11-17 JJK   Moved PDF data and functions to seperate module
 *============================================================================*/
var pdf = (function () {
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var pdf;
    var pdfTitle = '';
    var pdfOrientation = 'letter';
    var pdfTimestamp = '';

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

    var hoaName = config.getVal('hoaName');
    var hoaNameShort = config.getVal('hoaNameShort');
    //var pdfLogoImgData = config.getVal('pdfLogoImgData');
    //console.log("in reports, pdfLogoImgData.length = " + pdfLogoImgData.length);
    var pdfLogoImgData;
    $.get("getLogoImgData.php", function (logoImgDataResults) {
        pdfLogoImgData = logoImgDataResults;
    });

    //=================================================================================================================
    // Module methods
    function init(inPdfTitle,inPdfOrientation) {
        pdfTitle = inPdfTitle;
        if (inPdfOrientation !== 'undefined') {
            pdfOrientation = inPdfOrientation;
        }
        // Create the PDF object
        pdf = new jsPDF('p', 'in', pdfOrientation);
        pdf.setProperties({
            title: pdfTitle,
            subject: pdfTitle,
            author: hoaName
        });

        // Initialize variables
        pdfPageCnt = 0;
        pdfLineCnt = 0;
        var currSysDate = new Date();
        pdfTimestamp = currSysDate.toString().substr(0, 24);
    }

    function download(filename) {
        pdf.save(util.formatDate()+"-"+filename+".pdf");
    }

    function addPage() {
        pdf.addPage(pdfOrientation, 'p');
        pdfLineCnt = 0;
    }

    function getTitle() {
        return pdfTitle;
    }

    function setLineIncrement(inLineIncrement) {
        pdfLineIncrement = inLineIncrement;
    }
    function setColIncrement(inColIncrement) {
        pdfColIncrement = inColIncrement;
    }

    function setLineColIncrArray(inLineColIncrArray) {
        pdfLineColIncrArray = pdfLineColIncrArray;
    }

    //Function to add a line to the Yearly Dues Statement PDF
    function yearlyDuesStatementAddLine(pdfLineArray, pdfLineHeaderArray, fontSize, lineYStart) {
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
                pdf.text(X, pdfLineY, '' + pdfLineHeaderArray[i]);
            }
            pdfLineY += pdfLineIncrement / 2.0;

            X = pdfLineColIncrArray[0];
            pdf.setLineWidth(0.015);
            pdf.line(X, pdfLineY, 8, pdfLineY);
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
            textLine = '' + pdfLineArray[i];

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

                    pdf.text(X, pdfLineY, textLine.substr(0, breakPos));
                    pdfLineY += pdfLineIncrement;
                    textLine = textLine.substr(breakPos, textLine.length - breakPos);

                } else {
                    pdf.text(X, pdfLineY, textLine);
                    textLine = '';
                }
            } // while (textLine.length > 0) {

        } // for (i = 0; i < pdfLineArray.length; i++) {
        pdfLineY += pdfLineIncrement;
        pdf.setFontType("normal");

    } // End of function yearlyDuesStatementAddLine(pdfLineArray,pdfLineHeaderArray) {


    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        init:               init,
        addPage:            addPage,
        getTitle:           getTitle,
        setLineIncrement:   setLineIncrement,
        setColIncrement:    setColIncrement,
        setLineColIncrArray: setLineColIncrArray,
        yearlyDuesStatementAddLine: yearlyDuesStatementAddLine,
        download:           download
    };




    function formatDuesStatementResults(hoaRec) {
        var tr = '';
        var checkedStr = '';

        pdfMaxLineChars = 95;

        var duesStatementDownloadLinks = $("#DuesStatementDownloadLinks");
        duesStatementDownloadLinks.empty();

        ownerRec = hoaRec.ownersList[0];

        var currSysDate = new Date();
        pdfTitle = "Member Dues Statement";
        pdfTimestamp = currSysDate.toString().substr(0, 24);

        pdfPageCnt = 0;
        pdfLineCnt = 0;

        if (duesStatementNotes.length > 0) {
            pdfLineColIncrArray = [1.4];
            duesStatementPDFaddLine([duesStatementNotes], null);
            duesStatementPDFaddLine([''], null);
        }

        pdfLineHeaderArray = [
            'Parcel Id',
            'Lot No',
            'Location',
            'Owner and Alt Address',
            'Phone'];
        pdfLineColIncrArray = [0.6, 1.4, 0.8, 2.2, 1.9];

        duesStatementPDFaddLine([hoaRec.Parcel_ID, hoaRec.LotNo, hoaRec.Parcel_Location, ownerRec.Mailing_Name,
        ownerRec.Owner_Phone], pdfLineHeaderArray);

        if (hoaRec.ownersList[0].AlternateMailing) {
            duesStatementPDFaddLine(['', '', '', ownerRec.Alt_Address_Line1, ''], null);
            if (ownerRec.Alt_Address_Line2 != '') {
                duesStatementPDFaddLine(['', '', '', ownerRec.Alt_Address_Line2, ''], null);
            }
            duesStatementPDFaddLine(['', '', '', ownerRec.Alt_City + ', ' + ownerRec.Alt_State + ' ' + ownerRec.Alt_Zip, ''], null);
        }


        tr += '<tr><th>Parcel Id:</th><td>' + hoaRec.Parcel_ID + '</a></td></tr>';
        tr += '<tr><th>Lot No:</th><td>' + hoaRec.LotNo + '</td></tr>';
        //tr += '<tr><th>Sub Division: </th><td>'+hoaRec.SubDivParcel+'</td></tr>';
        tr += '<tr><th>Location: </th><td>' + hoaRec.Parcel_Location + '</td></tr>';
        tr += '<tr><th>City State Zip: </th><td>' + hoaRec.Property_City + ', ' + hoaRec.Property_State + ' ' + hoaRec.Property_Zip + '</td></tr>';
        tr += '<tr><th>Owner Name:</th><td>' + ownerRec.Owner_Name1 + ' ' + ownerRec.Owner_Name2 + '</td></tr>';

        var tempTotalDue = '' + hoaRec.TotalDue;
        tr += '<tr><th>Total Due: </th><td>$' + stringToMoney(tempTotalDue) + '</td></tr>';
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
            $('<a>').prop('id', 'DownloadDuesStatementPDF')
                .attr('href', '#')
                .attr('class', "btn btn-danger downloadBtn")
                .attr('data-pdfName', 'DuesStatement')
                .html('PDF'));

        pdfLineColIncrArray = [0.6, 4.2, 0.5];
        duesStatementPDFaddLine([''], null);

        tr = '';
        $.each(hoaRec.totalDuesCalcList, function (index, rec) {
            tr = tr + '<tr>';
            tr = tr + '<td>' + rec.calcDesc + '</td>';
            tr = tr + '<td>$</td>';
            tr = tr + '<td align="right">' + parseFloat('' + rec.calcValue).toFixed(2) + '</td>';
            tr = tr + '</tr>';
            duesStatementPDFaddLine([rec.calcDesc, '$', parseFloat('' + rec.calcValue).toFixed(2)], null);
        });
        tr = tr + '<tr>';
        tr = tr + '<td><b>Total Due:</b></td>';
        tr = tr + '<td><b>$</b></td>';
        tr = tr + '<td align="right"><b>' + parseFloat('' + hoaRec.TotalDue).toFixed(2) + '</b></td>';
        tr = tr + '</tr>';
        duesStatementPDFaddLine(['Total Due:', '$', parseFloat('' + hoaRec.TotalDue).toFixed(2)], null);

        tr = tr + '<tr>';
        tr = tr + '<td>' + hoaRec.assessmentsList[0].LienComment + '</td>';
        tr = tr + '<td></td>';
        tr = tr + '<td align="right"></td>';
        tr = tr + '</tr>';
        $("#DuesStatementCalculationTable tbody").html(tr);
        duesStatementPDFaddLine([hoaRec.assessmentsList[0].LienComment, '', ''], null);

        duesStatementPDFaddLine([''], null);

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
                pdfLineColIncrArray = [0.6, 0.8, 1.0, 1.7, 0.8, 1.5];
            }

            tempDuesAmt = '' + rec.DuesAmt;
            tr = tr + '<tr>';
            tr = tr + '<td>' + rec.FY + '</a></td>';
            tr = tr + '<td>' + stringToMoney(tempDuesAmt) + '</td>';
            tr = tr + '<td>' + rec.DateDue + '</td>';
            tr = tr + '<td>' + setCheckbox(rec.Paid) + '</td>';
            tr = tr + '<td>' + setCheckbox(rec.NonCollectible) + '</td>';
            tr = tr + '<td>' + rec.DatePaid + '</td>';
            tr = tr + '</tr>';
            duesStatementPDFaddLine([rec.FY, rec.DuesAmt, rec.DateDue, setBoolText(rec.Paid), setBoolText(rec.NonCollectible), rec.DatePaid], pdfLineHeaderArray);
        });

        $("#DuesStatementAssessmentsTable tbody").html(tr);

    } // End of function formatDuesStatementResults(hoaRec){

    //Function to add a line to the Dues Statement PDF
    function duesStatementPDFaddLine(pdfLineArray, pdfLineHeaderArray) {
        pdfLineCnt++;
        var pdfHeader = false;
        var X = 0.0;
        // X (horizontal), Y (vertical)

        var hoaName = '';
        var hoaNameShort = '';

        if (pdfLineCnt == 1) {
            pdf = new jsPDF('p', 'in', 'letter');
            pdf.setProperties({
                title: hoaNameShort + ' Dues Statements',
                subject: hoaNameShort + ' Dues Statements',
                author: 'Treasurer',
                keywords: 'generated, javascript, web 2.0, ajax',
                creator: 'MEEE'
            });
            pdfHeader = true;
        }

        //if (pdfLineY > 7.8) {
        if (pdfLineY > 10) {
            pdf.addPage('letter', 'p');
            pdfHeader = true;
        }

        if (pdfHeader) {
            pdfPageCnt++;

            // X (horizontal), Y (vertical)
            pdf.setFontSize(15);
            pdf.text(1.5, 0.6, hoaName);
            pdf.setFontSize(13);
            pdf.text(1.5, 0.9, pdfTitle + " - " + pdfTimestamp);
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
                pdf.text(X, pdfLineY, '' + pdfLineHeaderArray[i]);
            }
            pdfLineY += pdfLineIncrement / 2.0;

            X = pdfLineColIncrArray[0];
            pdf.setLineWidth(0.015);
            pdf.line(X, pdfLineY, 8, pdfLineY);
            pdfLineY += pdfLineIncrement;
        }

        var textLine = '';
        var breakPos = 0;
        var j = 0;
        X = 0.0;
        // Loop through all the columns in the array
        for (i = 0; i < pdfLineArray.length; i++) {
            X += pdfLineColIncrArray[i];
            textLine = '' + pdfLineArray[i];

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

                    pdf.text(X, pdfLineY, textLine.substr(0, breakPos));
                    pdfLineY += pdfLineIncrement;
                    textLine = textLine.substr(breakPos, textLine.length - breakPos);

                } else {
                    pdf.text(X, pdfLineY, textLine);
                    textLine = '';
                }
            } // while (textLine.length > 0) {

        } // for (i = 0; i < pdfLineArray.length; i++) {
        pdfLineY += pdfLineIncrement;

    }





})(); // var pdf = (function(){
