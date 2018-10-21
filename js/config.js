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
    var tr = '';
    var tr2 = '';
    var checkedStr = '';
    var buttonStr = '';

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $moduleDiv = $('#ConfigPage');
    var $displayPage = $document.find('#navbar a[href="#ConfigPage"]');
    var $ConfigListDisplay = $moduleDiv.find("tbody");
    var $EditPage = $("#EditPage");
    var $Configname = $("#ConfigName");
    var $ConfigDesc = $("#ConfigDesc");
    var $ConfigValue = $("#ConfigValue");

    //=================================================================================================================
    // Bind events
    $document.on('shown.bs.tab', 'a[data-toggle="tab"]', getHoaConfigList);
    $document.on("click", ".NewConfig", editConfig);
    $document.on("click", ".SaveConfigEdit", saveConfigEdit);

    // When the javascript initializes do a one time get of the logo image data (for PDF writes)
    // *** maybe move this to PDF module ***
    $.get("getLogoImgData.php", function (logoImgDataResults) {
        configVal.set('pdfLogoImgData', logoImgDataResults);
    });

    // Load the configuration list when the page is loaded
    $.getJSON("getHoaConfigList.php", "", function (outHoaConfigRecList) {
        hoaConfigRecList = outHoaConfigRecList;
        configVal.clear();
        $.each(hoaConfigRecList, function (index, hoaConfigRec) {
            // Load into Map for lookup
            configVal.set(hoaConfigRec.ConfigName, hoaConfigRec.ConfigValue);
        });
        //console.log("in config, configVal.size = "+configVal.size);
    });

    //=================================================================================================================
    // Module methods
    function getHoaConfigList(event) {
        var activatedTab = event.target;
        //console.log("tab = "+activatedTab);
        //http://127.0.0.1:8080/hoadb/#ConfigPage
        var configPage = activatedTab.toString().indexOf("ConfigPage");
        if (configPage) {
            util.waitCursor();
            $ConfigListDisplay.html("");
            // Get the list
            $.getJSON("getHoaConfigList.php", "", function (outHoaConfigRecList) {
                hoaConfigRecList = outHoaConfigRecList;
                _render();
                util.defaultCursor();
                //$displayPage.tab('show');
            });
        }
    }

    _render();
    function _render() {
        //var tr = '<tr><td>No records found - try different search parameters</td></tr>';
        tr = '';
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

    function getVal(name) {
        return configVal.get(name);
    }

    function editConfig(event) {
        // If a string was passed in then use value as the name, else get it from the attribute of the click event object
        util.waitCursor();
        $.getJSON("getHoaConfigList.php", "ConfigName=" + event.target.getAttribute("data-ConfigName"), function (hoaConfigRecList) {
            formatConfigEdit(hoaConfigRecList[0]);
            util.defaultCursor();
            $EditPage.modal();
        });
    };

    /*
		document.getElementById('UpdateConcerts').addEventListener('click', function() {
			var FormInputs = $("#ConcertsInput input,textarea");
			//console.log("data = "+app.getJSONfromInputs(FormInputs));
			$.ajax("updateConcerts.php", {
            	type: "POST",
                contentType: "application/json",
                data: app.getJSONfromInputs(FormInputs),
                dataType: "json",
                success: function(list) {
					app.displayList(list,"#ConcertsListDisplay tbody","EditConcert");
					// Reset the current id and clear out all of the input fields
					FormInputs.val("");
                },
                error: function() {
                    //$('#notification-bar').text('An error occurred');
            	}
            });
			event.stopPropagation();
		});
    */
    function saveConfigEdit(event) {
        util.waitCursor();
        // ***  Need to change this to a POST (and pass all element as a JSON)
        $.get("updHoaConfig.php", "ConfigName=" + util.cleanStr($("#ConfigName").val()) +
            "&ConfigDesc=" + util.cleanStr($("#ConfigDesc").val()) +
            "&ConfigValue=" + util.cleanStr($("#ConfigValue").val()) +
            "&ConfigAction=" + event.target.getAttribute("data-ConfigAction"), function (results) {

                $.getJSON("getHoaConfigList.php", function (hoaConfigRecList) {
                    util.defaultCursor();
                    displayConfigList(hoaConfigRecList);
                    $EditPage.modal("hide");
                    $displayPage.tab('show');
                });

            }); // End of 
    };

    function formatConfigEdit(hoaConfigRec) {
        $(".editValidationError").empty();

        $("#EditPageHeader").text("Edit Configuration");

        //console.log("hoaConfigRec.ConfigName = "+hoaConfigRec.ConfigName);

        tr = '';
        tr += '<div class="form-group">';
        tr += '<tr><th>Name:</th><td>' + setInputText("ConfigName", hoaConfigRec.ConfigName, "80") + '</td></tr>';
        tr += '<tr><th>Description:</th><td>' + setInputText("ConfigDesc", hoaConfigRec.ConfigDesc, "100") + '</td></tr>';
        tr += '<tr><th>Value:</th><td>' + setTextArea("ConfigValue", hoaConfigRec.ConfigValue, "15") + '</td></tr>';
        tr += '</div>';

        $("#EditTable tbody").html(tr);
        //$("#EditTable2 tbody").html(tr2);

        tr = '<form class="form-inline" role="form">';
        tr += '<a data-ConfigAction="Edit" href="#" class="btn btn-primary SaveConfigEdit" role="button">Save</a>';
        tr += '<a data-ConfigAction="Delete" href="#" class="btn btn-primary SaveConfigEdit" role="button">Delete</a>';
        tr += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button></form>';
        $("#EditPageButton").html(tr);

    } // End of function formatConfigEdit(hoaConfigRec){

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        getVal: getVal
    };
        
})(); // var util = (function(){


