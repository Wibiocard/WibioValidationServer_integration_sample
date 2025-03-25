@vite(['resources/js/webcard.js','resources/js/webcard_common.js', 'resources/js/dashboard.js'])
<script src="https://cdn.form.io/js/formio.embed.js"></script>
<x-app-layout>
    <div class="mx-auto mt-2 sm:px-6 lg:px-8">
        <div class="card" id="card_mess">
            <div class="card-header text-white bg-success" id="h_mess"></div>
            <div class="card-body" id="body_mess">
                <h5 class="card-title" id="t_mess"></h5>
                <p class="card-text" id="b_mess">Personal card manager</p>
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

    <div id="card_div" class="mt-2"></div>
    <input type="hidden" id="user_email" value="{{ Auth::user()->email }}"/>
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
</x-app-layout>
