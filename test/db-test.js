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

      const testDB = new DB()
      return testDB.save({ user_id: 'a user' }, 'UserCacheTable').then(data => {
        putStub.should.be.calledWith(expected)
      })
    })

    it('should be rejected with an error if dynamodb fails', () => {
      const putStub = sandbox.stub()
      putStub.callsArgWith(1, new Error('DynamoDB put has failed'), null)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'put', putStub)

      const testDB = new DB()
      return testDB.save({ user_id: 'a user' }, 'UserCacheTable')
        .should.eventually.be.rejectedWith('DynamoDB put has failed')
        .should.eventually.be.an.instanceOf(Error)
    })
  })

  describe('save loan method', () => {
    it('should call the save method with the input parameters and the loan cache table', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.resolves(true)
      const testDB = new DB({ loanCacheTable: 'loan cache table' })

      return testDB.saveLoan('a loan').then(() => {
        saveStub.should.have.been.calledWith('a loan', 'loan cache table')
      })
    })
  })

  describe('save user method', () => {
    it('should call the save method with the input parameters and the user cache table', () => {
      const saveStub = sandbox.stub(DB.prototype, 'save')
      saveStub.resolves(true)
      const testDB = new DB({ userCacheTable: 'user cache table' })

      return testDB.saveUser('a user').then(() => {
        saveStub.should.have.been.calledWith('a user', 'user cache table')
      })
    })
  })

  describe('get user method', () => {
    afterEach(() => {
      AWS_MOCK.restore('DynamoDB.DocumentClient')
    })

    it('should call dynamodb get with the correct parameters', () => {
      const getStub = sinon.stub()

      const getResult = {
        Item: {
          user_id: 'a user'
        }
      }
      getStub.callsArgWith(1, null, getResult)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getStub)

      const expected = {
        Key: {
          user_id: 'a user'
        },
        TableName: 'UserCacheTable'
      }

      testDB = new DB({ userCacheTable: 'UserCacheTable' })

      return testDB.getUser('a user').then(data => {
        getStub.should.be.calledWith(expected)
      })
    })

    it('should resolve with a user record if a matching user is found with no expiry date set', () => {
      const getResult = {
        Item: {
          user_id: 'a user'
        }
      }

      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getResult)
      testDB = new DB({ userCacheTable: 'UserCacheTable' })

      return testDB.getUser('a user').should.eventually.be.fulfilled
        .and.should.eventually.deep.equal({user_id: 'a user'})
    })

    it('should reject with an error if the user\'s expiry date is in the past', () => {
      const getResult = {
        Item: {
          user_id: 'a user',
          expiry_date: Math.floor(Date.now() / 1000) - 10
        }
      }

      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getResult)
      testDB = new DB({ userCacheTable: 'UserCacheTable' })

      return testDB.getUser('a user').should.eventually.be.rejectedWith('No matching record found')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should resolve with a user record if the expiry date is in the future', () => {
      const getResult = {
        Item: {
          user_id: 'a user',
          expiry_date: Math.floor(Date.now() / 1000) + 10
        }
      }

      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getResult)
      testDB = new DB({ userCacheTable: 'UserCacheTable' })

      return testDB.getUser('a user').should.eventually.be.fulfilled
        .and.should.eventually.deep.equal(getResult.Item)
    })

    it('should be rejected with an error if no matching user record is found', () => {
      const getResult = {}

      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getResult)
      testDB = new DB({ userCacheTable: 'UserCacheTable' })

      return testDB.getUser('a user').should.eventually.be.rejectedWith('No matching record found')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should be rejected with an error if dynamodb fails', () => {
      const getStub = sinon.stub()
      getStub.callsArgWith(1, new Error('DynamoDB broke'), null)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getStub)

      testDB = new DB({ userCacheTable: 'UserCacheTable' })

      return testDB.getUser('a user').should.eventually.be.rejectedWith('DynamoDB broke')
        .and.should.eventually.be.an.instanceOf(Error)
    })
  })

  describe('get loan method tests', () => {
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

      testDB = new DB({ loanCacheTable: 'LoanCacheTable' })

      return testDB.getLoan('a loan').then(data => {
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
      testDB = new DB({ loanCacheTable: 'LoanCacheTable' })

      return testDB.getLoan('a loan').should.eventually.be.fulfilled
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
      testDB = new DB({ loanCacheTable: 'LoanCacheTable' })

      return testDB.getLoan('a loan').should.eventually.be.rejectedWith('No matching record found')
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
      testDB = new DB({ loanCacheTable: 'LoanCacheTable' })

      return testDB.getLoan('a loan').should.eventually.be.fulfilled
        .and.should.eventually.deep.equal(getResult.Item)
    })

    it('should be rejected with an error if no matching loan record is found', () => {
      const getResult = {}

      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getResult)
      testDB = new DB({ loanCacheTable: 'LoanCacheTable' })

      return testDB.getLoan('a loan').should.eventually.be.rejectedWith('No matching record found')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should be rejected with an error if dynamodb fails', () => {
      const getStub = sinon.stub()
      getStub.callsArgWith(1, new Error('DynamoDB broke'), null)
      AWS_MOCK.mock('DynamoDB.DocumentClient', 'get', getStub)

      testDB = new DB({ loanCacheTable: 'LoanCacheTable' })

      return testDB.getLoan('a loan').should.eventually.be.rejectedWith('DynamoDB broke')
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

      const params = {
        Key: {
          loan_id: 'a loan'
        },
        TableName: 'a loan cache table'
      }

      const testDB = new DB()

      return testDB.delete(params).then(() => {
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

  describe('deleteLoan method tests', () => {
    it('should call delete with the correct parameters', () => {
      const deleteStub = sinon.stub(DB.prototype, 'delete')
      deleteStub.resolves(true)

      const expected = {
        TableName: 'a cache table',
        Key: {
          loan_id: 'a loan'
        }
      }

      const testDB = new DB({loanCacheTable: 'a cache table'})
      return testDB.deleteLoan('a loan').then(() => {
        deleteStub.should.have.been.calledWith(expected)
      })
    })
  })
})
