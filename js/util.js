/*==============================================================================
 * (C) Copyright 2015,2016,2017,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version 
 * 2015-04-09 JJK   Added Regular Expressions and functions for validating
 * 					email addresses and replacing non-printable characters
 * 2016-05-18 JJK   Added setTextArea
 * 2016-08-14 JJK   Imported data from Access backup of 8/12/2016
 * 2016-08-26 JJK   Went live, and Paypal payments working in Prod!!!
 * 2018-10-14 JJK   Re-factored for modules
 * 2018-10-27 JJK   Modified getJSONfromInputs to just loop through the DIV
 *                  looking for input fields, and added an action parameter
 * 2018-10-28 JJK   Went back to declaring variables in the functions
 * 2018-11-01 JJK   Modified getJSONfromInputs to only include elements with
 *                  an Id and check for checkbox "checked"
 * 2019-09-22 JJK   Checked logic for dues emails and communications
 * 2020-08-03 JJK   Removed ajaxError handling - error handling re-factor
 *                  Moved result.error check and message display to the
 *                  individual calls
 *============================================================================*/
 var util = (function(){
    'use strict';  // Force declaration of variables before use (among other things)
    //=================================================================================================================
    // Private variables for the Module

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $wildcard = $('*');
    var $resetval = $document.find(".resetval");
    var $Date = $document.find(".Date");

    //=================================================================================================================
    // Bind events
   
     // Auto-close the collapse menu after clicking a non-dropdown menu item (in the bootstrap nav header)
     $document.on('click', '.navbar-collapse.in', function (e) {
         if ($(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle') {
             $(this).collapse('hide');
         }
     });

     // 8/9/2020 Focus on the first non-readonly input field when a modal pops up
     $document.on('shown.bs.modal', function (e) {
         $('input:visible:enabled:not([readonly]):first', e.target).focus(); 
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

    // Non-Printable characters - Hex 01 to 1F, and 7F
    var nonPrintableCharsStr = "[\x01-\x1F\x7F]";
    // "g" global so it does more than 1 substitution
    var regexNonPrintableChars = new RegExp(nonPrintableCharsStr, "g");
    function cleanStr(inStr) {
        return inStr.replace(regexNonPrintableChars, '');
    }

    // Filter out commas (for CSV outputs)
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

    // 2020-07-29 Turning off this changing cursor idea
    function waitCursor() {
        //$wildcard.css('cursor', 'progress');
        //$ajaxError.html("");
    }
    function defaultCursor() {
        //$wildcard.css('cursor', 'default');
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

    function displayError(errorMessage) {
        $ajaxError.html(errorMessage);
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        sleep:              sleep,
        urlParam:           urlParam,
        cleanStr:           cleanStr,
        csvFilter:          csvFilter,
        formatMoney:        formatMoney,
        formatDate:         formatDate,
        waitCursor:         waitCursor,
        defaultCursor:      defaultCursor,
        setBoolText:        setBoolText,
        setCheckbox:        setCheckbox,
        setCheckboxEdit:    setCheckboxEdit,
        setInputText:       setInputText,
        setTextArea:        setTextArea,
        setInputDate:       setInputDate,
        setSelectOption:    setSelectOption,
        getJSONfromInputs:  getJSONfromInputs,
        displayError:       displayError
    };
        
})(); // var util = (function(){
