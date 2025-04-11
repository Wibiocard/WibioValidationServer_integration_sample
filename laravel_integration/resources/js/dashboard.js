import * as c from './webcard_common.js';
//**************************INTERFACE**************************//
var countDownActive = false;
document.onreadystatechange = async function () {
    if (document.readyState == "complete") {
        await c.init().catch(error => c.manageMessages("#f_mess", "d", error));
        listReaders();
    }
}

if (navigator.wibioWebcard) {
    navigator.wibioWebcard.cardInserted = function (reader) {
        console.log('Card inserted in ' + reader.name);
        loadInterface(reader);
    }
    navigator.wibioWebcard.cardRemoved = function (reader) {
        console.log('Card removed from ' + reader.name);
        c.unloadInterface(reader);
    }

    navigator.wibioWebcard.readersConnected = function (reader) {
        console.log('Reader connected: ' + reader.name);
        listReaders();
    }
    navigator.wibioWebcard.readersDisconnected = function (reader) {
        console.log('Reader disconnected: ' + reader.name);
        listReaders();
    }
}

/**
 * Asynchronously lists smart card readers and updates the UI with their status.
 *
 * This function performs the following steps:
 * 1. Shows a spinner to indicate loading.
 * 2. Displays a message indicating that the WibioWebcard Extension is loaded.
 * 3. Retrieves the list of smart card readers using the `navigator.wibioWebcard.readers()` method.
 * 4. Displays the number of detected readers.
 * 5. Displays a message prompting the user to place their card on the reader.
 * 6. Clears any previous messages in the specified element.
 * 7. Creates a list of readers and updates the UI with their status:
 *    - If a reader has an ATR and the card is supported, it displays the reader as "Card detected".
 *    - If a reader has an ATR but the card is not supported, it displays the reader as "not supported card".
 *    - If a reader does not have an ATR, it displays the reader as "Empty slot".
 * 8. Appends the list of readers to the specified element in the UI.
 * 9. Hides the spinner.
 *
 * If an error occurs during the process, it logs the error to the console and displays an error message.
 *
 * @async
 * @function listReaders
 * @returns {Promise<void>} A promise that resolves when the readers have been listed and the UI has been updated.
 */
async function listReaders() {
    try {
        c.showSpinner()
        c.manageMessages("#h_mess", "s", "WibioWebcard Extension loaded");
        let readers = await navigator.wibioWebcard.readers();
        c.manageMessages("#t_mess", "s", readers.length + " readers detected");
        c.manageMessages("#f_mess", "s","Put your card on the smartcard reader to start working!");
        c.manageMessages("#b_mess", null, "");
        var ul = document.createElement('ul');
        ul.classList.add('list-group');
        readers.forEach((reader) => {
            const li = document.createElement('li');
            if (reader.atr != "" && c._supportedCards.find(c => reader.atr.startsWith(c.Atr.replaceAll('-', ''))))
            {
                li.classList.add('list-group-item', 'list-group-item-success');
                li.innerHTML = '<i class="bi bi-credit-card text-success"></i> <span>' + reader.name + '</span><span class="float-end text-sm">Card detected</span>';
                loadInterface(reader);
            }
            else if (reader.atr != "")
            {
                li.classList.add('list-group-item', 'list-group-item-danger');
                li.innerHTML = '<i class="bi bi-credit-card text-danger"></i> <span>' + reader.name +  '</span><span class="float-end text-sm">not supported card</span>';
            }
            else
            {
                li.classList.add('list-group-item', 'list-group-item-secondary');
                li.innerHTML = '<i class="bi bi-x-octagon text-secondary"></i> <span>' + reader.name +  '</span><span class="float-end text-sm">Empty slot</span>';
            }
            ul.appendChild(li);
        });
        document.querySelector("#b_mess").appendChild(ul);
        c.hideSpinner();
    } catch(ex){
        console.log(ex);
        c.manageMessages("#f_mess", "d", "An error occurred during reader recognition. Please check your card reader and try again");
    }
}

/**
 * Loads the interface for the given card reader.
 *
 * This function manages messages to the user about the card detection process,
 * attempts to recognize the card type, and fetches a partial page based on the
 * recognized card type. It also handles errors and hides the spinner once the
 * process is complete.
 *
 * @param {Object} reader - The card reader object.
 * @param {string} reader.name - The name of the card reader.
 *
 * @returns {Promise<void>} A promise that resolves when the interface is loaded.
 */
async function loadInterface(reader)
{
    c.manageMessages("#h_mess", "s", "Card detected");
    c.manageMessages("#t_mess", null, "Card inserted in " + reader.name);
    c.manageMessages("#b_mess", null, "ATR detected");
    c.manageMessages("#f_mess", "s", "Wait while recognize card type!");
    await c.recognizeCard(reader).then(() => {
        if (c._cardType !== undefined)
            fetchPartialPage('/authentica'+c._cardType, '#card_div');
    }).catch(ex => {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during card recognition. Please check your card and try again");
    }).finally(function(){
        c.hideSpinner();
    });
}

/**
 * Fetches a partial HTML page from the given URL and inserts its content into the specified destination element.
 *
 * @param {string} url - The URL of the partial HTML page to fetch.
 * @param {string} dest - The CSS selector of the destination element where the fetched content will be inserted.
 *
 * @returns {void}
 *
 * @example
 * fetchPartialPage('/path/to/partial.html', '#content');
 *
 * @throws Will log an error message to the console and update the message element if the fetch operation fails.
 */
function fetchPartialPage(url, dest)
{
    fetch(url).then(function (response) {
        return response.text();
    }).then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        document.querySelector(dest).innerHTML = doc.body.innerHTML;
        document.querySelector("#b_mess").innerHTML = "Card interface loaded";
        executePartialScript();
    }).catch(function (ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "Error loading card interface. Check your internet connection and try again");
    });
}

/**
 * Executes a partial script based on the card type and sets up an event listener for copying OTP to clipboard.
 *
 * @async
 * @function executePartialScript
 * @returns {Promise<void>}
 *
 * @description
 * This function performs different actions based on the card type (`c._cardType`). It verifies enrollment status for
 * card types 'F', 'T', and 'D'. For card type 'C', it displays a message indicating that cloud functionality is a work
 * in progress. For unsupported card types, it displays a message indicating that the card type doesn't support cloud
 * functionality. Additionally, it sets up an event listener on the element with id 'otp' to copy the OTP value to the
 * clipboard when clicked.
 */
async function executePartialScript()
{
    countDownActive = false;
    switch(c._cardType)
    {
        case 'F':
            VerifyEnrollStatus_F();
            break;
        case 'C':
            c.manageMessages("#b_mess", "d", "Type C cloud functonality implemetation is a work in progress");
            break;
        case 'T':
            VerifyEnrollStatus_T();
            break;
        case 'D':
            VerifyEnrollStatus_D();
            break;
        default:
            c.manageMessages("#b_mess", "d", "Card type doesn't support cloud functonality");
            break;
    }
    if (document.body.contains(document.querySelector('#otp')))
        document.querySelector('#otp').addEventListener('click', function(event){
            navigator.clipboard.writeText(document.querySelector("#otp").innerHTML.split(": ")[1]);
        });

}

/**
 * Verifies the enrollment status of a card type F and updates the UI accordingly.
 *
 * This function performs the following steps:
 * 1. Executes a command to get the enrollment status of the card.
 * 2. Checks the response to determine if the card is already enrolled or needs enrollment.
 * 3. If the card is already enrolled, it updates the UI to remove the enroll button and sets up the OTP retrieval.
 * 4. If the card needs enrollment, it sets up the UI for fingerprint enrollment and handles the enrollment process.
 *
 * @async
 * @function VerifyEnrollStatus_F
 * @throws Will log an error and display a message if an error occurs during the enrollment status verification.
 */
function VerifyEnrollStatus_F()
{
    try{
        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectEnroll][GetEnrollStatus]"))).then((execResult) => {
            if(c.countApduResponse(execResult) == 2)
            {
                if (c.checkApduResponse(execResult[0]) == false)
                {
                    c.manageMessages("#f_mess", "w", "Unable to verify the enroll status. Assuming the card is already enrolled using the hardware enroll tool.");
                    ListSequences_F();
                    document.querySelector("#enrollCard").remove();
                }
                else
                {
                    c.manageMessages("#f_mess", "s", "Card applet selected");
                    if (c.checkApduResponse(execResult[1]) == true)
                    {
                        var ApduData = c.parseApduResponse(execResult[1]);
                        if (ApduData.Status == "complete")
                        {
                            document.querySelector("#enrollCard").remove();
                            ListSequences_F();
                            document.querySelector('#getOtp').addEventListener('click', async function(event){
                                let sequence = document.querySelector("#sequences").value.split(": ")[1];
                                if (!sequence)
                                    c.manageMessages("#b_mess", "d", "Select a sequence to get OTP");
                                else
                                    GetHotp_F(sequence);
                            });
                        }
                        else if (ApduData.Status == "finger1" || ApduData.Status == "finger2")
                        {
                            document.querySelector('#useCard').remove();
                            let FingerToEnroll = (ApduData.Status == "1finger")?2:1;
                            let TouchedEnrolled = 0;
                            let TouchedRemain = 12;
                            let TotalTouched = TouchedEnrolled + TouchedRemain;
                            document.querySelector('#FingerToEnroll').innerHTML = FingerToEnroll;
                            for (let j = 0; j < FingerToEnroll; j++)
                            {
                                let finger = document.createElement('div');
                                finger.classList.add('row', 'sensors');
                                for (let i = 0; i < TotalTouched; i++)
                                {
                                    let touch = document.createElement('div');
                                    touch.classList.add('col-3', 'sensor_container');
                                    let img = document.createElement('img');
                                        img.src = (i>=TouchedEnrolled)? '/images/fingerprint_partial.png' : '/images/fingerprint.png';
                                        img.id = 'imgenroll'+i;
                                        img.classList.add('mx-auto', 'fingerChild', (i>=TouchedEnrolled)?'imgfinger_hidden':'imgfinger');
                                        img.alt = 'Wibio fingerprint request';
                                    touch.appendChild(img);
                                    finger.appendChild(touch);
                                }
                                document.querySelector('#enrollSchema').appendChild(finger);
                                document.querySelector('#enroll').addEventListener('click', async function(event){
                                    document.querySelector("#imgenroll"+TouchedEnrolled).src = '/images/fingerprint_partial.png';
                                    document.querySelector("#imgenroll"+TouchedEnrolled).classList.replace('imgfinger_hidden', 'imgfinger_request');
                                    const recursiveFingerCall = (index) => {
                                        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[EnrollFingerprint {finger_id="+index+"}}]"))).then((execEnrollResult) => {
                                            if (c.countApduResponse(execEnrollResult) == 1 && c.checkApduResponse(execEnrollResult[0]) == true)
                                            {
                                                document.querySelector("#imgenroll"+index).classList.replace('imgfinger_request', 'imgfinger');
                                                document.querySelector("#imgenroll"+index).src = '/images/fingerprint.png';
                                                TouchedRemain--;
                                                document.querySelector('#TouchedEnrolled').innerHTML = TouchedEnrolled;
                                                document.querySelector('#TouchedRemain').innerHTML = index;
                                                index++;
                                            }else{
                                                document.querySelector("#imgenroll"+index).classList.replace('imgfinger_request', 'imgfinger');
                                                document.querySelector("#imgenroll"+index).src = '/images/fingerprint_broken.png';
                                                c.manageMessages("#b_mess", "d", "Enroll error! Retry");
                                            }
                                            if (index < TotalTouched) {
                                                document.querySelector("#imgenroll"+index).src = '/images/fingerprint_partial.png';
                                                document.querySelector("#imgenroll"+index).classList.replace('imgfinger_hidden', 'imgfinger_request');
                                                return recursiveFingerCall(index)
                                            } else {
                                                c.manageMessages("#b_mess", "s", "Enroll completed.");
                                                location.reload();
                                            }
                                        })
                                    }
                                    recursiveFingerCall(TouchedEnrolled);
                                })
                            }
                        }
                    }
                }
            }
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during enroll status verification. Please check your card and try again");
    }
}

/**
 * Verifies the enrollment status of a card type T and updates the UI accordingly.
 *
 * This function performs the following steps:
 * 1. Executes a command to get the enrollment status of the card.
 * 2. Checks the response to determine if the card is selected and if the applet is found.
 * 3. If the biometric mode indicates a qualification failure, it removes certain elements from the UI and displays an error message.
 * 4. If the verification status is "enrollment", it updates the UI to show the enrollment schema and sets up event listeners for enrolling fingerprints.
 * 5. If the verification status is not "enrollment", it sets up the UI for OTP generation and adds event listeners for OTP retrieval.
 *
 * @throws Will throw an error if the applet is not found or if there is a biometric error.
 */
function VerifyEnrollStatus_T()
{
    try{
        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectEnroll][GetEnrollStatus]"))).then((execResult) => {
            if(c.countApduResponse(execResult) == 2)
            {
                if (c.checkApduResponse(execResult[0]) == false)
                {
                    c.manageMessages("#f_mess", "d", "Applet not found");
                    throw 'Applet not found';
                }
                c.manageMessages("#f_mess", "s", "Card selected");
                if (c.checkApduResponse(execResult[1]) == true)
                {
                    var ApduData = c.parseApduResponse(execResult[1]);
                    if (ApduData.BiometricMode == "qualification failed")
                    {
                        document.querySelector('#enrollCard').remove();
                        document.querySelector('#useCard').remove();
                        c.manageMessages("#f_mess", "d", "Biometric error. Please contact the administrator to reset the card");
                        throw "Biometric error. Please contact the administrator to reset the card";
                    }
                    else if (ApduData.VerificationStatus == "enrollment")
                    {
                        document.querySelector('#useCard').remove();
                        document.querySelector('#FingerToEnroll').innerHTML = Number(ApduData.FingerToEnroll);
                        let TouchedEnrolled = document.querySelector('#TouchedEnrolled').innerHTML = Number(ApduData.TouchedEnrolled);
                        let TouchedRemain = document.querySelector('#TouchedRemain').innerHTML = Number(ApduData.TouchedRemain);
                        let TotalTouched = TouchedEnrolled + TouchedRemain;
                        for (let j = 0; j < ApduData.FingerNumberToEnroll; j++)
                        {
                            let finger = document.createElement('div');
                            finger.classList.add('row', 'sensors');
                            for (let i = 0; i < TotalTouched; i++)
                            {
                                let touch = document.createElement('div');
                                touch.classList.add('col-3', 'sensor_container');
                                let img = document.createElement('img');
                                    img.src = (i>=TouchedEnrolled)? '/images/fingerprint_partial.png' : '/images/fingerprint.png';
                                    img.id = 'imgenroll'+i;
                                    img.classList.add('mx-auto', 'fingerChild', (i>=TouchedEnrolled)?'imgfinger_hidden':'imgfinger');
                                    img.alt = 'Wibio fingerprint request';
                                touch.appendChild(img);
                                finger.appendChild(touch);
                            }
                            document.querySelector('#enrollSchema').appendChild(finger);
                            document.querySelector('#enroll').addEventListener('click', async function(event){
                                document.querySelector("#imgenroll"+TouchedEnrolled).src = '/images/fingerprint_partial.png';
                                document.querySelector("#imgenroll"+TouchedEnrolled).classList.replace('imgfinger_hidden', 'imgfinger_request');
                                const recursiveFingerCall = (index) => {
                                    new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[EnrollFingerprint]"))).then((execEnrollResult) => {
                                        if (c.countApduResponse(execEnrollResult) == 1 && c.checkApduResponse(execEnrollResult[0]) == true)
                                        {
                                            document.querySelector("#imgenroll"+index).classList.replace('imgfinger_request', 'imgfinger');
                                            document.querySelector("#imgenroll"+index).src = '/images/fingerprint.png';
                                            TouchedRemain--;
                                            document.querySelector('#TouchedEnrolled').innerHTML = TouchedEnrolled;
                                            document.querySelector('#TouchedRemain').innerHTML = index;
                                            index++;
                                        }else{
                                            document.querySelector("#imgenroll"+index).classList.replace('imgfinger_request', 'imgfinger');
                                            document.querySelector("#imgenroll"+index).src = '/images/fingerprint_broken.png';
                                            c.manageMessages("#b_mess", "d", "Enroll error! Retry");
                                        }
                                        if (index < TotalTouched) {
                                            document.querySelector("#imgenroll"+index).src = '/images/fingerprint_partial.png';
                                            document.querySelector("#imgenroll"+index).classList.replace('imgfinger_hidden', 'imgfinger_request');
                                            return recursiveFingerCall(index)
                                        } else {
                                            c.manageMessages("#b_mess", "s", "Enroll completed");
                                            location.reload();
                                        }
                                    })
                                }
                                recursiveFingerCall(TouchedEnrolled);
                            });
                        }
                        location.reload();
                    }
                    else
                    {
                        document.querySelector("#enrollCard").remove();
                        ListSequences_T();
                        document.querySelector('#getOtp').addEventListener('click', async function(event){
                            let sequence = document.querySelector("#sequences").value;
                            let otpType = sequence.split(": ")[0];
                            if (!sequence)
                                c.manageMessages("#b_mess", "d", "Select a sequence to get OTP");
                            else
                                if (otpType == "HOTP")
                                    GetHotp_T(sequence.split(": ")[1]);
                                else
                                    GetTotp_T(sequence.split(": ")[1]);
                        });
                        document.querySelector('#deleteOtp').addEventListener('click', async function(event){
                            let sequence = document.querySelector("#sequences").value;
                            let otpType = sequence.split(": ")[0];
                            if (!sequence)
                                c.manageMessages("#b_mess", "d", "Select a sequence to get OTP");
                            else
                                if (confirm("Are you sure you want to delete the OTP sequence?" == true))
                                    DeleteSequence_T(sequence.split(": ")[1]);
                        });
                    }
                }
            }
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during enroll status verification. Please check your card and try again");
    }
}

/**
 * VerifyEnrollStatus_D function handles the verification of the enrollment status of a card.
 * It executes a series of commands to check the status of the card and manages the enrollment process.
 *
 * The function performs the following steps:
 * 1. Selects the card and logs in.
 * 2. Checks the enrollment status of two fingers.
 * 3. If the card is not found or login fails, it displays appropriate error messages.
 * 4. If the card is selected, it proceeds to check the enrollment status of each finger.
 * 5. If a finger is not enrolled or enrollment is in progress, it displays the enrollment schema and handles the enrollment process.
 * 6. If a finger is already enrolled, it moves to the next finger.
 * 7. If the maximum number of touches is reached, it finalizes the enrollment.
 * 8. If any error occurs during the process, it displays appropriate error messages and logs the error.
 *
 * @throws {string} Throws an error message if any step in the process fails.
 */
function VerifyEnrollStatus_D()
{
    try{
        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectEnroll][LoginEnroll][GetEnrollStatus {finger_id=00}][GetEnrollStatus {finger_id=01}]"))).then((execResult) => {
            if (c.countApduResponse(execResult) == 4)
            {
                let TotalTouched = 0;
                let TotalTouchedList = [];
                if (c.checkApduResponse(execResult[0]) == false)
                {
                    c.manageMessages("#f_mess", "d", "Applet not found");
                    throw 'Applet not found';
                }
                if (c.checkApduResponse(execResult[1]) == false)
                {
                    c.manageMessages("#f_mess", "d", "Failed login");
                    throw 'Failed login';
                }
                c.manageMessages("#f_mess", "s", "Card selected");
				for (let cId=2; cId<4; cId++)
				{
					let findex = cId-2;
                    let touchList = [];
					if (c.checkApduResponse(execResult[cId]) == true)
                    {
						var ApduData = c.parseApduResponse(execResult[cId]);
                        if (ApduData.finger_status == "Finger invalid")
                        {
                            document.querySelector('#enrollCard').remove();
                            document.querySelector('#useCard').remove();
                            c.manageMessages("#f_mess", "d", "Card reset required");
                            if (confirm('Are you sure you want to reset the card data?')) {
                                new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[ResetEnroll]"))).then(async (execEnrollResult) => {
                                    if (c.countApduResponse(execEnrollResult) == 1 && c.checkApduResponse(execEnrollResult[0]) == true)
                                    {
                                        c.manageMessages("#f_mess", "s", "Card reset completed. Please reinsert the card to make the enrollment");
                                    }
                                    else
                                    {
                                        c.manageMessages("#f_mess", "d", "Card reset error");
                                        throw 'Card reset error';
                                    }
                                });
                            } else {
                                throw ApduData.finger_status;
                            }
                        }
                        else if (ApduData.finger_status == "Not enrolled" || ApduData.finger_status == "Enroll wip")
                        {
                            if (document.body.contains(document.querySelector('#useCard'))) document.querySelector('#useCard').remove();
                            if (document.body.contains(document.querySelector('#identityCard'))) document.querySelector('#identityCard').remove();

                            document.querySelector('#FingerToEnroll').innerHTML = findex+1;
                            let TouchedEnrolled = document.querySelector('#TouchedEnrolled').innerHTML = Number(ApduData.touches_no);
                            TotalTouched = Number(ApduData.max_touches);
                            document.querySelector('#TouchedRemain').innerHTML = TotalTouched - TouchedEnrolled;
                            let finger = document.createElement('div');
                            finger.classList.add('row', 'sensors');
                            finger.style.zoom = "60%";
                            finger.id = 'tab_finger_'+findex;
                            let touch = document.createElement('div');
                                touch.classList.add('col');
                                let img = document.createElement('img');
                                    img.src = "/images/enrol_finger_"+findex+".png";
                                    img.alt = 'Wibio finger request';
                                    img.style.width = "160px";
                                    img.style.margin = "auto";
                                let btn = document.createElement('button');
                                    btn.classList.add('btn', 'btn-secondary', 'mx-auto', 'w-100');
                                    btn.id = "enroll_"+findex;
                                    btn.innerHTML = "Enroll";
                                    btn.onclick = function() {
                                        if (document.body.contains(document.querySelector('#tab_finger_'+findex)))
                                            enrollFinger(findex, TotalTouchedList[findex], TotalTouched);
                                    };
                            touch.appendChild(img);
                            touch.appendChild(btn);
                            finger.appendChild(touch);
                            let binaryString = parseInt(ApduData.touches_details[0][0]).toString(2).padStart(TotalTouched/2, "0")+parseInt(ApduData.touches_details[0][1]).toString(2).padStart(TotalTouched/2, "0");
							for (let i = 0; i < TotalTouched; i++)
                            {
                                const tstatus = binaryString[binaryString.length-i-1];
                                touchList.push(tstatus);
                                let touch = document.createElement('div');
                                touch.classList.add('sensor_container', 'col');
                                let img = document.createElement('img');
                                    img.src = (tstatus == 0) ? '/images/fingerprint_partial.png' : '/images/fingerprint.png';
                                    img.id = 'imgenroll'+i;
                                    img.classList.add('mx-auto', 'fingerChild', (tstatus == 0) ?'imgfinger_hidden':'imgfinger');
                                    img.alt = 'Wibio fingerprint request';
                                touch.appendChild(img);
                                finger.appendChild(touch);
                            }
							document.querySelector('#enrollSchema').appendChild(finger);
                            TotalTouchedList.push(touchList);
                        }
						else if (ApduData.finger_status == "Touches reached")
                        {
                            new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[GetEnrollStatus {finger_id=0"+findex+"}][FinalizeEnroll {finger_id=0"+findex+"}][GetEnrollStatus {finger_id=0"+findex+"}]"))).then(async (execFinalizeResult) => {
                                if (c.countApduResponse(execFinalizeResult) == 3
                                    && c.checkApduResponse(execFinalizeResult[0]) == true
                                    && c.parseApduResponse(execFinalizeResult[0]).finger_status == "Touches reached"
                                    && c.checkApduResponse(execFinalizeResult[1]) == true
                                    && c.checkApduResponse(execFinalizeResult[2]) == true
                                    && c.parseApduResponse(execFinalizeResult[2]).finger_status == "Enrolled not allowed")
                                {
                                    document.querySelector('#tab_finger_'+findex).remove();
                                    c.manageMessages("#f_mess", "d", "Enrollment of finger finalized. If nothing else appens please remove and reinsert the card on reader");
                                }
                                else
                                {
                                    c.manageMessages("#f_mess", "d", "Unable to finalize the enrollment. Please contact the administrator to reset the card");
                                    throw 'Unable to finalize the enrollment. Please contact the administrator to reset the card';
                                }
                            });
                        }
                        else if (ApduData.finger_status == "Finalized")
                        {
                            c.manageMessages("#f_mess", "s", "Finger enrolled");
                            if (cId == 3 && document.body.contains(document.querySelector('#useCard')))
                            {
                                document.querySelector('#enrollCard').remove();
                                ListSequences_T();
                                document.querySelector('#getOtp').addEventListener('click', async function(event){
                                    let sequence = document.querySelector("#sequences").value;
                                    let otpType = sequence.split(": ")[0];
                                    if (!sequence)
                                        c.manageMessages("#b_mess", "d", "Select a sequence to get OTP");
                                    else
                                        if (otpType == "HOTP")
                                            GetHotp_T(sequence.split(": ")[1]);
                                        else
                                            GetTotp_T(sequence.split(": ")[1]);
                                });
                                document.querySelector('#deleteOtp').addEventListener('click', async function(event){
                                    let sequence = document.querySelector("#sequences").value;
                                    let otpType = sequence.split(": ")[0];
                                    if (!sequence)
                                        c.manageMessages("#b_mess", "d", "Select a sequence to delete it");
                                    else
                                        if (confirm("Are you sure you want to delete the "+otpType+" sequence?" == true))
                                            DeleteSequence_T(sequence.split(": ")[1]);
                                });
                                return;
                            }
                        }
					}
					else
                    {
                        document.querySelector('#enrollCard').remove();
                        document.querySelector('#useCard').remove();
                        c.manageMessages("#f_mess", "d", "Enroll error. Please contact the administrator to reset the card");
                        throw 'Enroll error. Please contact the administrator to reset the card';
                    }
                    TotalTouchedList.push(touchList);
				}
            }
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during enroll status verification. Please check your card and try again");
    }
}

async function enrollFinger(findex, touchList, TotalTouched) {
	let index = 0;
    while (index < TotalTouched) {
        if (touchList[index] == 0) {
            try {
                await c.CmdsExecutor(c._reader, `[SelectEnroll][LoginEnroll][EnrollFingerprint {finger_id=0${findex}} {touch_id=0${index+1}}]`).then(
                    (execEnrollResult) => {
                    if (c.countApduResponse(execEnrollResult) == 3 && c.checkApduResponse(execEnrollResult[2]) == true) {
                        document.querySelector(`#imgenroll${index}`).classList.replace("imgfinger_hidden", "imgfinger");
                        document.querySelector(`#imgenroll${index}`).src = "/images/fingerprint.png";
                        document.querySelector("#TouchedEnrolled").innerHTML = index;
                        document.querySelector("#TouchedRemain").innerHTML = TotalTouched-index;
                    } else {
                        document.querySelector(`#imgenroll${index}`).classList.replace("imgfinger_hidden", "imgfinger");
                        document.querySelector(`#imgenroll${index}`).src = "/images/fingerprint_broken.png";
                        index--;
                    }
                    new Promise((res) => setTimeout(res, 3000));
                });
            } catch (error) {
                console.error("Error during enrollment:", error);
            }
        }
        index++;
    }

    try {
        let execFinalizeResult = await c.CmdsExecutor(c._reader, `[FinalizeEnroll {finger_id=0${findex}}]`);
        if (c.countApduResponse(execFinalizeResult) == 1 && c.checkApduResponse(execFinalizeResult[0]) == true) {
            c.manageMessages("#f_mess", "s", "Enrollment of finger "+ (findex+1) +" finalized");
        } else {
            c.manageMessages("#f_mess", "d", "Unable to finalize the enrollment. Please contact the administrator to reset the card");
            throw "Unable to finalize the enrollment. Please contact the administrator to reset the card";
        }
    } catch (error) {
        console.error("Error during finalization:", error);
    }
}

/**
 * ListSequences_F function retrieves and displays OTP sequences associated with a card.
 *
 * This function executes a command to read sequence information from a card applet.
 * If the applet is not found, an error message is displayed.
 * If the applet is found and sequences are retrieved, they are displayed in a dropdown list.
 *
 * @function
 * @throws Will throw an error if the applet is not found or if an error occurs during sequence listing.
 */
function ListSequences_F()
{
    try{
        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectBeCard][ReadSequenceInfo]"))).then((execResult) => {
            if(c.countApduResponse(execResult) == 2)
            {
                if (c.checkApduResponse(execResult[0]) == false)
                {
                    c.manageMessages("#f_mess", "d", "Applet not found");
                    throw 'Applet not found';
                }
                c.manageMessages("#f_mess", "s", "Card applet selected");
                if (c.checkApduResponse(execResult[1]) == true)
                {
                    var ApduData = c.parseApduResponse(execResult[1]);
                    if (ApduData.Sequence.length == 0)
                    {
                        c.manageMessages("#b_mess", "w", "This card is not associated with any OTP sequence. Please contact the administrator to associate the card with an OTP sequence");
                        document.querySelector("#useCard").remove();
                    }
                    else
                        ApduData.Sequence.forEach((sequence, index) => {
                            document.querySelector("#sequences").add(new Option("HOTP: " + sequence));
                        })
                    c.manageFinger("#imgfinger", "none");
                }
            }
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during sequence listing. Please check your card and try again");
    }
}

/**
 * ListSequences_T function retrieves and processes OTP sequences associated with a card.
 *
 * This function performs the following steps:
 * 1. Executes a series of commands to select the card, login, and read sequence information.
 * 2. Checks the response of the commands to ensure they were successful.
 * 3. If successful, it manages the fingerprint image and parses the APDU response.
 * 4. If the card is associated with OTP sequences, it adds them to a dropdown list.
 * 5. If the card is not associated with any OTP sequences, it alerts the user.
 * 6. If the login fails, it manages the fingerprint image and displays an error message.
 * 7. Waits for 2 seconds and then calls the ListUserDatas_T function.
 *
 * @throws Will throw an error if the login fails or if an error occurs during sequence listing.
 */
function ListSequences_T()
{
    try{
        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectBeCard][LoginBeCard][ReadSequenceInfo]"))).then((selectResult) => {
            if(c.countApduResponse(selectResult) == 3)
            {
                if (c.checkApduResponse(selectResult[0]) == true && c.checkApduResponse(selectResult[2]) == true)
                {
                    c.manageFinger("#imgfinger", "verify");
                    var ApduData = c.parseApduResponse(selectResult[2]);
                    if (!ApduData || ApduData.Account_len[0] == 0)
                    {
                        c.manageMessages("#b_mess", "w", "This card is not associated with any OTP sequence. Please contact the administrator to associate the card with an OTP sequence");
                        document.querySelector("#useCard").remove();
                    }
                    else
                        ApduData.Account.forEach((sequence, index) => {
                            document.querySelector("#sequences").add(new Option(ApduData.OTP_type[index] + ": "  + sequence));
                        })
                    c.manageFinger("#imgfinger", "none");
                }
                else
                {
                    c.manageFinger("#imgfinger", "broken");
                    c.manageMessages("#f_mess", "d", "Login failed");
                    throw 'Login failed';
                }
            }
            c.wait(2000);
            ListUserDatas_T();
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during sequence listing. Please check your card and try again");
    }
}

/**
 * ListUserDatas_T function retrieves and processes user data from a card.
 * It executes a series of commands to read identity data and updates the HTML content accordingly.
 *
 * @function
 * @throws Will throw an error if unable to retrieve user data definition or if an error occurs during sequence listing.
 */
function ListUserDatas_T()
{
    try{
        new Promise(resolve => resolve(c.listUserData())).then((userData) => {
            if(!userData)
                throw 'Unable to retrieve user data definition. Please check your internet connection and try again';
            let dataStr = [];
            new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectIdentityApp]"))).then((identityAppResult) => {
                if (c.countApduResponse(identityAppResult) == 1 && c.checkApduResponse(identityAppResult[0]) == true)
                {
                    let Cmds = "";
                    for (let i = 0; i < 8; i++)
                        Cmds += "[readAlldata {chunk_id="+i+"}]";
                    new Promise(resolve => resolve(c.CmdsExecutor(c._reader, Cmds))).then((IdentityDataResult) => {
                        if(c.countApduResponse(IdentityDataResult) == 8)
                        {
                            for (let i = 0; i < 8; i++)
                                if (c.checkApduResponse(IdentityDataResult[i]) == true)
                                    dataStr += String.fromCharCode(...c.parseApduResponse(IdentityDataResult[i]).Chunk[0]);
                            let Categories = dataStr.replace(/\x00/g, '').split("#");
                            Categories.forEach(category => {
                                if (category.length !== 0)
                                {
                                    let elements = category.split(">");
                                    let cat = elements[0];
                                    elements.splice(1,elements.length).forEach(element => {
                                        let item = element.split("?");
                                        document.getElementById("#" + cat + ">" + item[0]).innerHTML += item[1];
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }
    catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during sequence listing. Please check your card and try again");
    }

}

/**
 * Generates a HOTP (HMAC-based One-Time Password) sequence for the given sequence number.
 *
 * This function manages the process of verifying the OTP sequence associated with the user's email,
 * executing commands to read the OTP token from the card, and updating the UI with the generated HOTP.
 *
 * @param {number} sequence - The sequence number for which the HOTP is to be generated.
 * @throws Will throw an error if the OTP sequence is not associated with the user's email or if the applet is not found.
 */
function GetHotp_F(sequence)
{
    countDownActive = false;
    c.manageFinger("#imgfinger", "none");
    try{
        new Promise(resolve => resolve(c.verifyTokenByEmail(sequence))).then((execResult) => {
            if (execResult == "0")
            {
                c.manageMessages("#f_mess", "d", "OTP sequence not associated to your email");
                throw 'OTP sequence not associated to your email';
            }
            new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectBeCard][ReadOtpToken {OtpMode="+sequence+"}]"))).then((execResult) => {
                if(c.countApduResponse(execResult) == 2)
                {
                    if (c.checkApduResponse(execResult[0]) == false)
                    {
                        c.manageMessages("#f_mess", "d", "Applet not found");
                        throw 'Applet not found';
                    }
                    if (c.checkApduResponse(execResult[1]) == true)
                    {
                        var ApduData = c.parseApduResponse(execResult[1]);
                        c.manageFinger("#imgfinger", "verify");
                        document.querySelector("#otp").innerHTML = 'HOTP: '+ ApduData.Otp;
                    }
                    else
                    {
                        c.manageFinger("#imgfinger", "broken");
                        document.querySelector("#otp").innerHTML = "HOTP not generated";
                    }
                }
            });
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during OTP generation. Please check your card and try again");
    } finally {
        c.manageFinger("#imgfinger", "none");
    }
}

/**
 * Deletes an OTP sequence associated with the provided card.
 *
 * This function verifies the OTP sequence by email and then attempts to delete it.
 * If the OTP sequence is not associated with the user's email, an error message is displayed.
 * If the OTP sequence is successfully deleted, a success message is displayed.
 * If the deletion fails, an error message is displayed.
 *
 * @param {string} sequence - The OTP sequence to be deleted.
 * @throws Will throw an error if the OTP sequence is not associated with the user's email.
 */
function DeleteOtp_T(sequence)
{
    try{
        new Promise(resolve => resolve(c.verifyTokenByEmail(sequence))).then((execResult) => {
            if (execResult == "0")
            {
                c.manageMessages("#f_mess", "d", "OTP sequence not associated to your email");
                throw 'OTP sequence not associated to your email';
            }
            new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectBeCard][LoginBeCard][DeleteOtpToken {sequence="+sequence+"}]"))).then((execResult) => {
                if(c.countApduResponse(execResult) == 2)
                {
                    if (c.checkApduResponse(execResult[0]) == true && c.checkApduResponse(execResult[1]) == true)
                    {
                        new Promise(resolve => resolve(c.rollbackToken(sequence))).then(() => {
                            c.manageMessages("#b_mess", "s", "OTP sequence deleted");
                        });
                    }
                    else
                    {
                        c.manageMessages("#b_mess", "d", "Unable to delete OTP sequence");
                    }
                }
            });
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during OTP deletion. Please check your card and try again");
    }
}


/**
 * Generates a HOTP (HMAC-based One-Time Password) token based on the provided sequence.
 *
 * This function manages the process of verifying the token by email, executing commands to read the HOTP token,
 * and updating the UI with the generated HOTP or an error message if the process fails.
 *
 * @param {string} sequence - The OTP sequence associated with the user's email.
 * @throws Will throw an error if the OTP sequence is not associated with the user's email.
 */
function GetHotp_T(sequence)
{
    countDownActive = false;
    c.manageFinger("#imgfinger", "none");
    try{
        new Promise(resolve => resolve(c.verifyTokenByEmail(sequence))).then((execResult) => {
            if (execResult == "0")
            {
                c.manageMessages("#f_mess", "d", "OTP sequence not associated to your email");
                throw 'OTP sequence not associated to your email';
            }
            new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectBeCard][LoginBeCard][ReadHotpToken {serial_no="+sequence+"}]"))).then((execResult) => {
                if(c.countApduResponse(execResult) == 3)
                {
                    if (c.checkApduResponse(execResult[0]) == true && c.checkApduResponse(execResult[2]) == true)
                    {
                        var ApduData = c.parseApduResponse(execResult[2]);
                        document.querySelector("#otp").innerHTML = 'HOTP: ' + ApduData.Otp;
                        c.manageFinger("#imgfinger", "verify");
                    }
                    else
                    {
                        document.querySelector("#otp").innerHTML = "HOTP not generated";
                        c.manageFinger("#imgfinger", "broken");
                    }
                }
            });
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during OTP generation. Please check your card and try again");
    } finally {
        c.manageFinger("#imgfinger", "none");
    }
}

/**
 * Generates a Time-based One-Time Password (TOTP) for a given sequence.
 *
 * This function manages the process of generating a TOTP by verifying the token associated with the user's email,
 * and then recursively calling the function to read the TOTP token from the card.
 *
 * @param {string} sequence - The OTP sequence associated with the user's email.
 *
 * @throws Will throw an error if the OTP sequence is not associated with the user's email or if an error occurs during OTP generation.
 */
function GetTotp_T(sequence)
{
    c.manageFinger("#imgfinger", "none");
    try{
        new Promise(resolve => resolve(c.verifyTokenByEmail(sequence))).then((execResult) => {
            if (execResult == "0")
            {
                c.manageMessages("#f_mess", "d", "OTP sequence not associated to your email");
                throw 'OTP sequence not associated to your email';
            }
            recursiveTotpCall(sequence);
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during OTP generation. Please check your card and try again");
    } finally {
        c.manageFinger("#imgfinger", "none");
    }

    const recursiveTotpCall = (sequence) => {
        try{
            new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectBeCard][LoginBeCard][ReadTotpToken {timestamp=}]"))).then((execResult) => {
                if(c.countApduResponse(execResult) == 3)
                {
                    if (c.checkApduResponse(execResult[0]) == true && c.checkApduResponse(execResult[2]) == true)
                    {
                        var ApduData = c.parseApduResponse(execResult[2]);
                        c.manageFinger("#imgfinger", "verify");
                        ApduData.Otp.forEach((otps, index) => {
                            if (otps.constructor !== Array && ApduData.Serial_no[index] == sequence)
                            {
                                document.querySelector("#otp").innerHTML = 'TOTP: '+ otps + "<br>";
                                countDownActive = true;
                                countDownClock(29, sequence);
                            }
                        });
                    }
                    else
                    {
                        c.manageMessages("#f_mess", "d", "Unable to verify fingerprint");
                        c.manageFinger("#imgfinger", "broken");
                        document.querySelector("#otp").innerHTML = "TOTP not generated";
                        throw 'Unable to verify fingerprint';
                    }
                }
            });
        } catch(ex) {
            console.log(ex);
            c.manageMessages("#b_mess", "d", "An error occurred during OTP generation. Please check your card and try again");
        } finally {
            c.manageFinger("#imgfinger", "none");
        }
    }

    const countDownClock = (number, sequence) => {
        if (countDownActive == false) return;
        let countdown;
        timer(number);
        function timer(seconds) {
            const now = Date.now();
            const then = now + seconds * 1000;
            countdown = setInterval(() => {
                const secondsLeft = Math.round((then - Date.now()) / 1000);
                if(secondsLeft <= 0) {
                    clearTimer(countdown);
                    return true;
                };
                displayTimeLeft(secondsLeft);
            },1000);
        }
        function displayTimeLeft(seconds) {
            document.querySelector('.seconds').textContent = seconds % 60 < 10 ? `0${seconds % 60}` : seconds % 60;
        }
        function clearTimer(countdown) {
            clearInterval(countdown);
            document.querySelector(".seconds").textContent = '';
            document.querySelector("#otp").innerHTML = '';
            recursiveTotpCall(sequence);
        }
    }
}

