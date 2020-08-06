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
 * 2018-11-25 JJK   Renamed to pdfModule and implemented configuration object
 *                  rather than global variables
 * 2018-11-27 JJK   Added EmailAddr2
 *============================================================================*/
var pdfModule = (function () {
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var defaultOrientation = 'letter';
    var defaultFontSize = 11;
    var startLineY = 1.5;

    //=================================================================================================================
    // Module methods
    function init(inTitle,inOrientation) {
        var currSysDate = new Date();
        var tempOrientation = defaultOrientation;
        if (inOrientation !== 'undefined') {
            tempOrientation = inOrientation;
        }

        var pdfRec = {
            title: inTitle,
            orientation: tempOrientation,
            createTimestamp: currSysDate.toString().substr(0, 24),
            lineColIncrArray: [],
            pageCnt: 0,
            lineCnt: 0,
            lineY: startLineY,
            lineIncrement: 0.25,
            colIncrement: 1.5,
            maxLineChars: 95,
            fontSize: 11,
            header: true
        };

        // Create the PDF object
        pdfRec.pdf = new jsPDF('p', 'in', pdfRec.orientation);
        pdfRec.pdf.setProperties({
            title: pdfRec.title,
            subject: pdfRec.title,
            author: config.getVal('hoaName'),
            keywords: 'generated, javascript, web 2.0, ajax',
            creator: 'MEEE'
        });

        return pdfRec;
    }

    function addPage(pdfRec) {
        pdfRec.pdf.addPage(pdfRec.orientation, 'p');
        pdfRec.lineCnt = 0;
        pdfRec.header = true;
        return pdfRec;
    }

    // function to format a Yearly dues statement and add to the PDF
    function formatYearlyDuesStatement(pdfRec, hoaRec, firstNotice) {
        var ownerRec = hoaRec.ownersList[0];
        pdfRec.maxLineChars = 95;

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

        pdfRec.lineColIncrArray = [-4.5];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[config.getVal('hoaName')], null, 13, 0.5);
        pdfRec.lineColIncrArray = [4.5, -3.05];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[pdfRec.title + " for Fiscal Year ", hoaRec.assessmentsList[0].FY], null, 12, 0.8);

        // hoa name and address for return label
        pdfRec.lineIncrement = 0.2;
        pdfRec.lineColIncrArray = [1.0];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[config.getVal('hoaName')], null, 10, 1.0);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[config.getVal('hoaAddress1')]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[config.getVal('hoaAddress2')]);

        pdfRec.lineIncrement = 0.21;
        pdfRec.lineColIncrArray = [4.5, 1.3];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["For the Period: ", 'Oct 1st, ' + noticeYear + ' thru Sept 30th, ' + hoaRec.assessmentsList[0].FY], null, 11, 1.1);
        pdfRec.lineColIncrArray = [-4.5, -1.3];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Notice Date: ", noticeDate]);

        var duesAmount = util.formatMoney(hoaRec.assessmentsList[0].DuesAmt);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Dues Amount: ", '$' + duesAmount]);
        if (hoaRec.TotalDue > duesAmount) {
            pdfRec = yearlyDuesStatementAddLine(pdfRec, ["********************* ", "There are prior year dues owed"]);
            pdfRec = yearlyDuesStatementAddLine(pdfRec, ["********************* ", "Please contact the Treasurer"]);
            pdfRec = yearlyDuesStatementAddLine(pdfRec, ["Due Date: ", 'October 1st, ' + noticeYear]);
            pdfRec.lineColIncrArray = [-4.5, 1.3];
            pdfRec = yearlyDuesStatementAddLine(pdfRec, ["Parcel Id: ", hoaRec.Parcel_ID + ", Lot: " + hoaRec.LotNo]);
        } else {
            pdfRec = yearlyDuesStatementAddLine(pdfRec,["Due Date: ", 'October 1st, ' + noticeYear]);
            pdfRec.lineColIncrArray = [-4.5, 1.3];
            pdfRec = yearlyDuesStatementAddLine(pdfRec,["Parcel Id: ", hoaRec.Parcel_ID]);
            pdfRec = yearlyDuesStatementAddLine(pdfRec,["Lot No: ", hoaRec.LotNo]);
        }

        pdfRec.lineColIncrArray = [-4.5];
        //pdfRec = yearlyDuesStatementAddLine(pdfRec,['']);
        //pdfRec = yearlyDuesStatementAddLine(pdfRec,['    Contact Information:']);
        pdfRec.lineColIncrArray = [4.5];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[ownerRec.Owner_Name1 + ' ' + ownerRec.Owner_Name2]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[hoaRec.Parcel_Location]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[hoaRec.Property_City + ', ' + hoaRec.Property_State + ' ' + hoaRec.Property_Zip]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,['Phone # ' + ownerRec.Owner_Phone]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec, ['Email: ' + hoaRec.DuesEmailAddr]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec, ['Email2: ' + ownerRec.EmailAddr2]);

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
        pdfRec.lineIncrement = 0.21;
        pdfRec.lineColIncrArray = [1.0];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[displayAddress1], null, 11, 2.5);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[displayAddress2]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[displayAddress3]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[displayAddress4]);

        // Address corrections
        pdfRec.lineIncrement = 0.3;
        pdfRec.lineColIncrArray = [-0.6];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Enter any information that needs to be corrected:"], null, 11, 4.3);
        pdfRec.lineColIncrArray = [0.6];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Owner Name:"]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Address Line 1:"]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Address Line 2:"]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["City State Zip:"]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Phone Number:"]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[""]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Email:"]);

        // Survey description, questions (1,2,3)
        // Commenting out survey for now
        //pdfRec.lineIncrement = 0.285);
        //pdfRec.lineColIncrArray = [-1.0]);
        //pdfRec = yearlyDuesStatementAddLine(pdfRec,[surveyInstructions],null,11,6.28);
        //pdfRec.lineColIncrArray = [1.0]);
        //pdfRec = yearlyDuesStatementAddLine(pdfRec,[surveyQuestion1]);
        //pdfRec = yearlyDuesStatementAddLine(pdfRec,[surveyQuestion2]);
        //pdfRec = yearlyDuesStatementAddLine(pdfRec,[surveyQuestion3]);

        pdfRec.lineIncrement = 0.15;
        pdfRec.lineColIncrArray = [1.0];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[""]);
        pdfRec.lineIncrement = 0.21;
        pdfRec.lineColIncrArray = [-1.0];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Go Paperless - check here to turn off mailed paper notices"]);
        pdfRec.lineColIncrArray = [1.0];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["(Make sure correct Email address is listed in Contact Info or entered above)"]);

        pdfRec.lineIncrement = 0.21;
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[''], null, 10, 3.9);

        // Print the Notice statement if it exists (2nd notice, etc.)
        if (yearlyDuesStatementNotice.length > 0) {
            pdfRec.maxLineChars = 35;
            pdfRec.lineColIncrArray = [-5.2];
            pdfRec = yearlyDuesStatementAddLine(pdfRec,[yearlyDuesStatementNotice], null, 12);
            pdfRec = yearlyDuesStatementAddLine(pdfRec,[''], null);
        }

        // If there are notes - print them
        pdfRec.maxLineChars = 45;
        if (yearlyDuesStatementNotes.length > 0) {
            pdfRec.lineColIncrArray = [5.2];
            pdfRec = yearlyDuesStatementAddLine(pdfRec,[yearlyDuesStatementNotes], null, 10);
        }

        // Print information on the user records portion
        pdfRec.lineColIncrArray = [-0.5];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[config.getVal('hoaName')], null, 13, 8.0);
        pdfRec.lineColIncrArray = [0.5, -3.05];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[pdfRec.title + " for Fiscal Year ", hoaRec.assessmentsList[0].FY], null, 12, 8.3);

        pdfRec.lineIncrement = 0.21;
        noticeYear = '' + parseInt(hoaRec.assessmentsList[0].FY) - 1;
        pdfRec.lineColIncrArray = [0.5, 1.5];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["For the Period: ", 'Oct 1st, ' + noticeYear + ' thru Sept 30th, ' + hoaRec.assessmentsList[0].FY], null, 11, 8.6);
        pdfRec.lineColIncrArray = [-0.5, -1.5];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Notice Date: ", noticeDate]);

        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Dues Amount: ", '$' + duesAmount]);
        if (duesAmount != hoaRec.TotalDue) {
            pdfRec = yearlyDuesStatementAddLine(pdfRec,["************************ ", "There are prior year dues owed"]);
            pdfRec = yearlyDuesStatementAddLine(pdfRec,["************************ ", "Please contact the Treasurer"]);
        }
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Due Date: ", 'October 1st, ' + noticeYear]);

        pdfRec.lineColIncrArray = [-0.5, 1.5];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,['', '']);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Parcel Id: ", hoaRec.Parcel_ID]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Lot No: ", hoaRec.LotNo]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Property Location: ", hoaRec.Parcel_Location]);

        // hoa name and address for payment
        pdfRec.lineIncrement = 0.21;
        pdfRec.lineColIncrArray = [5.2];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Make checks payable to:"], null, 11, 8.0);
        pdfRec.lineColIncrArray = [-5.2];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[config.getVal('hoaName')]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,['']);
        pdfRec.lineColIncrArray = [-5.2, 0.8];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Send to:", config.getVal('hoaNameShort')]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec, ["", config.getVal('hoaAddress1')]);
        pdfRec = yearlyDuesStatementAddLine(pdfRec, ["", config.getVal('hoaAddress2')]);

        pdfRec.lineIncrement = 0.19;
        pdfRec.lineColIncrArray = [-5.2];
        pdfRec = yearlyDuesStatementAddLine(pdfRec,['']);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Date Paid:"], null, 12);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,['']);
        pdfRec = yearlyDuesStatementAddLine(pdfRec,["Check No:"]);

        // Help notes
        pdfRec = yearlyDuesStatementAddLine(pdfRec,[''], null, 10, 10.05);
        pdfRec.maxLineChars = 55;
        // If there are notes - print them
        if (yearlyDuesStatementNotes.length > 0) {
            pdfRec.lineColIncrArray = [4.7];
            pdfRec = yearlyDuesStatementAddLine(pdfRec,[config.getVal('yearlyDuesHelpNotes')], null);
        }

        return pdfRec;
    } // End of function formatYearlyDuesStatement(hoaRec) {

    //Function to add a line to the Yearly Dues Statement PDF
    function yearlyDuesStatementAddLine(pdfRec, pdfLineArray, pdfLineHeaderArray, fontSize, lineYStart) {
        pdfRec.lineCnt++;
        var X = 0.0;
        // X (horizontal), Y (vertical)

        /*
        pdfRec.pdf.setTextColor(255,0,0);
        pdfRec.pdf.text(20, 40, 'This is red.');
    
        pdfRec.pdf.setTextColor(0,255,0);
        pdfRec.pdf.text(20, 50, 'This is green.');
    
        pdfRec.pdf.setTextColor(0,0,255);
        pdfRec.pdf.text(20, 60, 'This is blue.');
        */

        // Print header and graphic sections (at the start of each page)
        if (pdfRec.lineCnt == 1) {
            pdfRec.pageCnt++;

            // X (horizontal), Y (vertical)
            pdfRec.pdf.setFontSize(9);
            pdfRec.pdf.text(8.05, 0.3, pdfRec.pageCnt.toString());
            pdfRec.pdf.addImage(config.getLogoImgData(), 'JPEG', 0.42, 0.9, 0.53, 0.53);

            // Tri-fold lines
            pdfRec.pdf.setLineWidth(0.01);
            pdfRec.pdf.line(X, 3.75, 8.5, 3.75);
            pdfRec.pdf.setLineWidth(0.02);
            var segmentLength = 0.2;
            pdfRec = _dottedLine(pdfRec, 0, 7.5, 8.5, 7.5, segmentLength)

            // Text around bottom line
            pdfRec.pdf.setFontSize(9);
            pdfRec.pdf.text(3.0, 7.45, "Detach and mail above portion with your payment");
            pdfRec.pdf.text(3.45, 7.65, "Keep below portion for your records");

            // Information correction area
            pdfRec.pdf.setLineWidth(0.013);
            // Box around area
            //pdfRec.pdf.rect(0.4, 4.0, 4.4, 2.0);   Not including the email line
            pdfRec.pdf.rect(0.4, 4.0, 4.4, 2.6);
            // Lines for address corrections
            pdfRec.pdf.line(1.7, 4.65, 4.5, 4.65);
            pdfRec.pdf.line(1.7, 4.95, 4.5, 4.95);
            pdfRec.pdf.line(1.7, 5.25, 4.5, 5.25);
            pdfRec.pdf.line(1.7, 5.55, 4.5, 5.55);
            pdfRec.pdf.line(1.7, 5.85, 4.5, 5.85);

            // Checkboxes for survey questions
            // empty square (X,Y, X length, Y length)
            pdfRec.pdf.setLineWidth(0.015);
            //pdfRec.pdf.rect(0.5, 6.4, 0.2, 0.2); 
            pdfRec.pdf.rect(0.5, 6.7, 0.2, 0.2);
            //pdfRec.pdf.rect(0.5, 7.0, 0.2, 0.2); 

            // Date and Check No lines
            pdfRec.pdf.setLineWidth(0.013);
            pdfRec.pdf.line(6.1, 9.5, 7.5, 9.5);
            pdfRec.pdf.line(6.1, 9.9, 7.5, 9.9);

            pdfRec.lineY = startLineY;
            pdfRec.fontSize = defaultFontSize;
        }

        if (fontSize != null && fontSize !== 'undefined') {
            pdfRec.fontSize = fontSize;
        }
        if (lineYStart != null && lineYStart !== 'undefined') {
            pdfRec.lineY = lineYStart;
        }

        pdfRec.pdf.setFontSize(pdfRec.fontSize);

        if (pdfLineHeaderArray != null && pdfLineHeaderArray !== 'undefined') {
            X = 0.0;
            // Loop through all the column headers in the array
            for (i = 0; i < pdfLineArray.length; i++) {
                if (pdfRec.lineColIncrArray[i] < 0) {
                    pdfRec.pdf.setFontType("bold");
                } else {
                    pdfRec.pdf.setFontType("normal");
                }
                X += Math.abs(pdfRec.lineColIncrArray[i]);
                pdfRec.pdf.text(X, pdfRec.lineY, '' + pdfLineHeaderArray[i]);
            }
            pdfRec.lineY += pdfRec.lineIncrement / 2.0;

            X = pdfRec.lineColIncrArray[0];
            pdfRec.pdf.setLineWidth(0.015);
            pdfRec.pdf.line(X, pdfRec.lineY, 8, pdfRec.lineY);
            pdfRec.lineY += pdfRec.lineIncrement;
        }

        var textLine = '';
        var breakPos = 0;
        var i = 0;
        var j = 0;
        X = 0.0;
        // Loop through all the columns in the array
        for (i = 0; i < pdfLineArray.length; i++) {
            if (pdfRec.lineColIncrArray[i] < 0) {
                pdfRec.pdf.setFontType("bold");
            } else {
                pdfRec.pdf.setFontType("normal");
            }

            X += Math.abs(pdfRec.lineColIncrArray[i]);
            textLine = '' + pdfLineArray[i];

            while (textLine.length > 0) {
                if (textLine.length > pdfRec.maxLineChars) {
                    breakPos = pdfRec.maxLineChars;
                    j = breakPos;
                    for (j; j > 0; j--) {
                        if (textLine[j] == ' ') {
                            breakPos = j;
                            break;
                        }
                    }

                    pdfRec.pdf.text(X, pdfRec.lineY, textLine.substr(0, breakPos));
                    pdfRec.lineY += pdfRec.lineIncrement;
                    textLine = textLine.substr(breakPos, textLine.length - breakPos);

                } else {
                    pdfRec.pdf.text(X, pdfRec.lineY, textLine);
                    textLine = '';
                }
            } // while (textLine.length > 0) {

        } // for (i = 0; i < pdfLineArray.length; i++) {
        pdfRec.lineY += pdfRec.lineIncrement;
        pdfRec.pdf.setFontType("normal");

        return pdfRec;
    } // End of function yearlyDuesStatementAddLine(pdfLineArray,pdfLineHeaderArray) {


    //Function to add a line to the Dues Statement PDF
    function duesStatementAddLine(pdfRec, pdfLineArray, pdfLineHeaderArray) {
        pdfRec.lineCnt++;
        var X = 0.0;
        // X (horizontal), Y (vertical)

        // Check for new page
        if (pdfRec.lineY > 10) {
            pdfRec.pdf.addPage('letter', 'p');
            pdfRec.header = true;
        }

        // If new page, write the header
        if (pdfRec.header) {
            pdfRec.header = false;
            pdfRec.pageCnt++;

            // X (horizontal), Y (vertical)
            pdfRec.pdf.setFontSize(15);
            pdfRec.pdf.text(1.5, 0.6, config.getVal('hoaName'));
            pdfRec.pdf.setFontSize(13);
            pdfRec.pdf.text(1.5, 0.9, pdfRec.title + " - " + pdfRec.createTimestamp);
            pdfRec.pdf.setFontSize(10);
            pdfRec.pdf.text(6.5, 0.6, config.getVal('hoaAddress1'));
            pdfRec.pdf.text(6.5, 0.8, config.getVal('hoaAddress2'));

            pdfRec.pdf.addImage(config.getLogoImgData(), 'JPEG', 0.4, 0.3, 0.9, 0.9);
            pdfRec.pdf.setFontSize(10);

            pdfRec.lineY = startLineY;
        }

        if (pdfLineHeaderArray != null) {
            X = 0.0;
            // Loop through all the column headers in the array
            for (i = 0; i < pdfLineArray.length; i++) {
                X += pdfRec.lineColIncrArray[i];
                pdfRec.pdf.text(X, pdfRec.lineY, '' + pdfLineHeaderArray[i]);
            }
            pdfRec.lineY += pdfRec.lineIncrement / 2.0;

            X = pdfRec.lineColIncrArray[0];
            pdfRec.pdf.setLineWidth(0.015);
            pdfRec.pdf.line(X, pdfRec.lineY, 8, pdfRec.lineY);
            pdfRec.lineY += pdfRec.lineIncrement;
        }

        var textLine = '';
        var breakPos = 0;
        var i = 0;
        var j = 0;
        X = 0.0;
        // Loop through all the columns in the array
        for (i = 0; i < pdfLineArray.length; i++) {
            X += pdfRec.lineColIncrArray[i];
            textLine = '' + pdfLineArray[i];

            while (textLine.length > 0) {
                if (textLine.length > pdfRec.maxLineChars) {
                    breakPos = pdfRec.maxLineChars;
                    j = breakPos;
                    for (j; j > 0; j--) {
                        if (textLine[j] == ' ') {
                            breakPos = j;
                            break;
                        }
                    }

                    pdfRec.pdf.text(X, pdfRec.lineY, textLine.substr(0, breakPos));
                    pdfRec.lineY += pdfRec.lineIncrement;
                    textLine = textLine.substr(breakPos, textLine.length - breakPos);

                } else {
                    pdfRec.pdf.text(X, pdfRec.lineY, textLine);
                    textLine = '';
                }
            } // while (textLine.length > 0) {

        } // for (i = 0; i < pdfLineArray.length; i++) {
        pdfRec.lineY += pdfRec.lineIncrement;

        return pdfRec;
    }

    /**
     * Draws a dotted line on a jsPDF doc between two points.
     * Note that the segment length is adjusted a little so
     * that we end the line with a drawn segment and don't
     * overflow.
     */
    function _dottedLine(pdfRec, xFrom, yFrom, xTo, yTo, segmentLength) {
        // Calculate line length (c)
        var a = Math.abs(xTo - xFrom);
        var b = Math.abs(yTo - yFrom);
        var c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));

        // Make sure we have an odd number of line segments (drawn or blank)
        // to fit it nicely
        var fractions = c / segmentLength;
        var adjustedSegmentLength = (Math.floor(fractions) % 2 === 0) ? (c / Math.ceil(fractions)) : (c / Math.floor(fractions));

        // Calculate x, y deltas per segment
        var deltaX = adjustedSegmentLength * (a / c);
        var deltaY = adjustedSegmentLength * (b / c);

        var curX = xFrom, curY = yFrom;
        while (curX <= xTo && curY <= yTo) {
            pdfRec.pdf.line(curX, curY, curX + deltaX, curY + deltaY);
            curX += 2 * deltaX;
            curY += 2 * deltaY;
        }

        return pdfRec;
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        init:                       init,
        addPage:                    addPage,
        formatYearlyDuesStatement:  formatYearlyDuesStatement,
        yearlyDuesStatementAddLine: yearlyDuesStatementAddLine,
        duesStatementAddLine:       duesStatementAddLine
    };

})(); // var pdfModule = (function(){
