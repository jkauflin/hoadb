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
 * 2018-10-21 JJK   Re-factor for modules
 * 2018-10-28 JJK   Went back to declaring variables in the functions
 *============================================================================*/
var detail = (function(){
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var hoaRec;

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $moduleDiv = $('#DetailPage');
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
    var $AddAssessment = $("#AddAssessment");

    var $EditPage = $("#EditPage");
    var $EditTable = $("#EditTable");
    var $EditTableBody = $("#EditTable").find("tbody");
    var $editValidationError = $(".editValidationError");
    var $EditPageHeader = $("#EditPageHeader");
    var $EditPageButton = $("#EditPageButton");

    //=================================================================================================================
    // Bind events
    //$button.on('click', addPerson);
    //$ul.delegate('i.del', 'click', deletePerson);              
    $document.on("click", "#PropertyListDisplay tr td a", getHoaRec);
    $moduleDiv.on("click", "#PropertyDetail tr td a", _editProperty);
    $EditPage.on("click", "#SavePropertyEdit", _savePropertyEdit);

    function _editProperty(value) {
        // If a string was passed in then use value as the name, else get it from the attribute of the click event object
        parcelId = (typeof value === "string") ? value : value.target.getAttribute("data-parcelId");
        util.waitCursor();
        $.getJSON("getHoaDbData.php", "parcelId=" + parcelId, function (hoaRec) {
            _formatPropertyDetailEdit(hoaRec);
            util.defaultCursor();
            $EditPage.modal();
        });
    };

    // Functions for EditPage - respond to requests for update
    function _savePropertyEdit(event) {
        util.waitCursor();
        var paramMap = new Map();
        paramMap.set('parcelId', event.target.getAttribute("data-parcelId"));
        console.log("util.getJSONfromInputs($EditTable,paramMap) = " + util.getJSONfromInputs($EditTable, paramMap));
        $.ajax("updHoaProperty.php", {
            type: "POST",
            contentType: "application/json",
            data: util.getJSONfromInputs($EditTable, paramMap),
            dataType: "json",
            success: function (outHoaRec) {
                util.defaultCursor();
                // Set the newest record from the update into the module variable (for render)
                hoaRec = outHoaRec;
                _render();
                $EditPage.modal("hide");
                // Shouldn't have to do this
                //$displayPage.tab('show');
            },
            error: function () {
                $editValidationError.html("An error occurred in the update - see log");
            }
        });

        /*
        waitCursor();

        var $this = $(this);
        var $parcelId = $this.attr("data-parcelId");
        var $memberBoolean = $("#MemberCheckbox").is(":checked");
        var $vacantBoolean = $("#VacantCheckbox").is(":checked");
        var $rentalBoolean = $("#RentalCheckbox").is(":checked");
        var $managedBoolean = $("#ManagedCheckbox").is(":checked");
        var $foreclosureBoolean = $("#ForeclosureCheckbox").is(":checked");
        var $bankruptcyBoolean = $("#BankruptcyCheckbox").is(":checked");
        var $liensBoolean = $("#LiensCheckbox").is(":checked");
        var $useEmailBoolean = $("#UseEmailCheckbox").is(":checked");

        //$.getJSON("updHoaDbData.php","parcelId="+$this.attr("data-parcelId"),function(hoaRec){
        $.get("updHoaProperty.php", "parcelId=" + $parcelId +
            "&memberBoolean=" + $memberBoolean +
            "&vacantBoolean=" + $vacantBoolean +
            "&rentalBoolean=" + $rentalBoolean +
            "&managedBoolean=" + $managedBoolean +
            "&foreclosureBoolean=" + $foreclosureBoolean +
            "&bankruptcyBoolean=" + $bankruptcyBoolean +
            "&liensBoolean=" + $liensBoolean +
            "&useEmailBoolean=" + $useEmailBoolean +
            "&propertyComments=" + cleanStr($("#PropertyComments").val()), function (results) {

                // Re-read the updated data for the Detail page display
                $.getJSON("getHoaDbData.php", "parcelId=" + $parcelId, function (hoaRec) {
                    formatPropertyDetailResults(hoaRec);
                    $('*').css('cursor', 'default');
                    $("#EditPage").modal("hide");
                    $('#navbar a[href="#DetailPage"]').tab('show');
                });
            }); // End of $.get("updHoaDbData.php","parcelId="+$parcelId+
        */
    };	// End of $(document).on("click","#SavePropertyEdit",function(){





    $(document).on("click", "#PropertyOwners tr td a", function () {
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php", "parcelId=" + $this.attr("data-parcelId") + "&ownerId=" + $this.attr("data-ownerId"), function (hoaRec) {
            createNew = false;
            formatOwnerDetailEdit(hoaRec, createNew);
            $('*').css('cursor', 'default');
            $("#EditPage2Col").modal();
        });
    });

    $(document).on("click", "#NewOwnerButton", function () {
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php", "parcelId=" + $this.attr("data-parcelId") + "&ownerId=" + $this.attr("data-ownerId"), function (hoaRec) {
            createNew = true;
            formatOwnerDetailEdit(hoaRec, createNew);
            $('*').css('cursor', 'default');
            $("#EditPage2Col").modal();
        });
    });	


    $(document).on("click", "#PropertyAssessments tr td a", function () {
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php", "parcelId=" + $this.attr("data-parcelId") + "&fy=" + $this.attr("data-FY"), function (hoaRec) {
            formatAssessmentDetailEdit(hoaRec);
            $('*').css('cursor', 'default');
            $("#EditPage2Col").modal();
        });
    });



    $(document).on("click", "#SaveOwnerEdit", function () {
        waitCursor();
        var $this = $(this);
        var $parcelId = $this.attr("data-parcelId");
        var $ownerId = $this.attr("data-ownerId");

        //var $currentOwnerBoolean = $("#CurrentOwnerCheckbox").is(":checked");
        var $alternateMailingBoolean = $("#AlternateMailingCheckbox").is(":checked");

        /*
        var tempEmailAddr = cleanStr($("#EmailAddr").val());
        if (tempEmailAddr.length > 0 && !validEmailAddr.test(tempEmailAddr)) {
            console.log('email address is NOT VALID');
			$('*').css('cursor', 'default');
            $(".editValidationError").text("Email Address is NOT VALID");
        } else {
        } // End of empty or valid email address
        */

        //console.log('email address is empty or valid');
        $.get("updHoaOwner.php", "parcelId=" + $parcelId +
            "&ownerId=" + $ownerId +
            //"&currentOwnerBoolean="+$currentOwnerBoolean+
            "&ownerName1=" + cleanStr($("#OwnerName1").val()) +
            "&ownerName2=" + cleanStr($("#OwnerName2").val()) +
            "&datePurchased=" + cleanStr($("#DatePurchased").val()) +
            "&mailingName=" + cleanStr($("#MailingName").val()) +
            "&alternateMailingBoolean=" + $alternateMailingBoolean +
            "&addrLine1=" + cleanStr($("#AddrLine1").val()) +
            "&addrLine2=" + cleanStr($("#AddrLine2").val()) +
            "&altCity=" + cleanStr($("#AltCity").val()) +
            "&altState=" + cleanStr($("#AltState").val()) +
            "&altZip=" + cleanStr($("#AltZip").val()) +
            "&ownerPhone=" + cleanStr($("#OwnerPhone").val()) +
            "&emailAddr=" + cleanStr($("#EmailAddr").val()) +
            "&ownerComments=" + cleanStr($("#OwnerComments").val()), function (results) {

                // Re-read the updated data for the Detail page display
                $.getJSON("getHoaDbData.php", "parcelId=" + $parcelId, function (hoaRec) {
                    formatPropertyDetailResults(hoaRec);
                    $('*').css('cursor', 'default');
                    $("#EditPage2Col").modal("hide");
                    $('#navbar a[href="#DetailPage"]').tab('show');
                });
            }); // End of $.get("updHoaDbData.php","parcelId="+$parcelId+


    });	// End of $(document).on("click","#SaveOwnerEdit",function(){

    $(document).on("click", "#SaveAssessmentEdit", function () {
        waitCursor();
        var $this = $(this);
        var $parcelId = $this.attr("data-parcelId");
        //var $ownerId = $this.attr("data-ownerId");
        var $fy = $this.attr("data-FY");
        var $paidBoolean = $("#PaidCheckbox").is(":checked");
        var $nonCollectibleBoolean = $("#NonCollectibleCheckbox").is(":checked");
        var $lienBoolean = $("#LienCheckbox").is(":checked");
        var $stopInterestCalcBoolean = $("#StopInterestCalcCheckbox").is(":checked");
        var $interestNotPaidBoolean = $("#InterestNotPaidCheckbox").is(":checked");

        $.get("updHoaAssessment.php", "parcelId=" + $parcelId +
            "&fy=" + $fy +
            "&ownerId=" + cleanStr($("#OwnerID").val()) +
            "&duesAmount=" + cleanStr($("#DuesAmount").val()) +
            "&dateDue=" + cleanStr($("#DateDue").val()) +
            "&paidBoolean=" + $paidBoolean +
            "&nonCollectibleBoolean=" + $nonCollectibleBoolean +
            "&datePaid=" + cleanStr($("#DatePaid").val()) +
            "&paymentMethod=" + cleanStr($("#PaymentMethod").val()) +
            "&assessmentsComments=" + cleanStr($("#AssessmentsComments").val()) +
            "&lienBoolean=" + $lienBoolean +
            "&lienRefNo=" + cleanStr($("#LienRefNo").val()) +
            "&dateFiled=" + cleanStr($("#DateFiled").val()) +
            "&disposition=" + cleanStr($("#Disposition").val()) +
            "&filingFee=" + cleanStr($("#FilingFee").val()) +
            "&releaseFee=" + cleanStr($("#ReleaseFee").val()) +
            "&dateReleased=" + cleanStr($("#DateReleased").val()) +
            "&lienDatePaid=" + cleanStr($("#LienDatePaid").val()) +
            "&amountPaid=" + cleanStr($("#AmountPaid").val()) +
            "&stopInterestCalcBoolean=" + $stopInterestCalcBoolean +
            "&filingFeeInterest=" + cleanStr($("#FilingFeeInterest").val()) +
            "&assessmentInterest=" + cleanStr($("#AssessmentInterest").val()) +
            "&interestNotPaidBoolean=" + $interestNotPaidBoolean +
            "&bankFee=" + cleanStr($("#BankFee").val()) +
            "&lienComment=" + cleanStr($("#LienComment").val()), function (results) {

                // Re-read the updated data for the Detail page display
                $.getJSON("getHoaDbData.php", "parcelId=" + $parcelId, function (hoaRec) {
                    formatPropertyDetailResults(hoaRec);
                    $('*').css('cursor', 'default');
                    $("#EditPage2Col").modal("hide");
                    $('#navbar a[href="#DetailPage"]').tab('show');
                });
            }); // End of $.get("updHoaDbData.php","parcelId="+$parcelId+

    });	// End of $(document).on("click","#SaveAssessmentEdit",function(){



    function formatAssessmentDetailEdit(hoaRec) {
        var tr = '';
        var checkedStr = '';
        var buttonStr = '';
        //var ownerId = '';
        var fy = '';
        $(".editValidationError").empty();

        // action or type of update
        $("#EditPage2ColHeader").text("Edit Assessment");

        //console.log("hoaRec.ownersList.length = "+hoaRec.ownersList.length);
        rec = hoaRec.assessmentsList[0];

        fy = rec.FY;
        tr = '';
        tr += '<div class="form-group">';
        tr += '<tr><th>Fiscal Year: </th><td>' + rec.FY + '</td></tr>';
        tr += '<tr><th>Parcel Id: </th><td>' + rec.Parcel_ID + '</td></tr>';

        var ownerSelect = '<select class="form-control" id="OwnerID">'
        $.each(hoaRec.ownersList, function (index, rec) {
            ownerSelect += setSelectOption(rec.OwnerID, rec.OwnerID + " - " + rec.Owner_Name1 + " " + rec.Owner_Name2, (index == 0), "");
        });
        ownerSelect += '</select>';
        tr += '<tr><th>Owner: </th><td>' + ownerSelect + '</td></tr>';
        //tr += '<tr><th>Owner Id: </th><td>'+rec.OwnerID+'</td></tr>';

        var tempDuesAmt = '' + rec.DuesAmt;
        tr += '<tr><th>Dues Amount: </th><td>' + util.setInputText("DuesAmount", stringToMoney(tempDuesAmt), "10") + '</td></tr>';

        tr += '<tr><th>Date Due: </th><td>' + util.setInputDate("DateDue", rec.DateDue, "10") + '</td></tr>';
        tr += '<tr><th>Paid: </th><td>' + util.setCheckboxEdit(rec.Paid, 'PaidCheckbox') + '</td></tr>';
        tr += '<tr><th>Non-Collectible: </th><td>' + util.setCheckboxEdit(rec.NonCollectible, 'NonCollectibleCheckbox') + '</td></tr>';
        tr += '<tr><th>Date Paid: </th><td>' + util.setInputDate("DatePaid", rec.DatePaid, "10") + '</td></tr>';
        tr += '<tr><th>Payment Method: </th><td>' + util.setInputText("PaymentMethod", rec.PaymentMethod, "50") + '</td></tr>';
        tr += '<tr><th>Comments: </th><td>' + util.setInputText("AssessmentsComments", rec.Comments, "90") + '</td></tr>';
        tr += '<tr><th>Last Changed: </th><td>' + rec.LastChangedTs + '</td></tr>';
        tr += '<tr><th>Changed by: </th><td>' + rec.LastChangedBy + '</td></tr>';
        tr += '</div>';
        $("#EditTable2Col tbody").html(tr);

        tr = '';
        tr += '<div class="form-group">';
        tr += '<tr><th>Lien: </th><td>' + util.setCheckboxEdit(rec.Lien, 'LienCheckbox') + '</td></tr>';
        tr += '<tr><th>LienRefNo: </th><td>' + util.setInputText("LienRefNo", rec.LienRefNo, "15") + '</td></tr>';
        tr += '<tr><th>DateFiled: </th><td>' + util.setInputDate("DateFiled", rec.DateFiled, "10") + '</td></tr>';

        var selectOption = '<select class="form-control" id="Disposition">'
            + util.setSelectOption("", "", ("" == rec.Disposition), "")
            + util.setSelectOption("Open", "Open", ("Open" == rec.Disposition), "bg-danger")
            + util.setSelectOption("Paid", "Paid", ("Paid" == rec.Disposition), "bg-success")
            + util.setSelectOption("Released", "Released", ("Released" == rec.Disposition), "bg-info")
            + util.setSelectOption("Closed", "Closed", ("Closed" == rec.Disposition), "bg-warning")
            + '</select>';
        tr += '<tr><th>Disposition: </th><td>' + selectOption + '</td></tr>';
        //tr += '<tr><th>Disposition: </th><td>'+setInputText("Disposition",rec.Disposition,"10")+'</td></tr>';

        tr += '<tr><th>FilingFee: </th><td>' + util.setInputText("FilingFee", rec.FilingFee, "10") + '</td></tr>';
        tr += '<tr><th>ReleaseFee: </th><td>' + util.setInputText("ReleaseFee", rec.ReleaseFee, "10") + '</td></tr>';
        tr += '<tr><th>DateReleased: </th><td>' + util.setInputDate("DateReleased", rec.DateReleased, "10") + '</td></tr>';
        tr += '<tr><th>LienDatePaid: </th><td>' + util.setInputDate("LienDatePaid", rec.LienDatePaid, "10") + '</td></tr>';
        tr += '<tr><th>AmountPaid: </th><td>' + util.setInputText("AmountPaid", rec.AmountPaid, "10") + '</td></tr>';
        tr += '<tr><th>StopInterestCalc: </th><td>' + util.setCheckboxEdit(rec.StopInterestCalc, 'StopInterestCalcCheckbox') + '</td></tr>';
        tr += '<tr><th>FilingFeeInterest: </th><td>' + util.setInputText("FilingFeeInterest", rec.FilingFeeInterest, "10") + '</td></tr>';
        tr += '<tr><th>AssessmentInterest: </th><td>' + util.setInputText("AssessmentInterest", rec.AssessmentInterest, "10") + '</td></tr>';

        tr += '<tr><th>InterestNotPaid: </th><td>' + util.setCheckboxEdit(rec.InterestNotPaid, 'InterestNotPaidCheckbox') + '</td></tr>';
        tr += '<tr><th>BankFee: </th><td>' + util.setInputText("BankFee", rec.BankFee, "10") + '</td></tr>';

        tr += '<tr><th>LienComment: </th><td>' + util.setInputText("LienComment", rec.LienComment, "90") + '</td></tr>';
        tr += '</div>';
        $("#EditTable2Col2 tbody").html(tr);

        tr = '<form class="form-inline" role="form">' +
            '<a id="SaveAssessmentEdit" data-parcelId="' + hoaRec.Parcel_ID + '" data-FY="' + fy + '" href="#" class="btn btn-primary" role="button">Save</a>' +
            '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
            '</form>';
        $("#EditPage2ColButton").html(tr);

        $(".Date").datetimepicker({
            timepicker: false,
            format: 'Y-m-d'
        });

    } // End of function formatAssessmentDetailEdit(hoaRec){



    //=================================================================================================================
    // Module methods
    function getHoaRec(value) {
        // If a string was passed in then use value as the name, else get it from the attribute of the click event object
        var parcelId = (typeof value === "string") ? value : value.target.getAttribute("data-parcelId");
        util.waitCursor();
        $propDetail.html("");
        $propOwners.html("");
        $propAssessments.html("");
        $.getJSON("getHoaDbData.php", "parcelId=" + parcelId, function (outHoaRec) {
            hoaRec = outHoaRec;
            _render();
            util.defaultCursor();
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

        tr += '<tr><th class="hidden-xs hidden-sm">Member: </th><td class="hidden-xs hidden-sm">' + util.setCheckbox(hoaRec.Member) + '</td></tr>';
        tr += '<tr><th>Vacant: </th><td>' + util.setCheckbox(hoaRec.Vacant) + '</td></tr>';
        tr += '<tr><th>Rental: </th><td>' + util.setCheckbox(hoaRec.Rental) + '</td></tr>';
        tr += '<tr><th>Managed: </th><td>' + util.setCheckbox(hoaRec.Managed) + '</td></tr>';
        tr += '<tr><th>Foreclosure: </th><td>' + util.setCheckbox(hoaRec.Foreclosure) + '</td></tr>';
        tr += '<tr><th>Bankruptcy: </th><td>' + util.setCheckbox(hoaRec.Bankruptcy) + '</td></tr>';
        tr += '<tr><th>ToBe Released: </th><td>' + util.setCheckbox(hoaRec.Liens_2B_Released) + '</td></tr>';
        tr += '<tr><th>Use Email: </th><td>' + util.setCheckbox(hoaRec.UseEmail) + '</td></tr>';
        tr += '<tr><th>Comments: </th><td>' + hoaRec.Comments + '</td></tr>';

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
                tr = tr + '<tr>';
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

            tr = tr + '<tr>';
            tr = tr + '<td>' + rec.OwnerID + '</td>';
            if (hoaRec.adminLevel > 1) {
                tr = tr + '<td><a data-parcelId="' + hoaRec.Parcel_ID + '" data-FY="' + rec.FY + '" href="#">' + rec.FY + '</a></td>';
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
                LienButton = '<a data-parcelId="' + hoaRec.Parcel_ID + '" data-FY="' + rec.FY + '" href="#" class="btn ' + ButtonType + ' btn-xs" role="button">Lien</a>';
            } else {
                // If NOT PAID and past the due date, add a Create Lien button to go to edit
                if (!rec.Paid && rec.DuesDue && !rec.NonCollectible) {
                    LienButton = '<a data-parcelId="' + hoaRec.Parcel_ID + '" data-FY="' + rec.FY + '" href="#" class="btn btn-warning btn-xs" role="button">Create Lien</a>';
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

    function _formatPropertyDetailEdit(hoaRec) {
        // Clear the field where we report validation errors
        $editValidationError.empty();
        // Action or type of update
        $EditPageHeader.text("Edit Property");

        var tr = '';
        tr = '<div class="form-group">';
        tr += '<tr><th>Parcel Id:</th><td>' + hoaRec.Parcel_ID + '</td></tr>';
        tr += '<tr><th>Lot No:</th><td>' + hoaRec.LotNo + '</td></tr>';
        tr += '<tr><th>Sub Division: </th><td>' + hoaRec.SubDivParcel + '</td></tr>';
        tr += '<tr><th>Location: </th><td>' + hoaRec.Parcel_Location + '</td></tr>';
        tr += '<tr><th>Street No: </th><td>' + hoaRec.Property_Street_No + '</td></tr>';
        tr += '<tr><th>Street Name: </th><td>' + hoaRec.Property_Street_Name + '</td></tr>';
        tr += '<tr><th>City: </th><td>' + hoaRec.Property_City + '</td></tr>';
        tr += '<tr><th>State: </th><td>' + hoaRec.Property_State + '</td></tr>';
        tr += '<tr><th>Zip Code: </th><td>' + hoaRec.Property_Zip + '</td></tr>';
        tr += '<tr><th>Member: </th><td>' + util.setCheckbox('MemberCheckbox', hoaRec.Member) + '</td></tr>';
        tr += '<tr><th>Vacant: </th><td>' + util.setCheckboxEdit('VacantCheckbox', hoaRec.Vacant) + '</td></tr>';
        tr += '<tr><th>Rental: </th><td>' + util.setCheckboxEdit('RentalCheckbox', hoaRec.Rental) + '</td></tr>';
        tr += '<tr><th>Managed: </th><td>' + util.setCheckboxEdit('ManagedCheckbox', hoaRec.Managed) + '</td></tr>';
        tr += '<tr><th>Foreclosure: </th><td>' + util.setCheckboxEdit('ForeclosureCheckbox', hoaRec.Foreclosure) + '</td></tr>';
        tr += '<tr><th>Bankruptcy: </th><td>' + util.setCheckboxEdit('BankruptcyCheckbox', hoaRec.Bankruptcy) + '</td></tr>';
        tr += '<tr><th>ToBe Released: </th><td>' + util.setCheckboxEdit('LiensCheckbox', hoaRec.Liens_2B_Released) + '</td></tr>';
        tr += '<tr><th>Use Email: </th><td>' + util.setCheckboxEdit('UseEmailCheckbox', hoaRec.UseEmail) + '</td></tr>';
        tr += '<tr><th>Comments: </th><td >' + util.setInputText("PropertyComments", hoaRec.Comments, "90") + '</td></tr>';
        tr += '</div>'
        $EditTableBody.html(tr);

        tr = '<form class="form-inline" role="form">' +
            '<a id="SavePropertyEdit" data-parcelId="' + hoaRec.Parcel_ID + '" href="#" class="btn btn-primary" role="button">Save</a>' +
            '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
            '</form>';
        $EditPageButton.html(tr);

    } // End of function _formatPropertyDetailEdit(hoaRec){



    function formatOwnerDetailEdit(hoaRec, createNew) {
        var tr = '';
        var tr2 = '';
        var ownerId = '';

        // Clear the field where we report validation errors
        $editValidationError.empty();
        $EditPageHeader.text("Edit Configuration");
        
        // action or type of update
        if (createNew) {
            $("#EditPage2ColHeader").text("New Owner");
        } else {
            $("#EditPage2ColHeader").text("Edit Owner");
        }

        rec = hoaRec.ownersList[0];
        salesRec = null;
        if (hoaRec.salesList[0] != null) {
            salesRec = hoaRec.salesList[0];
        }

        ownerId = rec.OwnerID;
        tr = '';
        tr += '<div class="form-group">';
        if (createNew) {
            tr += '<tr><th>Owner Id:</th><td>CREATE NEW OWNER</td></tr>';
        } else {
            tr += '<tr><th>Owner Id:</th><td>' + rec.OwnerID + '</td></tr>';
        }
        tr += '<tr><th>Location:</th><td>' + hoaRec.Parcel_Location + '</td></tr>';

        tr += '<tr><th>Current Owner: </th><td>' + util.setCheckbox(rec.CurrentOwner, 'CurrentOwnerCheckbox') + '</td></tr>';
        tr += '<tr><th>Owner Name1:</th><td>' + util.setInputText("OwnerName1", rec.Owner_Name1, "50") + '</td></tr>';
        tr += '<tr><th>Owner Name2:</th><td>' + util.setInputText("OwnerName2", rec.Owner_Name2, "50") + '</td></tr>';
        tr += '<tr><th>Date Purchased:</th><td>' + util.setInputDate("DatePurchased", rec.DatePurchased, "10") + '</td></tr>';
        tr += '<tr><th>Mailing Name:</th><td>' + util.setInputText("MailingName", rec.Mailing_Name, "50") + '</td></tr>';
        tr += '<tr><th>Alternate Mailing: </th><td>' + util.setCheckboxEdit(rec.AlternateMailing, 'AlternateMailingCheckbox') + '</td></tr>';
        tr += '<tr><th>Address Line1:</th><td>' + util.setInputText("AddrLine1", rec.Alt_Address_Line1, "50") + '</td></tr>';
        tr += '<tr><th>Address Line2:</th><td>' + util.setInputText("AddrLine2", rec.Alt_Address_Line2, "50") + '</td></tr>';
        tr += '<tr><th>City:</th><td>' + util.setInputText("AltCity", rec.Alt_City, "40") + '</td></tr>';
        tr += '<tr><th>State:</th><td>' + util.setInputText("AltState", rec.Alt_State, "20") + '</td></tr>';
        tr += '<tr><th>Zip:</th><td>' + util.setInputText("AltZip", rec.Alt_Zip, "20") + '</td></tr>';
        tr += '<tr><th>Owner Phone:</th><td>' + util.setInputText("OwnerPhone", rec.Owner_Phone, "30") + '</td></tr>';
        tr += '<tr><th>Email Addr: </th><td>' + util.setInputText("EmailAddr", rec.EmailAddr, "90") + '</td></tr>';
        tr += '<tr><th>Comments: </th><td>' + util.setInputText("OwnerComments", rec.Comments, "90") + '</td></tr>';
        tr += '<tr><th>Last Changed:</th><td>' + rec.LastChangedTs + '</td></tr>';
        tr += '<tr><th>Changed by:</th><td>' + rec.LastChangedBy + '</td></tr>';
        tr += '</div>';

        $("#EditTable2Col tbody").html(tr);

        if (salesRec != null) {
            tr2 += '<div class="form-group">';
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

        $("#EditTable2Col2 tbody").html(tr2);

        tr = '<form class="form-inline" role="form">';
        if (createNew) {
            //	    tr += '<tr><th></th><td>'+
            tr += '<a id="SaveOwnerEdit" data-parcelId="' + hoaRec.Parcel_ID + '" data-ownerId="NEW" href="#" class="btn btn-primary" role="button">Create New</a>';
            //	  	  '</td></tr>';
        } else {
            //	    tr += '<tr><th></th><td>'+
            tr += '<a id="SaveOwnerEdit" data-parcelId="' + hoaRec.Parcel_ID + '" data-ownerId="' + ownerId + '" href="#" class="btn btn-primary" role="button">Save</a>';
            //	  	  '</td></tr>';
        }
        tr += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button></form>';
        $("#EditPage2ColButton").html(tr);

        $(".Date").datetimepicker({
            timepicker: false,
            format: 'Y-m-d'
        });

    } // End of function _formatOwnerDetailEdit(hoaRec){


    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        getHoaRec: getHoaRec
    };
        
})(); // var detail = (function(){
