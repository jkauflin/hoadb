/*==============================================================================
 * (C) Copyright 2015,2016,2017,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version 
 * 2015-03-26 JJK	Solved initial DetailPage checkbox display problem by
 * 					moving format after the pagecontainer change (instead of
 * 					before it.  Let the page initialize first, then fill it.
 * 2015-04-09 JJK   Added Regular Expressions and functions for validating
 * 					email addresses and replacing non-printable characters
 * 2015-08-03 JJK	Modified to put the data parameters on the "a" element
 * 					and only response to clicks to the anchor
 * 2016-02-09 JJK	Switching from JQuery Mobile to Twitter Bootstrap
 * 2016-02-21 JJK   Test new Git
 * 2016-11-04 JJK   (Jackson's 14th birthday)
 * 2016-09-01 JJK   Corrected Owner order by year not id
 * 2016-09-02 JJK   Added NonCollectible field
 * 2016-09-20 JJK   Added NonCollectible fields to counts report
 * 2016-11-13 JJK	Added NonCollectible field to Dues Statement
 * 2016-11-25 JJK	Added InterestNotPaid and BankFee fields to Assessment
 * 					table, inserts, and updates
 * 2016-12-06 JJK   Added version parameter in the links to solve cache
 * 					re-load problem (?ver=1.0)
 * 2018-10-21 JJK   Re-factor for modules
 * 2018-10-28 JJK   Went back to declaring variables in the functions
 * 2018-11-03 JJK   Got update Properties working again with JSON POST
 * 2018-11-04 JJK   (Jackson's 16th birthday)
 *                  Got update Owner working again with JSON POST
 *                  Got update Assessment working again with JSON POST
 * 2018-11-25 JJK   Moved Dues Statement back to here
 * 2018-11-27 JJK   Added EmailAddr2
 * 2020-08-03 JJK   Re-factored for new error handling
 *============================================================================*/
var detail = (function(){
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var hoaRec;
    var currPdfRec;

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $moduleDiv = $('#DetailPage');
    var $ajaxError = $moduleDiv.find(".ajaxError");
    // Figure out a better way to do this
    var $displayPage = $document.find('#navbar a[href="#DetailPage"]');

    var $propertyDetail = $moduleDiv.find("#PropertyDetail");
    var $propertyOwners = $moduleDiv.find("#PropertyOwners");
    var $propertyAssessments = $moduleDiv.find("#PropertyAssessments");
    var $propDetail = $propertyDetail.find('tbody');
    var $propOwners = $propertyOwners.find('tbody');
    var $propAssessments = $propertyAssessments.find('tbody');
    var $MCTreasLink = $("#MCTreasLink");
    var $MCAuditorLink = $("#MCAuditorLink");
    var $DuesStatement = $("#DuesStatement");
    var $Communications = $("#Communications");
    var $NewOwner = $("#NewOwner");
    var $editValidationError = $(".editValidationError");

    var $EditPage = $("#EditPage");
    var $EditTable = $("#EditTable");
    var $EditTableBody = $EditTable.find("tbody");
    var $EditPageHeader = $("#EditPageHeader");
    var $EditPageButton = $("#EditPageButton");

    var $EditPage2Col = $("#EditPage2Col");
    var $EditTable2Col = $("#EditTable2Col");
    var $EditTable2ColBody = $EditTable2Col.find("tbody");
    var $EditTable2Col2 = $("#EditTable2Col2");
    var $EditTable2Col2Body = $EditTable2Col2.find("tbody");
    var $EditPage2ColHeader = $("#EditPage2ColHeader");
    var $EditPage2ColButton = $("#EditPage2ColButton");

    //var $DuesStatementButton = $document.find("#DuesStatementButton");
    //var $DownloadDuesStatement = $document.find("#DownloadDuesStatement");
    var $DuesStatementPage = $document.find("#DuesStatementPage");
    var $DuesStatementPropertyTable = $("#DuesStatementPropertyTable tbody");
    var $DuesStatementAssessmentsTable = $("#DuesStatementAssessmentsTable tbody");
    var duesStatementDownloadLinks = $("#DuesStatementDownloadLinks");

    //=================================================================================================================
    // Bind events
    $document.on("click", "#PropertyListDisplay tr td a", getHoaRec);
    $moduleDiv.on("click", "#PropertyDetail tr td a", _editProperty);
    $EditPage.on("click", "#SavePropertyEdit", _savePropertyEdit);
    $moduleDiv.on("click", "#PropertyOwners tr td a", _editOwner);
    $EditPage2Col.on("click", "#SaveOwnerEdit", _saveOwnerEdit);
    $moduleDiv.on("click", "#NewOwnerButton", _newOwner);
    $moduleDiv.on("click", "#PropertyAssessments tr td a", _editAssessment);
    $EditPage2Col.on("click", "#SaveAssessmentEdit", _saveAssessmentEdit);
    $document.on("click", ".SalesNewOwnerProcess", _salesNewOwnerProcess);

    $document.on("click", "#DuesStatementButton", createDuesStatement);
    $document.on("click", "#DownloadDuesStatement", downloadDuesStatement);
    //$DuesStatementButton.click(createDuesStatement);
    //$DownloadDuesStatement.click(downloadDuesStatement);



    //=================================================================================================================
    // Module methods
    function getHoaRec(value) {
        // If a string was passed in then use value as the name, else get it from the attribute of the click event object
        var parcelId = (typeof value === "string") ? value : value.target.getAttribute("data-parcelId");
         
        $propDetail.html("");
        $propOwners.html("");
        $propAssessments.html("");
        $.getJSON("getHoaDbData.php", "parcelId=" + parcelId, function (outHoaRec) {
            hoaRec = outHoaRec;
            _render();
             
            $displayPage.tab('show');
        });
    }

    function _render() {
        var tr = '';

        // Get the admin level to see if user is allowed to edit data
        if (hoaRec.adminLevel > 1) {
            tr += '<tr><th>Parcel Id:</th><td><a data-parcelId="' + hoaRec.Parcel_ID + '" href="#">' + hoaRec.Parcel_ID + '</a></td></tr>';
        } else {
            tr += '<tr><th>Parcel Id:</th><td>' + hoaRec.Parcel_ID + '</a></td></tr>';
        }
        tr += '<tr><th>Lot No:</th><td>' + hoaRec.LotNo + '</td></tr>';
        tr += '<tr><th>Location: </th><td>' + hoaRec.Parcel_Location + '</td></tr>';
        tr += '<tr><th class="hidden-xs hidden-sm">Street No: </th><td class="hidden-xs hidden-sm">' + hoaRec.Property_Street_No + '</td></tr>';
        tr += '<tr><th class="hidden-xs hidden-sm">Street Name: </th><td class="hidden-xs hidden-sm">' + hoaRec.Property_Street_Name + '</td></tr>';
        tr += '<tr><th class="hidden-xs">City: </th><td class="hidden-xs">' + hoaRec.Property_City + '</td></tr>';
        tr += '<tr><th class="hidden-xs">State: </th><td class="hidden-xs">' + hoaRec.Property_State + '</td></tr>';
        tr += '<tr><th class="hidden-xs">Zip Code: </th><td class="hidden-xs">' + hoaRec.Property_Zip + '</td></tr>';
        tr += '<tr><th>Total Due: </th><td>$' + util.formatMoney(hoaRec.TotalDue) + '</td></tr>';

        //tr += '<tr><th class="hidden-xs hidden-sm">Member: </th><td class="hidden-xs hidden-sm">' + util.setCheckbox(hoaRec.Member) + '</td></tr>';
        //tr += '<tr><th>Vacant: </th><td>' + util.setCheckbox(hoaRec.Vacant) + '</td></tr>';
        tr += '<tr><th>Rental: </th><td>' + util.setCheckbox(hoaRec.Rental) + '</td></tr>';
        tr += '<tr><th>Managed: </th><td>' + util.setCheckbox(hoaRec.Managed) + '</td></tr>';
        tr += '<tr><th>Foreclosure: </th><td>' + util.setCheckbox(hoaRec.Foreclosure) + '</td></tr>';
        tr += '<tr><th>Bankruptcy: </th><td>' + util.setCheckbox(hoaRec.Bankruptcy) + '</td></tr>';
        tr += '<tr><th>ToBe Released: </th><td>' + util.setCheckbox(hoaRec.Liens_2B_Released) + '</td></tr>';
        tr += '<tr><th>Use Email: </th><td>' + util.setCheckbox(hoaRec.UseEmail) + '</td></tr>';
        tr += '<tr><th>Comments: </th><td>' + hoaRec.Comments + '</td></tr>';
        //tr += '<tr><th>AdminLevel: </th><td>' + hoaRec.adminLevel + '</td></tr>';
        //tr += '<tr><th>UserName: </th><td>' + hoaRec.userName + '</td></tr>';

        $propDetail.html(tr);

        var ownName1 = '';
        var currOwnerID = '';
        tr = '';
        $.each(hoaRec.ownersList, function (index, rec) {
            if (index == 0) {
                tr = tr + '<tr>';
                tr = tr + '<th>OwnId</th>';
                tr = tr + '<th>Owner</th>';
                tr = tr + '<th>Phone</th>';
                tr = tr + '<th class="hidden-xs">Date Purchased</th>';
                tr = tr + '<th class="hidden-xs">Alt Address</th>';
                tr = tr + '<th class="hidden-xs">Comments</th>';
                tr = tr + '</tr>';
            }
            tr = tr + '<tr>';
            tr = tr + '<td>' + rec.OwnerID + '</td>';

            if (rec.CurrentOwner) {
                ownName1 = rec.Owner_Name1;
                currOwnerID = rec.OwnerID;
            }

            if (hoaRec.adminLevel > 1) {
                tr = tr + '<td><a data-parcelId="' + hoaRec.Parcel_ID + '" data-ownerId="' + rec.OwnerID + '" href="#">' + rec.Owner_Name1 + ' ' + rec.Owner_Name2 + '</a></td>';
            } else {
                tr = tr + '<td>' + rec.Owner_Name1 + ' ' + rec.Owner_Name2 + '</a></td>';
            }
            tr = tr + '<td>' + rec.Owner_Phone + '</td>';
            tr = tr + '<td class="hidden-xs">' + rec.DatePurchased + '</td>';
            tr = tr + '<td class="hidden-xs">' + rec.Alt_Address_Line1 + '</td>';
            tr = tr + '<td class="hidden-xs">' + rec.Comments + '</td>';
            tr = tr + '</tr>';
        });
        $propOwners.html(tr);

        var TaxYear = '';
        var LienButton = '';
        var ButtonType = '';
        tr = '';
        $.each(hoaRec.assessmentsList, function (index, rec) {
            LienButton = '';
            ButtonType = '';

            if (index == 0) {
                tr = tr + '<tr class="small">';
                tr = tr + '<th>OwnId</th>';
                tr = tr + '<th>FY</th>';
                tr = tr + '<th>Dues Amt</th>';
                tr = tr + '<th>Lien</th>';
                tr = tr + '<th>Paid</th>';
                tr = tr + '<th>Non-Collectible</th>';
                tr = tr + '<th class="hidden-xs">Date Paid</th>';
                tr = tr + '<th class="hidden-xs hidden-sm">Date Due</th>';
                tr = tr + '<th class="hidden-xs">Payment</th>';
                tr = tr + '<th class="hidden-xs">Comments</th>';
                tr = tr + '</tr>';
                TaxYear = rec.DateDue.substring(0, 4);
            }

            tr = tr + '<tr class="small">';
            tr = tr + '<td>' + rec.OwnerID + '</td>';
            if (hoaRec.adminLevel > 1) {
                tr = tr + '<td><a data-parcelId="' + hoaRec.Parcel_ID + '" data-fy="' + rec.FY + '" href="#">' + rec.FY + '</a></td>';
            } else {
                tr = tr + '<td>' + rec.FY + '</a></td>';
            }

            // Check to add the Lien button
            if (rec.Lien) {
                if (rec.Disposition == 'Open') {
                    ButtonType = 'btn-danger';
                } else if (rec.Disposition == 'Paid') {
                    ButtonType = 'btn-success';
                } else {
                    ButtonType = 'btn-default';
                }
                LienButton = '<a data-parcelId="' + hoaRec.Parcel_ID + '" data-fy="' + rec.FY + '" href="#" class="btn ' + ButtonType + ' btn-xs" role="button">Lien</a>';
            } else {
                // If NOT PAID and past the due date, add a Create Lien button to go to edit
                if (!rec.Paid && rec.DuesDue && !rec.NonCollectible) {
                    LienButton = '<a data-parcelId="' + hoaRec.Parcel_ID + '" data-fy="' + rec.FY + '" href="#" class="btn btn-warning btn-xs" role="button">Create Lien</a>';
                }
            }

            tr = tr + '<td>' + util.formatMoney(rec.DuesAmt) + '</td>';
            tr = tr + '<td>' + LienButton + '</td>';

            tr = tr + '<td>' + util.setCheckbox(rec.Paid) + '</td>';
            tr = tr + '<td>' + util.setCheckbox(rec.NonCollectible) + '</td>';
            tr = tr + '<td class="hidden-xs">' + rec.DatePaid + '</td>';
            tr = tr + '<td class="hidden-xs hidden-sm">' + rec.DateDue + '</td>';
            tr = tr + '<td class="hidden-xs">' + rec.PaymentMethod + '</td>';
            tr = tr + '<td class="hidden-xs">' + rec.Comments + ' ' + rec.LienComment + '</td>';
            tr = tr + '</tr>';
        });
        $propAssessments.html(tr);

        // Set the buttons from configuration values and current parcel id
        var mcTreasURI = config.getVal('countyTreasurerUrl') + '?parid=' + hoaRec.Parcel_ID + '&taxyr=' + TaxYear + '&own1=' + ownName1;
        $MCTreasLink.html('<a href="' + encodeURI(mcTreasURI) + '" class="btn btn-primary" role="button" target="_blank">County<br>Treasurer</a>');

        var mcAuditorURI = config.getVal('countyAuditorUrl') + '?mode=PARID';
        $MCAuditorLink.html('<a href="' + encodeURI(mcAuditorURI) + '" class="btn btn-primary" role="button" target="_blank">County<br>Property</a>');

        $DuesStatement.html('<a id="DuesStatementButton" data-parcelId="' + hoaRec.Parcel_ID + '" data-ownerId="' + currOwnerID + '" href="#" class="btn btn-success" role="button">Dues Statement</a>');

        $Communications.html('<a id="CommunicationsButton" data-parcelId="' + hoaRec.Parcel_ID + '" data-ownerId="' + currOwnerID + '" href="#" class="btn btn-info" role="button">Communications</a>');

        if (hoaRec.adminLevel > 1) {
            $NewOwner.html('<a id="NewOwnerButton" data-parcelId="' + hoaRec.Parcel_ID + '" data-ownerId="' + currOwnerID + '" href="#" class="btn btn-warning" role="button">New Owner</a>');
            //$AddAssessment.html('<a id="AddAssessmentButton" href="#" class="btn btn-default" role="button">Add Assessment</a>');
        }

    } // function _render() {

    function _editProperty(event) {
         
        $.getJSON("getHoaDbData.php", "parcelId=" + event.target.getAttribute("data-parcelId"), function (editHoaRec) {
            _formatPropertyDetailEdit(editHoaRec);
             
            $EditPage.modal();
        });
    };


    function _formatPropertyDetailEdit(editHoaRec) {
        // Clear the field where we report validation errors
        $editValidationError.empty();
        // Action or type of update
        $EditPageHeader.text("Edit Property");

        var tr = '';
        tr = '<div class="form-group">';
        tr += '<tr><th>Parcel Id:</th><td>' + editHoaRec.Parcel_ID + '</td></tr>';
        tr += '<tr><th>Lot No:</th><td>' + editHoaRec.LotNo + '</td></tr>';
        tr += '<tr><th>Sub Division: </th><td>' + editHoaRec.SubDivParcel + '</td></tr>';
        tr += '<tr><th>Location: </th><td>' + editHoaRec.Parcel_Location + '</td></tr>';
        tr += '<tr><th>Street No: </th><td>' + editHoaRec.Property_Street_No + '</td></tr>';
        tr += '<tr><th>Street Name: </th><td>' + editHoaRec.Property_Street_Name + '</td></tr>';
        tr += '<tr><th>City: </th><td>' + editHoaRec.Property_City + '</td></tr>';
        tr += '<tr><th>State: </th><td>' + editHoaRec.Property_State + '</td></tr>';
        tr += '<tr><th>Zip Code: </th><td>' + editHoaRec.Property_Zip + '</td></tr>';
        tr += '<tr><th>Member: </th><td>' + util.setCheckbox(editHoaRec.Member) + '</td></tr>';
        tr += '<tr><th>Vacant: </th><td>' + util.setCheckboxEdit('vacantCheckbox', editHoaRec.Vacant) + '</td></tr>';
        tr += '<tr><th>Rental: </th><td>' + util.setCheckboxEdit('rentalCheckbox', editHoaRec.Rental) + '</td></tr>';
        tr += '<tr><th>Managed: </th><td>' + util.setCheckboxEdit('managedCheckbox', editHoaRec.Managed) + '</td></tr>';
        tr += '<tr><th>Foreclosure: </th><td>' + util.setCheckboxEdit('foreclosureCheckbox', editHoaRec.Foreclosure) + '</td></tr>';
        tr += '<tr><th>Bankruptcy: </th><td>' + util.setCheckboxEdit('bankruptcyCheckbox', editHoaRec.Bankruptcy) + '</td></tr>';
        tr += '<tr><th>ToBe Released: </th><td>' + util.setCheckboxEdit('liensCheckbox', editHoaRec.Liens_2B_Released) + '</td></tr>';
        tr += '<tr><th>Use Email: </th><td>' + util.setCheckboxEdit('useEmailCheckbox', editHoaRec.UseEmail) + '</td></tr>';
        tr += '<tr><th>Comments: </th><td >' + util.setInputText("propertyComments", editHoaRec.Comments, "90") + '</td></tr>';
        tr += '</div>'
        $EditTableBody.html(tr);

        tr = '<form class="form-inline" role="form">' +
            '<a id="SavePropertyEdit" data-parcelId="' + editHoaRec.Parcel_ID + '" href="#" class="btn btn-primary" role="button">Save</a>' +
            '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
            '</form>';
        $EditPageButton.html(tr);

    } // End of function _formatPropertyDetailEdit(editHoaRec){

    // Functions for EditPage - respond to requests for update
    function _savePropertyEdit(event) {
         
        var paramMap = new Map();
        paramMap.set('parcelId', event.target.getAttribute("data-parcelId"));
        //console.log("util.getJSONfromInputs($EditTable,paramMap) = " + util.getJSONfromInputs($EditTable, paramMap));
        $.ajax("updHoaProperty.php", {
            type: "POST",
            contentType: "application/json",
            data: util.getJSONfromInputs($EditTable, paramMap),
            dataType: "json",
            success: function (outHoaRec) {
                 
                // Set the newest record from the update into the module variable (for render)
                hoaRec = outHoaRec;
                _render();
                $EditPage.modal("hide");
            },
            error: function () {
                $editValidationError.html("An error occurred in the update - see log");
            }
        });
    };	// End of $(document).on("click","#SavePropertyEdit",function(){

    function _editOwner(event) {
         
        $.getJSON("getHoaDbData.php", "parcelId=" + event.target.getAttribute("data-parcelId") + "&ownerId=" + event.target.getAttribute("data-ownerId"), 
        function (editHoaRec) {
            var createNew = false;
            _formatOwnerDetailEdit(editHoaRec, createNew);
             
            $EditPage2Col.modal();
        });
    };

    function _newOwner() {
         
        $.getJSON("getHoaDbData.php", "parcelId=" + event.target.getAttribute("data-parcelId") + "&ownerId=" + event.target.getAttribute("data-ownerId"), 
        function (editHoaRec) {
            var createNew = true;
            _formatOwnerDetailEdit(editHoaRec, createNew);
             
            $EditPage2Col.modal();
        });
    };

    function _salesNewOwnerProcess() {
         
        $.getJSON("getHoaDbData.php", "parcelId=" + event.target.getAttribute("data-parcelId") + "&saleDate=" + event.target.getAttribute("data-saleDate"),
            function (editHoaRec) {
                var createNew = true;
                _formatOwnerDetailEdit(editHoaRec, createNew);
                 
                $EditPage2Col.modal();
            });

    }

    function _formatOwnerDetailEdit(editHoaRec, createNew) {
        var tr = '';
        var tr2 = '';
        var ownerId = '';

        // Clear the field where we report validation errors
        $editValidationError.empty();
        // Action or type of update
        if (createNew) {
            $EditPage2ColHeader.text("New Owner");
        } else {
            $EditPage2ColHeader.text("Edit Owner");
        }

        var rec = editHoaRec.ownersList[0];
        var salesRec = null;
        if (editHoaRec.salesList[0] != null) {
            salesRec = editHoaRec.salesList[0];
        }

        ownerId = rec.OwnerID;
        tr = '';
        tr += '<div class="form-group">';
        if (createNew) {
            tr += '<tr><th>Owner Id:</th><td>CREATE NEW OWNER</td></tr>';
        } else {
            tr += '<tr><th>Owner Id:</th><td>' + rec.OwnerID + '</td></tr>';
        }
        tr += '<tr><th>Location:</th><td>' + editHoaRec.Parcel_Location + '</td></tr>';

        tr += '<tr><th>Current Owner: </th><td>' + util.setCheckbox(rec.CurrentOwner) + '</td></tr>';
        tr += '<tr><th>Owner Name1:</th><td>' + util.setInputText("ownerName1", rec.Owner_Name1, "50") + '</td></tr>';
        tr += '<tr><th>Owner Name2:</th><td>' + util.setInputText("ownerName2", rec.Owner_Name2, "50") + '</td></tr>';
        tr += '<tr><th>Date Purchased:</th><td>' + util.setInputDate("datePurchased", rec.DatePurchased, "10") + '</td></tr>';
        tr += '<tr><th>Mailing Name:</th><td>' + util.setInputText("mailingName", rec.Mailing_Name, "50") + '</td></tr>';
        tr += '<tr><th>Alternate Mailing: </th><td>' + util.setCheckboxEdit('alternateMailingCheckbox', rec.AlternateMailing) + '</td></tr>';
        tr += '<tr><th>Address Line1:</th><td>' + util.setInputText("addrLine1", rec.Alt_Address_Line1, "50") + '</td></tr>';
        tr += '<tr><th>Address Line2:</th><td>' + util.setInputText("addrLine2", rec.Alt_Address_Line2, "50") + '</td></tr>';
        tr += '<tr><th>City:</th><td>' + util.setInputText("altCity", rec.Alt_City, "40") + '</td></tr>';
        tr += '<tr><th>State:</th><td>' + util.setInputText("altState", rec.Alt_State, "20") + '</td></tr>';
        tr += '<tr><th>Zip:</th><td>' + util.setInputText("altZip", rec.Alt_Zip, "20") + '</td></tr>';
        tr += '<tr><th>Owner Phone:</th><td>' + util.setInputText("ownerPhone", rec.Owner_Phone, "30") + '</td></tr>';
        tr += '<tr><th>Email Addr: </th><td>' + util.setInputText("emailAddr", rec.EmailAddr, "90") + '</td></tr>';
        tr += '<tr><th>Email Addr2: </th><td>' + util.setInputText("emailAddr2", rec.EmailAddr2, "90") + '</td></tr>';
        tr += '<tr><th>Comments: </th><td>' + util.setInputText("ownerComments", rec.Comments, "90") + '</td></tr>';
        tr += '<tr><th>Last Changed:</th><td>' + rec.LastChangedTs + '</td></tr>';
        tr += '<tr><th>Changed by:</th><td>' + rec.LastChangedBy + '</td></tr>';
        tr += '</div>';

        $EditTable2ColBody.html(tr);

        if (salesRec != null) {
            tr2 = '<div class="form-group">';
            tr2 += '<tr><td><h3>Sales Information</h3></td></tr>';
            tr2 += '<tr><th>Sales Owner Name: </th><td>' + salesRec.OWNERNAME1 + '</td></tr>';
            tr2 += '<tr><th>Sale Date: </th><td>' + salesRec.SALEDT + '</td></tr>';
            tr2 += '<tr><th>Sales Mailing Name1: </th><td>' + salesRec.MAILINGNAME1 + '</td></tr>';
            tr2 += '<tr><th>Sales Mailing Name2: </th><td>' + salesRec.MAILINGNAME2 + '</td></tr>';
            tr2 += '<tr><th>Sales Address1: </th><td>' + salesRec.PADDR1 + '</td></tr>';
            tr2 += '<tr><th>Sales Address2: </th><td>' + salesRec.PADDR2 + '</td></tr>';
            tr2 += '<tr><th>Sales Address3: </th><td>' + salesRec.PADDR3 + '</td></tr>';
            tr2 += '</div>';
        }

        $EditTable2Col2Body.html(tr2);

        tr = '<form class="form-inline" role="form">';
        if (createNew) {
            //	    tr += '<tr><th></th><td>'+
            tr += '<a id="SaveOwnerEdit" data-parcelId="' + editHoaRec.Parcel_ID + '" data-ownerId="NEW" href="#" class="btn btn-primary" role="button">Create New</a>';
            //	  	  '</td></tr>';
        } else {
            //	    tr += '<tr><th></th><td>'+
            tr += '<a id="SaveOwnerEdit" data-parcelId="' + editHoaRec.Parcel_ID + '" data-ownerId="' + ownerId + '" href="#" class="btn btn-primary" role="button">Save</a>';
            //	  	  '</td></tr>';
        }
        tr += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button></form>';
        $EditPage2ColButton.html(tr);

        // Initialize the date picker object
        /*
        $(".Date").datetimepicker({
            timepicker: false,
            format: 'Y-m-d'
        });
        */

    } // End of function _formatOwnerDetailEdit(editHoaRec){

    function _saveOwnerEdit(event) {
        /* *** implement validator.js to validate form fields ***
        var tempEmailAddr = cleanStr($("#EmailAddr").val());
        if (tempEmailAddr.length > 0 && !validEmailAddr.test(tempEmailAddr)) {
            console.log('email address is NOT VALID');
			$('*').css('cursor', 'default');
            $(".editValidationError").text("Email Address is NOT VALID");
        } else {
        } // End of empty or valid email address
        */

         
        var paramMap = new Map();
        paramMap.set('parcelId', event.target.getAttribute("data-parcelId"));
        paramMap.set('ownerId', event.target.getAttribute("data-ownerId"));

        //console.log("util.getJSONfromInputs($EditTable,paramMap) = " + util.getJSONfromInputs($EditTable2Col, paramMap));

        $.ajax("updHoaOwner.php", {
            type: "POST",
            contentType: "application/json",
            data: util.getJSONfromInputs($EditTable2Col, paramMap),
            dataType: "json",
            success: function (outHoaRec) {
                 
                // Set the newest record from the update into the module variable (for render)
                hoaRec = outHoaRec;
                _render();
                $EditPage2Col.modal("hide");
            },
            error: function () {
                $editValidationError.html("An error occurred in the update - see log");
            }
        });

        /*
        $.ajax(url, {
            type: "POST",
            contentType: "application/json",
            data: util.getJSONfromInputs($Inputs, paramMap),
            dataType: "json"
            //dataType: "html"
        })
            .done(function (storeRec) {
                _renderConfig(storeRec);
            })
            .fail(function (xhr, status, error) {
                //Ajax request failed.
                console.log('Error in AJAX request to ' + url + ', xhr = ' + xhr.status + ': ' + xhr.statusText +
                    ', status = ' + status + ', error = ' + error);
                alert('Error in AJAX request to ' + url + ', xhr = ' + xhr.status + ': ' + xhr.statusText +
                    ', status = ' + status + ', error = ' + error);
            });
            */


    };	// End of $(document).on("click","#SaveOwnerEdit",function(){

    function _editAssessment(event) {
         
        $.getJSON("getHoaDbData.php", "parcelId=" + event.target.getAttribute("data-parcelId") + "&fy=" + event.target.getAttribute("data-fy"), function (editHoaRec) {
            _formatAssessmentDetailEdit(editHoaRec);
             
            $EditPage2Col.modal();
        });
    };

    function _formatAssessmentDetailEdit(editHoaRec) {
        var tr = '';
        var fy = '';

        // Clear the field where we report validation errors
        $editValidationError.empty();
        // Action or type of update
        $EditPage2ColHeader.text("Edit Assessment");

        var rec = editHoaRec.assessmentsList[0];

        fy = rec.FY;
        tr += '<div class="form-group">';
        tr += '<tr><th>Fiscal Year: </th><td>' + rec.FY + '</td></tr>';
        tr += '<tr><th>Parcel Id: </th><td>' + rec.Parcel_ID + '</td></tr>';

        var ownerSelect = '<select class="form-control" id="ownerId">'
        $.each(editHoaRec.ownersList, function (index, rec) {
            ownerSelect += util.setSelectOption(rec.OwnerID, rec.OwnerID + " - " + rec.Owner_Name1 + " " + rec.Owner_Name2, (index == 0), "");
        });
        ownerSelect += '</select>';
        tr += '<tr><th>Owner: </th><td>' + ownerSelect + '</td></tr>';

        var tempDuesAmt = '' + rec.DuesAmt;
        tr += '<tr><th>Dues Amount: </th><td>' + util.setInputText("duesAmount", util.formatMoney(tempDuesAmt), "10") + '</td></tr>';

        tr += '<tr><th>Date Due: </th><td>' + util.setInputDate("dateDue", rec.DateDue, "10") + '</td></tr>';
        tr += '<tr><th>Paid: </th><td>' + util.setCheckboxEdit('paidCheckbox', rec.Paid) + '</td></tr>';
        tr += '<tr><th>Non-Collectible: </th><td>' + util.setCheckboxEdit('nonCollectibleCheckbox',rec.NonCollectible) + '</td></tr>';
        tr += '<tr><th>Date Paid: </th><td>' + util.setInputDate("datePaid", rec.DatePaid, "10") + '</td></tr>';
        tr += '<tr><th>Payment Method: </th><td>' + util.setInputText("paymentMethod", rec.PaymentMethod, "50") + '</td></tr>';
        tr += '<tr><th>Comments: </th><td>' + util.setInputText("assessmentsComments", rec.Comments, "90") + '</td></tr>';
        tr += '<tr><th>Last Changed: </th><td>' + rec.LastChangedTs + '</td></tr>';
        tr += '<tr><th>Changed by: </th><td>' + rec.LastChangedBy + '</td></tr>';
        tr += '</div>';
        $EditTable2ColBody.html(tr);

        tr = '';
        tr += '<div class="form-group">';
        tr += '<tr><th>Lien: </th><td>' + util.setCheckboxEdit('lienCheckbox', rec.Lien) + '</td></tr>';
        tr += '<tr><th>LienRefNo: </th><td>' + util.setInputText("lienRefNo", rec.LienRefNo, "15") + '</td></tr>';
        tr += '<tr><th>DateFiled: </th><td>' + util.setInputDate("dateFiled", rec.DateFiled, "10") + '</td></tr>';

        var selectOption = '<select class="form-control" id="disposition">'
            + util.setSelectOption("", "", ("" == rec.Disposition), "")
            + util.setSelectOption("Open", "Open", ("Open" == rec.Disposition), "bg-danger")
            + util.setSelectOption("Paid", "Paid", ("Paid" == rec.Disposition), "bg-success")
            + util.setSelectOption("Released", "Released", ("Released" == rec.Disposition), "bg-info")
            + util.setSelectOption("Closed", "Closed", ("Closed" == rec.Disposition), "bg-warning")
            + '</select>';
        tr += '<tr><th>Disposition: </th><td>' + selectOption + '</td></tr>';

        tr += '<tr><th>FilingFee: </th><td>' + util.setInputText("filingFee", rec.FilingFee, "10") + '</td></tr>';
        tr += '<tr><th>ReleaseFee: </th><td>' + util.setInputText("releaseFee", rec.ReleaseFee, "10") + '</td></tr>';
        tr += '<tr><th>DateReleased: </th><td>' + util.setInputDate("dateReleased", rec.DateReleased, "10") + '</td></tr>';
        tr += '<tr><th>LienDatePaid: </th><td>' + util.setInputDate("lienDatePaid", rec.LienDatePaid, "10") + '</td></tr>';
        tr += '<tr><th>AmountPaid: </th><td>' + util.setInputText("amountPaid", rec.AmountPaid, "10") + '</td></tr>';
        tr += '<tr><th>StopInterestCalc: </th><td>' + util.setCheckboxEdit('stopInterestCalcCheckbox', rec.StopInterestCalc) + '</td></tr>';
        tr += '<tr><th>FilingFeeInterest: </th><td>' + util.setInputText("filingFeeInterest", rec.FilingFeeInterest, "10") + '</td></tr>';
        tr += '<tr><th>AssessmentInterest: </th><td>' + util.setInputText("assessmentInterest", rec.AssessmentInterest, "10") + '</td></tr>';

        tr += '<tr><th>InterestNotPaid: </th><td>' + util.setCheckboxEdit('interestNotPaidCheckbox', rec.InterestNotPaid) + '</td></tr>';
        tr += '<tr><th>BankFee: </th><td>' + util.setInputText("bankFee", rec.BankFee, "10") + '</td></tr>';

        tr += '<tr><th>LienComment: </th><td>' + util.setInputText("lienComment", rec.LienComment, "90") + '</td></tr>';
        tr += '</div>';
        $EditTable2Col2Body.html(tr);

        tr = '<form class="form-inline" role="form">' +
            '<a id="SaveAssessmentEdit" data-parcelId="' + editHoaRec.Parcel_ID + '" data-fy="' + fy + '" href="#" class="btn btn-primary" role="button">Save</a>' +
            '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
            '</form>';
        $("#EditPage2ColButton").html(tr);

        // Initialize the date picker object
        /*
        $(".Date").datetimepicker({
            timepicker: false,
            format: 'Y-m-d'
        });
        */

    } // End of function formatAssessmentDetailEdit(editHoaRec){

    function _saveAssessmentEdit() {
         
        var paramMap = new Map();
        paramMap.set('parcelId', event.target.getAttribute("data-parcelId"));
        paramMap.set('fy', event.target.getAttribute("data-fy"));

        //console.log("util.getJSONfromInputs($EditPage2Col,paramMap) = " + util.getJSONfromInputs($EditPage2Col, paramMap));

        $.ajax("updHoaAssessment.php", {
            type: "POST",
            contentType: "application/json",
            data: util.getJSONfromInputs($EditPage2Col, paramMap),
            dataType: "json",
            success: function (outHoaRec) {
                 
                // Set the newest record from the update into the module variable (for render)
                hoaRec = outHoaRec;
                _render();
                $EditPage2Col.modal("hide");
            },
            error: function () {
                $editValidationError.html("An error occurred in the update - see log");
            }
        });

    };	// End of $(document).on("click","#SaveAssessmentEdit",function(){


    function createDuesStatement(event) {
        //console.log("create dues statement, parcel = " + event.target.getAttribute("data-parcelId") + ", owner = " + event.target.getAttribute("data-ownerId"));
         
        $.getJSON("getHoaDbData.php", "parcelId=" + event.target.getAttribute("data-parcelId") + "&ownerId=" + event.target.getAttribute("data-ownerId"), function (hoaRec) {
            formatDuesStatementResults(hoaRec);
             
            $DuesStatementPage.modal();
        });
    };

    function downloadDuesStatement(event) {
        currPdfRec.pdf.save(util.formatDate() + "-" + event.target.getAttribute("data-pdfName") + ".pdf");
    };

    function formatDuesStatementResults(hoaRec) {
        var ownerRec = hoaRec.ownersList[0];
        var tr = '';
        var duesStatementNotes = config.getVal('duesStatementNotes');
        duesStatementDownloadLinks.empty();

        // Initialize the PDF object
        currPdfRec = pdfModule.init(config.getVal('hoaNameShort') + ' Dues Statement');

        if (duesStatementNotes.length > 0) {
            currPdfRec.lineColIncrArray = [1.4];
            currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,[duesStatementNotes], null);
            currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,[''], null);
        }

        var pdfLineHeaderArray = [
            'Parcel Id',
            'Lot No',
            'Location',
            'Owner and Alt Address',
            'Phone'];
        currPdfRec.lineColIncrArray = [0.6, 1.4, 0.8, 2.2, 1.9];

        currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,[hoaRec.Parcel_ID, hoaRec.LotNo, hoaRec.Parcel_Location, 
            ownerRec.Mailing_Name,ownerRec.Owner_Phone], pdfLineHeaderArray);

        if (hoaRec.ownersList[0].AlternateMailing) {
            currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,['', '', '', ownerRec.Alt_Address_Line1, ''], null);
            if (ownerRec.Alt_Address_Line2 != '') {
                currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,['', '', '', ownerRec.Alt_Address_Line2, ''], null);
            }
            currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,['', '', '', ownerRec.Alt_City + ', ' + ownerRec.Alt_State + ' ' + ownerRec.Alt_Zip, ''], null);
        }

        tr += '<tr><th>Parcel Id:</th><td>' + hoaRec.Parcel_ID + '</a></td></tr>';
        tr += '<tr><th>Lot No:</th><td>' + hoaRec.LotNo + '</td></tr>';
        tr += '<tr><th>Location: </th><td>' + hoaRec.Parcel_Location + '</td></tr>';
        tr += '<tr><th>City State Zip: </th><td>' + hoaRec.Property_City + ', ' + hoaRec.Property_State + ' ' + hoaRec.Property_Zip + '</td></tr>';
        tr += '<tr><th>Owner Name:</th><td>' + ownerRec.Owner_Name1 + ' ' + ownerRec.Owner_Name2 + '</td></tr>';

        var tempTotalDue = '' + hoaRec.TotalDue;
        tr += '<tr><th>Total Due: </th><td>$' + util.formatMoney(tempTotalDue) + '</td></tr>';
        $DuesStatementPropertyTable.html(tr);

        // If enabled, payment button and instructions will have values, else they will be blank if online payment is not allowed
        if (hoaRec.TotalDue > 0) {
            $("#PayDues").html(hoaRec.paymentButton);
            if (hoaRec.paymentButton != '') {
                $("#PayDuesInstructions").html(config.getVal('onlinePaymentInstructions'));
            } else {
                $("#PayDuesInstructions").html(config.getVal('offlinePaymentInstructions'));
            }
        }

        duesStatementDownloadLinks.append(
            $('<a>').prop('id', 'DownloadDuesStatement')
                .attr('href', '#')
                .attr('class', "btn btn-danger downloadBtn")
                .attr('data-pdfName', 'DuesStatement')
                .html('PDF'));

        currPdfRec.lineColIncrArray = [0.6, 4.2, 0.5];
        currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,[''], null);

        tr = '';
        $.each(hoaRec.totalDuesCalcList, function (index, rec) {
            tr = tr + '<tr>';
            tr = tr + '<td>' + rec.calcDesc + '</td>';
            tr = tr + '<td>$</td>';
            tr = tr + '<td align="right">' + parseFloat('' + rec.calcValue).toFixed(2) + '</td>';
            tr = tr + '</tr>';
            currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,[rec.calcDesc, '$', parseFloat('' + rec.calcValue).toFixed(2)], null);
        });
        tr = tr + '<tr>';
        tr = tr + '<td><b>Total Due:</b></td>';
        tr = tr + '<td><b>$</b></td>';
        tr = tr + '<td align="right"><b>' + parseFloat('' + hoaRec.TotalDue).toFixed(2) + '</b></td>';
        tr = tr + '</tr>';
        currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,['Total Due:', '$', parseFloat('' + hoaRec.TotalDue).toFixed(2)], null);

        tr = tr + '<tr>';
        tr = tr + '<td>' + hoaRec.assessmentsList[0].LienComment + '</td>';
        tr = tr + '<td></td>';
        tr = tr + '<td align="right"></td>';
        tr = tr + '</tr>';
        $("#DuesStatementCalculationTable tbody").html(tr);
        currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,[hoaRec.assessmentsList[0].LienComment, '', ''], null);

        currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,[''], null);

        var TaxYear = '';
        tr = '';
        var tempDuesAmt = '';
        $.each(hoaRec.assessmentsList, function (index, rec) {
            pdfLineHeaderArray = null;

            if (index == 0) {
                tr = tr + '<tr>';
                tr = tr + '<th>Year</th>';
                tr = tr + '<th>Dues Amt</th>';
                tr = tr + '<th>Date Due</th>';
                tr = tr + '<th>Paid</th>';
                tr = tr + '<th>Non-Collectible</th>';
                tr = tr + '<th>Date Paid</th>';
                tr = tr + '</tr>';
                TaxYear = rec.DateDue.substring(0, 4);

                pdfLineHeaderArray = [
                    'Year',
                    'Dues Amt',
                    'Date Due',
                    'Paid',
                    'Non-Collectible',
                    'Date Paid'];
                currPdfRec.lineColIncrArray = [0.6, 0.8, 1.0, 1.7, 0.8, 1.5];
            }

            tempDuesAmt = '' + rec.DuesAmt;
            tr = tr + '<tr>';
            tr = tr + '<td>' + rec.FY + '</a></td>';
            tr = tr + '<td>' + util.formatMoney(tempDuesAmt) + '</td>';
            tr = tr + '<td>' + rec.DateDue + '</td>';
            tr = tr + '<td>' + util.setCheckbox(rec.Paid) + '</td>';
            tr = tr + '<td>' + util.setCheckbox(rec.NonCollectible) + '</td>';
            tr = tr + '<td>' + rec.DatePaid + '</td>';
            tr = tr + '</tr>';
            currPdfRec = pdfModule.duesStatementAddLine(currPdfRec,[rec.FY, rec.DuesAmt, rec.DateDue, util.setBoolText(rec.Paid), util.setBoolText(rec.NonCollectible), rec.DatePaid], pdfLineHeaderArray);
        });

        $DuesStatementAssessmentsTable.html(tr);

    } // End of function formatDuesStatementResults(hoaRec){

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        getHoaRec: getHoaRec
    };
        
})(); // var detail = (function(){
