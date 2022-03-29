const errors = {
  USER_DOES_NOT_EXIST: {
    message: 'User does not exist'
  },
  ERROR_CODE_DOES_NOT_EXIST: {
    message: 'Error code does not exist'
  },
  PASSWORD_UNSET: {
    message: 'Password not set for this user, aborting password verification.'
  }
}

module.exports = new Proxy(errors, {
  get: function (target, prop, receiver) {
    if (!Object.prototype.hasOwnProperty.call(errors, prop)) {
      const error = new Error('Error code does not exist')
      error.code = 'ERROR_CODE_DOES_NOT_EXIST'
      throw error
    }
    const error = new Error(errors[prop].message)
    error.code = prop
    return error
  }
})
