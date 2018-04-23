const chai = require('chai')
chai.should()

// Module under test
const Utils = require('../src')

// Test data
const Topic = require('../src/topic')
const DB = require('../src/db')
const ItemNotFoundError = require('../src/item-not-found-error')

describe('module tests', () => {
  it('should export an object', () => {
    Utils.should.be.an('object')
  })

  it('should export a Topic object matching the one exported by topic.js', () => {
    Utils.Topic.should.deep.equal(Topic)
  })

  it('should export a DB object matching the one exported by db.js', () => {
    Utils.DB.should.deep.equal(DB)
  })

  it('should export an ItemNotFoundError object matching the one exported by item-not-found-error.js', () => {
    Utils.ItemNotFoundError.should.deep.equal(ItemNotFoundError)
  })
})
