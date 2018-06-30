const {db, models} = require('../../db/models')
const {hasNull} = require('../../utils/nullCheck')

function generateDemographics(body, id) {
    return new Promise ((resolve, reject) => {
        models.Demographic.findCreateFind({
            where: {userId: id},
            include: [models.Address]
        })
        .then(([demographics, created]) => models.Address.create({
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
                resolve(body.returnTo)
            } else {
                resolve('/address/' + address.id)
            }
        })
        .catch((err) => {
            reject(err)
        })
    })
}

function updateDemographics(body, addrId, userId) {
    return new Promise ((resolve, reject) => {
        db.transaction(async (t) => {
            if (body.primary === 'on') {
                let demo = await models.Demographic.findOne({where: {userId: userId}})
                let demoId = demo.id
                await models.Address.update(
                    {primary: false},
                    {where: {demographicId: demoId}}
                )
            }
            await models.Address.update({
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
                    primary: body.primary === 'on'
                },
                { where: {id: addrId} }
            )
            resolve(true)  // Successfully updation done

        })
    })
}


module.exports = {
    generateDemographics, updateDemographics
}



