


// Respond to clicking on a property by reading details and display on detail tab
    $(document).on("click","#PropertyListDisplay tr td a",function(){
        waitCursor();
        $("#PropertyDetail tbody").html("");
    	$("#PropertyOwners tbody").html("");
        $("#PropertyAssessments tbody").html("");
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-parcelId"),function(hoaRec){
        	formatPropertyDetailResults(hoaRec);
    	    $('*').css('cursor', 'default');
	        $('#navbar a[href="#DetailPage"]').tab('show');
        });
    });

    // Response to Detail link clicks
	// *** 8/3/2015 fix so it only reacts to the clicks on the property one
    $(document).on("click","#PropertyDetail tr td a",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-ParcelId"),function(hoaRec){
            formatPropertyDetailEdit(hoaRec);
    	    $('*').css('cursor', 'default');
            $("#EditPage").modal();
        });
    });	

    $(document).on("click","#PropertyOwners tr td a",function(){
        waitCursor();
        var $this = $(this);
        $.getJSON("getHoaDbData.php","parcelId="+$this.attr("data-ParcelId")+"&ownerId="+$this.attr("data-OwnerId"),function(hoaRec){
    		createNew = false;
            formatOwnerDetailEdit(hoaRec,createNew);
    	    $('*').css('cursor', 'default');
            $("#EditPage2Col").modal();
        });
    });	

function formatPropertyDetailResults(hoaRec){
    var tr = '';
    var checkedStr = '';

    // Get the admin level to see if user is allowed to edit data
	if (hoaRec.adminLevel > 1) {
	    tr += '<tr><th>Parcel Id:</th><td><a data-ParcelId="'+hoaRec.Parcel_ID+'" href="#">'+hoaRec.Parcel_ID+'</a></td></tr>';
	} else {
	    tr += '<tr><th>Parcel Id:</th><td>'+hoaRec.Parcel_ID+'</a></td></tr>';
	}
    tr += '<tr><th>Lot No:</th><td>'+hoaRec.LotNo+'</td></tr>';
    //tr += '<tr><th class="hidden-xs hidden-sm">Sub Division: </th><td class="hidden-xs hidden-sm">'+hoaRec.SubDivParcel+'</td></tr>';
    tr += '<tr><th>Location: </th><td>'+hoaRec.Parcel_Location+'</td></tr>';
    tr += '<tr><th class="hidden-xs hidden-sm">Street No: </th><td class="hidden-xs hidden-sm">'+hoaRec.Property_Street_No+'</td></tr>';
    tr += '<tr><th class="hidden-xs hidden-sm">Street Name: </th><td class="hidden-xs hidden-sm">'+hoaRec.Property_Street_Name+'</td></tr>';
    tr += '<tr><th class="hidden-xs">City: </th><td class="hidden-xs">'+hoaRec.Property_City+'</td></tr>';
    tr += '<tr><th class="hidden-xs">State: </th><td class="hidden-xs">'+hoaRec.Property_State+'</td></tr>';
    tr += '<tr><th class="hidden-xs">Zip Code: </th><td class="hidden-xs">'+hoaRec.Property_Zip+'</td></tr>';
    //tr += '<tr><th>Total Due: </th><td>$'+hoaRec.TotalDue+'</td></tr>';
    var tempTotalDue = '' + hoaRec.TotalDue;
    tr += '<tr><th>Total Due: </th><td>$'+stringToMoney(tempTotalDue)+'</td></tr>';
    
    tr += '<tr><th class="hidden-xs hidden-sm">Member: </th><td class="hidden-xs hidden-sm">'+setCheckbox(hoaRec.Member)+'</td></tr>';
    tr += '<tr><th>Vacant: </th><td>'+setCheckbox(hoaRec.Vacant)+'</td></tr>';
    tr += '<tr><th>Rental: </th><td>'+setCheckbox(hoaRec.Rental)+'</td></tr>';
    tr += '<tr><th>Managed: </th><td>'+setCheckbox(hoaRec.Managed)+'</td></tr>';
    tr += '<tr><th>Foreclosure: </th><td>'+setCheckbox(hoaRec.Foreclosure)+'</td></tr>';
    tr += '<tr><th>Bankruptcy: </th><td>'+setCheckbox(hoaRec.Bankruptcy)+'</td></tr>';
    tr += '<tr><th>ToBe Released: </th><td>'+setCheckbox(hoaRec.Liens_2B_Released)+'</td></tr>';
    tr += '<tr><th>Use Email: </th><td>'+setCheckbox(hoaRec.UseEmail)+'</td></tr>';
    tr += '<tr><th>Comments: </th><td>'+hoaRec.Comments+'</td></tr>';
    
    $("#PropertyDetail tbody").html(tr);
    
    var own1 = '';
    var currOwnerID = '';
    tr = '';
	$.each(hoaRec.ownersList, function(index, rec) {
		if (index == 0) {
    	    tr = tr +   '<tr>';
        	tr = tr +     '<th>OwnId</th>';
        	tr = tr +     '<th>Owner</th>';
        	tr = tr +     '<th>Phone</th>';
        	tr = tr +     '<th class="hidden-xs">Date Purchased</th>';
        	tr = tr +     '<th class="hidden-xs">Alt Address</th>';
        	tr = tr +     '<th class="hidden-xs">Comments</th>';
    	    tr = tr +   '</tr>';
    	    //ownName1 = rec.Owner_Name1;
    	    //currOwnerID = rec.OwnerID;
		}
	    tr = tr + '<tr>';
	    //tr = tr +   '<td data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+rec.OwnerID+'"><a href="#EditPage">'+rec.OwnerID+'</a></td>';
	    tr = tr +   '<td>'+rec.OwnerID+'</td>';

	    if (rec.CurrentOwner) {
    	    ownName1 = rec.Owner_Name1;
    	    currOwnerID = rec.OwnerID;
	    }
	    
    	if (hoaRec.adminLevel > 1) {
    	    tr = tr +   '<td><a data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+rec.OwnerID+'" href="#">'+rec.Owner_Name1+' '+rec.Owner_Name2+'</a></td>';
    	} else {
    	    tr = tr +   '<td>'+rec.Owner_Name1+' '+rec.Owner_Name2+'</a></td>';
    	}
	    tr = tr +   '<td>'+rec.Owner_Phone+'</td>';
		tr = tr +   '<td class="hidden-xs">'+rec.DatePurchased+'</td>';
		tr = tr +   '<td class="hidden-xs">'+rec.Alt_Address_Line1+'</td>';
		tr = tr +   '<td class="hidden-xs">'+rec.Comments+'</td>';
	    tr = tr + '</tr>';
	});
	$("#PropertyOwners tbody").html(tr);

	var TaxYear = '';
	var LienButton = '';
	var ButtonType = '';
    tr = '';
	$.each(hoaRec.assessmentsList, function(index, rec) {
		LienButton = '';
		ButtonType = '';
		
		if (index == 0) {
    	    tr = tr +   '<tr>';
        	tr = tr +     '<th>OwnId</th>';
        	tr = tr +     '<th>FY</th>';
        	tr = tr +     '<th>Dues Amt</th>';
        	tr = tr +     '<th>Lien</th>';
        	tr = tr +     '<th>Paid</th>';
        	tr = tr +     '<th>Non-Collectible</th>';
        	tr = tr +     '<th class="hidden-xs">Date Paid</th>';
        	tr = tr +     '<th class="hidden-xs hidden-sm">Date Due</th>';
        	tr = tr +     '<th class="hidden-xs">Payment</th>';
        	tr = tr +     '<th class="hidden-xs">Comments</th>';
    	    tr = tr +   '</tr>';
    	    TaxYear = rec.DateDue.substring(0,4);
		}
		
	    tr = tr + '<tr>';
	    tr = tr +   '<td>'+rec.OwnerID+'</td>';
    	if (hoaRec.adminLevel > 1) {
    	    tr = tr +   '<td><a data-ParcelId="'+hoaRec.Parcel_ID+'" data-FY="'+rec.FY+'" href="#">'+rec.FY+'</a></td>';
    	} else {
    	    tr = tr +   '<td>'+rec.FY+'</a></td>';
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
    	    LienButton = '<a data-ParcelId="'+hoaRec.Parcel_ID+'" data-FY="'+rec.FY+'" href="#" class="btn '+ButtonType+' btn-xs" role="button">Lien</a>';
    	} else {
    		// If NOT PAID and past the due date, add a Create Lien button to go to edit
        	if (!rec.Paid && rec.DuesDue && !rec.NonCollectible) {
        	    LienButton = '<a data-ParcelId="'+hoaRec.Parcel_ID+'" data-FY="'+rec.FY+'" href="#" class="btn btn-warning btn-xs" role="button">Create Lien</a>';
        	}
    	}
		//tr = tr +   '<td>'+rec.DuesAmt+' '+LienButton+'</td>';
    	
        var tempDuesAmt = '' + rec.DuesAmt;
		tr = tr +   '<td>'+stringToMoney(tempDuesAmt)+'</td>';
		tr = tr +   '<td>'+LienButton+'</td>';

	    tr = tr +   '<td>'+setCheckbox(rec.Paid)+'</td>';
	    tr = tr +   '<td>'+setCheckbox(rec.NonCollectible)+'</td>';
	    tr = tr +   '<td class="hidden-xs">'+rec.DatePaid+'</td>';
		tr = tr +   '<td class="hidden-xs hidden-sm">'+rec.DateDue+'</td>';
	    tr = tr +   '<td class="hidden-xs">'+rec.PaymentMethod+'</td>';
	    tr = tr +   '<td class="hidden-xs">'+rec.Comments+' '+rec.LienComment+'</td>';
	    tr = tr + '</tr>';
	});
    $("#PropertyAssessments tbody").html(tr);
    
    // Set the buttons from configuration values and current parcel id
    var mcTreasURI = countyTreasurerUrl + '?parid='+hoaRec.Parcel_ID+'&taxyr='+TaxYear+'&own1='+ownName1;
    $("#MCTreasLink").html('<a href="'+encodeURI(mcTreasURI)+'" class="btn btn-primary" role="button" target="_blank">County<br>Treasurer</a>');    

    var mcAuditorURI = countyAuditorUrl + '?mode=PARID';
    $("#MCAuditorLink").html('<a href="'+encodeURI(mcAuditorURI)+'" class="btn btn-primary" role="button" target="_blank">County<br>Property</a>');    

    $("#DuesStatement").html('<a id="DuesStatementButton" data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+currOwnerID+'" href="#" class="btn btn-success" role="button">Dues Statement</a>');

    $("#Communications").html('<a id="CommunicationsButton" data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+currOwnerID+'" href="#" class="btn btn-info" role="button">Communications</a>');

    if (hoaRec.adminLevel > 1) {
	    $("#NewOwner").html('<a id="NewOwnerButton" data-ParcelId="'+hoaRec.Parcel_ID+'" data-OwnerId="'+currOwnerID+'" href="#" class="btn btn-warning" role="button">New Owner</a>');
	    //$("#AddAssessment").html('<a id="AddAssessmentButton" href="#" class="btn btn-default" role="button">Add Assessment</a>');
	}

} // End of function formatDetailResults(hoaRec){

function formatPropertyDetailEdit(hoaRec){
    var tr = '';
    var checkedStr = '';
    $(".editValidationError").empty();

    // action or type of update
    $("#EditPageHeader").text("Edit Property");
    
	tr += '<div class="form-group">';
    tr += '<tr><th>Parcel Id:</th><td>'+hoaRec.Parcel_ID+'</td></tr>';
    tr += '<tr><th>Lot No:</th><td>'+hoaRec.LotNo+'</td></tr>';
    tr += '<tr><th>Sub Division: </th><td>'+hoaRec.SubDivParcel+'</td></tr>';
    tr += '<tr><th>Location: </th><td>'+hoaRec.Parcel_Location+'</td></tr>';
    tr += '<tr><th>Street No: </th><td>'+hoaRec.Property_Street_No+'</td></tr>';
    tr += '<tr><th>Street Name: </th><td>'+hoaRec.Property_Street_Name+'</td></tr>';
    tr += '<tr><th>City: </th><td>'+hoaRec.Property_City+'</td></tr>';
    tr += '<tr><th>State: </th><td>'+hoaRec.Property_State+'</td></tr>';
    tr += '<tr><th>Zip Code: </th><td>'+hoaRec.Property_Zip+'</td></tr>';
    //tr += '<tr><th>Member: </th><td>'+setCheckboxEdit(hoaRec.Member,'MemberCheckbox')+'</td></tr>';
    tr += '<tr><th>Member: </th><td>'+setCheckbox(hoaRec.Member,'MemberCheckbox')+'</td></tr>';
    tr += '<tr><th>Vacant: </th><td>'+setCheckboxEdit(hoaRec.Vacant,'VacantCheckbox')+'</td></tr>';
    tr += '<tr><th>Rental: </th><td>'+setCheckboxEdit(hoaRec.Rental,'RentalCheckbox')+'</td></tr>';
    tr += '<tr><th>Managed: </th><td>'+setCheckboxEdit(hoaRec.Managed,'ManagedCheckbox')+'</td></tr>';
    tr += '<tr><th>Foreclosure: </th><td>'+setCheckboxEdit(hoaRec.Foreclosure,'ForeclosureCheckbox')+'</td></tr>';
    tr += '<tr><th>Bankruptcy: </th><td>'+setCheckboxEdit(hoaRec.Bankruptcy,'BankruptcyCheckbox')+'</td></tr>';
    tr += '<tr><th>ToBe Released: </th><td>'+setCheckboxEdit(hoaRec.Liens_2B_Released,'LiensCheckbox')+'</td></tr>';
    tr += '<tr><th>Use Email: </th><td>'+setCheckboxEdit(hoaRec.UseEmail,'UseEmailCheckbox')+'</td></tr>';
    tr += '<tr><th>Comments: </th><td >'+setInputText("PropertyComments",hoaRec.Comments,"90")+'</td></tr>';
	tr += '</div>'
	$("#EditTable tbody").html(tr);
	//$("#EditTable2 tbody").html('');

	tr = '<form class="form-inline" role="form">'+
		 '<a id="SavePropertyEdit" data-ParcelId="'+hoaRec.Parcel_ID+'" href="#" class="btn btn-primary" role="button">Save</a>'+
		          		'<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'+
		          		'</form>';
    $("#EditPageButton").html(tr);

} // End of function formatPropertyDetailEdit(hoaRec){
