/**
 * Created by championswimmer on 10/03/17.
 *
 * This is the /api/v1/clients path
 */
const router = require("express").Router();
const cel = require("connect-ensure-login");
const Raven = require("raven");
const generator = require("../../utils/generator");
const urlutils = require("../../utils/urlutils");
const { 
    createClient,
    updateClient
} = require("../../controllers/clients");


router.post("/add", 
    async function (req, res) {
        if (!req.user) {
            return res.status(403).send("Only logged in users can make clients");
        }
        try {
            let clientName = req.body.clientname;
            let clientDomains = req.body.domain.replace(/ /g, "").split(";");
            let clientCallbacks = req.body.callback.replace(/ /g, "").split(";");
            let defaultURL = req.body.defaulturl.replace(/ /g, "");
            defaultURL = urlutils.prefixHttp(defaultURL);
        
            //Make sure all urls have http in them
            clientDomains.forEach(function (url, i, arr) {
                arr[i] = urlutils.prefixHttp(url);
            });
            clientCallbacks.forEach(function (url, i, arr) {
                arr[i] = urlutils.prefixHttp(url);
            });

            const client = await createClient({
                id: generator.genNdigitNum(10),
                secret: generator.genNcharAlphaNum(64),
                name: clientName,
                domain: clientDomains,
                defaultURL: defaultURL,
                callbackURL: clientCallbacks,
                userId: req.user.id,
            });
            res.redirect("/clients/" + client.id);
        } catch (err) {
            Raven.captureException(err);
            req.flash("error", "Error adding Client");
            res.redirect("users/me");
        }
    }
)

router.post("/edit/:id", cel.ensureLoggedIn("/login"),
    async function (req, res) {
        try {
            let clientId = parseInt(req.params.id);
            let clientName = req.body.clientname;
            let clientDomains = req.body.domain.replace(/ /g, "").split(";");
            let defaultURL = req.body.defaulturl.replace(/ /g, "");
            let clientCallbacks = req.body.callback.replace(/ /g, "").split(";");
            let trustedClient = false;

            if(req.user.role === "admin"){
                trustedClient = req.body.trustedClient;
            }
            defaultURL = urlutils.prefixHttp(defaultURL);
            
            //Make sure all urls have http in them
            clientDomains.forEach((url, i, arr) => {
                arr[i] = urlutils.prefixHttp(url);
            });
            clientCallbacks.forEach((url, i, arr) => {
                arr[i] = urlutils.prefixHttp(url);
            });

            const client = await updateClient({
                name: clientName,
                domain: clientDomains,
                defaultURL: defaultURL,
                callbackURL: clientCallbacks,
                trusted: trustedClient
            }, req.params.id);

            res.redirect("/clients/" + clientId);

        } catch (err) {
            Raven.captureException(err);
            req.flash("error", "Error editing Client");
            res.redirect("users/me");
        }
    }
)


module.exports = router;
