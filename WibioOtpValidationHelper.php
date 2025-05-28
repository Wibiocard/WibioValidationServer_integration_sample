<?php

namespace App\Helpers;
use Illuminate\Support\Facades\Storage;

use http;

class WibioOtpValidationHelper
{
    const SERVER = 'https://otpsandbox.wibiocard.com';

    private $ch;

    public function __construct() {
        $this->ch = curl_init();
    }

    public function __destruct() {
        curl_close($this->ch);
    }

/*validateOtp()
        GET /validate/check
        This function is used to validate the OTP against the WibioOtp server.
        Parameters
            user – (required) the username
            pass – (required) the OTP
            realm – (required) the realm
            serial – (optional) the serial number / identifier of the token
*/
    public function validateOtp($user, $pass, $realm, $serial = '')
    {
        curl_setopt($this->ch, CURLOPT_URL, self::SERVER."/validate/check?user=".$user."&pass=".$pass."&realm=".strtolower($realm)."&serial=".$serial);
        curl_setopt($this->ch, CURLOPT_POST, false);
        curl_setopt($this->ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($this->ch, CURLOPT_SSL_VERIFYPEER, false);
        $answer = curl_exec($this->ch);
        if (curl_error($this->ch)) return ("cURL request error!");
        return json_decode($answer);
    }

    public function sendSms($user, $pin, $realm)
    {
        curl_setopt($this->ch, CURLOPT_URL, self::SERVER."/validate/smspin=".$user."&pass=".$pin."&realm=".strtolower($realm));
        curl_setopt($this->ch, CURLOPT_POST, false);
        curl_setopt($this->ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($this->ch, CURLOPT_SSL_VERIFYPEER, false);
        $answer = curl_exec($this->ch);
        if (curl_error($this->ch)) return ("cURL request error!");
        return json_decode($answer);
    }
}
