const AWS_MOCK = require('aws-sdk-mock')
const sinon = require('sinon')

// Test libraries
const chai = require('chai')
const chai_as_promised = require('chai-as-promised')
chai.use(chai_as_promised)
const sinon_chai = require('sinon-chai')
chai.use(sinon_chai)
const should = chai.should()

const sandbox = sinon.sandbox.create()

// Module under test
const DB = require('../src/db')

describe('db class tests', () => {
  afterEach(() => {
    sandbox.restore()
  })

  describe('save method', () => {
    afterEach(() => {
      AWS_MOCK.restore('DynamoDB.DocumentClient')
    })

    it('should call dynamodb with the input parameters', () => {
      const putStub = sandbox.stub()
      putStub.callsArgWith(1, null, true)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'put', putStub)

      const expected = {
        Item: {
          user_id: 'a user'
        },
        TableName: 'UserCacheTable'
      }

      const testDB = new DB('UserCacheTable')
      return testDB.save({ user_id: 'a user' }).then(data => {
        putStub.should.be.calledWith(expected)
      })
    })

    it('should be rejected with an error if dynamodb fails', () => {
      const putStub = sandbox.stub()
      putStub.callsArgWith(1, new Error('DynamoDB put has failed'), null)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'put', putStub)

      const testDB = new DB('UserCacheTable')
      return testDB.save({ user_id: 'a user' })
        .should.eventually.be.rejectedWith('DynamoDB put has failed')
        .should.eventually.be.an.instanceOf(Error)
    })
  })

  describe('get method tests', () => {
    afterEach(() => {
      AWS_MOCK.restore('DynamoDB.DocumentClient')
    })

    it('should call dynamodb get with the correct parameters', () => {
      const getStub = sinon.stub()

      const getResult = {
        Item: {
          loan_id: 'a loan'
        }
      }
      getStub.callsArgWith(1, null, getResult)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getStub)

      const expected = {
        Key: {
          loan_id: 'a loan'
        },
        TableName: 'LoanCacheTable'
      }

      let testDB = new DB('LoanCacheTable')

      return testDB.get({ loan_id: 'a loan' }).then(data => {
        getStub.should.be.calledWith(expected)
      })
    })

    it('should resolve with a loan record if a matching loan is found with no expiry date set', () => {
      const getResult = {
        Item: {
          loan_id: 'a loan'
        }
      }

      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getResult)
      let testDB = new DB('LoanCacheTable')

      return testDB.get({ loan_id: 'a loan' }).should.eventually.be.fulfilled
        .and.should.eventually.deep.equal({loan_id: 'a loan'})
    })

    it('should reject with an error if the loan\'s expiry date is in the past', () => {
      const getResult = {
        Item: {
          loan_id: 'a loan',
          expiry_date: Math.floor(Date.now() / 1000) - 10
        }
      }

      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getResult)
      let testDB = new DB('LoanCacheTable')

      return testDB.get({ loan_id: 'a loan' }).should.eventually.be.rejectedWith('No matching record found')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should resolve with a loan record if the expiry date is in the future', () => {
      const getResult = {
        Item: {
          loan_id: 'a loan',
          expiry_date: Math.floor(Date.now() / 1000) + 10
        }
      }

      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getResult)
      let testDB = new DB('LoanCacheTable')

      return testDB.get({ loan_id: 'a loan' }).should.eventually.be.fulfilled
        .and.should.eventually.deep.equal(getResult.Item)
    })

    it('should be rejected with an error if no matching loan record is found', () => {
      const getResult = {}

      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getResult)
      let testDB = new DB('LoanCacheTable')

      return testDB.get({ loan_id: 'a loan' }).should.eventually.be.rejectedWith('No matching record found')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should be rejected with an error if dynamodb fails', () => {
      const getStub = sinon.stub()
      getStub.callsArgWith(1, new Error('DynamoDB broke'), null)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getStub)

      let testDB = new DB('LoanCacheTable')

      return testDB.get({ loan_id: 'a loan' }).should.eventually.be.rejectedWith('DynamoDB broke')
        .and.should.eventually.be.an.instanceOf(Error)
    })
  })

  describe('delete method tests', () => {
    afterEach(() => {
      AWS_MOCK.restore('DynamoDB.DocumentClient')
    })

    it('should call dynamodb delete with the correct params', () => {
      const deleteStub = sandbox.stub()
      deleteStub.callsArgWith(1, null, true)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'delete', deleteStub)

      const Key = {
        loan_id: 'a loan'
      }

      const testDB = new DB('a loan cache table')

      return testDB.delete(Key).then(() => {
        deleteStub.should.have.been.calledWith({
          Key: {
            loan_id: 'a loan'
          },
          TableName: 'a loan cache table'
        })
      })
    })

    it('should be fulfilled if dynamodb succeeds', () => {
      const deleteStub = sandbox.stub()
      deleteStub.callsArgWith(1, null, true)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'delete', deleteStub)

      const testDB = new DB()

      return testDB.delete('success').should.eventually.be.fulfilled
    })

    it('should be rejected with an error if dynamodb fails', () => {
      const deleteStub = sandbox.stub()
      deleteStub.callsArgWith(1, new Error('DynamoDB error'), null)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'delete', deleteStub)

      const testDB = new DB()

      return testDB.delete('error').should.eventually.be.rejectedWith('DynamoDB error')
    })
  })
})
