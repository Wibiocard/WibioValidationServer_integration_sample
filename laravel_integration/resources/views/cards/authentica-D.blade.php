
<div class="mx-auto sm:px-6 lg:px-8" id="SMtypeC">
    <div class="row">
        <div class="col-4 mb-4">
            <div class="card h-100">
                <div class="card-header bg-light-success text-success text-uppercase d-flex flex-row">
                    <i class="bi bi-credit-card"></i>
                    <span  class="my-auto ms-2" ><b>Type:</b> D</span>
                </div>
                <div class="card-body bg-light-secondary">
                    <div id="card_img_container">
                        <img src="{{ Vite::asset('resources/images/type D.png') }}" alt="Wibio smartcard type-D" class="mx-auto my-auto">
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
        <div class="col-8 mb-4" id="useCard">
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
                            <div class="row"><button class="my-2 btn btn-success w-75" id ="getOtp">Get OTP</button><button class="my-2 btn btn-danger w-25" id ="deleteOtp">Delete sequence</button></div>
                            <div class="text-center">
                                <h2 id="otp" class="text-success">OTP: </h2>
                                <section class="countdown-container">
                                    <div class="seconds-container">
                                      <div class="seconds"></div>
                                    </div>
                                </section>
                            </div>
                        </div>
                        <div class="col-4 sensor_container">
                            <img src="{{ Vite::asset('resources/images/fingerprint_partial.png') }}" id="imgfinger" class="mx-auto imgfinger_hidden" alt="Wibio fingerprint request">
                        </div>
                    </div>
                </div>
                <div class="card-footer text-muted">Select a sequence and click on button to retrive OTP from smartcard</div>
            </div>
        </div>
        <div class="col-8 mb-4" id="enrollCard">
            <div class="card h-100">
                <div class="card-header bg-light-warning text-warning text-uppercase d-flex flex-row">
                    <i class="bi text-warning bi-fingerprint"></i>
                    <span id="cardid" class="my-auto ms-2" >Fingerprint enrollment</span>
                </div>
                <div class="card-body">
                    <div class="row" id="enrollSchema">
                        <div class="col-12 my-2">
                            <span class="h5">When you are ready to enroll your fingerprint, click on the button below and follow the instructions.</span>
                        </div>
                        <ul>
                            <li>Number of remaining finger required to enroll this smartcard: <span id="FingerToEnroll"></span> of 2</li>
                            <li>Number of touches performed: <span id="TouchedEnrolled"></span></li>
                            <li>Number of touches remaining: <span id="TouchedRemain"></span></li>
                        </ul>
                    </div>
                </div>
                <div class="card-footer text-muted">You need to perform the smartcard enrollment before continue to work!</div>
            </div>
        </div>
        <div class="col-8 mb-4" id="identityCard">
            <div class="card h-100">
                <div class="card-header bg-light-success text-success text-uppercase d-flex flex-row">
                    <i class="bi text-success bi-journal-medical"></i>
                    <span id="cardid" class="my-auto ms-2" >Identity data</span>
                </div>
                <div class="card-body">
                    <div class="row" id="userDatas">
                        <h3 class="col-12 pt-2" style="border-bottom: 1px solid #ccc;">
                            Card ID: <span id="#W>I"></span> expires on <span id="#W>E"></span>
                        </h3>
                        <div class="col-4" id="Personal_data" style="border-right: 1px solid #ccc;">
                            <h5 class="card-title my-4">Personal data</h5>
                            <ul class="card-text">
                                <li><b>Email:</b> <span id="#U>E"></span></li>
                                <li><b>Name:</b> <span id="#U>N"></span></li>
                                <li><b>Surname:</b> <span id="#U>S"></span></li>
                                <li><b>Gender:</b> <span id="#U>G"></span></li>
                                <li><b>Birthdate:</b> <span id="#U>B"></span></li>
                                <li><b>Birthplace:</b> <span id="#U>P"></span></li>
                                <li><b>Address:</b> <span id="#U>A"></span></li>
                                <li><b>City:</b> <span id="#U>C"></span></li>
                                <li><b>Country:</b> <span id="#U>U"></span></li>
                                <li><b>Fiscal code:</b> <span id="#U>F"></span></li>
                            </ul>
                        </div>
                        <div class="col-4" id="Health_insurance">
                            <h5 class="card-title my-4">Health insurance</h5>
                            <ul class="card-text">
                                <li><b>Health insurance code:</b> <span id="#H>I"></span></li>
                                <li><b>Insurance code:</b> <span id="#H>C"></span></li>
                                <li><b>Insurance expiration date:</b> <span id="#H>E"></span></li>
                            </ul>
                        </div>
                        <div class="col-4" id="Company_data" style="border-left: 1px solid #ccc;">
                            <h5 class="card-title my-4">Company data</h5>
                            <ul class="card-text">
                                <li><b>Company name:</b> <span id="#C>N"></span></li>
                                <li><b>Company address:</b> <span id="#C>A"></span></li>
                                <li><b>Company city:</b> <span id="#C>C"></span></li>
                                <li><b>Company country:</b> <span id="#C>S"></span></li>
                                <li><b>Company fiscal code:</b> <span id="#C>F"></span></li>
                                <li><b>Company user ID:</b> <span id="#C>I"></span></li>
                                <li><b>Company user email:</b> <span id="#C>E"></span></li>
                                <li><b>Company user phone:</b> <span id="#C>P"></span></li>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
