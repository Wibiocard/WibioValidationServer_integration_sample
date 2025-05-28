
<div class="mx-auto sm:px-6 lg:px-8" id="SMtypeC">
    <div class="row">
        <div class="col-4">
            <div class="card h-100">
                <div class="card-header bg-light-success text-success text-uppercase d-flex flex-row">
                    <i class="bi bi-credit-card"></i>
                    <span  class="my-auto ms-2" ><b>Type:</b> F</span>
                </div>
                <div class="card-body bg-light-secondary">
                    <div id="card_img_container">
                        <img src="{{ Vite::asset('resources/images/type F.png') }}" alt="Wibio smartcard type-F" class="mx-auto my-auto">
                    </div>
                    <div id="workingCard">
                        <i class="bi bi-wifi slide active"></i>
                        <i class="bi bi-wifi-2 slide"></i>
                        <i class="bi bi-wifi-1 slide"></i>
                    </div>
                </div>
                <div class="card-footer text-muted">Card state: <span id="cardstate">present</span></div>
            </div>
        </div>
        <div class="col-8" id="useCard">
            <div class="card h-100">
                <div class="card-header bg-light-success text-success text-uppercase d-flex flex-row">
                    <i class="bi bi-fingerprint"></i>
                    <span id="cardid" class="my-auto ms-2" >Otp sequences</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-8">
                            <select class="form-select" size="10"  id="sequences" aria-label="size 3 select example">
                            </select>
                            <button class="my-2 btn btn-success w-100" id ="getOtp">Get OTP</button>
                            <div class="text-center">
                                <h2 id="otp" class="text-success">OTP: </h2>
                                <section class="countdown-container">
                                    <div class="seconds-container">
                                      <div class="seconds"></div>
                                    </div>
                                </section>
                            </div>
                        </div>
                        <div class="col-3 sensor_container"  style="zoom: 60%;">
                            <img src="{{ Vite::asset('resources/images/fingerprint_partial.png') }}" id="imgfinger" class="mx-auto imgfinger_hidden" alt="Wibio fingerprint request">
                        </div>
                    </div>
                </div>
                <div class="card-footer text-muted">Select a sequence and click on button to retrive OTP from smartcard. <b>Click on OTP to copy it on clipboard</b></div>
            </div>
        </div>
        <div class="col-8 mb-2" id="enrollCard">
            <div class="card h-100">
                <div class="card-header bg-light-warning text-warning text-uppercase d-flex flex-row">
                    <i class="bi text-warning bi-fingerprint"></i>
                    <span id="cardid" class="my-auto ms-2" >Fingerprint enrollment</span>
                </div>
                <div class="card-body">
                    <div class="row" id="enrollSchema">
                        <div class="col-12 my-2">
                            <span class="h5">When you are ready to enroll your fingerprint, click on the button below and follow the instructions.</span>
                            <button class="btn btn-success" id="enroll">Enroll fingerprint</button>
                        </div>
                        <ul>
                            <li>Number of finger required to enroll this smartcard: <span id="FingerToEnroll"></span></li>
                            <li>Number of touches performed: <span id="TouchedEnrolled"></span></li>
                            <li>Number of touches remaining: <span id="TouchedRemain"></span></li>
                        </ul>
                    </div>
                </div>
                <div class="card-footer text-muted">You need to perform the smartcard enrollment before continue to work!</div>
            </div>
        </div>
    </div>
</div>
