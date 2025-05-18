const corsOrigins = require('./corsOrigins')

const corsConfiguration = {
    origin: (origin, callback) => {
        if (corsOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}

module.exports = corsConfiguration