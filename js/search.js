/*==============================================================================
 * (C) Copyright 2015,2016,2017,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version 
 * 2015-08-03 JJK	Modified to put the data parameters on the "a" element
 * 					and only response to clicks to the anchor
 * 2015-09-30 JJK	Added Search button
 * 2016-02-09 JJK	Switching from JQuery Mobile to Twitter Bootstrap
 * 2016-04-03 JJK	Working on input fields
 * 2018-10-27 JJK   Added SearchInput for non-touch devices
 * 2020-07-29 JJK   Modified for version 2.0 changes
 * 2020-08-03 JJK   Re-factored for new error handling
 * 2020-12-22 JJK   Re-factored for Bootstrap 4
 *============================================================================*/
var search = (function(){
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var hoaPropertyRecList;

    //=================================================================================================================
    // Variables cached from the DOM
    var $moduleDiv = $('#SearchPage');
    var $ajaxError = $moduleDiv.find(".ajaxError");
    var $SearchButton = $moduleDiv.find("#SearchButton");
    var $SearchInput = $moduleDiv.find("#SearchInput");
    var $searchStr = $moduleDiv.find("#searchStr");
    var $parcelId = $moduleDiv.find("#parcelId");
    var $lotNo = $moduleDiv.find("#lotNo");
    var $address = $moduleDiv.find("#address");
    var $ownerName = $moduleDiv.find("#ownerName");
    var $phoneNo = $moduleDiv.find("#phoneNo");
    var $altAddress = $moduleDiv.find("#altAddress");
    var $propertyListDisplay = $("#PropertyListDisplay");
    var $propList = $propertyListDisplay.find('tbody');
    var isTouchDevice = 'ontouchstart' in document.documentElement;

    //=================================================================================================================
    // Bind events
    $SearchButton.on('click', getHoaPropertiesList);
    // Accept input change on Enter (but not on touch devices because it won't turn off the text input)
    if (!isTouchDevice) {
        $SearchInput.change(getHoaPropertiesList);
    }

    // *** GOOD EXAMPLE OF NEW ERROR HANDLING ***
    function getHoaPropertiesList() {
        $propList.html("");
        $ajaxError.html("");
        
        $.getJSON("getHoaPropertiesList.php", "searchStr=" + util.cleanStr($searchStr.val()) +
            "&parcelId=" + util.cleanStr($parcelId.val()) +
            "&lotNo=" + util.cleanStr($lotNo.val()) +
            "&address=" + util.cleanStr($address.val()) +
            "&ownerName=" + util.cleanStr($ownerName.val()) +
            "&phoneNo=" + util.cleanStr($phoneNo.val()) +
            "&altAddress=" + util.cleanStr($altAddress.val()), function (result) {

            if (result.error) {
                console.log("error = " + result.error);
                $ajaxError.html("<b>"+result.error+"</b>");
            } else {
                hoaPropertyRecList = result;
                _render();
            }
        });
    }

    //=================================================================================================================
    function _render() {
        var tr = '<tr><td>No records found - try different search parameters</td></tr>';
        $.each(hoaPropertyRecList, function (index, hoaPropertyRec) {
            if (index == 0) {
                tr = '';
                tr += '<tr class="small">';
                tr += '<th>Row</th>';
                tr += '<th>Parcel Id</th>';
                tr += '<th>Location</th>';
                tr += '<th class="d-none d-md-table-cell">Owner Name</th>';
                tr += '<th class="d-none d-lg-table-cell">Owner Phone</th>';
                tr += '</tr>';
            }
            tr += '<tr class="small">';
            tr += '<td>' + (index + 1) + '</td>';
            tr += '<td><a class="DetailDisplay" data-parcelId="' + hoaPropertyRec.parcelId + '" href="#">' + hoaPropertyRec.parcelId + '</a></td>';
            tr += '<td>' + hoaPropertyRec.parcelLocation + '</td>';
            tr += '<td class="d-none d-md-table-cell">' + hoaPropertyRec.ownerName + '</td>';
            tr += '<td class="d-none d-lg-table-cell">' + hoaPropertyRec.ownerPhone + '</td>';
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
