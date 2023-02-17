/*==============================================================================
 * (C) Copyright 2015,2016,2017,2018,2020 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:
 *----------------------------------------------------------------------------
 * Modification History
 * 2016-10-25 JJK   Added Communications table
 * 2016-11-04 JJK   (Jackson's 14th birthday)
 * 2016-11-05 JJK   Added Admin option to send dues emails
 * 2016-11-12 JJK	Added Dues Notice email function and inserts of
 * 					Dues Notice functions into Communications table
 * 2018-11-07 JJK   Re-factor for JSON based POST for updates
 * 2020-08-03 JJK   Re-factored for new error handling
 * 2020-08-16 JJK   Modified to allow edit on issue
 * 2020-08-22 JJK   Increased CommDesc to 600 characters
 * 2020-12-22 JJK   Re-factored for Bootstrap 4
 *============================================================================*/
var communications = (function () {
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var hoaCommRecList;
    var parcelId = '';
    var ownerId = '';
    var commId = '';

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $moduleDiv = $('#CommPage');
    var $ajaxError = $moduleDiv.find(".ajaxError");
    var $CommListDisplay = $moduleDiv.find("tbody");
    var $EditPage = $("#EditPage");
    var $EditTable = $("#EditTable");
    var $EditTableBody = $("#EditTable").find("tbody");
    var $editValidationError = $(".editValidationError");
    var $EditPageHeader = $("#EditPageHeader");
    var $EditPageButton = $("#EditPageButton");
    var $CommunicationsNew = $("#CommunicationsNew");

    //=================================================================================================================
    // Bind events
    $document.on("click", "#CommunicationsButton", _getHoaCommList);
    $moduleDiv.on("click", ".NewComm", _newComm);
    $EditPage.on("click", ".SaveCommEdit", _saveCommEdit);

    //=================================================================================================================
    // Module methods
    function _getHoaCommList(event) {
        parcelId = event.target.getAttribute("data-parcelId");
        ownerId = event.target.getAttribute("data-ownerId");

        $.getJSON("getHoaCommList.php", "parcelId=" + parcelId + "&ownerId=" + ownerId, function (outHoaCommRecList) {
            hoaCommRecList = outHoaCommRecList;
            _render();
            util.displayTabPage('CommPage');
        });
    }

    //function displayCommList(hoaCommRecList, parcelId, ownerId) {
    function _render() {
        var tr = '';

            $CommunicationsNew.html('<a id="CommunicationsNewButton" data-parcelId="' + parcelId + '" data-ownerId="' + ownerId + '" data-commId="NEW" href="#" class="btn btn-primary NewComm" role="button">New Communication</a>');
        //$("#CommunicationsParcel").html("<b>Parcel Id:</b> " + parcelId + " <b>Owner Id:</b> " + ownerId);

        $.each(hoaCommRecList, function (index, hoaCommRec) {
            if (index == 0) {
                tr = '';
                tr += '<tr class="small">';
                tr += '<th>CommID</th>';
                tr += '<th>Datetime</th>';
                tr += '<th>Type</th>';
                tr += '<th>Email</th>';
                tr += '<th>Sent</th>';
                tr += '<th>Address</th>';
                tr += '<th>Name</th>';
                tr += '<th>Description</th>';
                tr += '<th>Last Changed</th>';
                tr += '</tr>';
            }
            tr += '<tr class="small">';
            // if issue make CommID a hyperlink to edit the issue
            if (hoaCommRec.CommType == "Issue") {
                tr += '<td><a data-parcelId="' + parcelId + '" data-ownerId="' + ownerId + '" data-commId="' + hoaCommRec.CommID +
                      '" href="#" class="NewComm" role="button">' + hoaCommRec.CommID + '</a></td>';
            } else {
                tr += '<td>' + hoaCommRec.CommID + '</td>';
            }
            tr += '<td>' + hoaCommRec.CreateTs + '</td>';
            tr += '<td>' + hoaCommRec.CommType + '</td>';
            tr += '<td>' + util.setBoolText(hoaCommRec.Email) + '</td>';
            tr += '<td>' + hoaCommRec.SentStatus + '</td>';
            tr += '<td>' + hoaCommRec.EmailAddr + '</td>';
            tr += '<td>' + hoaCommRec.Mailing_Name + '</td>';
            tr += '<td>' + hoaCommRec.CommDesc.substr(0,70) + '</td>';
            tr += '<td>' + hoaCommRec.LastChangedTs + '</td>';
            tr += '</tr>';
        });

        $CommListDisplay.html(tr);
    }

    function _newComm(event) {
        parcelId = event.target.getAttribute("data-parcelId");
        ownerId = event.target.getAttribute("data-ownerId");
        commId = event.target.getAttribute("data-commId");
        $.getJSON("getHoaCommList.php", "parcelId=" + parcelId + "&ownerId=" + ownerId + "&commId=" + commId, function (outHoaCommRecList) {
            _formatCommEdit(outHoaCommRecList[0],parcelId,ownerId,commId);
            $EditPage.modal();
        });
    }

    function _formatCommEdit(hoaCommRec, parcelId, ownerId, commId) {
        // Clear the field where we report validation errors
        $editValidationError.empty();
        $EditPageHeader.text("Create Communication");

        var tr = '';
        tr += '<div class="form-group">';
        tr += '<tr><th>Parcel:</th><td>' + parcelId + '</td></tr>';
        tr += '<tr><th>OwnerID:</th><td>' + ownerId + '</td></tr>';
        if (hoaCommRec === undefined) {
            var selectOption = '<select class="form-control" id="commType">'
                + util.setSelectOption("Issue", "Issue", 1, "bg-success")
                + util.setSelectOption("Dues Question", "Dues Question", 0, "bg-danger")
                + util.setSelectOption("Dues Notice", "Dues Notice", 0, "bg-info")
                + '</select>';
            tr += '<tr><th>Type: </th><td>' + selectOption + '</td></tr>';
            tr += '<tr><th>Description:</th><td>' + util.setTextArea2("commDesc", "", "7","80") + '</td></tr>';
        } else {
            tr += '<tr><th>CommID:</th><td>' + commId + '</td></tr>';
            tr += '<tr><th>Datetime:</th><td>' + hoaCommRec.CreateTs + '</td></tr>';
            var selectOption = '<select class="form-control" id="commType">'
                + util.setSelectOption("Issue", "Issue", ("Issue" == hoaCommRec.CommType), "bg-success")
                + util.setSelectOption("Dues Question", "Dues Question", ("Dues Question" == hoaCommRec.CommType), "bg-danger")
                + util.setSelectOption("Dues Notice", "Dues Notice", ("Dues Notice" == hoaCommRec.CommType), "bg-info")
                + '</select>';
            tr += '<tr><th>Type: </th><td>' + selectOption + '</td></tr>';
            tr += '<tr><th>Description:</th><td>' + util.setTextArea2("commDesc", hoaCommRec.CommDesc, "7", "80") + '</td></tr>';
        }

        tr += '</div>';
        $EditTableBody.html(tr);

        tr = '<form class="form-inline" role="form">';
        tr += '<a data-commAction="Edit" data-parcelId="' + parcelId + '" data-ownerId="' + ownerId + '" data-commId="' + commId + '" href="#" class="btn btn-sm btn-primary SaveCommEdit" role="button">Save</a>';
        tr += '<button type="button" class="btn btn-sm btn-info ml-1" data-dismiss="modal">Close</button></form>';
        $EditPageButton.html(tr);

    } // End of function formatCommEdit(hoaCommRec){

    function _saveCommEdit(event) {
        var paramMap = new Map();
        paramMap.set('parcelId', event.target.getAttribute("data-parcelId"));
        paramMap.set('ownerId', event.target.getAttribute("data-ownerId"));
        paramMap.set('commId', event.target.getAttribute("data-commId"));
        //console.log("util.getJSONfromInputs($EditTable,paramMap) = " + util.getJSONfromInputs($EditTable, paramMap));

        var url = 'updHoaComm.php';
        $.ajax(url, {
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
                    // Set the newest list from the update into the module variable (for render)
                    hoaCommRecList = result;
                    _render();
                    $EditPage.modal("hide");
                }
            },
            error: function (xhr, status, error) {
                //console.log('Error in AJAX request to ' + url + ', status = ' + status + ', error = ' + error)
                $editValidationError.html("An error occurred in the update - see log");
            }
        });

    }

    function LogCommunication(parcelId,ownerId,commType,commDesc) {
        var paramMap = new Map();
        paramMap.set('parcelId', parcelId);
        paramMap.set('ownerId', ownerId);
        paramMap.set('commId', "NEW");
        paramMap.set('commType', commType);
        paramMap.set('commDesc', commDesc);
        //console.log("util.getJSONfromInputs(null,paramMap) = " + util.getJSONfromInputs(null, paramMap));

        // RE-DO to use .post and data parameters ???

        var url = 'updHoaComm.php';
        $.ajax(url, {
            type: "POST",
            contentType: "application/json",
            data: util.getJSONfromInputs(null, paramMap),
            dataType: "json",
            //dataType: "html",
            success: function (result) {
                //console.log("result = " + result);
                if (result.error) {
                    console.log("error = " + result.error);
                    $ajaxError.html("<b>" + result.error + "</b>");
                } else {
                    // Success
                }
            },
            error: function (xhr, status, error) {
                //console.log('Error in AJAX request to ' + url + ', status = ' + status + ', error = ' + error)
                $editValidationError.html("An error occurred in the update - see log");
            }
        });
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        LogCommunication: LogCommunication
    };

})(); // var communications = (function(){
