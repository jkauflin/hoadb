  
  
  // When the javascript initializes do a one time get of the logo image data (for PDF writes)
	$.get("getLogoImgData.php",function(logoImgDataResults){
		pdfLogoImgData = logoImgDataResults;
	});

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

