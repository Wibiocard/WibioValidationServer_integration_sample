'use strict';

export const d = document;
export var _reader;
export var _cardId;
export var _cardType;
export var _supportedCards;
export var _userData;
const baseUrl = 'https://smartmanager.wibiocard.com/api'
const channel = 'NFC'
let target = document.getElementById('spinner-wrapper');
let apiKey

export async function init()
{
    apiKey = await navigator.wibioWebcard.apiKey();
    if(!apiKey)
        throw 'ApiKey not found. Please check your web extension configuration';
    _supportedCards = await getSupportedCards();
    if(!_supportedCards)
        throw 'Unable to retrieve supported cards. Please check your internet connection and try again';
    return true;
}


/**
 * Prepare informations to execute a series of commands on a given reader.
 *
 * @param {Object} reader - The reader object on which commands will be executed.
 * @param {string} commandstr - A string containing commands to be executed, formatted as [commandName {param1=value1} {param2=value2}].
 * @returns {Promise<Array>} - A promise that resolves to an array of execution results.
 * @throws {Error} - Throws an error if the reader is not found.
 */
export async function CmdsExecutor(reader, commandstr){
    if(!reader)
        throw 'Reader not found';
    let execResult = [];
    let commands = [];
    const commandsFromServer = await Promise
        .allSettled([...commandstr.matchAll(/\[(.*?)\]/gm)]
        .filter(matches => !!matches[1])
        .map(matches => {
            const commandName = matches[1]
            return new Promise((resolve, reject) => {
                const [splittedCommand, ...rest] = commandName.split(' ');
                const params = (rest.length == 0) ? null: rest.join(' ').matchAll(/\{(.*?)\}/gm).filter(matches => !!matches[1]).reduce((aggr, curr) => {
                    let keyVal = curr[1].split('=');
                    if(keyVal.length == 2)
                        aggr[keyVal[0]] = keyVal[1];
                    return aggr;
                }, {});
                getCommand(_cardId, splittedCommand)
                    .then(c => resolve({
                    ...c,
                    name: commandName,
                    params: params
                })).catch(err => reject(err))
            });
        }))
    commandsFromServer
        .filter(r => r.status == 'fulfilled')
        .map(r => ({
            name: r.value.name,
            command: r.value.Response,
            params: r.value.params,
            form: r.value.NeedGeneration == 1 ? r.value.Form : null,
            showFingerModal: r.value.requireFingerPrint == 1 ? true : false,
            showFingerModalBefore: r.value.requireFingerPrintBefore == 1 ? true : false
        }))
        .forEach(r => {
            if(!commands.find(c => c.name == r.name))
                commands.push(r)
        })
    try {
        execResult = execResult.concat(await execOnReader(reader, commands))
        if(execResult && Array.isArray(execResult)){
            return execResult;
        }
    } finally {
        hideSpinner();
    }
}

/**
 * Executes a series of commands on a card reader.
 *
 * @param {Object} reader - The card reader object.
 * @param {Array|Object} commands - The commands to execute. Can be a single command object or an array of command objects.
 * @returns {Promise<Array>} - A promise that resolves to an array of results for each command executed.
 *
 * @throws Will throw an error if the card is not found on the reader or if an error occurs during command execution.
 */
async function execOnReader(reader, commands) {
    try{
        cardPulse();
        if (!reader)
            throw 'Card not found on reader';
        await reader.connect(true);
        const results = []
        if(!Array.isArray(commands))
            commands = [commands]
        let cmdPos = 0;
        while (cmdPos < commands.length) {
            let c = commands[cmdPos];

            if (_cardId && c.form) {
                const prevResult = results[results.length - 1]?.result?.cmdRes ?? {};
                const formData = await generateForm(c.form, prevResult, c.params);
                const generateBody = await navigator.wibioWebcard.encrypt(JSON.stringify(formData || {}));
                const commandGenerated = await generateCommand(_cardId, c.name.split(' ')[0], generateBody);

                if (Array.isArray(commandGenerated)) {
                    let newPos = cmdPos;
                    commandGenerated.forEach(cmd => {
                        var newCmd = { ...c };
                        newCmd.command = cmd.Response;
                        newCmd.name = c.name;
                        newCmd.params = null;
                        newCmd.form = null;
                        commands.splice(newPos++, 0, newCmd);
                    });
                    commands.splice(newPos, 1);
                    continue; // Skip incrementing cmdPos to process new commands
                } else {
                    c.command = commandGenerated.Response;
                    c.params = null;
                }
            }

            if(c.showFingerModalBefore) {
                document.querySelector('#fingerModal').style.display = 'block';
                wait(2000);
            }
            let startTime = new Date();
            var strName = c.name;
            try {
                if(c.showFingerModal) {
                    document.querySelector('#fingerModal').style.display = 'block';
                    wait(100);
                }
                const commandResult = await reader.transceive(c.command, c.params);
                results.push({
                    result: commandResult,
                    status: 'ok',
                    name: c.name.split(' ')[0]
                })
            } catch(ex){
                console.log('error during apdu execution of ' + strName );
                results.push({
                    status: 'incomplete',
                    name: c.name
                })
            }
            finally
            {
                if(c.showFingerModalBefore || c.showFingerModal)
                    document.querySelector('#fingerModal').style.display = 'none';
            }
            results[results.length - 1].elapsed = new Date() - startTime;
            cmdPos++;
        }
        return results
    } catch(ex) {
        console.log(ex);
        manageMessages("#b_mess", "d", "An error occurred during command execution. Please check your card and try again");
    } finally {
        await reader.disconnect();
        cardUnpulse();
    }
}

export function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
}

export function reverseString(str) {
    return (str === '') ? '' : reverseString(str.substr(1)) + str.charAt(0);
}

/**
 * Recognizes a card using the provided reader.
 * If more than 1 card has the same ATR, the GetVersion command is used to identify the card.
 *
 * @param {Object} reader - The card reader object.
 * @param {string} reader.atr - The Answer To Reset (ATR) string of the card.
 * @returns {Promise<boolean>} - Returns true if the card is recognized successfully.
 * @throws Will throw an error if the card ID is not found or if the necessary command is not available.
 */
export async function recognizeCard(reader)
{
    try{
        const check = await checkCardByAtr(reader.atr);
        if(!check || !check.Id)
            throw 'Card id not found';
        if(Array.isArray(check.Id) && check.Id.length > 1) {
            if(!check.GetVersion)
                throw 'Needed command GetVersion not found'
            const idIdx = await execOnReader(reader, {
                name: 'GetVersion',
                command: check.GetVersion
            })
            if (!idIdx)
                throw 'Card not recognized'
            _cardId = check.Id[idIdx[0].result.cmdIdx]
            _cardType = check.Type[idIdx[0].result.cmdIdx];
        } else {
            _cardId = check.Id
            _cardType = check.Type;
        }
        _reader = reader;
    } catch(ex){
        console.log(ex);
        manageMessages("#b_mess", "d", "An error occurred during card recognition. Please check your card and try again");
    }
    return true;
}

/**
 * Counts the number of elements in an APDU response array.
 *
 * @param {Array} response - The APDU response to count elements from.
 * @returns {number} The number of elements in the response array, or 0 if the response is not an array.
 */
export function countApduResponse(response)
{
    if(response && Array.isArray(response))
        return response.length;
    return 0;
}

/**
 * Checks the APDU response from a card.
 *
 * @param {Object} response - The response object to check.
 * @returns {boolean} - Returns true if the response is valid and meets the criteria, otherwise false.
 */
export function checkApduResponse(response)
{
    if(!response)
        return false;
    if (response.status == "ok")
    {
        if (response.result.hasOwnProperty('cmdRes'))
            return true;
        if (response.result.hasOwnProperty('cmdRaw'))
        {
            if (response.result.cmdRaw == "9000")
                return true;
            console.log(response.name + " return " + response.result.cmdRaw + " instead of 9000 in " + response.elapsed + " ms");
            return false;
        }
    }
    return false;
}

/**
 * Parses the APDU response and returns the command result if available.
 *
 * @param {Object} response - The response object to parse.
 * @returns {Object|null} The command result if available, otherwise null.
 */
export function parseApduResponse(response)
{
    if (response.status == "ok")
    {
        if (response.result.hasOwnProperty('cmdRes') && !response.result.cmdRes.hasOwnProperty(""))
            return response.result.cmdRes ?? null;
    }
    return null;
}

//**************************API**************************//

/**
 * Verifies a token by email.
 *
 * This function sends a GET request to verify a token associated with an email address.
 * The email is retrieved from an input element with the ID "user_email".
 *
 * @param {string} token - The token to be verified.
 * @returns {Promise<string>} The response text from the verification request.
 * @throws Will log an error message and manage messages if the request fails.
 */
export async function verifyTokenByEmail(token) {
    try {
        let email =  document.querySelector("#user_email").value;
        const response = await fetch(`${baseUrl}/verifyTokenByEmail/${token}/${email}`, {
            method: 'GET',
            headers: {
            'X-Authorization': apiKey
            }
        })
        return await response.text()
    } catch(ex) {
        console.log(ex);
        manageMessages("#b_mess", "d", "Error during verification request. Check your internet connection and try again");
    }
}

/**
 * Sends a rollback request for a given token to the server.
 *
 * @param {string} token - The token to be rolled back.
 * @returns {Promise<string>} - The response text from the server.
 * @throws Will log an error message and display a user message if the request fails.
 */
export async function rollbackToken(token) {
    try {
        const response = await fetch(`${baseUrl}/rollbackTokens/${token}`, {
            method: 'GET',
            headers: {
            'X-Authorization': apiKey
            }
        })
        const data = await response.json();
        if (data.Status == 'error') window.location.href = '/error/Rollback token generation/' + data.Message;
        return true
    } catch(ex) {
        console.log(ex);
        manageMessages("#b_mess", "d", "Error during rollback request. Check your internet connection and try again");
    }
}

/**
 * Generates a form using the provided structure and parameters, and handles form submission.
 *
 * @param {Object|Array} formStruct - The structure of the form to be generated. Can be a JSON string or an array of form components.
 * @param {Object} prevResult - The previous result data used to populate the form fields.
 * @param {Object} params - Additional parameters to be used in the form.
 * @returns {Promise<Object>} A promise that resolves with the form submission data combined with other data.
 */
async function generateForm(formStruct, prevResult, params) {
    const formWrapper = document.getElementById('formio-wrapper');
    formWrapper.style.display = 'block';
    const formContent = document.getElementById('formio-content');

    if(typeof formStruct == 'string')
      formStruct = JSON.parse(formStruct);

    if(!Array.isArray(formStruct) || !formStruct.length) {
      formWrapper.style.display = 'none';
      return;
    }

    const otherData = {};
    let countStruct = 0;

    for(const f of formStruct) {
        if(!f.data && f.key != 'submit' && Object.keys(params).indexOf(f.key) == -1) {
            f.data = { values: Object.values(prevResult)[0]?.map(pr => ({ label: pr, value: pr })) };
            f.defaultValue = (f.data.values != undefined) ? f.data.values[0]?.value || '' : '';
            countStruct++;
        }
        else if(Object.keys(params).indexOf(f.key) !== -1)
            otherData[f.key] = (f.key == 'timestamp') ? Math.round(new Date().getTime() / 1000 / 30) : params[f.key];
    }

    if(countStruct == 0) {
      formWrapper.style.display = 'none';
      return otherData;
    }

    const form = await Formio.createForm(formContent, {
      components: formStruct.filter(fs => fs.key != 'timestamp')
    });
    return new Promise((res, _) => {
      form.on('submit', function(submission) {
        formWrapper.style.display = 'none';
        res({
          ...otherData,
          ...submission.data
        });
      });
    });
}

/**
 * Fetches the list of supported cards from the server.
 *
 * @param {boolean} [renew=false] - If true, forces a refresh of the supported cards list.
 * @returns {Promise<Array>} A promise that resolves to an array of supported cards.
 * @throws Will log an error message and display a user message if the fetch operation fails.
 */
async function getSupportedCards(renew = false)
{
    if(!renew && _supportedCards && _supportedCards.length){
        return _supportedCards;
    }
    try {
        const response = await fetch(`${baseUrl}/getSupportedCards`, {
            method: 'GET',
            headers: {
                'X-Authorization': apiKey
            }
        });
        const data = await response.json();
        if (data.Status == 'error') window.location.href = '/error/Get supported cards/' + data.Message;
        _supportedCards = [...(data.Cards || [])];
        return _supportedCards;
    } catch(ex){
        console.log(ex);
        manageMessages("#b_mess", "d", "No supported cards found. Please check your internet connection and try again");
    }
}

/**
 * Checks the card by its ATR (Answer To Reset) value.
 *
 * @param {string} Atr - The ATR value of the smartcard to be checked.
 * @returns {Promise<Object>} - A promise that resolves to the response JSON object.
 * @throws Will throw an error if the ATR is not provided or if the fetch request fails.
 */
export async function checkCardByAtr(Atr){
    try {
        if (!Atr)
            throw 'Atr not found';
        const response = await fetch(`${baseUrl}/checkCardByAtr/${channel}/${Atr}`, {
            method: 'GET',
            headers: {
            'X-Authorization': apiKey
            }
        })
        const data = await response.json();
        if (data.Status == 'error') window.location.href = '/error/Check card by ATR/' + data.Message;
        return data
    } catch(ex) {
        console.log(ex);
        manageMessages("#b_mess", "d", "Check card by atr failed. Please check your smartcard and try again");
    }
}

/**
 * Fetches a command for a given card and caches the result.
 *
 * @async
 * @function getCommand
 * @param {string} cardId - The ID of the card.
 * @param {string} commandName - The name of the command to fetch.
 * @returns {Promise<Object>} The command data as a JSON object.
 * @throws Will throw an error if the network response is not ok or if the JSON response cannot be parsed.
 */
async function getCommand(cardId, commandName)
{
    if (commandName.startsWith("Personalize"))
        return getPersonalizationCommand(cardId, commandName, {"token": document.querySelector("#token").value, "realm": document.querySelector("#realm").value});
    try {
        let cache = getCommand.cache || (getCommand.cache = new Map());
        let url = `${baseUrl}/getCommand/${cardId}/${channel}/${commandName}`;

        if (cache.has(url)) {
            return cache.get(url);
        } else {
            const promise = fetch(url, {
                method: 'GET',
                headers: {
                'X-Authorization': apiKey
                }
            }).then(response => {
                const data = response.json();
                if (data.Status == 'error') window.location.href = '/error/Get card command/' + data.Message;
                return data;
            }).catch(error => {
                cache.delete(url); // Remove the failed promise from the cache
                throw error;
            });

            cache.set(url, promise);
            return promise;
        }
    } catch (err) {
        console.log(err);
        throw 'Command not found';
    }
}

/**
 * Generates a command for a specific card.
 *
 * @param {string} cardId - The ID of the card.
 * @param {string} commandName - The name of the command to generate.
 * @param {Object} data - The data to be sent with the command.
 * @returns {Promise<Object>} The response from the server as a JSON object.
 * @throws Will throw an error if the command is not found.
 */
async function generateCommand(cardId, commandName, params) {
    try {
        const response = await fetch(`${baseUrl}/generateCommand/${cardId}/${channel}/${commandName}`, {
        method: 'POST',
        headers: {
            'X-Authorization': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: params || {} })
        })
        const data = await response.json();
        if (data.Status == 'error') window.location.href = '/error/Generate card command/' + data.Message;
        return data
    } catch(err) {
        console.log(err)
    }
    throw 'Command not found'
}

/**
 * Sends a request to generate a personalization command for a card.
 *
 * @param {string} cardId - The ID of the card.
 * @param {string} commandName - The name of the command to generate.
 * @param {Object} request - The request payload to send.
 * @returns {Promise<Object>} The response from the server as a JSON object.
 * @throws Will log an error message and manage messages if the request fails.
 */
async function getPersonalizationCommand(cardId, commandName, request)
{
    try {
        const response = await fetch(`${baseUrl}/generateCommand/${cardId}/${channel}/${commandName}`, {
            method: 'POST',
            headers: {
                'X-Authorization': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request)
        })
        const data = await response.json();
        if (data.Status == 'error') window.location.href = '/error/Generate card command/' + data.Message;
        return data
    } catch(ex) {
        console.log(ex);
        manageMessages("#b_mess", "d", "Unable to retrive card command from webserver. Check your internet connection and try again");
    }
}

/**
 * Fetches user data from the server and returns it.
 *
 * @async
 * @function listUserData
 * @returns {Promise<Array>} A promise that resolves to an array of user data.
 * @throws Will throw an error if the fetch operation fails.
 */
export async function listUserData()
{
    try {
        const response = await fetch(`${baseUrl}/listUserData`, {
            method: 'GET',
            headers: {
                'X-Authorization': apiKey
            },
        });
        const data = await response.json();
        if (data.Status == 'error') window.location.href = '/error/List user data/' + data.Message;
        _userData = [...(data.Uncrypted || [])];
        return _userData;
    } catch(ex) {
        console.log(ex);
        manageMessages("#b_mess", "d", "Unable to retrive user data definition from webserver. Check your internet connection and try again");
    }
}

/** UNUSED
 * Fetches a resource from the network with rate limiting.
 *
 * This function attempts to fetch a resource from the specified URL. If the server responds with a
 * 429 status code (Too Many Requests), it will retry the request after a delay specified by the
 * `Retry-After` header or a default backoff time. The function will retry the request up to a
 * specified number of times, with an exponential backoff.
 *
 * @param {string} url - The URL to fetch.
 * @param {Object} [options={}] - The options to pass to the fetch function.
 * @param {number} [retries=5] - The number of times to retry the request if rate limited.
 * @param {number} [backoff=1000] - The initial backoff time in milliseconds.
 * @returns {Promise<Object>} - A promise that resolves to the response data as JSON.
 * @throws {Error} - Throws an error if the request fails or if the rate limit is exceeded after all retries.
 */
async function fetchWithRateLimit(url, options = {}, retries = 5, backoff = 1000) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : backoff;
        if (retries > 0) {
          console.log(`Rate limit exceeded. Retrying in ${waitTime / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return fetchWithRateLimit(url, options, retries - 1, backoff * 2);
        } else {
          throw new Error('Too many requests. Please try again later.');
        }
      }
      const data = await response.json();
      if (data.Status == 'error') window.location.href = '/error/Generate card command/' + data.Message;
      return data
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
}

//**************************DOM**************************//
export function showSpinner(){
    target.style.display = 'block';
}
export function hideSpinner(){
    target.style.display = 'none';
}

/**
 * Adds a pulse animation to the card image container and displays the working card with a slide show effect.
 *
 * This function performs the following actions:
 * 1. If an element with the ID "card_img_container" exists, it adds the "pulse" class to it.
 * 2. If an element with the ID "workingCard" exists, it sets its display style to "block" and initiates a slide show effect.
 *
 * The slide show effect cycles through elements with the class "slide", making each one active in turn with a 700ms interval.
 */
export function cardPulse(){
    if (document.getElementById("card_img_container") != undefined)
        document.querySelector("#card_img_container").classList.add("pulse");
    if (document.getElementById("workingCard") != undefined)
    {
        document.querySelector("#workingCard").style.display = "block";
        let currentIndex = 0;
        const slides = document.querySelectorAll('.slide');

        function showNextSlide() {
            slides[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % slides.length;
            slides[currentIndex].classList.add('active');
        }
        setInterval(showNextSlide, 700);
    }
}

/**
 * Removes the "pulse" class from the element with the ID "card_img_container"
 * and hides the element with the ID "workingCard" by setting its display style to "none".
 */
export function cardUnpulse(){
    if (document.getElementById("card_img_container") != undefined)
        document.querySelector("#card_img_container").classList.remove("pulse");
    if (document.getElementById("workingCard") != undefined)
        document.querySelector("#workingCard").style.display = "none";
}

/**
 * Updates the inner HTML of the specified destination element with a message and changes the element's styles based on the message type.
 *
 * @param {string} dest - The CSS selector of the destination element where the message will be displayed.
 * @param {string} type - The type of the message, either "s" for success or "d" for danger.
 * @param {string} message - The message to be displayed in the destination element.
 */
export function manageMessages(dest, type, message)
{
    document.querySelector(dest).innerHTML = message;
    if (type == "s")
    {
        document.getElementById("h_mess").classList.replace("bg-danger", "bg-success");
        document.getElementById("f_mess").classList.replace("bg-light-danger", "bg-light-success");
        document.getElementById("body_mess").classList.replace("bg-light-danger", "bg-light-success");
        document.querySelector(dest).classList.replace("text-danger", "text-success");
    }
    else if (type == "d")
    {
        document.getElementById("h_mess").classList.replace("bg-success", "bg-danger");
        document.getElementById("f_mess").classList.replace("bg-success", "bg-danger");
        document.getElementById("body_mess").classList.replace("bg-light-success", "bg-light-danger");
        document.querySelector(dest).classList.replace("text-success", "text-danger");
    }
    document.getElementById('card_mess').scrollIntoView({
        behavior: 'smooth', // Optional: 'smooth' for smooth scrolling, 'auto' for instant scrolling
        block: 'start' // Optional: 'start', 'center', 'end', or 'nearest'
    });
}

/**
 * Updates the fingerprint image and its associated CSS classes based on the given status.
 *
 * @param {string} target - The CSS selector of the target element to update.
 * @param {string} status - The status of the fingerprint, which determines the image and CSS class to apply.
 *                          Possible values are:
 *                          - "request": Sets the image to a partial fingerprint and applies the 'imgfinger_request' class.
 *                          - "broken": Sets the image to a broken fingerprint and applies the 'imgfinger' class.
 *                          - "verify": Sets the image to a complete fingerprint and applies the 'imgfinger' class.
 *                          - Any other value: Applies the 'imgfinger_hidden' class.
 */
export function manageFinger(target, status)
{
    document.querySelector(target).classList.remove('imgfinger_hidden', 'imgfinger_request', 'imgfinger');
    if (status == "request")
    {
        document.querySelector(target).src = '/images/fingerprint_partial.png';
        document.querySelector(target).classList.add('imgfinger_request');
    }
    else if (status == "broken")
    {
        document.querySelector(target).src = '/images/fingerprint_broken.png';
        document.querySelector(target).classList.add('imgfinger');
    }
    else if (status == "verify")
    {
        document.querySelector(target).src = '/images/fingerprint.png';
        document.querySelector(target).classList.add('imgfinger');
    }
    else
    {
        document.querySelector(target).classList.add('imgfinger_hidden');
    }
}

/**
 * Unloads the interface for the given card reader.
 *
 * This function performs the following actions if the provided reader matches the global `_reader`:
 * - Displays various messages indicating the card has been removed.
 * - Clears the content of the card display area.
 * - Resets the global card ID and card type variables.
 * - Disconnects the reader and sets the global `_reader` to null.
 *
 * @param {Object} reader - The card reader to unload.
 */
export function unloadInterface(reader)
{
    if (reader == _reader)
        {
            manageMessages("#h_mess", "d", "Card removed");
            manageMessages("#t_mess", null, "Card removed in " + reader.name);
            manageMessages("#b_mess", null, "");
            manageMessages("#f_mess", "d", "Put your card on the reader to continue working");
            document.querySelector('#card_div').innerHTML = "";
            _cardId = null;
            _cardType = null;
            _reader.disconnect();
            _reader = null;
        }
}
