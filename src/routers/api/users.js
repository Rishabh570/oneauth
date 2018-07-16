/**
 * Created by championswimmer on 10/03/17.
 *
 * This is the /api/v1/users path
 */
const router = require('express').Router()
const cel = require('connect-ensure-login')
const passport = require('../../passport/passporthandler')
const models = require('../../db/models').models
const Raven = require('raven')

const {findUserById, deleteAuthToken} = require('../../controllers/user');
const  {findAllAddress} = require('../../controllers/demographics');

router.get('/me',
    // Frontend clients can use this API via session (using the '.codingblocks.com' cookie)
    passport.authenticate(['bearer', 'session']),
    async function (req, res) {

        if (req.user && !req.authInfo.clientOnly && req.user.id) {
            let includes = []
            if (req.query.include) {
                let includedAccounts = req.query.include.split(',')
                for (ia of includedAccounts) {
                    switch (ia) {
                        case 'facebook':
                            includes.push({ model: models.UserFacebook, attributes: {exclude: ["accessToken","refreshToken"]}})
                            break
                        case 'twitter':
                            includes.push({ model: models.UserTwitter, attributes: {exclude: ["token","tokenSecret"]}})
                            break
                        case 'github':
                            includes.push({ model: models.UserGithub, attributes: {exclude: ["token","tokenSecret"]}})
                            break
                        case 'google':
                            includes.push({model: models.UserGoogle, attributes: {exclude: ["token","tokenSecret"]}})
                            break
                        case 'lms':
                            includes.push({ model: models.UserLms, attributes: {exclude: ["accessToken"]}})
                            break
                    }
                }
            }

            try {
                const user = await findUserById(req.user.id, includes);
                if (!user) {
                    throw new Error("User not found")
                }
                res.send(user);
            } catch (err) {
                res.send('Unknown user or unauthorized request');
            }
        } else {
            return res.status(403).json({error: 'Unauthorized'});
        }

    })

router.get('/me/address',
    // Frontend clients can use this API via session (using the '.codingblocks.com' cookie)
    passport.authenticate(['bearer', 'session']),
    async function (req, res) {
        if (req.user && req.user.id) {
            let includes = [{model: models.Demographic,
            include: [models.Address]
            }]
            if (req.query.include) {
                let includedAccounts = req.query.include.split(',')
                for (ia of includedAccounts) {
                    switch (ia) {
                        case 'facebook':
                            includes.push({ model: models.UserFacebook, attributes: {exclude: ["accessToken","refreshToken"]}})
                            break
                        case 'twitter':
                            includes.push({ model: models.UserTwitter, attributes: {exclude: ["token","tokenSecret"]}})
                            break
                        case 'github':
                            includes.push({ model: models.UserGithub, attributes: {exclude: ["token","tokenSecret"]}})
                            break
                        case 'google':
                            includes.push({model: models.UserGoogle, attributes: {exclude: ["token","tokenSecret"]}})
                            break
                        case 'lms':
                            includes.push({ model: models.UserLms, attributes: {exclude: ["accessToken"]}})
                            break
                    }
                }
            }

            try {
                const user = await findUserById(req.user.id, includes);
                if (!user) {
                    throw new Error("User not found");
                }
                res.send(user);
            } catch (err) {
                res.send('Unknown user or unauthorized request');
            }
        } else {
            return res.sendStatus(403)
        }

    })


router.get('/me/logout',
    passport.authenticate('bearer', {session: false}),
    async function (req, res) {
        if (req.user && req.user.id) {
            let token = req.header('Authorization').split(' ')[1];
            try {
                const response  = await deleteAuthToken(token);
                res.status(202).send({
                    'user_id': req.user.id,
                    'logout': response
                })
            } catch (err) {
                res.status(501).send(error);   
            }
        } else {
            res.status(403).send("Unauthorized")
        }
    }
)

router.get('/:id',
    passport.authenticate('bearer', {session: false}),
    async function (req, res) {
        // Send the user his own object if the token is user scoped
        if (req.user && !req.authInfo.clientOnly && req.user.id) {
            if (req.params.id == req.user.id) {
                return res.send(req.user)
            }
        }
        let trustedClient = req.client && req.client.trusted;
        try {
            let attributes = trustedClient ? undefined: ['id', 'username', 'photo']
            const user = await findUserById(req.params.id, includes, attributes);
            if (!user) {
                throw new Error("User not found");
            }
            res.send(user);
        } catch (err) {
            res.send('Unknown user or unauthorized request');
        }
)
router.get('/:id/address',
    // Only for server-to-server calls, no session auth
    passport.authenticate('bearer', {session: false}),
    async function (req, res) {
        let includes = [{model: models.Demographic,
            include: [{model: models.Address, include:[models.State, models.Country]}]
        }]

        if (!req.authInfo.clientOnly) {
            // If user scoped token

            // Scoped to some other user: Fuck off bro
            if (req.params.id != req.user.id) {
                return res.status(403).json({error: 'Unauthorized'})
            }
        } else {
            // If not user scoped

            // Check if trusted client or not
            if (!req.client.trusted) {
                return res.status(403).json({error: 'Unauthorized'})
            }
        }

        try {
            const addresses = await findAllAddress(req.params.id, includes);
            if (!addresses || addresses.length === 0) {
                throw new Error("User has no addresses")
            }
            return res.json(addresses);
        } catch (err) {
            Raven.captureException(err)
            req.flash('error', 'Something went wrong trying to query address database');
            return res.status(501).json({error: error})
        }
    })

module.exports = router
