const router = require("express").Router();
const {db} = require("../../db/models");
const cel = require("connect-ensure-login");
const Raven = require("raven");
const {hasNull} = require("../../utils/nullCheck");

const {
    generateDemographics,
    updateDemographics
    } = require("../../controllers/demographics");


router.post("/", cel.ensureLoggedIn("/login"), async function (req, res) {
    if (hasNull(req.body, ["label", "first_name", "last_name", "number", "email", "pincode", "street_address", "landmark", "city", "stateId", "countryId"])) {
        res.send(400);
    } else {
        if (req.query) {
            var redirectUrl = req.query.returnTo;
        }
        try {
            const returnURL = await generateDemographics(req.body, req.user.id);
            res.redirect(returnURL);
        } catch (err) {
            Raven.captureException(err);
            req.flash("error", "Error inserting Address");
            res.redirect("/users/me");
        }   
    }
})

router.post("/:id", cel.ensureLoggedIn("/login"), async function (req, res) {
    if (hasNull(req.body, ["label", "first_name", "last_name", "number", "email", "pincode", "street_address", "landmark", "city", "stateId", "countryId"])) {
        return res.send(400);
    }
    let addrId = parseInt(req.params.id);
    let userId = parseInt(req.user.id);

    try {
        const response = await updateDemographics(req.body, addrId, userId);
        res.redirect(`/address/${addrId}`);
        } catch (err) {
            Raven.captureException(err);
            req.flash("error", "Could not update address");
            res.redirect("/address");
        }
})


module.exports = router
