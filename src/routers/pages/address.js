const router = require("express").Router()
const cel = require("connect-ensure-login")
const Raven = require("raven")

const models = require("../../db/models").models
const { findAddress, findAllAddress} = require("../../controllers/demographics");

router.get("/",
    cel.ensureLoggedIn("/login"),
        async function (req, res, next) {
        try {
            const addresses = await findAllAddress(req.user.id,[models.Demographic])
            if (!addresses || addresses.length === 0) {
                throw new Error("User has no addresses")
            }
            return res.render("address/all", {addresses})
        } catch(err) {
            Raven.captureException(err)
            req.flash("error", "Something went wrong trying to query address database")
            return res.redirect("/users/me")
        }
    }
)

router.get("/add",
    cel.ensureLoggedIn("/login"),
    function (req, res, next) {
        Promise.all([
            models.State.findAll({}),
            models.Country.findAll({})
        ]).then(function ([states, countries]) {
            return res.render("address/add", {states, countries})
        }).catch(function (err) {
            res.send("Error Fetching Data.")
        })
    }
)

router.get("/:id",
    cel.ensureLoggedIn("/login"),
    function (req, res, next) {
        async function (req, res, next) {
        try {
            const address = await findAddress(req.params.id,req.user.id );    
            if (!address) {
                req.flash("error", "Address not found");
                return res.redirect(".");
            }
            return res.render("address/id", {address});
        } catch(err) {
            Raven.captureException(err);
            req.flash("error", "Something went wrong trying to query address database");
            return res.redirect("/users/me");
        }
    })


router.get("/:id/edit",
    cel.ensureLoggedIn("/login"),
    function (req, res, next) {
        Promise.all([
            async function (req, res, next) {
                Promise.all([await findAddress(req.params.id,req.user.id ),
                    models.State.findAll({}),
                    models.Country.findAll({})
        ]).then(function ([address, states, countries]) {
            if (!address) {
                req.flash("error", "Address not found")
                return res.redirect(".")
            }
            return res.render("address/edit", {address, states, countries})
        }).catch((err) => {
            Raven.captureException(err)
            req.flash("error", "Something went wrong trying to query address database")
            return res.redirect("/users/me")
        })
    }
)

module.exports = router
