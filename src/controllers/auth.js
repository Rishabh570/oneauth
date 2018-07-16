const models = require("../db/models").models;
const generator = require("../utils/generator");
const config = require("../../config");


// Finds the Client by clientId
function getClientById(clientId) {
    return new Promise ((resolve, reject) => {
        models.Client.findOne({
            where: { id: clientId } 
        })
        .then((client) => {
            resolve(client);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Creates the Grant code given the ClientId and UserId
function generateGrantCode(clientId, userId) {
    return new Promise ((resolve, reject) => {
        models.GrantCode.create({
            code: generator.genNcharAlphaNum(config.GRANT_TOKEN_SIZE),
            clientId: clientId,
            userId: userId
        })
        .then((grantCode) => {
            resolve(grantCode.code);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Finds Grant Code
function searchGrantCode(client, code, redirectURI) {
    return new Promise((resolve, reject) => {
        models.GrantCode.findOne({
            where: {code: code},
            include: [models.Client]
        })
        .then((grantCode) => {
            if (!grantCode) {
                resolve(false);  // Grant code doesn not exist
            }
            if (client.id !== grantCode.client.id) {
                resolve(false);  // Client ID does not match
            }
            let callbackMatch = false;
            for (let url of client.callbackURL) {
                if (redirectURI.startsWith(url)) {
                    callbackMatch = true;
                }
            }
            if (!callbackMatch) {
                resolve(false); // Wrong redirect URI
            }
            resolve(grantCode);
        })
        .catch((err) => reject(err));
    });
}

// Finds or Creates Auth Token
function findOrCreateAuthToken(grantCode) {
    return new Promise((resolve, reject) => {
        models.AuthToken.findCreateFind({
        where: {
            clientId: grantCode.clientId,
            userId: grantCode.userId,
            explicit: true
        },
        defaults: {
            token: generator.genNcharAlphaNum(config.AUTH_TOKEN_SIZE),
            userId: grantCode.userId,
            clientId: grantCode.clientId,
            explicit: true,
            scope: ["*"]
        }
        })
        .spread((authToken, created) => {
            grantCode.destroy();  // We get the authToken so destroy the grant code
            resolve(authToken.token);
        })
        .catch((err) => {
            reject(err);
        });
    });
}


// Generates Auth Token
function generateAuthToken(clientId, userId=null) {
    return new Promise ((resolve, reject) => {
        models.AuthToken.create({
            token: generator.genNcharAlphaNum(config.AUTH_TOKEN_SIZE),
            userId: userId,
            clientId: clientId,
            scope: ["*"],
            explicit: false
        })
        .then((authToken) => {
            resolve(authToken);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Finds the Auth Token
function searchAuthToken(clientId, userId) {
    return new Promise((resolve, reject) => {
        models.AuthToken.findOne({
        where: {
            clientId: clientId,
            userId: userId
        }})
        .then((authToken) => {
            if (!authToken) {
                resolve(false);   // Auth token doesn't exist
            } else {
                resolve(true);
            }
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Finds all Auth tokens
function searchAllAuthTokens(userId) {
    return new Promise((resolve, reject) => {
        models.AuthToken.findAll({
        where: {
            userId: userId,
            include: [models.Client]
        }})
        .then((result) => {
            resolve(result);
        })
        .catch((err) => {
            reject(err);
        });
    });
}



// EXPORTS
module.exports = {
    getClientById,
    searchGrantCode,
    searchAuthToken,
    generateAuthToken,
    generateGrantCode,
    searchAllAuthTokens,
    findOrCreateAuthToken,
};
