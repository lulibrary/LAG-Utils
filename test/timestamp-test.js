const sinon = require('sinon')
const sandbox = sinon.sandbox.create()

const chai = require('chai')
chai.should()

// Module under test
const timestamp = require('../src/timestamp')

describe('timestamp tests', () => {
  describe('in seconds tests', () => {
    it('should return a unix timestamp in seconds', () => {
      const testTime = Date.now()
      const timeStub = sandbox.stub(Date, 'now')
      timeStub.returns(testTime)

      const expected = Math.floor(testTime / 1000)

      timestamp.inSeconds().should.equal(expected)
    })
  })
})
