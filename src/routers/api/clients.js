/**
 * Created by championswimmer on 10/03/17.
 *
 * This is the /api/v1/clients path
 */
const router = require('express').Router()
const cel = require('connect-ensure-login')
const Raven = require('raven')

const { AddClient, EditClient } = require('../controllers/demographics')

router.post('/add', async function (req, res) {
    if (!req.user) {
        return res.status(403).send("Only logged in users can make clients")
    }
    try {
        const response = await AddClient(req.body, req.user.id)
        res.redirect('/clients/' + response)
    } catch (err) {
        Raven.captureException(err)
        req.flash('error', 'Error adding Client')
    }
    
})

router.post('/edit/:id', cel.ensureLoggedIn('/login'),
    async function (req, res) {
        try {
            const response = await EditClient(req.body, req.params.id, req.user.role)
            res.redirect('/clients/' + response)
        } catch (err) {
            Raven.captureException(err)
            req.flash('error', 'Error editing Client')
        }

    })


module.exports = router
