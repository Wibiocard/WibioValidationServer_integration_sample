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
        $userId = $request->session()->pull('user_id');
        $user = User::find($userId);
        $otp = $request->get('one_time_password');
        if (!$user) return back()->withError('Wibio token login', 'User not found');
        $token = $user->hardware_token;
        if (!$token) return back()->withError('Wibio token login', 'Token not found');

        $WibioOtpValidationHelper = new WibioOtpValidationHelper();
        $resp = $WibioOtpValidationHelper->validateOtp($user->email, $otp, '');
        $WibioOtpValidationHelper = null;
        if ($resp == "cURL request error!") return back()->withError('Wibio token login', 'Unable to validate token');
        if ($resp->result->value->status == "ok")
        {
            Auth::loginUsingId($userId);
            return redirect()->intended(route('dashboard', absolute: false));
        }
        else
            return back()->withError('Wibio token login', 'Invalid OTP');
    }
}
