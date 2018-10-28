/*==============================================================================
 * (C) Copyright 2015,2016,2017,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-04-09 JJK   Adding Dues Statement calculation display logic
 * 2016-04-14 JJK   Adding Dues Report (working on csv and pdf downloads)
 * 2016-04-20 JJK   Completed test Dues Statement PDF
 * 2016-04-30 JJK   Implemented initial payment button functionality if
 *  				only current year dues are owed
 * 2016-06-09 JJK	Added duesStatementNotes to the individual dues
 * 					statement and adjusted the format
 * 2016-07-13 JJK   Finished intial version of yearly dues statements
 * 2016-07-14 JJK   Added Paid Dues Counts report
 * 2016-07-28 JJK	Corrected compound interest problem with a bad start date
 * 					Added print of LienComment after Total Due on Dues Statement
 * 2016-07-30 JJK   Changed the Yearly Dues Statues to just display prior
 * 					years due messages instead of amounts.
 * 					Added yearlyDuesStatementNotice for 2nd notice message.
 * 					Added DateDue to CSV for reports
 * 2016-11-05 JJK   Added Admin option to send dues emails
 * 2016-11-12 JJK	Added Dues Notice email function and inserts of
 * 					Dues Notice functions into Communications table
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
 * 2018-10-14 JJK   Corrected email send
 * 2018-10-27 JJK   Re-factor for JSON based POST for updates
 *============================================================================*/
var dues = (function () {
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var hoaConfigRecList;
    var configVal = new Map();
    var tr = '';
    var configName = '';

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
    $document.on("click", ".NewConfig", editConfig);
    $document.on("click", ".SaveConfigEdit", saveConfigEdit);


    $(document).on("click", "#DuesStatementButton", function () {
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php", "parcelId=" + $this.attr("data-ParcelId") + "&ownerId=" + $this.attr("data-OwnerId"), function (hoaRec) {
            //console.log("Format Dues Statement, parcel = "+$this.attr("data-ParcelId")+", OwnerId = "+hoaRec.ownersList[0].OwnerID);
            formatDuesStatementResults(hoaRec);
            $('*').css('cursor', 'default');
            $("#DuesStatementPage").modal();
        });
    });

    $(document).on("click", "#DownloadDuesStatementPDF", function () {
        var $this = $(this);
        pdf.save(formatDate() + "-" + $this.attr("data-pdfName") + ".pdf");
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
        tr = '';
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
        configName = (typeof value === "string") ? value : value.target.getAttribute("data-ConfigName");
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

    function saveConfigEdit(event) {
        util.waitCursor();
        //console.log("in saveConfigEdit, data-ConfigAction = " + event.target.getAttribute("data-ConfigAction"));
        //console.log("util.getJSONfromInputs($EditTable) = " + util.getJSONfromInputs($EditTable, event.target.getAttribute("data-ConfigAction")));
        $.ajax("updHoaConfig.php", {
            type: "POST",
            contentType: "application/json",
            data: util.getJSONfromInputs($EditTable, event.target.getAttribute("data-ConfigAction")),
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

})(); // var dues = (function(){
