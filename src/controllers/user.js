const models = require("../db/models").models;

// Finds user by ID
function findUserById(userId){
    return new Promise((resolve, reject) => {
        models.User.findOne({
            where: {id: userId},
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
function findUserByIdAndIncludes(userId, includes){
    return new Promise((resolve, reject) => {
        models.User.findOne({
            // attributes: attributes,
            where: {id: userId},
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
function findUserByIdAndAttrs(userId, attributes){
    return new Promise((resolve, reject) => {
        models.User.findOne({
            attributes: attributes,
            where: {id: userId},
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
function updateUser(userId, newValues){
    return new Promise((resolve, reject) => {
        models.User.update(newValues, {
            where: {id: userId},
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

// Updates UserLocal
function updateUserLocalByUserId(passhash, userId) {
    return new Promise((resolve, reject) => {
        models.UserLocal.update({
            password: passhash
        }, {
            where: {userId: userId}
        })
        .then(() => {
            resolve(true);
        })
        .catch((err) => {
            reject(err);
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

// EXPORTS
module.exports = {
    updateUser,
    findUserById,
    deleteAuthToken,
    findUserByIdAndAttrs,
    updateUserLocalByUserId,
    findUserByIdAndIncludes, 
};