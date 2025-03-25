import * as c from './webcard_common.js';
//**************************INTERFACE**************************//

document.onreadystatechange = async function () {
    if (document.readyState == "complete") {
        await c.init().catch(error => c.manageMessages("#f_mess", "d", error));
        listReaders();
    }
}

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

/**
 * Asynchronously lists smart card readers and updates the UI with their status.
 *
 * This function shows a spinner while it attempts to retrieve the list of smart card readers
 * using the `navigator.wibioWebcard.readers()` API. It then updates various message elements
 * on the page to indicate the status of the readers. Each reader is displayed in a list with
 * an appropriate status message and icon based on whether a card is detected, not supported,
 * or if the slot is empty.
 *
 * @async
 * @function listReaders
 * @returns {Promise<void>} A promise that resolves when the reader listing process is complete.
 * @throws Will log an error message and update the UI if an error occurs during reader recognition.
 */
async function listReaders() {
    c.showSpinner();
    try {
        c.manageMessages("#h_mess", "s", "WibioWebcard Extension loaded");
        let readers = await navigator.wibioWebcard.readers();
        c.manageMessages("#t_mess", "s", readers.length + " readers detected");
        c.manageMessages("#f_mess", "s","Put your card on the smartcard reader to start working!");
        c.manageMessages("#b_mess", null, "");
        var ul = document.createElement('ul');
        ul.classList.add('list-group');
        readers.forEach((reader) => {
            const li = document.createElement('li');
            if (reader.atr !== "" && c._supportedCards.find(c => reader.atr.startsWith(c.Atr.replaceAll('-', ''))))
            {
                li.classList.add('list-group-item', 'list-group-item-success');
                li.innerHTML = '<i class="bi bi-credit-card text-success"></i> <span>' + reader.name + '</span><span class="float-end text-sm">Card detected</span>';
                loadInterface(reader);
            }
            else if (reader.atr !== "")
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
    } catch(ex){
        console.log(ex);
        c.manageMessages("#f_mess", "d", "An error occurred during reader recognition. Please check your card reader and try again");
    }
    finally {
        c.hideSpinner();
    }
}

/**
 * Asynchronously loads the interface for the given card reader.
 * Displays various messages and a spinner during the process.
 * Recognizes the card type and executes a partial script based on the card type.
 *
 * @param {Object} reader - The card reader object.
 * @param {string} reader.name - The name of the card reader.
 *
 * @returns {Promise<void>} A promise that resolves when the interface is loaded.
 */
async function loadInterface(reader)
{
    c.showSpinner();
    c.manageMessages("#h_mess", "s", "Card detected");
    c.manageMessages("#t_mess", null, "Card inserted in " + reader.name);
    c.manageMessages("#b_mess", null, "ATR detected");
    c.manageMessages("#f_mess", "s", "Wait while recognize card type!");
    try {
        await c.recognizeCard(reader).then(() => {
            if (c._cardType !== undefined)
                executePartialScript(c._cardType);
        });
    } catch (ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", "An error occurred during card recognition. Please check your card and try again");
    } finally {
        c.hideSpinner();
    }
}

/**
 * Executes a partial script based on the provided card type.
 *
 * @param {string} card_type - The type of card to initialize.
 *                             Supported values are:
 *                             'F' - Calls Initialize_F function.
 *                             'C' - No operation.
 *                             'T' - Calls Initialize_T function.
 *                             'D' - Calls Initialize_T function.
 *                             Any other value will trigger a message indicating unsupported card type.
 */
async function executePartialScript(card_type)
{
    switch(card_type)
    {
        case 'F':
            c.manageMessages("#b_mess", "s", "Card personalization available");
            Initialize_F();
            break;
        case 'T':
            c.manageMessages("#b_mess", "s", "Card personalization available");
            Initialize_T();
            break;
        case 'D':
            c.manageMessages("#b_mess", "s", "Card personalization available");
            Initialize_T();
            break;
        default:
            c.manageMessages("#b_mess", "d", "Card type doesn't support cloud personalization");
            break;
    }
}

/**
 * Initializes the card personalization process.
 *
 * This function performs the following steps:
 * 1. Shows a spinner to indicate processing.
 * 2. Retrieves a token from the DOM.
 * 3. Executes a command to select the Wibio applet and checks the response.
 * 4. Retrieves the card UUID and compares it with the token.
 * 5. Executes a command to select the BeCard applet and read sequence info.
 * 6. Manages messages based on the card's state (empty or already in use).
 * 7. Adds an event listener to the "run_perso" button to handle card personalization.
 * 8. Executes the personalization command and manages the response.
 * 9. Updates the UI with the personalization result and submits the form.
 *
 * @throws Will throw an error if any of the steps fail.
 */
function Initialize_F ()
{
    try{
        c.showSpinner();
        let token = (typeof(document.querySelector("#token")) != 'undefined') ? document.querySelector("#token").value : (() => { throw 'Token not found'; })();
        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectWibioApp]"))).then((selectResult) => {
            if(c.countApduResponse(selectResult) == 1)
            {
                if (c.checkApduResponse(selectResult[0]) == false)
                    throw 'Wibio applet not found';
                var WibioVersion = c.parseApduResponse(selectResult[0]);
                var apduName = (WibioVersion.hasOwnProperty('CardType')) ? "[GetCardUuid]" : "[GetCardUuid_V2]";
                new Promise(resolve => resolve(c.CmdsExecutor(c._reader, apduName))).then((execResult) => {
                    if (c.countApduResponse(execResult) == 1 && c.checkApduResponse(execResult[1]) == true)
                    {
                        var ApduData = c.parseApduResponse(execResult[1]);
                        if (ApduData.uuid != token)
                            throw 'Card Id mismatch';
                    }
                });
            }
        });
        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectBeCard][ReadSequenceInfo]"))).then((execResult) => {
            if (c.countApduResponse(execResult) == 2)
            {
                if (c.checkApduResponse(execResult[0]) == false)
                    throw 'Applet not found';
                c.manageMessages("#f_mess", "s", "Card selected");
                if (c.checkApduResponse(execResult[1]) == true && c.parseApduResponse(execResult[1]) != null)
                {
                    c.manageMessages("#f_mess", "d", "Card already in use, to perform this operation you need a factory resetted card");
                    document.querySelector("#run_perso").disabled = true;
                }
                else
                {
                    c.manageMessages("#f_mess", "s", "Card personalization available, this card is empty");
                    document.querySelector("#run_perso").disabled = false;
                    document.querySelector('#run_perso').addEventListener('click', async function(e){
                        e.preventDefault();
                        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectBeCard][PersonalizeF]"))).then((execPersoResult) => {
                            if (c.countApduResponse(execPersoResult) == 2)
                            {
                                if (c.checkApduResponse(execPersoResult[0]) == false)
                                    throw 'Applet not found';
                                if (c.checkApduResponse(execPersoResult[1]) == false)
                                    throw 'Card personalization error';
                                c.manageMessages("#b_mess", "s", "Card data updated successfully<br>");
                            }
                        });
                    });
                }
            }
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", ex);
    } finally {
        c.hideSpinner();
    }
}

/**
 * Initializes the personalization process for the card.
 *
 * This function performs the following steps:
 * 1. Shows a spinner to indicate processing.
 * 2. Retrieves a token from the DOM.
 * 3. Executes a command to select the Wibio applet and get the card UUID.
 * 4. Validates the card UUID against the token.
 * 5. Adds an event listener to the form for personalizing data.
 * 6. Adds an event listener to the button for running personalization.
 * 7. Handles errors and displays appropriate messages.
 * 8. Hides the spinner after processing.
 *
 * @throws Will throw an error if the token is not found, if the Wibio applet is not found,
 *         if the card ID does not match the token, if the identity applet is not found,
 *         if the identity applet is already initialized, if there is no data to personalize,
 *         if there is an error in personalizing identity data, if there is an error in protecting
 *         identity data, if the applet is not found, if the card is already in use, or if there
 *         is an error in card personalization.
 */
function Initialize_T ()
{
    try{
        c.showSpinner();
        let token = (typeof(document.querySelector("#token")) != 'undefined') ? document.querySelector("#token").value : (() => { throw 'Token not found'; })();
        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectWibioApp][GetCardUuid_V2]"))).then((execResult) => {
            if(c.countApduResponse(execResult) == 2)
            {
                if (c.checkApduResponse(execResult[0]) == false)
                    throw 'Wibio applet not found';
                if (c.countApduResponse(execResult) == 1 && c.checkApduResponse(execResult[1]) == true)
                {
                    var ApduData = c.parseApduResponse(execResult[1]);
                    if (ApduData.uuid != token)
                        throw 'Card Id mismatch';
                }
            }
        });
        document.querySelector('#run_perso').addEventListener('click', async function(e){
            e.preventDefault();
            new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[SelectBeCard][LoginBeCard][ReadSequenceInfo]"))).then((execResult) => {
                if (c.countApduResponse(execResult) == 3)
                {
                    if (c.checkApduResponse(execResult[0]) == false || c.checkApduResponse(execResult[1]) == false)
                        throw 'Applet not found';
                    c.manageMessages("#f_mess", "s", "Card selected");
                    if (c.checkApduResponse(execResult[2]) == true && c.parseApduResponse(execResult[2]) != null)
                    {
                        c.manageMessages("#f_mess", "d", "Card already in use, to perform this operation you need a factory resetted card");
                        document.querySelector("#run_perso").disabled = true;
                    }
                    else
                    {
                        c.manageMessages("#f_mess", "s", "Card personalization available, this card is empty");
                        document.querySelector("#run_perso").disabled = false;
                        new Promise(resolve => resolve(c.CmdsExecutor(c._reader, "[PersonalizeD {token="+token+"}]"))).then((execPersoResult) => {
                            if (c.countApduResponse(execPersoResult) == 1 && c.checkApduResponse(execPersoResult[0]) == true)
                              {
                                  alert ("Card personalization completed successfully");
                                  new Promise(resolve => setTimeout(resolve,  4000));
                                  const form = document.querySelector("#form_perso");
                                  form.submit();
                              }
                              else
                                  new Promise(resolve => resolve(c.rollbackToken(token))).then(() => {
                                      throw "Card personalization error";
                                  });
                            }
                        });
                    }
                }
            });
        });
    } catch(ex) {
        console.log(ex);
        c.manageMessages("#b_mess", "d", ex);
    } finally {
        c.hideSpinner();
    }
}


