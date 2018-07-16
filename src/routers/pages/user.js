/**
 * Created by championswimmer on 13/03/17.
 */
const Raven = require("raven");
const cel = require("connect-ensure-login");
const router = require("express").Router();
const {hasNull} = require("../../utils/nullCheck");
const passutils = require("../../utils/password");
const models = require("../../db/models").models;
const acl = require("../../middlewares/acl");
const multer = require("../../utils/multer");

const {
    updateUser,
    findUserById,
    findUserByIdAndIncludes,
    updateUserLocalByUserId,
} = require("../../controllers/user");

const {
    findAllClientsbyUserId
} = require("../../controllers/clients");

const {
    findAllColleges,
    findAllBranches
} = require("../../controllers/demographics");


router.get("/me",
    cel.ensureLoggedIn("/login"),
    async function (req, res, next) {
        try {
            const user = await findUserByIdAndIncludes(req.user.id,[
                models.UserGithub,
                models.UserGoogle,
                models.UserFacebook,
                models.UserLms,
                models.UserTwitter,
                {
                    model: models.Demographic,
                    include: [
                        models.College,
                        models.Branch,
                        models.Company,
                        ]
                }
            ]);
            if (!user) {
                res.redirect("/login");
            }
            return res.render("user/me", {user: user});
        } catch(err) {
            throw err;
        }
    })

router.get("/me/edit",
    cel.ensureLoggedIn("/login"),
    async function (req, res, next) {
        await Promise.all([
            findUserByIdAndIncludes(req.user.id,[
                {
                    model: models.Demographic,
                    include: [
                        models.College,
                        models.Branch,
                        models.Company,
                    ]
                }
            ]),
            findAllColleges(),
            findAllBranches()
        ]).then(([user, colleges, branches]) => {
            if (!user) {
                res.redirect("/login");
            }
            return res.render("user/me/edit", {user, colleges, branches});
        }).catch((err) => {
            throw err;
        })

    }
)

router.post("/me/edit",
    cel.ensureLoggedIn("/login"),
    function(req, res, next) {
        let upload = multer.upload.single("userpic");
        upload(req, res, ((err) => {
            if(err) {
                if (err.message === "File too large") {
                    req.flash("error", "Profile photo size exceeds 2 MB");
                    return res.redirect("edit");
                } else {
                    Raven.captureException(err);
                    req.flash("error", "Error in Server");
                    return res.redirect("/");
                }
            } else {
                next();
            }
        }));
    },
    async function (req, res, next) {

        // Exit if password does not match
        if ((req.body.password) && (req.body.password !== req.body.repassword)) {
            req.flash("error", "Passwords do not match");
            return res.redirect("edit");
        }

        // Check name isn"t null
        if (hasNull(req.body, ["firstname", "lastname"])) {
            req.flash("error", "Null values for name not allowed");
            return res.redirect("/");
        }

        try {
            const user = await findUserByIdAndIncludes(req.user.id, [models.Demographic]);
            const demographic = user.demographic || {};
            
            user.firstname = req.body.firstname;
            user.lastname = req.body.lastname;
            if (!user.verifiedemail && req.body.email !== user.email) {
                user.email = req.body.email;
            }

            let prevPhoto = "";
            if (user.photo) {
                prevPhoto = user.photo.split("/").pop();
            }
            if (req.file) {
                user.photo = req.file.location;
            } else if(req.body.avatarselect) {
                user.photo = `https://minio.cb.lk/img/avatar-${req.body.avatarselect}.svg`;
            }

            await user.save();

            if ((req.file || req.body.avatarselect) && prevPhoto) {
                multer.deleteMinio(prevPhoto);
            }

            demographic.userId = demographic.userId || req.user.id;
            if (req.body.branchId) {
                demographic.branchId = +req.body.branchId;
            }
            if (req.body.collegeId) {
                demographic.collegeId = +req.body.collegeId;
            }
            await upsertDemographicByUserId();

            if (req.body.password) {
                const passHash = await passutils.pass2hash(req.body.password);
                await updateUserLocalByUserId();
            }
            res.redirect("/users/me");
        } catch (err) {
            Raven.captureException(err);
            req.flash("error", "Error in Server");
            return res.redirect("/");
        }

    })

router.get("/:id",
    cel.ensureLoggedIn("/login"),
    acl.ensureRole("admin"),
    async function (req, res, next) {
        try {
            const user = await findUserByIdAndIncludes(req.params.id,[
                models.UserGithub,
                models.UserGoogle,
                models.UserFacebook,
                models.UserLms,
                models.UserTwitter
            ]);
            if (!user) {
                return res.status(404).send({error: "Not found"});
            }
            return res.render("user/id", {user: user});
        } catch(err) {
            throw err;
        }
    }
)

router.get("/:id/edit",
    cel.ensureLoggedIn("/login"),
    acl.ensureRole("admin"),
    async function (req, res, next) {
        try {
            const user = await findUserById(req.params.id);
            if (!user) {
                return res.status(404).send({error: "Not found"});
            }
            return res.render("user/id/edit", {user: user});
        } catch (err) {
            throw err;
        }
    }
)

router.post("/:id/edit",
    cel.ensureLoggedIn("/login"),
    acl.ensureRole("admin"),
    async function (req, res, next) {
        try {
            const user = await updateUser(req.params.id,{
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                role: req.body.role !== "unchanged" ? req.body.role : undefined
            })
            return res.redirect("../" + req.params.id);
        } catch (err) {
            throw err;
        }
    }
)

router.get("/me/clients",
    cel.ensureLoggedIn("/login"),
    async function (req, res, next) {
        try {
            const clients = await findAllClientsbyUserId(req.user.id);
            return res.render("client/all", {clients: clients});
        } catch(err) {
            res.send("No clients registered");
        }
    }
)

module.exports = router;
