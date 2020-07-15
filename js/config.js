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
 *============================================================================*/
var config = (function(){
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var hoaConfigRecList;
    var configVal = new Map();

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $moduleDiv = $('#ConfigPage');
    var $displayPage = $document.find('#navbar a[href="#ConfigPage"]');
    var $ConfigListDisplay = $moduleDiv.find("tbody");
    var $EditPage = $("#EditPage");
    var $EditTable = $("#EditTable");
    var $EditTableBody = $("#EditTable").find("tbody");
    var $editValidationError = $(".editValidationError");
    var $EditPageHeader = $("#EditPageHeader");
    var $EditPageButton = $("#EditPageButton");

    //=================================================================================================================
    // Bind events
    $document.on('shown.bs.tab', 'a[data-toggle="tab"]', getHoaConfigList);
    $moduleDiv.on("click", ".NewConfig", editConfig);
    $EditPage.on("click", ".SaveConfigEdit", _saveConfigEdit);

    // When the javascript initializes do a one time get of the logo image data (for PDF writes)
    /*
    $.get("getLogoImgData.php", function (logoImgDataResults) {
        configVal.set('pdfLogoImgData', logoImgDataResults);
    });
    */

    // Load the configuration list when the page is loaded
    $.getJSON("getHoaConfigList.php", "", function (outHoaConfigRecList) {
        hoaConfigRecList = outHoaConfigRecList;
        // Clear the map for the data load
        configVal.clear();
        // Loop throught the data list and load into a Map
        $.each(hoaConfigRecList, function (index, hoaConfigRec) {
            // Load into Map for lookup
            configVal.set(hoaConfigRec.ConfigName, hoaConfigRec.ConfigValue);
        });
        //console.log("in config, configVal.size = "+configVal.size);
    });
    

    //=================================================================================================================
    // Module methods
    // When the page tab is clicked, display the current list of values
    function getHoaConfigList(event) {
        var activatedTab = event.target;
        //console.log("tab = "+activatedTab);
        //http://127.0.0.1:8080/hoadb/#ConfigPage
        var configPage = activatedTab.toString().indexOf("ConfigPage");
        if (configPage) {
            _render();
        }
    }

    _render();
    function _render() {
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

    // Return the value for a given name
    function getVal(name) {
        return configVal.get(name);
    }

    function editConfig(value) {
        // If a string was passed in then use value as the name, else get it from the attribute of the click event object
        var configName = (typeof value === "string") ? value : value.target.getAttribute("data-ConfigName");
        util.waitCursor();
        $.getJSON("getHoaConfigList.php", "ConfigName=" + configName, function (hoaConfigRec) {
            formatConfigEdit(hoaConfigRec[0]);
            util.defaultCursor();
            $EditPage.modal();
        });
    };

    function formatConfigEdit(hoaConfigRec) {
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
        tr += '<a data-ConfigAction="Edit" href="#" class="btn btn-primary SaveConfigEdit" role="button">Save</a>';
        tr += '<a data-ConfigAction="Delete" href="#" class="btn btn-primary SaveConfigEdit" role="button">Delete</a>';
        tr += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button></form>';
        $EditPageButton.html(tr);

    } // End of function formatConfigEdit(hoaConfigRec){

    function _saveConfigEdit(event) {
        util.waitCursor();
        //console.log("in saveConfigEdit, data-ConfigAction = " + event.target.getAttribute("data-ConfigAction"));
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
    };

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        getVal: getVal,
        editConfig: editConfig
    };
        
})(); // var util = (function(){
