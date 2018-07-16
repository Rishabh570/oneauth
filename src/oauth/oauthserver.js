/**
 * Created by championswimmer on 10/03/17.
 */
const oauth = require("oauth2orize");
const cel = require("connect-ensure-login");
const debug = require("debug")("oauth:oauthserver");
const passport = require("../passport/passporthandler");
const {
    getClientById,
    searchAuthToken,
    searchGrantCode,
    generateGrantCode,
    generateAuthToken,
    findOrCreateAuthToken
} = require("../controllers/auth");


const server = oauth.createServer()

server.serializeClient((client, done) => {
    return done(null, client.id)
})

server.deserializeClient(async (clientId, done) => {
    try {
        const client = await getClientById(clientId);
        return done(null, client);
    } catch (error) {
        debug(error);
    }
})

/**
 * Generates a  _grant code_
 * that has to be exchanged for an access token later
 */
server.grant(oauth.grant.code(
    async function (client, redirectURL, user, ares, done) {
        debug("oauth: getting grant code for " + client.id + " and " + user.id);
        try {
            const grantCode = await generateGrantCode(client.id, user.id);
            return done(null, grantCode);
        } catch (error) {
            return done(error);
        }
    }
))
/**
 * Generate refresh token
 */
server.grant(oauth.grant.token(
    async function (client, user, ares, done) {
        try {
            const authToken = await generateAuthToken(client.id, user.id);
            return done(null, authToken.token);
        } catch (error) {
            return done(error);
        }
    }
))

/**
 * Exchange **grant code** to get access token
 */
server.exchange(oauth.exchange.code(
    async function (client, code, redirectURI, done) {
        try {
            debug("oneauth: exchange");
            const grantCode = await searchGrantCode(client, code, redirectURI);
            const authToken = await findOrCreateAuthToken(grantCode);
            return done(null, authToken);
        } catch (error) {
            return done(error);
        }
    }
))

//TODO: Implement all the other types of tokens and grants !

const authorizationMiddleware = [
    cel.ensureLoggedIn("/login"),
    server.authorization(async function (clientId, callbackURL, done) {
        debug("oauth: authorize");
        try {
            const client = await getClientById(clientId);
            if (!client) {
                return done(null, false);
            }
            debug(callbackURL);
            for (let url of client.callbackURL) {
                if (callbackURL.startsWith(url)) {
                    return done(null, client, callbackURL);
                }
            }
            return done(null, false);
        } catch (error) {
            debug(error);
        }
    }, async function (client, user, done) {
        // Auto approve if this is trusted client
        if (client.trusted) {
            return done(null, true);
        }
        try {
            const authToken = await searchAuthToken(client.id, user.id);
            return done(null, authToken);
        } catch (error) {
            return done(error);
        }

    }),
    function (req, res) {
        res.render("authdialog", {
            transactionID: req.oauth2.transactionID,
            user: req.user,
            client: req.oauth2.client
        })
    }
]

// Exchange the client id and password/secret for an access token. The callback accepts the
// `client`, which is exchanging the client"s id and password/secret from the
// authorization request for verification. If these values are validated, the
// application issues an access token on behalf of the client who authorized the code.

server.exchange(oauth.exchange.clientCredentials(async (client, scope, done) => {
    // Validate the client
    try {
        const localClient = await getClientById(client.get().id);
        if (!localClient) {
            return done(null, false);
        }
        if (localClient.get().secret !== client.get().secret) {
            // Password (secret) of client is wrong
            return done(null, false);
        }

        if (!localClient.get().trusted) {
            // Client is not trusted
            return done(null, false);
        }

        // Everything validated, return the token
        const authToken = await generateAuthToken(client.get().id);
        return done(null, authToken.get().token);
    } catch (error) {
        done(error);
    }
}));

const decisionMiddleware = [
    cel.ensureLoggedIn("/login"),
    server.decision()
]

const tokenMiddleware = [
    passport.authenticate(["basic", "oauth2-client-password"], {session: false}),
    server.token(),
    server.errorHandler()
]
module.exports = {
    Middlewares: {tokenMiddleware, decisionMiddleware, authorizationMiddleware}
}
