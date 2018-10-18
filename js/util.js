document.addEventListener( 'DOMContentLoaded', function( event ) {
    var util = (function(){
        'use strict';
        
        // Private variables for the Module
        //var people = ['Will', 'Steve'];

        // Variables cached from the DOM
        var $el = $('#peopleModule');
        var $button = $el.find('button');
        var $input = $el.find('input');
        var $ul = $el.find('ul');
        var template = $el.find('#people-template').html();

        //bind events
        $button.on('click', addPerson);
        $ul.delegate('i.del', 'click', deletePerson);
        
        
        // General AJAX error handler to log the exception and set a message in DIV tags with a ajaxError class
        $(document).ajaxError(function(e, xhr, settings, exception) {
            console.log("ajax exception = "+exception);
            console.log("ajax exception xhr.responseText = "+xhr.responseText);
            $(".ajaxError").html("An Error has occurred (see console log)");
        });

        // This is what is exposed from this Module
        return {
            //addPerson: addPerson,
            //deletePerson: deletePerson
        };
        
    })(); // var util = (function(){
}); // document.addEventListener( 'DOMContentLoaded', function( event ) {
//people.addPerson("Jake");
//people.deletePerson(0);


function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
	    if ((new Date().getTime() - start) > milliseconds){
	      break;
	    }
	}
}

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}
/*
example.com?param1=name&param2=&id=6
		$.urlParam('param1'); // name
		$.urlParam('id');        // 6
		$.urlParam('param2');   // null
*/

var validEmailAddrRegExStr = "^((\"([ !#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\]^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])*\"|([!#$%&'*+\\-/0-9=?A-Z^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])+)(\\.(\"([ !#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\]^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])*\"|([!#$%&'*+\\-/0-9=?A-Z^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])+))*)@([a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?)*\\.(?![0-9]*\\.?$)[a-zA-Z0-9]{2,}\\.?)$";
var validEmailAddr = new RegExp(validEmailAddrRegExStr,"g"); 
/*
if (validEmailAddr.test(inStr)) {
	resultStr = '<b style="color:green;">VALID</b>';
} else {
	resultStr = '<b style="color:red;">INVALID</b>';
}
*/

//Non-Printable characters - Hex 01 to 1F, and 7F
var nonPrintableCharsStr = "[\x01-\x1F\x7F]";
//"g" global so it does more than 1 substitution
var regexNonPrintableChars = new RegExp(nonPrintableCharsStr,"g");

function cleanStr(inStr) {
	return inStr.replace(regexNonPrintableChars,'');
}

var commaHexStr = "[\x2C]";
var regexCommaHexStr = new RegExp(commaHexStr,"g");
function csvFilter(inVal) {
	return inVal.toString().replace(regexCommaHexStr,'');
}

//var.replace(/[^0-9]+\\.?[0-9]*/g, '');
/*
parseFloat()
//Non-Printable characters - Hex 01 to 1F, and 7F
var nonPrintableCharsStr = "[\x01-\x2D \x2F \x3A-\x7F]";
//"g" global so it does more than 1 substitution
var regexNonPrintableChars = new RegExp(nonPrintableCharsStr,"g");
function cleanStr(inStr) {
	return inStr.replace(regexNonPrintableChars,'');
}
*/

//Replace every ascii character except decimal and digits with a null, and round to 2 decimal places
var nonMoneyCharsStr = "[\x01-\x2D\x2F\x3A-\x7F]";
//"g" global so it does more than 1 substitution
var regexNonMoneyChars = new RegExp(nonMoneyCharsStr,"g");
function stringToMoney(inAmount) {
	var inAmountStr = ''+inAmount;
	inAmountStr = inAmountStr.replace(regexNonMoneyChars,'');
	return parseFloat(inAmountStr).toFixed(2);
}

function formatDate(inDate) {
	var tempDate = inDate;
	if (tempDate == null) {
		tempDate = new Date();
	}
	var tempMonth = tempDate.getMonth() + 1;
	if (tempDate.getMonth() < 9) {
		tempMonth = '0' + (tempDate.getMonth() + 1);
	}
	var tempDay = tempDate.getDate();
	if (tempDate.getDate() < 10) {
		tempDay = '0' + tempDate.getDate();
	}
	return tempDate.getFullYear()+'-'+tempMonth+'-'+tempDay;
}


function waitCursor() {
    $('*').css('cursor', 'progress');
    $(".ajaxError").html("");
}

/*
commented out because it messed up the cursor in other functions - put it individually around JSON services
$(document).ajaxComplete(function(event, request, settings) {
    $('*').css('cursor', 'default');
});
*/


// Helper functions for setting UI components from data
function setBoolText(inBool) {
	var outBoolStr = "NO";
	if (inBool) {
		outBoolStr = "YES";
	}
	return outBoolStr;
}
function setCheckbox(checkVal){
	var checkedStr = '';
	if (checkVal == 1) {
		checkedStr = 'checked=true';
	}
	return '<input type="checkbox" '+checkedStr+' disabled="disabled">';
}
function setCheckboxEdit(checkVal,idName){
	var checkedStr = '';
	if (checkVal == 1) {
		checkedStr = 'checked=true';
	}
	return '<input id="'+idName+'" type="checkbox" '+checkedStr+'>';
}
function setInputText(idName,textVal,textSize){
	return '<input id="'+idName+'" type="text" class="form-control input-sm resetval" value="'+textVal+'" size="'+textSize+'" maxlength="'+textSize+'">';
}
function setTextArea(idName,textVal,rows){
	return '<textarea id="'+idName+'" class="form-control input-sm" rows="'+rows+'">'+textVal+'</textarea>';
}
function setInputDate(idName,textVal,textSize){
	return '<input id="'+idName+'" type="text" class="form-control input-sm Date" value="'+textVal+'" size="'+textSize+'" maxlength="'+textSize+'" placeholder="YYYY-MM-DD">';
}
function setSelectOption(optVal,displayVal,selected,bg) {
	var outOpt = '';
	if (selected) {
		outOpt = '<option class="'+bg+'" value="'+optVal+'" selected>'+displayVal+'</option>';
	} else {
		outOpt = '<option class="'+bg+'" value="'+optVal+'">'+displayVal+'</option>';
	}
	return outOpt;
}

    
    var people = (function(){
    var people = ['Will', 'Steve'];

    //cache DOM
    var $el = $('#peopleModule');
    var $button = $el.find('button');
    var $input = $el.find('input');
    var $ul = $el.find('ul');
    var template = $el.find('#people-template').html();

    //bind events
    $button.on('click', addPerson);
    $ul.delegate('i.del', 'click', deletePerson);

    _render();

    function _render() {
       $ul.html(Mustache.render(template, {people: people}));
    }

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

    return {
        addPerson: addPerson,
        deletePerson: deletePerson
    };

})();

