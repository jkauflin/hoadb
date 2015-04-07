/*==============================================================================
 * (C) Copyright 2015 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2015-03-06 JJK 	Initial version 
 * 2015-03-26 JJK	Solved initial DetailPage checkbox display problem by
 * 					moving format after the pagecontainer change (instead of
 * 					before it.  Let the page initialize first, then fill it.
 *============================================================================*/
$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}

//  $str = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $str);

//myString.replaceAll("[\\p{Cc}\\p{Cf}\\p{Co}\\p{Cn}]", "?");
// [ -~]
//yourString = yourString.replace ( /[^0-9]/g, '' );

//var regex = /e/;
var regexStr = "^((\"([ !#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\]^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])*\"|([!#$%&'*+\\-/0-9=?A-Z^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])+)(\\.(\"([ !#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\]^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])*\"|([!#$%&'*+\\-/0-9=?A-Z^_`a-z{|}~]|\\\\[ !\"#$%&'()*+,\\-./0-9:;<=>?@A-Z[\\\\\\]^_`a-z{|}~])+))*)@([a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?)*\\.(?![0-9]*\\.?$)[a-zA-Z0-9]{2,}\\.?)$";
var regex = new RegExp(regexStr); 

/*
var inStr = $("#TestInput").val();
    	var resultStr = "";
    	
    	if (regex.test(inStr)) {
    		resultStr = '<b style="color:green;">VALID</b>';
    	} else {
    		resultStr = '<b style="color:red;">INVALID</b>';
    	}
    	$("#Result").html('<div style="color:blue;">'+inStr+'</div><br>email address is '+resultStr);
    });
*/

function waitCursor() {
    $('*').css('cursor', 'progress');
}

$(document).ajaxComplete(function(event, request, settings) {
    $('*').css('cursor', 'default');
});

$(document).ajaxError(function(e, xhr, settings, exception) {
	console.log("ajax exception = "+exception);
	console.log("ajax exception xhr.responseText = "+xhr.responseText);
});


// This is a functions that scrolls to #id
function scrollTo(id)
{
    // Only scroll if on mobile device
    if ($(window).width() < 601 && id) {
        $('html,body').animate({scrollTop: $("#"+id).offset().top},'slow');
    }
}


$(document).ready(function(){

    // http://xdsoft.net/jqplugins/datetimepicker/
    /*
    $(".DateTime").datetimepicker({
        format:'Y-m-d H:i'
    });    
    $(".Date").datetimepicker({
        timepicker:false,
        format:'Y-m-d'
    });    
    jQuery('#datetimepicker6').datetimepicker({
    	  timepicker:false,
    	  onChangeDateTime:function(dp,$input){
    	    alert($input.val())
    	  }
    	});
    	
    $(".Date").datetimepicker({
        timepicker:false,
        format:'Y-m-d',
  	  	onChangeDateTime:function(dp,$input){
  	  		alert($input.val())
  	  	}
    $(".Date").datetimepicker({
        timepicker:false,
        format:'Y-m-d'
    });    
    });    
        <input type="text" class="Date" name="ErrBeginDateTime" id="ErrBeginDateTime"  placeholder="Begin Date (YYYY-MM-DD)" data-mini="true">
    */
	
}); // $(document).ready(function(){

	
$(document).on("pageinit","#SearchPage",function(){
    // Respond to any change in values and call service
    $("#SearchInput").change(function() {
        waitCursor();
        $("#PropertyListDisplay tbody").html("");
        
    	// Get the list
    	$.getJSON("getHoaPropertiesList.php","parcelId="+$("#parcelId").val()+
    										"&checkNo="+$("#checkNo").val()+
    										"&address="+$("#address").val()+
    										"&ownerName="+$("#ownerName").val()+
    										"&phoneNo="+$("#phoneNo").val()+
    										"&altAddress="+$("#altAddress").val(),function(hoaPropertyRecList){
    		var tr = '';
    	    rowId = 0;
    		$.each(hoaPropertyRecList, function(index, hoaPropertyRec) {
    			rowId = index + 1;
    			if (index == 0) {
    	    	    tr +=    '<tr>';
    	    	    tr +=      '<th>Row</th>';
    	    	    tr +=      '<th>Parcel Id</th>';
    	    	    tr +=  	   '<th>Lot No</th>';
    	    	    tr +=      '<th>Sub Div</th>';
    	    	    tr +=      '<th>Parcel Location</th>';
    	    	    tr +=      '<th>Owner Name</th>';
    	    	    tr +=      '<th>Owner Phone</th>';
    	    	    tr +=    '</tr>';
    			}
    		    tr +=  '<tr>';
    		    tr +=    '<td>'+rowId+'</td>';
    		    tr +=    '<td data-parcelId="'+hoaPropertyRec.parcelId+'"><a href="#">'+hoaPropertyRec.parcelId+'</a></td>';
    		    tr +=    '<td>'+hoaPropertyRec.lotNo+'</td>';
    		    tr +=    '<td>'+hoaPropertyRec.subDivParcel+'</td>';
    		    tr +=    '<td>'+hoaPropertyRec.parcelLocation+'</td>';
    		    tr +=    '<td>'+hoaPropertyRec.ownerName+'</td>';
    		    tr +=    '<td>'+hoaPropertyRec.ownerPhone+'</td>';
    		    tr +=  '</tr>';
    		});

            $("#PropertyListDisplay tbody").html(tr);
    	});
        
        event.stopPropagation();
    });

    $(document).on("click","#PropertyListDisplay tr td",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-parcelId"),function(hoaRec){
        	// Let the new page initialize first
            $( ":mobile-pagecontainer" ).pagecontainer( "change", "#DetailPage");
            // Then fill it with new content
            formatPropertyDetailResults(hoaRec);
        });
    });
    
});

function setCheckbox(checkVal){
	var checkedStr = '';
	if (checkVal == 1) {
		checkedStr = 'checked=true';
	}
	return '<input type="checkbox" data-mini="true" '+checkedStr+' disabled="disabled">';
}
function setCheckboxEdit(checkVal,idName){
	var checkedStr = '';
	if (checkVal == 1) {
		checkedStr = 'checked=true';
	}
	return '<input id="'+idName+'" type="checkbox" data-mini="true" '+checkedStr+'>';
}
function setInputText(idName,textVal,textSize){
	return '<input id="'+idName+'" type="text" value="'+textVal+'" size="'+textSize+'" maxlength="'+textSize+'" data-mini="true" >';
}
function setInputDate(idName,textVal,textSize){
	return '<input id="'+idName+'" class="Date" type="text" value="'+textVal+'" size="'+textSize+'" maxlength="'+textSize+'" placeholder="YYYY-MM-DD" data-mini="true" >';
}

function formatPropertyDetailResults(hoaRec){
    var tr = '';
    var checkedStr = '';
	
    tr += '<tr><th>Parcel Id:</th><td data-ParcelId="'+hoaRec.Parcel_ID+'"><a href="#EditPage">'+hoaRec.Parcel_ID+'</a></td></tr>';
    tr += '<tr><th>Lot No:</th><td>'+hoaRec.LotNo+'</td></tr>';
    tr += '<tr><th>Sub Division: </th><td>'+hoaRec.SubDivParcel+'</td></tr>';
    tr += '<tr><th>Location: </th><td>'+hoaRec.Parcel_Location+'</td></tr>';
    tr += '<tr><th>Street No: </th><td>'+hoaRec.Property_Street_No+'</td></tr>';
    tr += '<tr><th>Street Name: </th><td>'+hoaRec.Property_Street_Name+'</td></tr>';
    tr += '<tr><th>City: </th><td>'+hoaRec.Property_City+'</td></tr>';
    tr += '<tr><th>State: </th><td>'+hoaRec.Property_State+'</td></tr>';
    tr += '<tr><th>Zip Code: </th><td>'+hoaRec.Property_Zip+'</td></tr>';
    tr += '<tr><th>Member: </th><td>'+setCheckbox(hoaRec.Member)+'</td></tr>';
    tr += '<tr><th>Vacant: </th><td>'+setCheckbox(hoaRec.Vacant)+'</td></tr>';
    tr += '<tr><th>Rental: </th><td>'+setCheckbox(hoaRec.Rental)+'</td></tr>';
    tr += '<tr><th>Managed: </th><td>'+setCheckbox(hoaRec.Managed)+'</td></tr>';
    tr += '<tr><th>Foreclosure: </th><td>'+setCheckbox(hoaRec.Foreclosure)+'</td></tr>';
    tr += '<tr><th>Bankruptcy: </th><td>'+setCheckbox(hoaRec.Bankruptcy)+'</td></tr>';
    tr += '<tr><th>ToBe Released: </th><td>'+setCheckbox(hoaRec.Liens_2B_Released)+'</td></tr>';
    tr += '<tr><th>Comments: </th><td>'+hoaRec.Comments+'</td></tr>';
    $("#PropertyDetail tbody").html(tr);
    
    var own1 = '';
    tr = '';
	$.each(hoaRec.ownersList, function(index, rec) {
		if (index == 0) {
    	    tr = tr +   '<tr>';
    	    tr = tr +     '<th>OwnId</th>';
    	    tr = tr +     '<th>Owner</th>';
    	    tr = tr +     '<th>Date Purchased</th>';
    	    tr = tr +     '<th>Phone Number</th>';
    	    tr = tr +     '<th>Alt Address</th>';
    	    tr = tr +     '<th>Comments</th>';
    	    tr = tr +   '</tr>';
		}
	    tr = tr + '<tr>';
	    tr = tr +   '<td data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+rec.OwnerID+'"><a href="#EditPage">'+rec.OwnerID+'</a></td>';
	    /*
	    if (rec.CurrentOwner) {
	    	own1 = rec.Owner_Name1;
		    tr = tr +   '<td data-OwnerId="'+rec.OwnerID+'"><a href="#EditPage">'+rec.OwnerID+'</a></td>';
	    } else {
		    tr = tr +   '<td>'+rec.OwnerID+'</td>';
	    }
	    */
	    tr = tr +   '<td>'+rec.Owner_Name1+' '+rec.Owner_Name2+'</td>';
	    tr = tr +   '<td>'+rec.DatePurchased.substring(0,10)+'</td>';
	    tr = tr +   '<td>'+rec.Owner_Phone+'</td>';
	    tr = tr +   '<td>'+rec.Alt_Address_Line1+'</td>';
	    tr = tr +   '<td>'+rec.Comments+'</td>';
	    tr = tr + '</tr>';
	});
	$("#PropertyOwners tbody").html(tr);

	var TaxYear = '';
    tr = '';
	$.each(hoaRec.assessmentsList, function(index, rec) {
		if (index == 0) {
    	    tr = tr +   '<tr>';
    	    tr = tr +     '<th>OwnId</th>';
    	    tr = tr +     '<th>Year</th>';
    	    tr = tr +     '<th>Dues Amt</th>';
    	    tr = tr +     '<th>Date Due</th>';
    	    tr = tr +     '<th>Paid</th>';
    	    tr = tr +     '<th>Date Paid</th>';
    	    tr = tr +     '<th>Payment</th>';
    	    tr = tr +     '<th>Comments</th>';
    	    tr = tr +   '</tr>';
    	    TaxYear = rec.DateDue.substring(0,4);
		}
	    tr = tr + '<tr>';
	    tr = tr +   '<td>'+rec.OwnerID+'</td>';
	    tr = tr +   '<td data-ParcelId="'+hoaRec.Parcel_ID+'" data-FY="'+rec.FY+'"><a href="#EditPage">'+rec.FY+'</a></td>';
	    tr = tr +   '<td>'+rec.DuesAmt+'</td>';
	    tr = tr +   '<td>'+rec.DateDue.substring(0,10)+'</td>';
	    tr = tr +   '<td>'+setCheckbox(rec.Paid)+'</td>';
	    tr = tr +   '<td>'+rec.DatePaid.substring(0,10)+'</td>';
	    tr = tr +   '<td>'+rec.PaymentMethod+'</td>';
	    tr = tr +   '<td>'+rec.Comments+'</td>';
	    tr = tr + '</tr>';
	});
    $("#PropertyAssessments tbody").html(tr);
    
    var mcTreasURI = 'http://mctreas.org/master.cfm?parid='+hoaRec.Parcel_ID+'&taxyr='+TaxYear+'&own1='+own1;
    $("#MCTreasLink").html('<a href="'+encodeURI(mcTreasURI)+'" class="ui-btn ui-mini ui-btn-inline ui-icon-action ui-btn-icon-left ui-corner-all" data-mini="true" target="_blank">Montgomery<br>County<br>Treasurer</a>');    

    var mcAuditorURI = 'http://www.mcrealestate.org/search/CommonSearch.aspx?mode=PARID';
    //$("#MCAuditorLink").html('<a href="'+encodeURI(mcAuditorURI)+'" class="ui-btn ui-corner-all ui-mini btnMarginPad" target="_blank">Montgomery<br>County<br>Auditor</a>');    
    $("#MCAuditorLink").html('<a href="'+encodeURI(mcAuditorURI)+'" class="ui-btn ui-mini ui-btn-inline ui-icon-action ui-btn-icon-left ui-corner-all" data-mini="true" target="_blank">Montgomery<br> County<br>Auditor</a>');    
    
//		<a id="SalesReport" href="#" class="ui-btn ui-mini ui-btn-inline ui-icon-action ui-btn-icon-left ui-corner-all" data-mini="true">Sales Report</a>
		
} // End of function formatDetailResults(hoaRec){


$(document).on("pageinit","#DetailPage",function(){
    // Response to Detail link clicks
    $(document).on("click","#PropertyDetail tr td",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-parcelId"),function(hoaRec){
            $( ":mobile-pagecontainer" ).pagecontainer( "change", "#EditPage");
            formatPropertyDetailEdit(hoaRec);
        });
    });	

    $(document).on("click","#PropertyOwners tr td",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-parcelId")+"&ownerId="+$this.attr("data-OwnerId"),function(hoaRec){
            $( ":mobile-pagecontainer" ).pagecontainer( "change", "#EditPage");
            formatOwnerDetailEdit(hoaRec);
        });
    });	

    $(document).on("click","#PropertyAssessments tr td",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-parcelId")+"&fy="+$this.attr("data-FY"),function(hoaRec){
            $( ":mobile-pagecontainer" ).pagecontainer( "change", "#EditPage");
            formatAssessmentDetailEdit(hoaRec);
        });
    });	

}); // End of $(document).on("pageinit","#DetailPage",function(){

function formatPropertyDetailEdit(hoaRec){
    var tr = '';
    var checkedStr = '';

    // action or type of update
    $("#EditPageHeader").text("Edit Property");
    
    tr += '<tr><th>Parcel Id:</th><td>'+hoaRec.Parcel_ID+'</td></tr>';
    tr += '<tr><th>Lot No:</th><td>'+hoaRec.LotNo+'</td></tr>';
    tr += '<tr><th>Sub Division: </th><td>'+hoaRec.SubDivParcel+'</td></tr>';
    tr += '<tr><th>Location: </th><td>'+hoaRec.Parcel_Location+'</td></tr>';
    tr += '<tr><th>Street No: </th><td>'+hoaRec.Property_Street_No+'</td></tr>';
    tr += '<tr><th>Street Name: </th><td>'+hoaRec.Property_Street_Name+'</td></tr>';
    tr += '<tr><th>City: </th><td>'+hoaRec.Property_City+'</td></tr>';
    tr += '<tr><th>State: </th><td>'+hoaRec.Property_State+'</td></tr>';
    tr += '<tr><th>Zip Code: </th><td>'+hoaRec.Property_Zip+'</td></tr>';
    tr += '<tr><th>Member: </th><td>'+setCheckboxEdit(hoaRec.Member,'MemberCheckbox')+'</td></tr>';
    tr += '<tr><th>Vacant: </th><td>'+setCheckboxEdit(hoaRec.Vacant,'VacantCheckbox')+'</td></tr>';
    tr += '<tr><th>Rental: </th><td>'+setCheckboxEdit(hoaRec.Rental,'RentalCheckbox')+'</td></tr>';
    tr += '<tr><th>Managed: </th><td>'+setCheckboxEdit(hoaRec.Managed,'ManagedCheckbox')+'</td></tr>';
    tr += '<tr><th>Foreclosure: </th><td>'+setCheckboxEdit(hoaRec.Foreclosure,'ForeclosureCheckbox')+'</td></tr>';
    tr += '<tr><th>Bankruptcy: </th><td>'+setCheckboxEdit(hoaRec.Bankruptcy,'BankruptcyCheckbox')+'</td></tr>';
    tr += '<tr><th>ToBe Released: </th><td>'+setCheckboxEdit(hoaRec.Liens_2B_Released,'LiensCheckbox')+'</td></tr>';
    tr += '<tr><th>Comments: </th><td>'+setInputText("PropertyComments",hoaRec.Comments,"60")+'</td></tr>';
    
    tr += '<tr><th></th><td>'+
    	  '<a id="SavePropertyEdit" data-ParcelId="'+hoaRec.Parcel_ID+'" href="#" class="ui-btn ui-mini ui-btn-inline ui-icon-plus ui-btn-icon-left ui-corner-all">Save</a>' +
          '<a href="#" data-rel="back" class="ui-btn ui-mini ui-btn-inline ui-icon-delete ui-btn-icon-left ui-corner-all">Cancel</a>' +
          '</td></tr>';

    $("#EditTable tbody").html(tr);

} // End of function formatPropertyDetailEdit(hoaRec){

function formatOwnerDetailEdit(hoaRec){
    var tr = '';
    var checkedStr = '';
    var buttonStr = '';

    // action or type of update
    $("#EditPageHeader").text("Edit Owner");

	$.each(hoaRec.ownersList, function(index, rec) {
		tr = '';
	    tr += '<tr><th>Owner Id:</th><td>'+rec.OwnerID+'</td></tr>';
	    tr += '<tr><th>Parcel Id:</th><td>'+rec.Parcel_ID+'</td></tr>';

	    tr += '<tr><th>Current Owner: </th><td>'+setCheckboxEdit(rec.CurrentOwner,'CurrentOwnerCheckbox')+'</td></tr>';
	    tr += '<tr><th>Owner Name1:</th><td>'+ setInputText("OwnerName1",rec.Owner_Name1,"50")+'</td></tr>';
	    tr += '<tr><th>Owner Name2:</th><td>'+ setInputText("OwnerName2",rec.Owner_Name2,"50")+'</td></tr>';
	    tr += '<tr><th>Date Purchased:</th><td>'+ setInputDate("DatePurchased",rec.DatePurchased,"10")+'</td></tr>';
	    tr += '<tr><th>Mailing Name:</th><td>'+ setInputText("MailingName",rec.Mailing_Name,"50")+'</td></tr>';
	    tr += '<tr><th>Alternate Mailing: </th><td>'+setCheckboxEdit(rec.AlternateMailing,'AlternateMailingCheckbox')+'</td></tr>';
	    tr += '<tr><th>Address Line1:</th><td>'+ setInputText("AddrLine1",rec.Alt_Address_Line1,"50")+'</td></tr>';
	    tr += '<tr><th>Address Line2:</th><td>'+ setInputText("AddrLine2",rec.Alt_Address_Line2,"50")+'</td></tr>';
	    tr += '<tr><th>City:</th><td>'+ setInputText("AltCity",rec.Alt_City,"40")+'</td></tr>';
	    tr += '<tr><th>State:</th><td>'+ setInputText("AltState",rec.Alt_State,"20")+'</td></tr>';
	    tr += '<tr><th>Zip:</th><td>'+ setInputText("AltZip",rec.Alt_Zip,"20")+'</td></tr>';
	    tr += '<tr><th>Owner Phone:</th><td>'+ setInputText("OwnerPhone",rec.Owner_Phone,"30")+'</td></tr>';
	    tr += '<tr><th>Comments: </th><td>'+setInputText("OwnerComments",rec.Comments,"60")+'</td></tr>';
	    
	    tr += '<tr><th>Created:</th><td>'+rec.EntryTimestamp+'</td></tr>';
	    tr += '<tr><th>Last Updated:</th><td>'+rec.UpdateTimestamp+'</td></tr>';
	});

    tr += '<tr><th></th><td>'+
	  	  '<a id="SaveOwnerEdit" data-ParcelId="'+hoaRec.Parcel_ID+'" href="#" class="ui-btn ui-mini ui-btn-inline ui-icon-plus ui-btn-icon-left ui-corner-all">Save</a>' +
	  	  '<a href="#" data-rel="back" class="ui-btn ui-mini ui-btn-inline ui-icon-delete ui-btn-icon-left ui-corner-all">Cancel</a>' +
	  	  '</td></tr>';

    $("#EditTable tbody").html(tr);

    $(".Date").datetimepicker({
        timepicker:false,
        format:'Y-m-d'
    });    

} // End of function formatOwnerDetailEdit(hoaRec){

function formatAssessmentDetailEdit(hoaRec){
    var tr = '';
    var checkedStr = '';
    var buttonStr = '';

    // action or type of update
    $("#EditPageHeader").text("Edit Assessment");

	$.each(hoaRec.assessmentsList, function(index, rec) {
		tr = '';
	    tr += '<tr><th>Fiscal Year:</th><td>'+rec.FY+'</td></tr>';
	    tr += '<tr><th>Owner Id:</th><td>'+rec.OwnerID+'</td></tr>';
	    tr += '<tr><th>Parcel Id:</th><td>'+rec.Parcel_ID+'</td></tr>';
	    
	    tr += '<tr><th>Dues Amount:</th><td>'+setInputText("DuesAmount",rec.DuesAmt,"10")+'</td></tr>';
	    tr += '<tr><th>Date Due:</th><td>'+setInputDate("DateDue",rec.DateDue,"10")+'</td></tr>';
	    tr += '<tr><th>Paid: </th><td>'+setCheckboxEdit(rec.Paid,'PaidCheckbox')+'</td></tr>';
	    tr += '<tr><th>Date Paid:</th><td>'+setInputDate("DatePaid",rec.DatePaid,"10")+'</td></tr>';
	    tr += '<tr><th>Payment Method:</th><td>'+setInputText("AssessmentsComments",rec.PaymentMethod,"40")+'</td></tr>';
	    tr += '<tr><th>Comments: </th><td>'+setInputText("AssessmentsComments",rec.Comments,"60")+'</td></tr>';
	});

    tr += '<tr><th></th><td>'+
	  	  '<a id="SaveAssessmentEdit" data-ParcelId="'+hoaRec.Parcel_ID+'" href="#" class="ui-btn ui-mini ui-btn-inline ui-icon-plus ui-btn-icon-left ui-corner-all">Save</a>' +
	  	  '<a href="#" data-rel="back" class="ui-btn ui-mini ui-btn-inline ui-icon-delete ui-btn-icon-left ui-corner-all">Cancel</a>' +
	  	  '</td></tr>';

	$("#EditTable tbody").html(tr);

    $(".Date").datetimepicker({
        timepicker:false,
        format:'Y-m-d'
    });    

} // End of function formatAssessmentDetailEdit(hoaRec){


$(document).on("pageinit","#EditPage",function(){
	// Functions for EditPage - respond to requests for update
	$(document).on("click","#SavePropertyEdit",function(){
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

        //$.getJSON("updHoaDbData.php","parcelId="+$this.attr("data-parcelId"),function(hoaRec){
        $.get("updHoaDbData.php","parcelId="+$parcelId+
        						 "&memberBoolean="+$memberBoolean+
        						 "&vacantBoolean="+$vacantBoolean+
        						 "&rentalBoolean="+$rentalBoolean+
        						 "&managedBoolean="+$managedBoolean+
        						 "&foreclosureBoolean="+$foreclosureBoolean+
        						 "&bankruptcyBoolean="+$bankruptcyBoolean+
        						 "&liensBoolean="+$liensBoolean+
        						 "&propertyComments="+$("#PropertyComments").val(),function(results){

        	// Re-read the updated data for the Detail page display
            $.getJSON("getHoaDbData.php","parcelId="+$parcelId,function(hoaRec){
                $( ":mobile-pagecontainer" ).pagecontainer( "change", "#DetailPage");
                formatPropertyDetailResults(hoaRec);
            });
        }); // End of $.get("updHoaDbData.php","parcelId="+$parcelId+

       	
    });	// End of $(document).on("click","#SavePropertyEdit",function(){

    $(document).on("click","#SaveOwnerEdit",function(){
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

        //$.getJSON("updHoaDbData.php","parcelId="+$this.attr("data-parcelId"),function(hoaRec){
        $.get("updHoaDbData.php","parcelId="+$parcelId+
        						 "&memberBoolean="+$memberBoolean+
        						 "&vacantBoolean="+$vacantBoolean+
        						 "&rentalBoolean="+$rentalBoolean+
        						 "&managedBoolean="+$managedBoolean+
        						 "&foreclosureBoolean="+$foreclosureBoolean+
        						 "&bankruptcyBoolean="+$bankruptcyBoolean+
        						 "&liensBoolean="+$liensBoolean+
        						 "&propertyComments="+$("#PropertyComments").val(),function(results){

        	// Re-read the updated data for the Detail page display
            $.getJSON("getHoaDbData.php","parcelId="+$parcelId,function(hoaRec){
                $( ":mobile-pagecontainer" ).pagecontainer( "change", "#DetailPage");
                formatPropertyDetailResults(hoaRec);
            });
        }); // End of $.get("updHoaDbData.php","parcelId="+$parcelId+

    });	// End of $(document).on("click","#SaveOwnerEdit",function(){
    
    $(document).on("click","#SaveAssessmentEdit",function(){
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

        //$.getJSON("updHoaDbData.php","parcelId="+$this.attr("data-parcelId"),function(hoaRec){
        $.get("updHoaDbData.php","parcelId="+$parcelId+
        						 "&memberBoolean="+$memberBoolean+
        						 "&vacantBoolean="+$vacantBoolean+
        						 "&rentalBoolean="+$rentalBoolean+
        						 "&managedBoolean="+$managedBoolean+
        						 "&foreclosureBoolean="+$foreclosureBoolean+
        						 "&bankruptcyBoolean="+$bankruptcyBoolean+
        						 "&liensBoolean="+$liensBoolean+
        						 "&propertyComments="+$("#PropertyComments").val(),function(results){

        	// Re-read the updated data for the Detail page display
            $.getJSON("getHoaDbData.php","parcelId="+$parcelId,function(hoaRec){
                $( ":mobile-pagecontainer" ).pagecontainer( "change", "#DetailPage");
                formatPropertyDetailResults(hoaRec);
            });
        }); // End of $.get("updHoaDbData.php","parcelId="+$parcelId+

    });	// End of $(document).on("click","#SaveAssessmentEdit",function(){

    
}); // End of $(document).on("pageinit","#EditPage",function(){


$(document).on("pageinit","#ReportsPage",function(){

	
	$(document).on("click","#SalesReport",function(){
		waitCursor();
		
        $("#PropertyListDisplay tbody").html("");
        
    	// Get the list
    	$.get("getSalesReport.php","salesYear="+$("#salesYear").val(),function(reportHtml){
    		/*
    		var tr = '';
    	    rowId = 0;
    		$.each(hoaPropertyRecList, function(index, hoaPropertyRec) {
    			rowId = index + 1;
    			if (index == 0) {
    	    	    tr +=    '<tr>';
    	    	    tr +=      '<th>Row</th>';
    	    	    tr +=      '<th>Parcel Id</th>';
    	    	    tr +=  	   '<th>Lot No</th>';
    	    	    tr +=      '<th>Sub Div</th>';
    	    	    tr +=      '<th>Parcel Location</th>';
    	    	    tr +=      '<th>Owner Name</th>';
    	    	    tr +=      '<th>Owner Phone</th>';
    	    	    tr +=    '</tr>';
    			}
    		    tr +=  '<tr>';
    		    tr +=    '<td>'+rowId+'</td>';
    		    tr +=    '<td data-parcelId="'+hoaPropertyRec.parcelId+'"><a href="#">'+hoaPropertyRec.parcelId+'</a></td>';
    		    tr +=    '<td>'+hoaPropertyRec.lotNo+'</td>';
    		    tr +=    '<td>'+hoaPropertyRec.subDivParcel+'</td>';
    		    tr +=    '<td>'+hoaPropertyRec.parcelLocation+'</td>';
    		    tr +=    '<td>'+hoaPropertyRec.ownerName+'</td>';
    		    tr +=    '<td>'+hoaPropertyRec.ownerPhone+'</td>';
    		    tr +=  '</tr>';
    		});
			*/
    		
            $("#ReportHeader").html("HOA Residential Sales for "+$("#salesYear").val());
            //$("#ReportListDisplay tbody").html(tr);
            $("#ReportDisplay").html(reportHtml);
    	});
        
        event.stopPropagation();
		
	});
	  	
	
}); // End of $(document).on("pageinit","#ReportsPage",function(){

$(document).on("pageinit","#AdminPage",function(){
	$('#summernote').summernote();

	$.get("getFile.php","",function(response){
		$('#summernote').code(response);
	});
	
	
	//$('.summernote').summernote({
	/*
	$('#summernote').summernote({
		  height: 300,                 // set editor height

		  minHeight: null,             // set minimum height of editor
		  maxHeight: null,             // set maximum height of editor

		  focus: true,                 // set focus to editable area after initializing summernote
	});
	*/
	
	/*
	Get the HTML contents of the first summernote in the set of matched elements.

	var sHTML = $('.summernote').code();
	Get the HTML content of the second summernote with jQuery eq.

	var sHTML = $('.summernote').eq(1).code();
	A string of HTML to set as the content of each matched element.

	$('.summernote').code(sHTML);
	*/

});

$(document).on("pageinit","#UsersPage",function(){
});


// no, not sending json to the server, just a string
//contentType: "application/json; charset=utf-8",
/*
$.ajax({
    url: 'updHoaDbData.php',
    data: hoaRec,
    type: 'POST',
    async: false,
    dataType: 'json',
    cache: false,
    success:function(data, textStatus, jqXHR){
        console.log('AJAX SUCCESS');
    }, 
    complete : function(data, textStatus, jqXHR){
        console.log('AJAX COMPLETE');
    }
});
*/
//$hoaRec = $_POST['hoaRec'];
