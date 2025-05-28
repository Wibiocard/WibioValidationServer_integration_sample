<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Helpers\WibioOtpValidationHelper;

class Wibio2FAController extends Controller
{
    private $realm = "********************";
    /**
     * Handle the 2FA login request.
     *
     * @param \Illuminate\Http\Request $request The HTTP request instance.
     * @return \Illuminate\Http\Response The HTTP response.
     */
    public function login2FA(Request $request)
    {
        $id = $request->session()->get('user_id');
        $email = User::find($id)->email;
        return view('auth.wibio2fa.login', compact('email'));
    }

    /**
     * Verify the Two-Factor Authentication (2FA) code.
     *
     * @param \Illuminate\Http\Request $request The HTTP request object containing the 2FA code.
     * @return \Illuminate\Http\Response The HTTP response indicating the result of the 2FA verification.
     */
    public function verify2FA(Request $request)
    {
        $user = User::where("email", $request->email)->first();
        if (!$user) return back()->withError('Wibio token login', 'User not found');
        $token = $user->hardware_token;
        if (!$token) return back()->withError('Wibio token login', 'Token not found');

        $WibioOtpValidationHelper = new WibioOtpValidationHelper();
        $resp = $WibioOtpValidationHelper->validateOtp(explode("@", $user->email)[0], $otp, $realm);  //realm to be compiled
        $WibioOtpValidationHelper = null;
        if ($resp == "cURL request error!") return back()->withError('Wibio token login', 'Unable to validate token');
        if ($resp->result->value == true)
        {
            Auth::loginUsingId($user->id);
            return redirect()->intended(route('dashboard', absolute: false));
        }
        else
            return back()->withError('Wibio token login error', $resp->detail->error);
    }
}
