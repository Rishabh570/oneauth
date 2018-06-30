const models = require("../db/models").models;
const generator = require("../../utils/generator");
const urlutils = require("../../utils/urlutils");

// Creates client
function createClient(options) {
    return new Promise ((resolve, reject) => {
        models.Client.create(options)
        .then((client) => {
            resolve(client);
        })
        .catch((err) => {
            resolve(err);
        });
    });
}

// Updates the client
function updateClient(options, clientId) {
    return new Promise ((resolve, reject) => {
        models.Client.update(options, {
            where: {id: clientId}
        })
        .then((client) => {
            resolve(client);
        })
        .catch((error) => {
            reject();
        })
    });
}

// Finds the client by client ID
function findClient(clientId) {
    return new Promise ((resolve, reject) => {
        models.Client.findOne({
            where: {id: clientId}
        })
        .then((client) => {
            resolve(client);
        })
        .catch((err) => {
            reject(err);
        })
    });
}

// Finds all clients
function findAllClients() {
    return new Promise ((resolve, reject) => {
        models.Client.findAll({
        })
        .then((clients) => {
            resolve(clients);
        })
        .catch((err) => {
            reject(err);
        })
    });
}

// Finds all client by a particular User
function findAllClientbyUser(userId) {
    return new Promise ((resolve, reject) => {
        models.Client.findAll({
            where: {userId: userId}
        })
        .then((clients) => {
            resolve(clients);
        })
        .catch((err) => {
            reject(err);
        })
    });
}

// Adds client given req.body and user ID
function addClient(body, userId) {
    let clientName = body.clientname;
    let clientDomains = body.domain.replace(/ /g, "").split(";");
    let clientCallbacks = body.callback.replace(/ /g, "").split(";");
    let defaultURL = body.defaulturl.replace(/ /g, "");
    defaultURL = urlutils.prefixHttp(defaultURL);

    //Make sure all urls have http in them
    clientDomains.forEach(function (url, i, arr) {
        arr[i] = urlutils.prefixHttp(url);
    });
    clientCallbacks.forEach(function (url, i, arr) {
        arr[i] = urlutils.prefixHttp(url);
    });

    return new Promise ((resolve, reject) => {
        createClient({
            id: generator.genNdigitNum(10),
            secret: generator.genNcharAlphaNum(64),
            name: clientName,
            domain: clientDomains,
            defaultURL: defaultURL,
            callbackURL: clientCallbacks,
            userId: userId
        })
        .then((client) => {
            resolve(client.id);
        })
        .catch((err) => {
            reject(err)
        });
    })
}

// Edits the client given the req.body, client ID and role
function editClient(body, id, role) {
    let clientId = parseInt(id);
    let clientName = body.clientname;
    let clientDomains = body.domain.replace(/ /g, "").split(";");
    let defaultURL = body.defaulturl.replace(/ /g, "");
    let clientCallbacks = body.callback.replace(/ /g, "").split(";");
    let trustedClient = false;
    if(role === "admin"){
        trustedClient = body.trustedClient;
    }
    defaultURL = urlutils.prefixHttp(defaultURL);
    //Make sure all urls have http in them
    clientDomains.forEach((url, i, arr) => {
        arr[i] = urlutils.prefixHttp(url);
    });
    clientCallbacks.forEach((url, i, arr) => {
        arr[i] = urlutils.prefixHttp(url);
    });

    return new Promise ((resolve, reject) => {
        updateClient({
            name: clientName,
            domain: clientDomains,
            defaultURL: defaultURL,
            callbackURL: clientCallbacks,
            trusted: trustedClient
        }, id)
        .then((client) => {
            resolve(client.id);
        }).catch((error) => {
            reject(error);
        });
    })
}



module.exports = {
    createClient, updateClient, findClient, findAllClients, 
    findAllClientbyUser, addClient, editClient
};