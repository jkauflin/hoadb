var detail = (function(){
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var hoaRec;
    var tr = '';
    var checkedStr = '';
    var parcelId = '';

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

    //=================================================================================================================
    // Bind events
    //$button.on('click', addPerson);
    //$ul.delegate('i.del', 'click', deletePerson);              
    $document.on("click", "#PropertyListDisplay tr td a", getHoaRec);

    //=================================================================================================================
    // Module methods
    function getHoaRec(value) {
        // If a string was passed in then use value as the name, else get it from the attribute of the click event object
        parcelId = (typeof value === "string") ? value : value.target.getAttribute("data-parcelId");
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
        tr = '';
        checkedStr = '';

        // Get the admin level to see if user is allowed to edit data
        if (hoaRec.adminLevel > 1) {
            tr += '<tr><th>Parcel Id:</th><td><a data-ParcelId="' + hoaRec.Parcel_ID + '" href="#">' + hoaRec.Parcel_ID + '</a></td></tr>';
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
                tr = tr + '<td><a data-ParcelId="' + hoaRec.Parcel_ID + '" data-OwnerId="' + rec.OwnerID + '" href="#">' + rec.Owner_Name1 + ' ' + rec.Owner_Name2 + '</a></td>';
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
                tr = tr + '<td><a data-ParcelId="' + hoaRec.Parcel_ID + '" data-FY="' + rec.FY + '" href="#">' + rec.FY + '</a></td>';
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
                LienButton = '<a data-ParcelId="' + hoaRec.Parcel_ID + '" data-FY="' + rec.FY + '" href="#" class="btn ' + ButtonType + ' btn-xs" role="button">Lien</a>';
            } else {
                // If NOT PAID and past the due date, add a Create Lien button to go to edit
                if (!rec.Paid && rec.DuesDue && !rec.NonCollectible) {
                    LienButton = '<a data-ParcelId="' + hoaRec.Parcel_ID + '" data-FY="' + rec.FY + '" href="#" class="btn btn-warning btn-xs" role="button">Create Lien</a>';
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

        $DuesStatement.html('<a id="DuesStatementButton" data-ParcelId="' + hoaRec.Parcel_ID + '" data-OwnerId="' + currOwnerID + '" href="#" class="btn btn-success" role="button">Dues Statement</a>');

        $Communications.html('<a id="CommunicationsButton" data-ParcelId="' + hoaRec.Parcel_ID + '" data-OwnerId="' + currOwnerID + '" href="#" class="btn btn-info" role="button">Communications</a>');

        if (hoaRec.adminLevel > 1) {
            $NewOwner.html('<a id="NewOwnerButton" data-ParcelId="' + hoaRec.Parcel_ID + '" data-OwnerId="' + currOwnerID + '" href="#" class="btn btn-warning" role="button">New Owner</a>');
            //$AddAssessment.html('<a id="AddAssessmentButton" href="#" class="btn btn-default" role="button">Add Assessment</a>');
        }

    } // function _render() {

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        getHoaRec: getHoaRec
    };
        
})(); // var detail = (function(){
