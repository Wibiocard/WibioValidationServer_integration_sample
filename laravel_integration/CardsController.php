<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;
use Illuminate\View\View;
use http;
use Illuminate\Support\Facades\Hash;

use App\Models\User;
use App\Helpers\WibioOtpRequestHelper;
use App\Helpers\WibioOtpValidationHelper;
use App\Helpers\TeamsHelper;

class CardsController extends Controller
{
    const APIKEY = "****************";
    /**************MASTER VIEWS**************/
    public function viewUsers(Request $request)
    {
        /*
        use the otp request helper functionality to show what you want and manage actions on users
        */
        $WibioOtpRequestHelper = new WibioOtpRequestHelper();
        $WibioOtpRequestHelper->init();
        $resp = $WibioOtpRequestHelper->adminUserList();
        $WibioOtpRequestHelper = null;
    }
  
    public function viewTokens(Request $request)
    {
        /*
        use the otp request helper functionality to show what you want and manage actions on tokens
        */
      
        $WibioOtpRequestHelper = new WibioOtpRequestHelper();
        $WibioOtpRequestHelper->init();
        $resp = $WibioOtpRequestHelper->adminShowAll();
        $WibioOtpRequestHelper = null;
    }
    /************** ACTIONS **************/
    public function generateUserAndToken(Request $request)
    {
        $response = Http::withHeaders(['X-Authorization' => self::APIKEY])
                        ->post('https://smartmanager.wibiocard.com/api/generateUserAndToken', 
                        [
                            'company' => '**********',   //the company name is provided by Wibiocard
                            'userEmail' => '**********',
                            'givenName' => '**********',
                            'telephoneNumber' => '**********',
                            'mobile' => '**********',
                            'cardType' => '**********',   //readable from card
                            'cardId' => '**********',     //readable from card
                            'otpLenght' => '**********',  // 6, 8
                            'otpType' => '**********',    // HMAC, TOTP if supported
                            'intend' => 'WebAuth',        
                            'comment' => '**********',
                        ]
                    );
        if ($resp == "cURL request error!") return back()->withError('Generate new token', 'Unable to create the token');
        return view('admin.card_perso', compact('serial'));
    }

    public function actionOnValidatorServer(Request $request)
    {
        $WibioOtpRequestHelper = new WibioOtpRequestHelper();
        $WibioOtpRequestHelper->init();
        switch($request->action)
        {
            case "assign":
                if (isset($request->user) && isset($request->serial))
                    $resp = $WibioOtpRequestHelper->adminAssign($request->user, $request->serial, $request->pin);
                else
                    $resp = "Invalid request";
                break;
            case "check_serial":
                if (isset($request->serial))
                    $resp = $WibioOtpRequestHelper->adminCheck($request->serial);
                else
                    $resp = "Invalid request";
                break;
            case "disable":
                if (isset($request->user))
                    $resp = $WibioOtpRequestHelper->adminDisableUser($request->user);
                else if (isset($request->serial))
                    $resp = $WibioOtpRequestHelper->adminDisableToken($request->serial);
                else
                    $resp = "Invalid request";
                break;
            case "enable":
                if (isset($request->user))
                    $resp = $WibioOtpRequestHelper->adminEnableUser($request->user);
                else if (isset($request->serial))
                    $resp = $WibioOtpRequestHelper->adminEnableToken($request->serial);
                else
                    $resp = "Invalid request";
                break;
            case "get_token_owner":
                if (isset($request->serial))
                    $resp = $WibioOtpRequestHelper->adminGetTokenOwner($request->serial);
                else
                    $resp = "Invalid request";
                break;
            case "remove":
                if (isset($request->user))
                    $resp = $WibioOtpRequestHelper->adminRemoveUser($request->user);
                else if (isset($request->serial))
                {
                    $token = HardwareToken::find($request->serial);
                    if ($token)
                        $token::delete();
                    $resp = $WibioOtpRequestHelper->adminRemoveToken($request->serial);
                }
                else
                    $resp = "Invalid request";
                break;
            case "reset_fail_counter":
                if (isset($request->user))
                    $resp = $WibioOtpRequestHelper->adminResetUser($request->user);
                else if (isset($request->serial))
                    $resp = $WibioOtpRequestHelper->adminResetToken($request->serial);
                else
                    $resp = "Invalid request";
                break;
            case "resync":
                if (isset($request->user))
                    $resp = $WibioOtpRequestHelper->adminResyncUser($request->user, $request->otp1, $request->otp2);
                else if (isset($request->serial))
                    $resp = $WibioOtpRequestHelper->adminResyncToken($request->serial, $request->otp1, $request->otp2);
                else
                    $resp = "Invalid request";
                break;
            case "show":
                if (isset($request->user))
                    $resp = $WibioOtpRequestHelper->adminShowUser($request->user);
                else if (isset($request->serial))
                    $resp = $WibioOtpRequestHelper->adminShowToken($request->serial);
                else
                    $resp = $WibioOtpRequestHelper->adminShowAll($Team->name);
                break;
            case "unassign":
                if (isset($request->serial))
                {
                    $token = HardwareToken::find($request->serial);
                    if ($token->count())
                    {
                        $token->owner = "";
                        $token->save();
                    }
                    $resp = $WibioOtpRequestHelper->adminUnassignToken($request->serial);
                }
                else
                    $resp = "Invalid request";
                break;
            case "user_list":
                $resp = $WibioOtpRequestHelper->adminUserList($Team->name);
                break;
        }
        $WibioOtpRequestHelper = null;
        if ($resp == "cURL request error!") return back()->withError('Request to OTP server: '.$request->action, 'Unable to perform the action');
        return $resp;
    }
}
