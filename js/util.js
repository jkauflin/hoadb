/*==============================================================================
 * (C) Copyright 2015,2016,2017,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version 
 * 2015-04-09 JJK   Added Regular Expressions and functions for validating
 * 					email addresses and replacing non-printable characters

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
 * 2016-09-20 JJK   Added NonCollectible fields to counts report 
 * 2016-11-13 JJK	Added NonCollectible field to Dues Statement
 * 2016-11-25 JJK	Added InterestNotPaid and BankFee fields to Assessment
 * 					table, inserts, and updates	
 * 2016-12-06 JJK   Added version parameter in the links to solve cache
 * 					re-load problem (?ver=1.0)
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
 * 
 * 
 * 2018-10-14 JJK   Re-factored for modules
 * 2018-10-27 JJK   Modified getJSONfromInputs to just loop through the DIV
 *                  looking for input fields, and added an action parameter
 * 2018-10-28 JJK   Went back to declaring variables in the functions
 * 2018-11-01 JJK   Modified getJSONfromInputs to only include elements with
 *                  an Id and check for checkbox "checked"
 * jjktest
 *============================================================================*/
 var util = (function(){
    'use strict';
    //=================================================================================================================
    // Private variables for the Module

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $ajaxError = $document.find(".ajaxError");
    var $wildcard = $('*');
    var $resetval = $document.find(".resetval");
    var $Date = $document.find(".Date");

    //=================================================================================================================
    // Bind events
    // General AJAX error handler to log the exception and set a message in DIV tags with a ajaxError class
    $document.ajaxError(function (e, xhr, settings, exception) {
        console.log("ajax exception = " + exception);
        console.log("ajax url = " + settings.url);
        console.log("xhr.responseText = " + xhr.responseText);
        defaultCursor();
        $ajaxError.html("An Error has occurred (see console log)");
    });

     // Auto-close the collapse menu after clicking a non-dropdown menu item (in the bootstrap nav header)
     $document.on('click', '.navbar-collapse.in', function (e) {
         if ($(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle') {
             $(this).collapse('hide');
         }
     });

     // Using addClear plug-in function to add a clear button on input text fields
     $resetval.addClear();

     // Initialize Date picker library
     $Date.datetimepicker({
         timepicker: false,
         format: 'Y-m-d'
     });

    //=================================================================================================================
    // Module methods
    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds) {
                break;
            }
        }
    }

    function urlParam(name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results == null) {
            return null;
        }
        else {
            return results[1] || 0;
        }
    }
    /*
    example.com?param1=name&param2=&id=6
        urlParam('param1');     // name
        urlParam('id');         // 6
        rlParam('param2');      // null
    */

    var validEmailAddrRegExStr = "^((\"([ !#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\]^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])*\"|([!#$%&'*+\\-/0-9=?A-Z^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])+)(\\.(\"([ !#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\]^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])*\"|([!#$%&'*+\\-/0-9=?A-Z^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])+))*)@([a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?)*\\.(?![0-9]*\\.?$)[a-zA-Z0-9]{2,}\\.?)$";
    var validEmailAddr = new RegExp(validEmailAddrRegExStr, "g");
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
    var regexNonPrintableChars = new RegExp(nonPrintableCharsStr, "g");
    function cleanStr(inStr) {
        return inStr.replace(regexNonPrintableChars, '');
    }

    var commaHexStr = "[\x2C]";
    var regexCommaHexStr = new RegExp(commaHexStr, "g");
    function csvFilter(inVal) {
        return inVal.toString().replace(regexCommaHexStr, '');
    }

    //Replace every ascii character except decimal and digits with a null, and round to 2 decimal places
    var nonMoneyCharsStr = "[\x01-\x2D\x2F\x3A-\x7F]";
    //"g" global so it does more than 1 substitution
    var regexNonMoneyChars = new RegExp(nonMoneyCharsStr, "g");
    function formatMoney(inAmount) {
        var inAmountStr = '' + inAmount;
        inAmountStr = inAmountStr.replace(regexNonMoneyChars, '');
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
        return tempDate.getFullYear() + '-' + tempMonth + '-' + tempDay;
    }

    function waitCursor() {
        $wildcard.css('cursor', 'progress');
        $ajaxError.html("");
    }
    /*
    commented out because it messed up the cursor in other functions - put it individually around JSON services
    $document.ajaxComplete(function(event, request, settings) {
        $wildcard.css('cursor', 'default');
    });
    */
    function defaultCursor() {
        $wildcard.css('cursor', 'default');
    }

    // Helper functions for setting UI components from data
    function setBoolText(inBool) {
        var tempStr = "NO";
        if (inBool) {
            tempStr = "YES";
        }
        return tempStr;
    }
    function setCheckbox(checkVal) {
        var tempStr = '';
        if (checkVal == 1) {
            tempStr = 'checked=true';
        }
        return '<input type="checkbox" ' + tempStr + ' disabled="disabled">';
    }
    //function setCheckboxEdit(checkVal, idName) {
    function setCheckboxEdit(idName, checkVal) {
        var tempStr = '';
        if (checkVal == 1) {
            tempStr = 'checked=true';
        }
        return '<input id="' + idName + '" type="checkbox" ' + tempStr + '>';
    }
    function setInputText(idName, textVal, textSize) {
        return '<input id="' + idName + '" name="' + idName + '" type="text" class="form-control input-sm resetval" value="' + textVal + '" size="' + textSize + '" maxlength="' + textSize + '">';
    }
    function setTextArea(idName, textVal, rows) {
        return '<textarea id="' + idName + '" class="form-control input-sm" rows="' + rows + '">' + textVal + '</textarea>';
    }
    function setInputDate(idName, textVal, textSize) {
        return '<input id="' + idName + '" type="text" class="form-control input-sm Date" value="' + textVal + '" size="' + textSize + '" maxlength="' + textSize + '" placeholder="YYYY-MM-DD">';
    }
    function setSelectOption(optVal, displayVal, selected, bg) {
        var tempStr = '';
        if (selected) {
            tempStr = '<option class="' + bg + '" value="' + optVal + '" selected>' + displayVal + '</option>';
        } else {
            tempStr = '<option class="' + bg + '" value="' + optVal + '">' + displayVal + '</option>';
        }
        return tempStr;
    }

    // Function to get all input objects within a DIV, and extra entries from a map
    // and construct a JSON object with names and values (to pass in POST updates)
    function getJSONfromInputs(InputsDiv, paramMap) {
        var first = true;
        var jsonStr = '{';

        if (InputsDiv !== null) {
            // Get all the input objects within the DIV
            var FormInputs = InputsDiv.find("input,textarea,select");

            // Loop through the objects and construct the JSON string
            $.each(FormInputs, function (index) {
                //id = useEmailCheckbox, type = checkbox
                //id = propertyComments, type = text
                // Only include elements that have an "id" in the JSON string
                if (typeof $(this).attr('id') !== 'undefined') {
                    if (first) {
                        first = false;
                    } else {
                        jsonStr += ',';
                    }
                    //console.log("id = " + $(this).attr('id') + ", type = " + $(this).attr("type"));
                    if ($(this).attr("type") == "checkbox") {
                        //console.log("id = " + $(this).attr('id') + ", $(this).prop('checked') = " + $(this).prop('checked'));
                        if ($(this).prop('checked')) {
                            jsonStr += '"' + $(this).attr('id') + '" : 1';
                        } else {
                            jsonStr += '"' + $(this).attr('id') + '" : 0';
                        }
                    } else {
                        jsonStr += '"' + $(this).attr('id') + '" : "' + cleanStr($(this).val()) + '"';
                    }
                }
            });
        }

        if (paramMap !== null) {
            paramMap.forEach(function (value, key) {
                if (first) {
                    first = false;
                } else {
                    jsonStr += ',';
                }
                jsonStr += '"' + key + '" : "' + value + '"';
            });
        }

        jsonStr += '}';
        return jsonStr;
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        sleep: sleep,
        urlParam: urlParam,
        cleanStr: cleanStr,
        csvFilter: csvFilter,
        formatMoney: formatMoney,
        formatDate: formatDate,
        waitCursor: waitCursor,
        defaultCursor: defaultCursor,
        setBoolText: setBoolText,
        setCheckbox: setCheckbox,
        setCheckboxEdit: setCheckboxEdit,
        setInputText: setInputText,
        setTextArea: setTextArea,
        setInputDate: setInputDate,
        setSelectOption: setSelectOption,
        getJSONfromInputs: getJSONfromInputs
    };
        
})(); // var util = (function(){
