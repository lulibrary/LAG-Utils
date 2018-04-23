class ItemNotFoundError extends Error {
  constructor (...args) {
    super(...args)
    Error.captureStackTrace(this, ItemNotFoundError)
  }
}

module.exports = ItemNotFoundError
