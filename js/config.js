var config = (function(){
    'use strict';

    //=================================================================================================================
    // Private variables for the Module
    var configVal = new Map();

    //=================================================================================================================
    // Variables cached from the DOM

    //=================================================================================================================
    // Bind events

    // When the javascript initializes do a one time get of the logo image data (for PDF writes)
    // *** maybe move this to PDF module ***
    $.get("getLogoImgData.php", function (logoImgDataResults) {
        configVal.set('pdfLogoImgData', logoImgDataResults);
    });

    // When the page loads, get the Config values from the database table
    $.getJSON("getHoaConfigList.php", "", function (hoaConfigRecList) {
        console.log("hoaConfigRecList.length = " + hoaConfigRecList.length);
        $.each(hoaConfigRecList, function (index, configRec) {
            configVal.set(configRec.ConfigName, configRec.ConfigValue);
        });
    });

    //=================================================================================================================
    // Bind events
    //$button.on('click', addPerson);
    //$ul.delegate('i.del', 'click', deletePerson);              

    //=================================================================================================================
    _render();
    function _render() {
        //$ul.html(Mustache.render(template, {people: people}));
    }

    //=================================================================================================================
    // Module methods
    function getVal(name) {
        return configVal.get(name);
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        getVal: getVal
    };
        
})(); // var util = (function(){
