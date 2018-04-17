const chai = require('chai')
chai.should()

// Module under test
const Utils = require('../src')

// Test data
const Topic = require('../src/topic')
const DB = require('../src/db')

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
})
