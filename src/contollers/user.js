const models = require("../db/models").models;

// Finds user by ID
function findUserById(userid){
    return new Promise((resolve, reject) => {
        models.User.findOne({
            where: {id: userid},
        })
        .then((user) => {
            resolve(user);
        })
        .catch((err) => {
            reject();
        });
    });
}

// Finds user by ID and Includes
function findUserByIdAndIncludes(userid, includes){
    return new Promise((resolve, reject) => {
        models.User.findOne({
            // attributes: attributes,
            where: {id: userid},
            include: includes
        })
        .then((user) => {
            resolve(user);
        })
        .catch((err) => {
            reject();
        });
    });
}

// Finds user by ID and Attributes
function findUserByIdAndAttrs(userid, attributes){
    return new Promise((resolve, reject) => {
        models.User.findOne({
            attributes: attributes,
            where: {id: userid},
        })
        .then((user) => {
            resolve(user);
        })
        .catch((err) => {
            reject();
        });
    });
}

// Updates User
function updateUser(userid, newValues){
    return new Promise((resolve, reject) => {
        models.User.update(newValues, {
            where: {id: userid},
            returning: true
        })
        .then((user) => {
            resolve(user);
        })
        .catch((err) => {
            reject();
        });
    });
}

// Deletes Auth Token
function deleteAuthToken(token){
    return new Promise((resolve, reject) => {
        models.AuthToken.destroy({
            where: {
                token: token
            }
        })
        .then(() => {
            resolve("success");
        })
        .catch((err) => {
            reject(err);
        });
    });
}

module.exports = {
    findUserById, findUserByIdAndAttrs, findUserByIdAndIncludes, deleteAuthToken, updateUser
};