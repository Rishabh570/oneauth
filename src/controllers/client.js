
const models = require('../../db/models').models
const generator = require('../../utils/generator')
const urlutils = require('../../utils/urlutils')

function AddClient(body, userId) {
    let clientName = body.clientname
    let clientDomains = body.domain.replace(/ /g, '').split(';')
    let clientCallbacks = body.callback.replace(/ /g, '').split(';')
    let defaultURL = body.defaulturl.replace(/ /g, '')
    defaultURL = urlutils.prefixHttp(defaultURL)

    //Make sure all urls have http in them
    clientDomains.forEach(function (url, i, arr) {
        arr[i] = urlutils.prefixHttp(url)
    })
    clientCallbacks.forEach(function (url, i, arr) {
        arr[i] = urlutils.prefixHttp(url)
    })

    return new Promise ((resolve, reject) => {
        models.Client.create({
            id: generator.genNdigitNum(10),
            secret: generator.genNcharAlphaNum(64),
            name: clientName,
            domain: clientDomains,
            defaultURL: defaultURL,
            callbackURL: clientCallbacks,
            userId: userId
        }).then((client) => {
            resolve(client.id)
        }).catch(err => reject(err))
    })
}


function EditClient(body, id, role) {
    let clientId = parseInt(id)
    let clientName = body.clientname
    let clientDomains = body.domain.replace(/ /g, '').split(';')
    let defaultURL = body.defaulturl.replace(/ /g, '')
    let clientCallbacks = body.callback.replace(/ /g, '').split(';')
    let trustedClient = false
    if(role === 'admin'){
        trustedClient = body.trustedClient
    }
    defaultURL = urlutils.prefixHttp(defaultURL)
    //Make sure all urls have http in them
    clientDomains.forEach(function (url, i, arr) {
        arr[i] = urlutils.prefixHttp(url)
    })
    clientCallbacks.forEach(function (url, i, arr) {
        arr[i] = urlutils.prefixHttp(url)
    })

    return new Promise ((resolve, reject) => {
        models.Client.update({
            name: clientName,
            domain: clientDomains,
            defaultURL: defaultURL,
            callbackURL: clientCallbacks,
            trusted: trustedClient
        }, {
            where: {id: clientId}
        }).then((client) => {
            resolve(clientId)
        }).catch((error) => {
            reject(error)
        })
    })
}



module.exports = {
    AddClient, EditClient
}