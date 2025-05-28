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
            fetchPartialPage('/login'+c._cardType, '#card_div');
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
            ListSequences_F();
            document.querySelector('#getOtp').addEventListener('click', async function(event){
                let sequence = document.querySelector("#sequences").value.split(": ")[1];
                if (!sequence)
                    c.manageMessages("#b_mess", "d", "Select a sequence to get OTP");
                else
                    GetHotp_F(sequence);
            });
            break;
        case 'D':
            ListSequences_D();
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
            break;
        default:
            c.manageMessages("#b_mess", "d", "Card type doesn't support cloud functonality");
            break;
    }

    document.querySelector('#otp').addEventListener('click', function(event){
        navigator.clipboard.writeText(document.querySelector("#otp").innerHTML.split(": ")[1]);
    });

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
                    else if (ApduData.Sequence.length == 1)
                    {
                    	document.querySelector("#sequences").add(new Option("HOTP: " + sequence[0]));
                        document.querySelector("#sequences").setAttribute("disabled", "true");
                        document.querySelector("#sequences").selectedIndex = 0;
                        document.querySelector("#getOtp").click();
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
function ListSequences_D()
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
                    else if (ApduData.Account.length == 1)
                    {
                        document.querySelector("#sequences").add(new Option(ApduData.OTP_type[0] + ": " + ApduData.Account[0]));
                        document.querySelector("#sequences").setAttribute("disabled", "true");
                        document.querySelector("#sequences").selectedIndex = 0;
                        document.querySelector("#getOtp").click();
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
        });
    } catch(ex) {
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
                        sendData(ApduData.Otp, sequence, document.querySelector("#user_email").value);
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
            new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[ReadHotpToken {serial_no="+sequence+"}]"))).then((execResult) => {
                if(c.countApduResponse(execResult) == 1 && c.checkApduResponse(execResult[0]) == true)
                {
                    var ApduData = c.parseApduResponse(execResult[0]);
                    document.querySelector("#otp").innerHTML = 'HOTP: ' + ApduData.Otp;
                    c.manageFinger("#imgfinger", "verify");
                    sendData(ApduData.Otp, sequence, document.querySelector("#user_email").value);
                }
                else
                {
                    document.querySelector("#otp").innerHTML = "HOTP not generated";
                    c.manageFinger("#imgfinger", "broken");
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
            new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[ReadTotpToken {timestamp=}]"))).then((execResult) => {
                if(c.countApduResponse(execResult) == 1 && c.checkApduResponse(execResult[0]) == true)
                {
                    var ApduData = c.parseApduResponse(execResult[2]);
                    c.manageFinger("#imgfinger", "verify");
                    ApduData.Otp.forEach((otps, index) => {
                        if (otps.constructor !== Array && ApduData.Serial_no[index] == sequence)
                            sendData(otps, sequence, document.querySelector("#user_email").value);
                    });
                }
                else
                {
                    c.manageFinger("#imgfinger", "broken");
                    document.querySelector("#otp").innerHTML = "TOTP not generated";
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
 * Sends OTP, sequence, and email data to the server for login.
 *
 * @param {string} otp - The one-time password.
 * @param {string} sequence - The sequence identifier.
 * @param {string} email - The user's email address.
 * @returns {Promise<void>} - A promise that resolves when the data is sent.
 */
async function sendData(otp, sequence, email) {

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = "/wbc/login";
    const _token = document.querySelector('meta[name="csrf-token"]').content;
    const params = { otp, sequence, email, _token };
    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = params[key];
            form.appendChild(hiddenField);
        }
    }
    document.body.appendChild(form);
    form.submit();
}
