var search = (function(){
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var hoaPropertyRecList;
    var tr = '';

    //=================================================================================================================
    // Variables cached from the DOM
    var $moduleDiv = $('#SearchPage');
    var $displayPage = $moduleDiv.find('#navbar a[href="#SearchPage"]');
    var $searchButton = $moduleDiv.find("#SearchButton");

    var $searchStr = $moduleDiv.find("#searchStr");
    var $parcelId = $moduleDiv.find("#parcelId");
    var $lotNo = $moduleDiv.find("#lotNo");
    var $address = $moduleDiv.find("#address");
    var $ownerName = $moduleDiv.find("#ownerName");
    var $phoneNo = $moduleDiv.find("#phoneNo");
    var $altAddress = $moduleDiv.find("#altAddress");

    var $propertyListDisplay = $("#PropertyListDisplay");
    var $propList = $propertyListDisplay.find('tbody');

    //=================================================================================================================
    // Bind events
    $searchButton.on('click', getHoaPropertiesList);

    function getHoaPropertiesList() {
        util.waitCursor();
        $propList.html("");
        $.getJSON("getHoaPropertiesList.php", "searchStr=" + util.cleanStr($searchStr.val()) +
            "&parcelId=" + util.cleanStr($parcelId.val()) +
            "&lotNo=" + util.cleanStr($lotNo.val()) +
            "&address=" + util.cleanStr($address.val()) +
            "&ownerName=" + util.cleanStr($ownerName.val()) +
            "&phoneNo=" + util.cleanStr($phoneNo.val()) +
            "&altAddress=" + util.cleanStr($altAddress.val()), function (outHoaPropertyRecList) {
                hoaPropertyRecList = outHoaPropertyRecList;
                _render();
                util.defaultCursor();
                $displayPage.tab('show');
        });
    }

    //=================================================================================================================
    function _render() {
        tr = '<tr><td>No records found - try different search parameters</td></tr>';
        $.each(hoaPropertyRecList, function (index, hoaPropertyRec) {
            if (index == 0) {
                tr = '';
                tr += '<tr>';
                tr += '<th>Row</th>';
                tr += '<th>Parcel Id</th>';
                tr += '<th class="hidden-xs hidden-sm">Lot No</th>';
                tr += '<th>Location</th>';
                tr += '<th class="hidden-xs">Owner Name</th>';
                tr += '<th class="visible-lg">Owner Phone</th>';
                tr += '</tr>';
            }
            tr += '<tr>';
            tr += '<td>' + (index + 1) + '</td>';
            tr += '<td><a data-parcelId="' + hoaPropertyRec.parcelId + '" href="#">' + hoaPropertyRec.parcelId + '</a></td>';
            tr += '<td class="hidden-xs hidden-sm">' + hoaPropertyRec.lotNo + '</td>';
            tr += '<td>' + hoaPropertyRec.parcelLocation + '</td>';
            tr += '<td class="hidden-xs">' + hoaPropertyRec.ownerName + '</td>';
            tr += '<td class="visible-lg">' + hoaPropertyRec.ownerPhone + '</td>';
            tr += '</tr>';
        });

        $propList.html(tr);
    }

    //=================================================================================================================
    // Module methods

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
    };
        
})(); // var search = (function(){
