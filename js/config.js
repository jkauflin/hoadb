/*==============================================================================
 * (C) Copyright 2015,2016,2017,2018 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-05-17 JJK   Implemented Config update page
 * 2016-05-18 JJK   Added setTextArea
 * 2016-07-08 JJK   Modified to get all config list values on page load
 * 2018-10-20 JJK   Re-factor for module design
 * 2018-10-21 JJK   Re-factor for JSON based POST for updates
 * 2020-08-03 JJK   Re-factored for new error handling
 * 2020-08-05 JJK   Re-did the map loading and rendering to not load on
 *                  page load - have the load called after login
 * 2020-08-06 JJK   Added functions to load and return the Logo image data
 * 2020-12-22 JJK   Modified for changes to jjklogin - added event
 *                  handling to call the config load functions when a user
 *                  is authenticated (using the new jjklogin event)
 *============================================================================*/
var config = (function(){
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var configVal = new Map();
    var pdfLogoImgData;

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $moduleDiv = $('#ConfigPage');
    var $ajaxError = $moduleDiv.find(".ajaxError");
    var $ConfigListDisplay = $moduleDiv.find("tbody");
    var $EditPage = $("#EditPage");
    var $EditTable = $("#EditTable");
    var $EditTableBody = $("#EditTable").find("tbody");
    var $editValidationError = $(".editValidationError");
    var $EditPageHeader = $("#EditPageHeader");
    var $EditPageButton = $("#EditPageButton");
    var $jjkloginEventElement = $document.find('#jjkloginEventElement')

    //=================================================================================================================
    // Bind events
    $moduleDiv.on("click", ".NewConfig", editConfig);
    $EditPage.on("click", ".SaveConfigEdit", _saveConfigEdit);

    // Respond to user authentication event from jjklogin
    $jjkloginEventElement.on('userJJKLoginAuth', function (event) {
        //console.log('in config, after login, username = '+event.originalEvent.detail.userName);
        // When user is authenticated load the configuration values
        // (need something like this because load is asynchronous - AJAX calls, can't do it on 1st request)
        _loadConfigValues();
        _loadConfigLogoImg();
    });

    //=================================================================================================================
    // Module methods

    function _loadConfigValues() {
        $.getJSON("getHoaConfigList.php", "", function (result) {
            if (result.error) {
                console.log("error = " + result.error);
                $ajaxError.html("<b>" + result.error + "</b>");
            } else {
                _render(result);
            }
        });
    }

    function _render(hoaConfigRecList) {
        var tr = '';
        // Clear out the Map before loading with data
        configVal.clear();
        $.each(hoaConfigRecList, function (index, hoaConfigRec) {
            // Load into Map for lookup
            configVal.set(hoaConfigRec.ConfigName, hoaConfigRec.ConfigValue);

            if (index == 0) {
                tr = '';
                tr += '<tr>';
                tr += '<th>Name</th>';
                tr += '<th>Description</th>';
                tr += '<th>Value</th>';
                tr += '</tr>';
            }
            tr += '<tr>';
            tr += '<td><a data-ConfigName="' + hoaConfigRec.ConfigName + '" class="NewConfig" href="#">' + hoaConfigRec.ConfigName + '</a></td>';
            tr += '<td>' + hoaConfigRec.ConfigDesc + '</td>';
            tr += '<td>' + hoaConfigRec.ConfigValue.substring(0, 80) + '</td>';
            tr += '</tr>';
        });

        $ConfigListDisplay.html(tr);
    }

    function _loadConfigLogoImg() {
        $.get("getLogoImgData.php", function (result) {
            if (result.error) {
                console.log("error = " + result.error);
                $ajaxError.html("<b>" + result.error + "</b>");
            } else {
                pdfLogoImgData = result;
            }
        });
    }

    function getLogoImgData() {
        return pdfLogoImgData;
    }

    // Return the value for a given name
    function getVal(name) {
        return configVal.get(name);
    }

    function editConfig(value) {
        // check user logged in
            // If a string was passed in then use value as the name, else get it from the attribute of the click event object
            var configName = (typeof value === "string") ? value : value.target.getAttribute("data-ConfigName");
            $.getJSON("getHoaConfigList.php", "ConfigName=" + configName, function (hoaConfigRec) {
                _formatConfigEdit(hoaConfigRec[0]);
                $EditPage.modal();
            });
    };

    function _formatConfigEdit(hoaConfigRec) {
        // Clear the field where we report validation errors
        $editValidationError.empty();
        $EditPageHeader.text("Edit Configuration");

        var tr = '';
        tr = '<div class="form-group">';
        if (hoaConfigRec === undefined) {
            tr += '<tr><th>Name:</th><td>' + util.setInputText("ConfigName", "", "80") + '</td></tr>';
            tr += '<tr><th>Description:</th><td>' + util.setInputText("ConfigDesc", "", "100") + '</td></tr>';
            tr += '<tr><th>Value:</th><td>' + util.setTextArea("ConfigValue", "", "15") + '</td></tr>';

        } else {
            tr += '<tr><th>Name:</th><td>' + util.setInputText("ConfigName", hoaConfigRec.ConfigName, "80") + '</td></tr>';
            tr += '<tr><th>Description:</th><td>' + util.setInputText("ConfigDesc", hoaConfigRec.ConfigDesc, "100") + '</td></tr>';
            tr += '<tr><th>Value:</th><td>' + util.setTextArea("ConfigValue", hoaConfigRec.ConfigValue, "15") + '</td></tr>';
        }

        tr += '</div>';
        $EditTableBody.html(tr);

        tr = '<form class="form-inline" role="form">';
        tr += '<a data-ConfigAction="Edit" href="#" class="btn btn-sm btn-primary m-1 SaveConfigEdit" role="button">Save</a>';
        tr += '<a data-ConfigAction="Delete" href="#" class="btn btn-sm btn-primary m-1 SaveConfigEdit" role="button">Delete</a>';
        tr += '<button type="button" class="btn btn-sm m-1 btn-info" data-dismiss="modal">Close</button></form>';
        $EditPageButton.html(tr);

    } // End of function _formatConfigEdit(hoaConfigRec){

    function _saveConfigEdit(event) {
        //console.log("in saveConfigEdit, data-ConfigAction = " + event.target.getAttribute("data-ConfigAction"));
        var paramMap = new Map();
        paramMap.set('action', event.target.getAttribute("data-ConfigAction"));
        //console.log("util.getJSONfromInputs($EditTable,paramMap) = " + util.getJSONfromInputs($EditTable, paramMap));
        var url = 'updHoaConfig.php';
        $.ajax("updHoaConfig.php", {
            type: "POST",
            contentType: "application/json",
            data: util.getJSONfromInputs($EditTable, paramMap),
            dataType: "json",
            //dataType: "html",
            success: function (result) {
                //console.log("result = " + result);
                if (result.error) {
                    console.log("error = " + result.error);
                    $ajaxError.html("<b>" + result.error + "</b>");
                } else {
                    _render(result);
                    $EditPage.modal("hide");
                }
            },
            error: function (xhr, status, error) {
                //console.log('Error in AJAX request to ' + url + ', status = ' + status + ', error = ' + error)
                $editValidationError.html("An error occurred in the update - see log");
            }
        });
    };

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        getLogoImgData,
        getVal,
        editConfig
    };

})(); // var util = (function(){
