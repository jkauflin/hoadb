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
 * 2020-08-04 JJK   Added setPassword, resetPassword, and setUserToken
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

    private static function setUserToken($cookieName,$cookiePath,$serverKey,$UserId,$UserName,$UserLevel) {
        try {
            if(isset($_COOKIE[$cookieName])) {
                unset($_COOKIE[$cookieName]);
            }

            // create a token
            $payloadArray = array();
            $payloadArray['userId'] = $UserId;
            $payloadArray['userName'] = $UserName;
            $payloadArray['userLevel'] = $UserLevel;
            $payloadArray['exp'] = strtotime("+1 Months");  // Set the token expiration datetime

            $token = JWT::encode($payloadArray, $serverKey);

            setcookie($cookieName, $token, [
                'expires' => 0,
                'path' => $cookiePath,
                'samesite' => 'strict',
                //'secure' => TRUE,
                'httponly' => TRUE
            ]);
        }
        catch(Exception $e) {
            //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
        }
    }


    public static function setUserCookie($conn,$cookieName,$cookiePath,$serverKey,$param) {
        $userRec = new UserRec();
        $userRec->userMessage = 'Username not found';

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
                    self::setUserToken($cookieName,$cookiePath,$serverKey,$user['UserId'],$user['UserName'],$user['UserLevel']);
                    $userRec->userName = $user['UserName'];
                    $userRec->userLevel = $user['UserLevel'];
                } else {
                    $userRec->userMessage = 'Password for this username does not match';
                }
            }
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

    public static function resetPassword($conn,$cookieName,$cookiePath,$serverKey,$param,$fromEmailAddress,$passwordResetUrl) {
        $userRec = new UserRec();
        $userRec->userMessage = 'Error in request';
        
        try {
            $username = mysqli_real_escape_string($conn, $param->usernameReset);
            $emailAddr = mysqli_real_escape_string($conn, $param->emailAddrReset);

            $sql = null;
            $stmt = null;
            if (!empty($username)) {
                $userRec->userMessage = 'Username not found';
                $sql = "SELECT * FROM users WHERE UserName = ? ";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("s", $username);
            }
            if (!empty($emailAddr)) {
                $userRec->userMessage = 'Email address not found';
                $sql = "SELECT * FROM users WHERE UserEmailAddr = ? ";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("s", $emailAddr);
            }
            $stmt->execute();
            $result = $stmt->get_result();
            $user = mysqli_fetch_assoc($result);
            $stmt->close();

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

            if ($user) {
                if ($user['UserLevel'] < 1) {
                    $userRec->userMessage = 'User is not authorized (contact Administrator)';
                } else {
                    $subject = "GRHA password reset";
                    $messageStr = 'Click the following to enter a new password for username [' . $user['UserName'] . ']:  ' 
                        . $passwordResetUrl . $user['RegistrationCode'];

                    //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", messageStr = $messageStr " . PHP_EOL, 3, LOG_FILE);
                    sendHtmlEMail($user['UserEmailAddr'],$subject,$messageStr,$fromEmailAddress);

                    $userRec->userMessage = 'Reset password verification sent to your email address';
                }
            }

        }
        catch(Exception $e) {
            //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
        }

        return $userRec;
    }

    public static function setPassword($conn,$cookieName,$cookiePath,$serverKey,$param) {
        $userRec = new UserRec();
        $userRec->userMessage = 'Error in request';

        $regCode = mysqli_real_escape_string($conn, $param->regCode);
        $password = mysqli_real_escape_string($conn, $param->password_1);

        if (empty($regCode)) {
            $userRec->userMessage = 'Registraction Code is missing';
        } else {
            // Make sure the user record exists for this registraction code
            $sql = "SELECT * FROM users WHERE RegistrationCode = ? ";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $regCode);

            $stmt->execute();
            $result = $stmt->get_result();
            $user = mysqli_fetch_assoc($result);
            $stmt->close();

            if ($user) {
                //$password = md5($password_1);//encrypt the password before saving in the database
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                $registrationCode = uniqid();

                $sql = "UPDATE users SET UserPassword = ?, RegistrationCode = ? WHERE RegistrationCode = ? ";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("sss", $passwordHash,$registrationCode,$regCode);
                $stmt->execute();
                $stmt->close();

                self::setUserToken($cookieName,$cookiePath,$serverKey,$user['UserId'],$user['UserName'],$user['UserLevel']);

                $userRec->userName = $user['UserName'];
                $userRec->userLevel = $user['UserLevel'];

            } else {
                $userRec->userMessage = 'User not found for this Registration Code';
            }
        }

        return $userRec;
    }

    public static function registerUser($conn,$cookieName,$cookiePath,$serverKey,$param,$fromEmailAddress,$passwordResetUrl) {
        $userRec = new UserRec();
        $userRec->userMessage = 'Error in request';

        try {
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
            } else {
                $registrationCode = uniqid();
                $tempPassword = "Temp" . uniqid();
                $password = password_hash($tempPassword, PASSWORD_DEFAULT);
                // sanitizing email(Remove unexpected symbol like <,>,?,#,!, etc.)
                $email = filter_var($param->emailAddrReg, FILTER_SANITIZE_EMAIL); 

                $sql = 'INSERT INTO users (UserEmailAddr,UserPassword,UserName,UserLevel,RegistrationCode) VALUES(?,?,?,?,?); ';
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("sssis", 
                    $email,
                    $password,
                    $username,
                    $param->userLevelReg,
                    $registrationCode);
                $stmt->execute();
                $stmt->close();

                // Send email
                $subject = "GRHA HOADB new user registration";
                $messageStr = 'A new user account has been created for you.  Click the following to enter a new password for username [' . 
                    $username . ']:  ' . $passwordResetUrl . $registrationCode;
        
                //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", messageStr = $messageStr " . PHP_EOL, 3, LOG_FILE);
                sendHtmlEMail($email,$subject,$messageStr,$fromEmailAddress);

                // set a token and a cookie or just make them login?
                $userRec->userMessage = 'User created successfully (and email sent)';
            }
        }
        catch(Exception $e) {
            //error_log(date('[Y-m-d H:i] '). "in " . basename(__FILE__,".php") . ", Exception = " . $e->getMessage() . PHP_EOL, 3, LOG_FILE);
        }

        return $userRec;
    }

} // class LoginAuth
