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
    var pdfLineColIncrArray = [];
    var pdfPageCnt = 0;
    var pdfLineCnt = 0;
    var pdfLineYStart = 1.5;
    var pdfLineY = pdfLineYStart;
    var pdfLineIncrement = 0.25;
    var pdfColIncrement = 1.5;
    var pdfMaxLineChars = 95;
    var pdfFontSizeDefault = 11;
    var pdfFontSize = 11;
    var pdfHeader = false;
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
            author: config.getVal('hoaName'),
            keywords: 'generated, javascript, web 2.0, ajax',
            creator: 'MEEE'
        });

        // During init set to true to write header
        pdfHeader = true;

        // Initialize variables
        pdfPageCnt = 0;
        pdfLineCnt = 0;
        var currSysDate = new Date();
        pdfTimestamp = currSysDate.toString().substr(0, 24);
    }

    function download(filename) {
        pdf.save(util.formatDate()+"-"+filename+".pdf");
    }
    function getOutput() {
        pdf.output();
    }
    function addPage() {
        pdf.addPage(pdfOrientation, 'p');
        pdfLineCnt = 0;
    }
    function getTitle() {
        return pdfTitle;
    }
    function setMaxLineChars(inMaxLineChars) {
        pdfMaxLineChars = inMaxLineChars;
    }
    function setLineIncrement(inLineIncrement) {
        pdfLineIncrement = inLineIncrement;
    }
    function setColIncrement(inColIncrement) {
        pdfColIncrement = inColIncrement;
    }
    function setLineColIncrArray(inLineColIncrArray) {
        pdfLineColIncrArray = inLineColIncrArray;
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

        // Print header and graphic sections (at the start of each page)
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
            _dottedLine(0, 7.5, 8.5, 7.5, segmentLength)

            // Text around bottom line
            pdf.setFontSize(9);
            pdf.text(3.0, 7.45, "Detach and mail above portion with your payment");
            pdf.text(3.45, 7.65, "Keep below portion for your records");

            // Information correction area
            pdf.setLineWidth(0.013);
            // Box around area
            //pdf.rect(0.4, 4.0, 4.4, 2.0);   Not including the email line
            pdf.rect(0.4, 4.0, 4.4, 2.6);
            // Lines for address corrections
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
        var i = 0;
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


    //Function to add a line to the Dues Statement PDF
    function duesStatementAddLine(pdfLineArray, pdfLineHeaderArray) {
        pdfLineCnt++;
        var X = 0.0;
        // X (horizontal), Y (vertical)

        // Check for new page
        if (pdfLineY > 10) {
            pdf.addPage('letter', 'p');
            pdfHeader = true;
        }

        // If new page, write the header
        if (pdfHeader) {
            pdfHeader = false;
            pdfPageCnt++;

            // X (horizontal), Y (vertical)
            pdf.setFontSize(15);
            pdf.text(1.5, 0.6, config.getVal('hoaName'));
            pdf.setFontSize(13);
            pdf.text(1.5, 0.9, pdfTitle + " - " + pdfTimestamp);
            pdf.setFontSize(10);
            pdf.text(6.5, 0.6, config.getVal('hoaAddress1'));
            pdf.text(6.5, 0.8, config.getVal('hoaAddress2'));

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
        var i = 0;
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

    /**
     * Draws a dotted line on a jsPDF doc between two points.
     * Note that the segment length is adjusted a little so
     * that we end the line with a drawn segment and don't
     * overflow.
     */
    function _dottedLine(xFrom, yFrom, xTo, yTo, segmentLength) {
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
            pdf.line(curX, curY, curX + deltaX, curY + deltaY);
            curX += 2 * deltaX;
            curY += 2 * deltaY;
        }
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        init:                       init,
        addPage:                    addPage,
        getTitle:                   getTitle,
        setMaxLineChars:            setMaxLineChars,
        setLineIncrement:           setLineIncrement,
        setColIncrement:            setColIncrement,
        setLineColIncrArray:        setLineColIncrArray,
        yearlyDuesStatementAddLine: yearlyDuesStatementAddLine,
        duesStatementAddLine:       duesStatementAddLine,
        download:                   download,
        getOutput:                  getOutput
    };

})(); // var pdf = (function(){
