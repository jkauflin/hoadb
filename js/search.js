var search = (function(){
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var hoaPropertyRecList;
    var tr = '';

    var $moduleDiv;
    var $displayPage;
    var $searchButton;
    var $searchStr;
    var $parcelId;
    var $lotNo;
    var $address;
    var $ownerName;
    var $phoneNo;
    var $altAddress;
    var $propertyListDisplay;
    var $propList;

    //=================================================================================================================
    // Variables cached from the DOM
    //document.addEventListener('DOMContentLoaded', function (event) {
        $moduleDiv = $('#SearchPage');
        $displayPage = $moduleDiv.find('#navbar a[href="#SearchPage"]');
        $searchButton = $moduleDiv.find("#SearchButton");

        $searchStr = $moduleDiv.find("#searchStr");
        $parcelId = $moduleDiv.find("#parcelId");
        $lotNo = $moduleDiv.find("#lotNo");
        $address = $moduleDiv.find("#address");
        $ownerName = $moduleDiv.find("#ownerName");
        $phoneNo = $moduleDiv.find("#phoneNo");
        $altAddress = $moduleDiv.find("#altAddress");

        $propertyListDisplay = $("#PropertyListDisplay");
        $propList = $propertyListDisplay.find('tbody');

    //}); // document.addEventListener( 'DOMContentLoaded', function( event ) {

    //=================================================================================================================
    // Bind events
    $searchButton.on('click', getHoaPropertiesList);

    function getHoaPropertiesList() {
        util.waitCursor();

        var tempStr = config.getVal('hoaNameShort');
        console.log(">>> tempStr = " + tempStr);

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
