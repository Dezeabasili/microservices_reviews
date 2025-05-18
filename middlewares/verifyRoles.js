const createError = require('../utils/error')

const verifyRoles = (...authorizedRoles) => {
    // return the middleware
    return (req, res, next) => {
        // get logged in user roles
        const assignedRoles = req.userInfo.assignedRoles

        // make copy of authorized roles
        const approvedRoles = [...authorizedRoles]

        // check if any of user's assigned roles is included in the approved roles
        // const result = assignedRoles.some((role) => approvedRoles.includes(role))
        const result = approvedRoles.includes(assignedRoles)

        if (!result) return next(createError('fail', 401, 'You are not authorized to view this page'))
        next()
    }
}

module.exports = verifyRoles