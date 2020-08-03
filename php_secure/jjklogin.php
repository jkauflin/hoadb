<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: PHP functions to interact with a database, and security
 *              components for authentication and login
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-07-25 JJK 	Initial version
 * 2020-07-28 JJK   Added registerUser and expired token check
 * 2020-07-31 JJK   Re-factor as a class
 *============================================================================*/
namespace jkauflin\jjklogin;

// Library class for JWT authentication work (includes are in the calling PHP using autoload)
use \Firebase\JWT\JWT;

class UserRec
{
	public $userName;
    public $userLevel;
    public $userMessage;
}

class LoginAuth
{
    public static function initUserRec() {
        return new UserRec();
    }

    public static function setUserCookie($conn,$cookieName,$cookiePath,$serverKey,$param) {
        $userRec = new UserRec();
        $userRec->userMessage = '';

        $username = mysqli_real_escape_string($conn, $param->username);

        $sql = "SELECT * FROM users WHERE UserName = ? ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = mysqli_fetch_assoc($result);
        $stmt->close();

        if ($user) {
            if ($user['UserLevel'] < 1) {
                $userRec->userMessage = 'User is not authorized (contact Administrator)';
            } else {
                if (password_verify($param->password, $user['UserPassword'])) {

                    if(isset($_COOKIE[$cookieName])) {
                        unset($_COOKIE[$cookieName]);
                    }

                    //Uncomment the following line and add an appropriate date and time to enable the "expire" feature.
                    // Set the token to expire in 1 month
                    $exp = strtotime("+1 Months");

                    // create a token
                    $payloadArray = array();
                    $payloadArray['userId'] = $user['UserId'];
                    $payloadArray['userName'] = $user['UserName'];
                    $payloadArray['userLevel'] = $user['UserLevel'];
                    if (isset($exp)) {$payloadArray['exp'] = $exp;}

                    //error_log(date('[Y-m-d H:i] '). "in setUserCookie, BEFORE encode" . PHP_EOL, 3, LOG_FILE);
                    $token = JWT::encode($payloadArray, $serverKey);
                    //error_log(date('[Y-m-d H:i] '). "in setUserCookie, BEFORE cookie set" . PHP_EOL, 3, LOG_FILE);

                    setcookie($cookieName, $token, [
                        'expires' => 0,
                        'path' => $cookiePath,
                        'samesite' => 'strict',
                //      'secure' => TRUE,
                        'httponly' => TRUE
                    ]);
                            
                    //error_log(date('[Y-m-d H:i] '). "in setUserCookie, AFTER cookie set" . PHP_EOL, 3, LOG_FILE);

                    $userRec->userName = $user['UserName'];
                    $userRec->userLevel = $user['UserLevel'];

                } else {
                    $userRec->userMessage = 'Password for this username does not match';
                }
            }
        } else {
            $userRec->userMessage = 'Username not found';
        }

        return $userRec;
    }

    public static function deleteUserCookie($cookieName,$cookiePath) {
        //error_log(date('[Y-m-d H:i] '). "in deleteUserCookie, at BEGINNING" . PHP_EOL, 3, LOG_FILE);
        if(isset($_COOKIE[$cookieName])) {
            // If set, expire and unset
            setcookie($cookieName, "", [
                'expires' => time()-3600,
                'path' => $cookiePath,
                'samesite' => 'strict',
    //          'secure' => TRUE,
                'httponly' => TRUE
            ]);

            unset($_COOKIE[$cookieName]);
        }
    }

    public static function getUserRec($cookieName,$cookiePath,$serverKey) {
        $userRec = new UserRec();
        $userRec->userMessage = '';

        $token = null;

        if(isset($_COOKIE[$cookieName])) {
            $token = $_COOKIE[$cookieName];

            if (!is_null($token)) {
                try {
                    $payload = JWT::decode($token, $serverKey, array('HS256'));

                    //$currTime = mktime();
                    //error_log(date('[Y-m-d H:i] '). "in getUserRec, exp = $payload->exp, currTime = $currTime" . PHP_EOL, 3, LOG_FILE);
                    // [2020-07-29 02:28] in getUserRec, exp = 1609455601, currTime = 1595982502

                    $userRec->userName = $payload->userName;
                    $userRec->userLevel = $payload->userLevel;
                }
                catch(Exception $e) {
                    // If the token is expired, the JWT::decode will throw an exception
                    if (strpos($e,"Expired") || strpos($e,"expired")) {
                        // if expired, delete the cookie
                        deleteUserCookie($cookieName,$cookiePath);
                    } else {
                        error_log(date('[Y-m-d H:i] '). "in getUserRec, exception in decode = $e" . PHP_EOL, 3, LOG_FILE);
                    }
                }
            }
        }

        return $userRec;
    }

    public static function registerUser($conn,$cookieName,$cookiePath,$serverKey,$param) {
        $userRec = new UserRec();
        $userRec->userMessage = '';

        $username = mysqli_real_escape_string($conn, $param->usernameReg);

        $sql = "SELECT * FROM users WHERE UserName = ? ";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = mysqli_fetch_assoc($result);
        $stmt->close();

        if ($user) {
            $userRec->userMessage = 'Username already exists';

            // check if email exists as well - you can only create 1 user for username and email

            // password reset
        } else {
            //$password = md5($password_1);//encrypt the password before saving in the database
            $password = password_hash($param->password_1, PASSWORD_DEFAULT);
            // sanitizing email(Remove unexpected symbol like <,>,?,#,!, etc.)
            $email = filter_var($param->emailAddrReg, FILTER_SANITIZE_EMAIL); 

    /*
        1	UserId Primary	int(7)			No	None	AUTO_INCREMENT	Change Change	Drop Drop	
        2	UserEmailAddr	varchar(100)	No	None			Change Change	Drop Drop	
        3	UserPassword	varchar(100)	No	None			Change Change	Drop Drop	
        4	UserName	    varchar(80)	    No	guest			Change Change	Drop Drop	
        5	UserLevel	    int(2)			No	0			Change Change	Drop Drop	
        6	UserLastLogin	datetime		No	current_timestamp()			Change Change	Drop Drop	
        7	RegistrationCode varchar(100)	No	None			Change Change	Drop Drop	
        8	EmailVerified	int(1)			No	0			Change Change	Drop Drop	
        9	LastChangedBy	varchar(80)	    No	system			Change Change	Drop Drop	
        10	LastChangedTs	datetime	        current_timestamp()
    */

            $registrationCode = uniqid();

            $sqlStr = 'INSERT INTO users (UserEmailAddr,UserPassword,UserName,RegistrationCode) VALUES(?,?,?,?); ';
            $stmt = $conn->prepare($sqlStr);
            //$stmt->bind_param("sss", $email,$password,$registrationCode);
            $stmt->bind_param("ssss", 
                $email,
                $password,
                $username,
                $registrationCode);
            $stmt->execute();
            $stmt->close();

            // set a token and a cookie or just make them login?
            $userRec->userMessage = 'Registration successful - contact Administrator to set user level';

            /*
            if ($user['UserLevel'] < 1) {
                $userRec->userMessage = 'User is not authorized (contact Administrator)';
            } else {
                if (password_verify($param->password, $user['UserPassword'])) {

                    if(isset($_COOKIE[$cookieName])) {
                        unset($_COOKIE[$cookieName]);
                    }

                    //Uncomment the following line and add an appropriate date and time to enable the "expire" feature.
                    $exp = strtotime('2021-01-01 00:00:01');

                    // create a token
                    $payloadArray = array();
                    $payloadArray['userId'] = $user['UserId'];
                    $payloadArray['userName'] = $user['UserName'];
                    $payloadArray['userLevel'] = $user['UserLevel'];
                    if (isset($exp)) {$payloadArray['exp'] = $exp;}

                    //error_log(date('[Y-m-d H:i] '). "in setUserCookie, BEFORE encode" . PHP_EOL, 3, LOG_FILE);

                    $token = JWT::encode($payloadArray, $serverKey);

                    //error_log(date('[Y-m-d H:i] '). "in setUserCookie, BEFORE cookie set" . PHP_EOL, 3, LOG_FILE);

                    setcookie($cookieName, $token, [
                        'expires' => 0,
                        'path' => $cookiePath,
                        'samesite' => 'strict',
                //      'secure' => TRUE,
                        'httponly' => TRUE
                    ]);
                            
                    //error_log(date('[Y-m-d H:i] '). "in setUserCookie, AFTER cookie set" . PHP_EOL, 3, LOG_FILE);

                    $userRec->userName = $user['UserName'];
                    $userRec->userLevel = $user['UserLevel'];

                } else {
                    $userRec->userMessage = 'Password for this username does not match';
                }
            }
            */

        }

        return $userRec;
    }

} // class LoginAuth
