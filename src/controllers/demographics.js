const {models} = require("../db/models");

// Finds the demographic given the user ID
function findDemographic(userId){
    return new Promise((resolve, reject) => {
        models.Demographic.findOne({where: {userId: userId}})
        .then((result) => {
            resolve(result);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Finds the Address given the user ID and demographic user ID
function findAddress(userId, demoUserId){
    return new Promise((resolve, reject) => {
        models.Address.findOne({
            where: {
                id: demoUserId,
                "$demographic.userId$": userId
            },
            include: [models.Demographic, models.State, models.Country]
        })
        .then((address) => {
            resolve(address);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Finds all Addresses
function findAllAddresses(userId, includes){
    return new Promise((resolve, reject) => {
        models.Address.findAll({
            where: {"$demographic.userId$": userId},
            include: includes
        })
        .then((addresses) => {
            resolve(addresses);
        })
        .catch((err) => {
            reject(err.message);
        });
    });
}

// Finds all States
function findAllStates(){
    return new Promise ((resolve, reject) => {
        models.State.findAll({})
        .then((states) => {
            resolve(states);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Finds all countries
function findAllCountries(){
    return new Promise ((resolve, reject) => {
        models.Country.findAll({})
        .then((countries) => {
            resolve(countries);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Finds all Colleges
function findAllColleges() {
    return new Promise ((resolve, reject) => {
        models.College.findAll({})
        .then((colleges) => {
            resolve(colleges);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Finds all Branches
function findAllBranches() {
    return new Promise ((resolve, reject) => {
        models.Branch.findAll({})
        .then((branches) => {
            resolve(branches);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Finds the demographic or creates it
function findCreateDemographic(userId) {
    return new Promise((resolve, reject) => {
        models.Demographic.findCreateFind({
            where: {userId: userId},
            include: [models.Address]
        })
        .then(([demographics, created]) => {
            resolve(demographics);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Creates the Address given the req.body containing all info
function createAddress(body) {
    return new Promise((resolve, reject) => {
        models.Address.create(body)
        .then((address) => {
            resolve(address);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Updates the Address given the Address ID and other options
function updateAddressbyAddrId(addrId, options){
    return new Promise((resolve, reject) => {
        models.Address.update(options,
        { where: {id: addrId} })
        .then((address) => {
            resolve(address);
        })
        .catch((err) => {
            reject(err);
        });
    });
}

// Updates the Address given the demographic ID and other options
function updateAddressbyDemoId(demoId, options){
    return new Promise((resolve, reject) => {
        models.Address.update(options,
        { where: {demographicId: demoId} })
        .then((address) => {
            resolve(address);
        })
        .catch((err) => {
            reject(err);
        });
    });
}


function generateDemographics(body, id) {
    return new Promise ((resolve, reject) => {
        findCreateDemographic(id)
        .then(([demographics, created]) => createAddress({
            label: body.label,
            first_name: body.first_name,
            last_name: body.last_name,
            mobile_number: body.number,
            email: body.email,
            pincode: body.pincode,
            street_address: body.street_address,
            landmark: body.landmark,
            city: body.city,
            stateId: body.stateId,
            countryId: body.countryId,
            demographicId: demographics.id,
            // if no addresses, then first one added is primary
            primary: !demographics.get().addresses
        }))
        .then((address) => {
            if (body.returnTo) {
                resolve(body.returnTo);
            } else {
                resolve("/address/");
            }
        })
        .catch((err) => {
            reject(err);
        });
    });
}
    
function updateDemographics(body, addrId, userId) {
    return new Promise ((resolve, reject) => {
        db.transaction(async (t) => {
        if (body.primary === "on") {
            let demographic = findDemographic(userId);
            let demographicId = demographic.id;
            updateAddressbyDemoId(demographicId,
                {primary: false},
            );
        }
        updateAddressbyAddrId(addrId, {
            label: body.label,
            first_name: body.first_name,
            last_name: body.last_name,
            mobile_number: body.number,
            email: body.email,
            pincode: body.pincode,
            street_address: body.street_address,
            landmark: body.landmark,
            city: body.city,
            stateId: body.stateId,
            countryId: body.countryId,
            primary: body.primary === "on"
            }
        );
        resolve(true);  // Successfully updation done
        });
    });
}



// EXPORTS
module.exports = {
    findCreateDemographic,updateAddressbyDemoId,
    updateAddressbyAddrId, findAddress, createAddress,
    findAllAddresses, findAllStates, findAllCountries, findAllColleges,findAllBranches, findDemographic, generateDemographics,
    updateDemographics
};
