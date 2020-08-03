/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:  Login authentication and authorization handling based on
 *               credentials stored in JWT Tokens, saved in HttpOnly, Secure,
 *               Samesite cookies, and user/auth properties in a database
 *
 * list what the library does and what it expects from caller
 * caller implements all ui and DIV's
 * library provides all authentication and login functions (and UserRec properties
 * to indicate an authenticated user.
 * and function to get AdminLevel)
 *
 * top level app must include JWT-PHP library in it's composer
 * and include and call jjklogin PHP functions?
 *
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-07-24 JJK 	Initial version
 * 2020-07-28 JJK   Added Registration handling
 * 2020-08-01 JJK   Re-factored to be in the same path as project
 *============================================================================*/
var jjklogin = (function () {
    'use strict'

    //=================================================================================================================
    // Private variables for the Module
    // Location of login library
    //var jjkloginRoot = 'jjklogin/'
    var jjkloginRoot = ''

    var userRec = null
    var url

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document)
    //var $moduleDiv = $('#DetailPage');
    // Figure out a better way to do this
    //var $displayPage = $document.find('#navbar a[href="#DetailPage"]');

    var $LoginModal = $document.find('#LoginModal')
    var $logout = $document.find('#logout')
    var $LoggedIn = $document.find('.username')

    var $LoginInput = $LoginModal.find('#LoginInput')
    var $LoginButton = $LoginModal.find('#LoginButton')
    var $LoginDisplay = $LoginModal.find('#LoginDisplay')

    var $RegisterModal = $document.find('#RegisterModal')
    var $RegisterInput = $RegisterModal.find('#RegisterInput')
    var $RegisterButton = $RegisterModal.find('#RegisterButton')
    var $RegisterDisplay = $RegisterModal.find('#RegisterDisplay')

    //var isTouchDevice = 'ontouchstart' in document.documentElement;

    //=================================================================================================================
    // Bind events
    $LoginButton.on('click', loginUser)
    // Accept input change on Enter (but not on touch devices because it won't turn off the text input)
    //if (!isTouchDevice) {
    //    $LoginInput.change(loginUser);
    //}

    $logout.on('click', logoutUser)
    $RegisterButton.on('click', registerUser)

    //=================================================================================================================
    // Initial load - when the module loads check for the authentication token
    url = jjkloginRoot + 'authentication.php'
    $.ajax(url, {
        type: 'GET',
        dataType: 'json' // Type of the data that is expected in the return
        //dataType: "html"
    }).done(function (result) {
        try {
            //console.log("result = " + result);
            //userRec = JSON.parse(result);
            userRec = result
            if (
                userRec == null ||
                userRec.userName == null ||
                userRec.userName == '' ||
                userRec.userLevel < 1
            ) {
                // redirect to Login
                $LoginModal.modal()
            } else {
                $LoggedIn.html('Logged in as ' + userRec.userName)
                console.log(
                    'After authentication, userName = ' +
                    userRec.userName +
                    ', level = ' +
                    userRec.userLevel
                )
            }
        } catch (err) {
            // For debugging PHP errors - set dataType to "html", manually parse with JSON.parse,
            // and see what PHP has added to the result string (i.e. error messages from PHP)
            // Err will be JSON parse error, but this will let you see the PHP errors
            console.log('err = ' + err)
            console.log('result = ' + result)
        }
    }).fail(function (xhr, status, error) {
        //Ajax request failed.
        console.log(
            'Error in AJAX request to ' +
            url +
            ', status = ' +
            status +
            ', error = ' +
            error
        )
        userRec = null
        $LoginDisplay.html('Error in request')
    })


    //=================================================================================================================
    // Module methods

    function loginUser () {
        url = jjkloginRoot + 'login.php'
        $.ajax(url, {
            type: 'POST',
            data: getJSONfromInputs($LoginInput, null),
            contentType: 'application/json',
            dataType: 'json' // Type of the data that is expected in the return
            //dataType: "html"                                  // Type of the data that is expected in the return
        })
            .done(function (result) {
                //console.log("result = " + result);
                userRec = result
                if (
                    userRec == null ||
                    userRec.userName == null ||
                    userRec.userName == '' ||
                    userRec.userLevel < 1
                ) {
                    // redirect to Login
                    $LoginDisplay.html(userRec.userMessage)
                    $LoginModal.modal()
                } else {
                    $LoginModal.modal('hide')
                    $LoggedIn.html('Logged in as ' + userRec.userName)
                    //console.log("After authentication, userName = " + userRec.userName + ", level = " + userRec.userLevel)
                }
            })
            .fail(function (xhr, status, error) {
                //Ajax request failed.
                console.log(
                    'Error in AJAX request to ' +
                        url +
                        ', status = ' +
                        status +
                        ', error = ' +
                        error
                )
                userRec = null
                $LoginDisplay.html('Error in request')
            })
    }

    function logoutUser () {
        url = jjkloginRoot + 'logout.php'
        $.ajax(url, {
            type: 'GET'
        })
            .done(function (result) {
                userRec = null
                $LoggedIn.html('User is not logged in')
                $LoginModal.modal()
            })
            .fail(function (xhr, status, error) {
                //Ajax request failed.
                console.log(
                    'Error in AJAX request to ' +
                        url +
                        ', status = ' +
                        status +
                        ', error = ' +
                        error
                )
            })
    }

    function registerUser () {
        url = jjkloginRoot + 'register.php'
        $.ajax(url, {
            type: 'POST',
            data: getJSONfromInputs($RegisterInput, null),
            contentType: 'application/json',
            dataType: 'json' // Type of the data that is expected in the return
            //dataType: "html"                                  // Type of the data that is expected in the return
        })
            .done(function (result) {
                //console.log("result = " + result);
                try {
                    //userRec = JSON.parse(result);
                    userRec = result

                    // successful registration???

                    if (
                        userRec == null ||
                        userRec.userName == null ||
                        userRec.userName == '' ||
                        userRec.userLevel < 1
                    ) {
                        // redirect to Login
                        $RegisterDisplay.html(userRec.userMessage)
                        $RegisterModal.modal()
                    } else {
                        $RegisterModal.modal('hide')
                        $LoggedIn.html('Logged in as ' + userRec.userName)
                        console.log(
                            'After authentication, userName = ' +
                                userRec.userName +
                                ', level = ' +
                                userRec.userLevel
                        )
                    }
                } catch (err) {
                    console.log('err = ' + err)
                    console.log('result = ' + result)
                }
            })
            .fail(function (xhr, status, error) {
                //Ajax request failed.
                console.log(
                    'Error in AJAX request to ' +
                        url +
                        ', status = ' +
                        status +
                        ', error = ' +
                        error
                )
                userRec = null
                $RegisterDisplay.html('Error in request')
            })
    }

    // Function to get all input objects within a DIV, and extra entries from a map
    // and construct a JSON object with names and values (to pass in POST updates)
    function getJSONfromInputs (InputsDiv, paramMap) {
        var first = true
        var jsonStr = '{'

        if (InputsDiv !== null) {
            // Get all the input objects within the DIV
            var FormInputs = InputsDiv.find('input,textarea,select')

            // Loop through the objects and construct the JSON string
            $.each(FormInputs, function (index) {
                //id = useEmailCheckbox, type = checkbox
                //id = propertyComments, type = text
                // Only include elements that have an "id" in the JSON string
                if (typeof $(this).attr('id') !== 'undefined') {
                    if (first) {
                        first = false
                    } else {
                        jsonStr += ','
                    }
                    //console.log("id = " + $(this).attr('id') + ", type = " + $(this).attr("type"));
                    if ($(this).attr('type') == 'checkbox') {
                        //console.log("id = " + $(this).attr('id') + ", $(this).prop('checked') = " + $(this).prop('checked'));
                        if ($(this).prop('checked')) {
                            jsonStr += '"' + $(this).attr('id') + '" : 1'
                        } else {
                            jsonStr += '"' + $(this).attr('id') + '" : 0'
                        }
                    } else {
                        //jsonStr += '"' + $(this).attr('id') + '" : "' + cleanStr($(this).val()) + '"';
                        jsonStr +=
                            '"' +
                            $(this).attr('id') +
                            '" : "' +
                            $(this).val() +
                            '"'
                    }
                }
            })
        }

        if (paramMap !== null) {
            paramMap.forEach(function (value, key) {
                if (first) {
                    first = false
                } else {
                    jsonStr += ','
                }
                jsonStr += '"' + key + '" : "' + value + '"'
            })
        }

        jsonStr += '}'
        //console.log("jsonStr = "+jsonStr);
        return jsonStr
    }

    function getUserName () {
        if (userRec != null) {
            return userRec.userName
        } else {
            return null
        }
    }
    function getUserLevel () {
        if (userRec != null) {
            return userRec.userLevel
        } else {
            return null
        }
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        getUserName,
        getUserLevel
    }
})() // var jjklogin = (function(){
