createError = (status, statusCode, message) => {
    const err = new Error(message)
    err.status = status
    err.statusCode = statusCode
    err.isOperational = true
    return err
}

module.exports = createError