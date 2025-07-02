@vite(['resources/js/webcard.js','resources/js/webcard_common.js', 'resources/js/login.js'])
<script src="https://cdn.form.io/js/formio.embed.js"></script>
<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Wibiocard multi factor authentication') }}
        </h2>
    </x-slot>
    <div class="container">
        <div class="mx-auto mt-2 sm:px-6 lg:px-8">
            <div class="row">
                <div class="form-group col-2 h3">
                    Login for user:
                </div>
                <div class="form-group col-6">
                    <input type="text" readonly id="user_email" class="form-control-plaintext"  value="{{ $email }}"/>
                </div>
                <div class="form-group col-4 text-center">
                    <a class="float-end h6" href="{{ route("2fa.login") }}">Can't access with smartcard? Use the Google Authenticator as backup MFA login</a>
                </div>
            </div>
            <div class="card" id="card_mess">
                <div class="card-header text-white bg-success" id="h_mess"></div>
                <div class="card-body" id="body_mess">
                    <h5 class="card-title" id="t_mess"></h5>
                    <p class="card-text" id="b_mess"></p>
                </div>
                <div class="card-footer text-success bg-light-success" id="f_mess"></div>
            </div>
        </div>
        <div id="spinner-wrapper" class="spinner-wrapper"><img class="mx-auto my-auto" src={{ Vite::asset('resources/images/rolling-slow.gif') }} alt="Wait..."></div>

        <div class="modal" tabindex="-1" role="dialog" id="formio-wrapper">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-light-warning">
                        <h5 class="modal-title">Custom data required</h5>
                    </div>
                    <div class="modal-body formio-modal-content">
                        <div id="formio-content"></div>
                    </div>
                </div>
            </div>
        </div>
        <div id="card_div" class="mt-2">

        </div>
        <div class="modal" tabindex="-1" role="dialog" id="fingerModal">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-light-warning">
                        <h5 class="modal-title">Fingerprint required</h5>
                    </div>
                    <div class="modal-body">
                        <div class="sensor_container">
                            <img src="{{ Vite::asset('resources/images/fingerprint_partial.png') }}" id="imgfinger" class="mx-auto imgfinger_request" alt="Wibio fingerprint request">
                        </div>
                        <h4 class="text-center">Please put your finger on the sensor and do not remove it.</h4>
                    </div>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
