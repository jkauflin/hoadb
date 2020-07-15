<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-07-15 JJK 	Initial version
 *============================================================================*/
	include 'commonUtil.php';
	// Include table record classes and db connection parameters
	include 'hoaDbCommon.php';

    define("LOG_FILE", "./hoadb-php.log");

    session_start();

// initializing variables
$username = "";
$email    = "";
$errors = array(); 

	//--------------------------------------------------------------------------------------------------------
	// Create connection to the database
	//--------------------------------------------------------------------------------------------------------
    $conn = getConn();

    // connect to the database
    //
    //$db = mysqli_connect('localhost', 'root', '', 'registration');

// REGISTER USER
if (isset($_POST['reg_user'])) {
  // receive all input values from the form
  //$username = mysqli_real_escape_string($conn, $_POST['username']);
  $email = mysqli_real_escape_string($conn, $_POST['email']);
  $password_1 = mysqli_real_escape_string($conn, $_POST['password_1']);
  $password_2 = mysqli_real_escape_string($conn, $_POST['password_2']);

  // form validation: ensure that the form is correctly filled ...
  // by adding (array_push()) corresponding error unto $errors array
  //if (empty($username)) { array_push($errors, "Username is required"); }
  if (empty($email)) { array_push($errors, "Email is required"); }
  if (empty($password_1)) { array_push($errors, "Password is required"); }
  if ($password_1 != $password_2) {
	array_push($errors, "The two passwords do not match");
  }

  /*
    hoa_users
UserID
UserEmailAddr
UserPassword
UserName
UserLevel
RegistrationCode
EmailVerified
LastChangedBy
LastChangedTs
*/

    
	    $sql = "SELECT * FROM hoa_users WHERE UserEmailAddr = ? ";
	    $stmt = $conn->prepare($sql);
		$stmt->bind_param("s", $email);
	    $stmt->execute();
	    $result = $stmt->get_result();
        $hoa_user = mysqli_fetch_assoc($result);
	$stmt->close();

    if ($hoa_user) {
      array_push($errors, "user already exists");
    }

    // Finally, register user if there are no errors in the form
    if (count($errors) == 0) {
  	    //$password = md5($password_1);//encrypt the password before saving in the database
        $password = password_hash($password_1, PASSWORD_DEFAULT);

        $registrationCode = "87654";
        $sqlStr = 'INSERT INTO hoa_users (UserEmailAddr,UserPassword,RegistrationCode) VALUES(?,?,?); ';
        $stmt = $conn->prepare($sqlStr);
        $stmt->bind_param("sss", $email,$password,$registrationCode);
        $stmt->execute();
        $stmt->close();

        $query = "INSERT INTO users (username, email, password) 
                VALUES('$username', '$email', '$password')";
        mysqli_query($db, $query);

        $_SESSION['username'] = "temp_user";
        $_SESSION['success'] = "You are now logged in";
        header('location: index.php');
    }
}

// ... 

// LOGIN USER
if (isset($_POST['login_user'])) {
  $email = mysqli_real_escape_string($conn, $_POST['email']);
  $password = mysqli_real_escape_string($conn, $_POST['password']);

  if (empty($email)) {
  	array_push($errors, "Email is required");
  }
  if (empty($password)) {
  	array_push($errors, "Password is required");
  }

  if (count($errors) == 0) {
    // get the user record by the email, then verify the password

	    $sql = "SELECT * FROM hoa_users WHERE UserEmailAddr = ? ";
	    $stmt = $conn->prepare($sql);
		$stmt->bind_param("s", $email);
	    $stmt->execute();
	    $result = $stmt->get_result();
        $hoa_user = mysqli_fetch_assoc($result);
	$stmt->close();

    if ($hoa_user) {
        if (password_verify($password, $hoa_user['UserPassword'])) {
  	        $_SESSION['email'] = $email;
  	        //$_SESSION['username'] = $username;
  	        $_SESSION['success'] = "You are now logged in";
  	        header('location: index.php');

        } else {
  		    array_push($errors, "User password for this email does not match");
        }

    } else {
  		array_push($errors, "User email not found");
    }

  }
}


	$conn->close();
?>
