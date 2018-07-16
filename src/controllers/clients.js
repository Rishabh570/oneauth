const models = require("../db/models").models;

// Creates client
function createClient(options) {
    return new Promise ((resolve, reject) => {
        models.Client.create(options)
        .then((client) => {
            resolve(client);
        })
        .catch((err) => {
            reject(err);
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
        .catch((err) => {
            reject(err);
        })
    });
}

// Finds the client by client ID
function findClientByClientId(clientId) {
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
function findAllClientsbyUserId(userId) {
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


// EXPORTS
module.exports = {
    createClient, 
    updateClient,
    findAllClients,
    findClientByClientId,  
    findAllClientsbyUserId
};