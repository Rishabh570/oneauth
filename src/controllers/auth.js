const models = require('../db/models').models
    , generator = require('../utils/generator')
    , config = require('../../config');

function getClientById(clientId) {
    return new Promise ((resolve,reject) => {
        models.Client.findOne({ where: {id: clientId} })
        .then((client)  => {
            resolve(client)
        }).catch((err) => {
            reject(err);
        })
    })
}

function generateGrantCode(clientId, userId) {
    return new Promise ((resolve,reject) => {
        models.GrantCode.create({
            code: generator.genNcharAlphaNum(config.GRANT_TOKEN_SIZE),
            clientId: clientId,
            userId: userId
        })
        .then((grantCode) => {
            resolve(grantCode.code)
        }).catch((err) => {
            reject(err)
        })
    })
}
function generateAuthToken(clientId, userId) {
    return new Promise ((resolve,reject) => {
        models.AuthToken.create({
            token: generator.genNcharAlphaNum(config.AUTH_TOKEN_SIZE),
            userId: userId,
            clientId: clientId,
            scope: ['*'],
            explicit: false
        })
        .then(function (authToken) {
            resolve(null, authToken.token)
        })
        .catch(function (err) {
            reject(err)
        })
    })
}

function searchGrantCode(client, code, redirectURI) {
    return new Promise((resolve,reject) => {
        models.GrantCode.findOne({
            where: {code: code},
            include: [models.Client]
        })
        .then(function (grantCode) {
            if (!grantCode) {
                resolve(false) // Grant code doesn not exist
            }
            if (client.id !== grantCode.client.id) {
                resolve(false) // Client ID does not match
            }
            let callbackMatch = false
            for (url of client.callbackURL) {
                if (redirectURI.startsWith(url)) {
                    callbackMatch = true
                }
            }
            if (!callbackMatch) {
                resolve(false) // Wrong redirect URI
            }
            resolve(grantCode);
        }).catch((err) => debug(err))
    })
}

function findCreateAuthToken(grantCode) {
    return new Promise((resolve,reject) => {
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
            scope: ['*']
        }
        }).spread(function (authToken, created) {
            grantCode.destroy()  // We get the authToken so destroy the grant code
            resolve(authToken.token)
        }).catch(function (err) {
            reject(err)
        })
    });
}


function generateAuthToken(clientId){
    return new Promise((resolve,reject) => {
        models.AuthToken.create({
            token: generator.genNcharAlphaNum(config.AUTH_TOKEN_SIZE),
            scope: ['*'],
            explicit: false,
            clientId: clientId,
            userId: null   // UserId is null
        }).then((authtoken) => {
            grantCode.destroy()   // Destroy grand code because we got auth token
            resolve(authToken.get().token)
        }).catch(function (err) {
            reject(err)
        })
    });
}


function searchAuthToken(clientId, userId) {
    return new Promise((resolve,reject)=>{
        models.AuthToken.findOne({
        where: {
            clientId: clientId,
            userId: userId
        }})
        .then(function (authToken) {
            if (!authToken) {
                resolve(false)   // Auth token doesn't exist
            } else {
                resolve(true)
            }
        }).catch(function (err) {
            reject(err)
        })
    })
}
module.exports = {
    getClientById, generateGrantCode,generateAuthToken, searchGrantCode, searchAuthToken, findCreateAuthToken
}