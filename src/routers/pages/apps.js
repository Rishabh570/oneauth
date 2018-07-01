/**
 * Created by bhavyaagg on 19/05/18.
 */
const router = require("express").Router();
const cel = require("connect-ensure-login");
const models = require("../../db/models").models;

import {
    searchAllAuthTokens,
    searchAuthToken
} from "../../contollers/auth";


router.get("/",
    cel.ensureLoggedIn("/login"),
    async function (req, res, next) {
        await searchAllAuthTokens(req.user.id)
        .then((apps) => {
            return res.render("apps/all", {apps: apps});
        })
        .catch((err) => {
            res.send("No clients registered");
        });
    }
)

router.get("/:clientId/delete",cel.ensureLoggedIn("/login"),
    async function (req, res, next) {
        await searchAuthToken(req.params.clientId, req.user.id)
        .then((token) => {
            if (!token) {
                return res.send("Invalid App");
            }
            if (token.userId != req.user.id) {
                return res.send("Unauthorized user");
            }
            token.destroy();

            return res.redirect("/apps/");
        })
    }
)



module.exports = router;
