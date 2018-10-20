var config = (function(){
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var configVal = new Map();
    var hoaConfigRecList;

    //=================================================================================================================
    // Variables cached from the DOM

    var $document = $(document);
    
    var $moduleDiv = $('#ConfigPage');
    var $displayPage = $moduleDiv.find('#navbar a[href="#ConfigPage"]');


    //=================================================================================================================
    // Bind events
    $document.on('shown.bs.tab', 'a[data-toggle="tab"]', getHoaConfigList);



    // When the javascript initializes do a one time get of the logo image data (for PDF writes)
    // *** maybe move this to PDF module ***
    $.get("getLogoImgData.php", function (logoImgDataResults) {
        configVal.set('pdfLogoImgData', logoImgDataResults);
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
//            $propList.html("");
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
        //console.log("hoaConfigRecList.length = " + hoaConfigRecList.length);
        $.each(hoaConfigRecList, function (index, configRec) {
            configVal.set(configRec.ConfigName, configRec.ConfigValue);
        });



    }

    function getVal(name) {
        return configVal.get(name);
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        getVal: getVal
    };
        
})(); // var util = (function(){


$(document).on("click", ".NewConfig", function () {
    waitCursor();
    var $this = $(this);
    $.getJSON("getHoaConfigList.php", "ConfigName=" + $this.attr("data-ConfigName"), function (hoaConfigRecList) {
        formatConfigEdit(hoaConfigRecList[0]);
        $('*').css('cursor', 'default');
        $("#EditPage").modal();
    });
});

$(document).on("click", ".SaveConfigEdit", function () {
    waitCursor();
    var $this = $(this);

    $.get("updHoaConfig.php", "ConfigName=" + cleanStr($("#ConfigName").val()) +
        "&ConfigDesc=" + cleanStr($("#ConfigDesc").val()) +
        "&ConfigValue=" + cleanStr($("#ConfigValue").val()) +
        "&ConfigAction=" + $this.attr("data-ConfigAction"), function (results) {

            $.getJSON("getHoaConfigList.php", function (hoaConfigRecList) {
                $('*').css('cursor', 'default');
                displayConfigList(hoaConfigRecList);
                $("#EditPage").modal("hide");
                $('#navbar a[href="#ConfigPage"]').tab('show');
            });

        }); // End of 
    event.stopPropagation();
});	// End of $(document).on("click","#SaveConfigEdit",function(){


$(document).on("click", ".SaveCommEdit", function () {
    waitCursor();
    var $this = $(this);
    var parcelId = $this.attr("data-ParcelId");
    var ownerId = $this.attr("data-OwnerId");
    var commId = $this.attr("data-CommId");

    $.get("updHoaComm.php", "parcelId=" + parcelId +
        "&ownerId=" + ownerId +
        "&commId=" + commId +
        "&commType=" + cleanStr($("#CommType").val()) +
        "&commDesc=" + cleanStr($("#CommDesc").val()) +
        "&CommAction=" + $this.attr("data-CommAction"), function (results) {

            $.getJSON("getHoaCommList.php", "parcelId=" + parcelId + "&ownerId=" + ownerId, function (hoaCommRecList) {
                $('*').css('cursor', 'default');
                displayCommList(hoaCommRecList, parcelId, ownerId);
                $("#EditPage").modal("hide");
                $('#navbar a[href="#CommPage"]').tab('show');
            });

        }); // End of 
    event.stopPropagation();
});	// End of $(document).on("click",".SaveCommEdit",function(){

function displayConfigList(hoaConfigRecList) {
    //var tr = '<tr><td>No records found - try different search parameters</td></tr>';
    var tr = '';
    $.each(hoaConfigRecList, function (index, hoaConfigRec) {
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

    $("#ConfigListDisplay tbody").html(tr);
}

function formatConfigEdit(hoaConfigRec) {
    var tr = '';
    var tr2 = '';
    var checkedStr = '';
    var buttonStr = '';
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

