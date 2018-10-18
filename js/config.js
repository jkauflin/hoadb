document.addEventListener( 'DOMContentLoaded', function( event ) {
    var config = (function(){
        'use strict';

        //=================================================================================================================
        // Private variables for the Module
        //var people = ['Will', 'Steve'];
        var pdfLogoImgData = '';
        
        //=================================================================================================================
        // Variables cached from the DOM
        var $document = $(document);
        var $ajaxError = $(".ajaxError");
        var $wildcard = $('*');
        /*
        var $el = $('#peopleModule');
        var $button = $el.find('button');
        var $input = $el.find('input');
        var $ul = $el.find('ul');
        var template = $el.find('#people-template').html();
        */

        // When the javascript initializes do a one time get of the logo image data (for PDF writes)
	    $.get("getLogoImgData.php",function(logoImgDataResults){
		    pdfLogoImgData = logoImgDataResults;
	    });

// https://javascript.info/map-set-weakmap-weakset

        map.get('1')

        map.get('hoaName')
        
// array of [key, value] pairs
let map = new Map([
  ['1',  'str1'],
  [1,    'num1'],
  [true, 'bool1']
]);

let map = new Map(Object.entries({
  name: "John",
  age: 30
}));

	//adminEmailList
	// When the page loads, get the Config values from the database table
	$.getJSON("getHoaConfigList.php","",function(hoaConfigRecList){
		$.each(hoaConfigRecList, function(index, configRec) {
			if (configRec.ConfigName == "hoaName") {
				hoaName = configRec.ConfigValue;
			} else if (configRec.ConfigName == "adminEmailList") {
				adminEmailList = configRec.ConfigValue;
			} else if (configRec.ConfigName == "paymentEmailList") {
				paymentEmailList = configRec.ConfigValue;
			} else if (configRec.ConfigName == "hoaNameShort") {
				hoaNameShort = configRec.ConfigValue;
			} else if (configRec.ConfigName == "hoaAddress1") {
				hoaAddress1 = configRec.ConfigValue;
			} else if (configRec.ConfigName == "hoaAddress2") {
				hoaAddress2 = configRec.ConfigValue;
			} else if (configRec.ConfigName == "duesStatementNotes") {
				duesStatementNotes = configRec.ConfigValue;
			} else if (configRec.ConfigName == "yearlyDuesStatementNotice1st") {
				yearlyDuesStatementNotice1st = configRec.ConfigValue;
			} else if (configRec.ConfigName == "yearlyDuesStatementNotes1st") {
				yearlyDuesStatementNotes1st = configRec.ConfigValue;
			} else if (configRec.ConfigName == "yearlyDuesStatementNoticeAdditional") {
				yearlyDuesStatementNoticeAdditional = configRec.ConfigValue;
			} else if (configRec.ConfigName == "yearlyDuesStatementNotesAdditional") {
				yearlyDuesStatementNotesAdditional = configRec.ConfigValue;
			} else if (configRec.ConfigName == "yearlyDuesHelpNotes") {
				yearlyDuesHelpNotes = configRec.ConfigValue;
			} else if (configRec.ConfigName == "countyTreasurerUrl") {
				countyTreasurerUrl = configRec.ConfigValue;
			} else if (configRec.ConfigName == "countyAuditorUrl") {
				countyAuditorUrl = configRec.ConfigValue;
			} else if (configRec.ConfigName == "OnlinePaymentInstructions") {
				onlinePaymentInstructions = configRec.ConfigValue;
			} else if (configRec.ConfigName == "OfflinePaymentInstructions") {
				offlinePaymentInstructions = configRec.ConfigValue;
			} else if (configRec.ConfigName == "SurveyInstructions") {
				surveyInstructions = configRec.ConfigValue;
			} else if (configRec.ConfigName == "SurveyQuestion1") {
				surveyQuestion1 = configRec.ConfigValue;
			} else if (configRec.ConfigName == "SurveyQuestion2") {
				surveyQuestion2 = configRec.ConfigValue;
			} else if (configRec.ConfigName == "SurveyQuestion3") {
				surveyQuestion3 = configRec.ConfigValue;
			}
		});
	});

        
        
        //=================================================================================================================
        // Bind events
        //$button.on('click', addPerson);
        //$ul.delegate('i.del', 'click', deletePerson);              
        // General AJAX error handler to log the exception and set a message in DIV tags with a ajaxError class
        $document.ajaxError(function(e, xhr, settings, exception) {
            console.log("ajax exception = "+exception);
            console.log("ajax exception xhr.responseText = "+xhr.responseText);
            $ajaxError.html("An Error has occurred (see console log)");
        });

        //=================================================================================================================
        _render();
        function _render() {
           //$ul.html(Mustache.render(template, {people: people}));
        }
        
        //=================================================================================================================
        // Module methods
        
        
        //=================================================================================================================
        // This is what is exposed from this Module
        return {
        };
        
    })(); // var util = (function(){
}); // document.addEventListener( 'DOMContentLoaded', function( event ) {
// util.cleanStr("this to clean");
    
/*
    function addPerson(value) {
        var name = (typeof value === "string") ? value : $input.val();
        people.push(name);
        _render();
        $input.val('');
    }
    function deletePerson(event) {
        var i;
        if (typeof event === "number") {
            i = event;
        } else {
            var $remove = $(event.target).closest('li');
            i = $ul.find('li').index($remove);
        }
        people.splice(i, 1);
        _render();
    }
*/  
  


