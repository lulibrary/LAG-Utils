const AWS_MOCK = require('aws-sdk-mock')
const sinon = require('sinon')

const chai = require('chai')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
chai.should()
const expect = chai.expect

const uuid = require('uuid/v4')

const sandbox = sinon.sandbox.create()

let mocks = []

// Module under test
const Queue = require('../src/queue')

describe('queue class tests', () => {
  afterEach(() => {
    sandbox.restore()
    mocks.forEach(mock => {
      AWS_MOCK.restore(mock)
    })
    mocks = []
  })

  describe('get queue url tests', () => {
    it('should call getQueueUrl with the correct parameters', () => {
      const urlStub = sandbox.stub()
      urlStub.callsArgWith(1, null, { QueueUrl: 'a url' })
      AWS_MOCK.mock('SQS', 'getQueueUrl', urlStub)
      mocks.push('SQS')

      const expected = {
        QueueName: 'a queue',
        QueueOwnerAWSAccountId: 'me'
      }

      const testQueue = new Queue({ name: 'a queue', owner: 'me' })
      return testQueue.getQueueUrl().then(() => {
        urlStub.should.have.been.calledWith(expected)
      })
    })

    it('should update the queue object url', () => {
      AWS_MOCK.mock('SQS', 'getQueueUrl', { QueueUrl: 'a url' })
      mocks.push('SQS')

      const testQueue = new Queue({ name: 'a queue', owner: 'me' })
      return testQueue.getQueueUrl().then(() => {
        testQueue.url.should.equal('a url')
      })
    })

    it('should be rejected with an error if SQS fails', () => {
      const urlStub = sandbox.stub()
      urlStub.callsArgWith(1, new Error('SQS has failed'), null)
      AWS_MOCK.mock('SQS', 'getQueueUrl', urlStub)
      mocks.push('SQS')

      const testQueue = new Queue({ name: 'a queue', owner: 'me' })
      return testQueue.getQueueUrl().should.eventually.be.rejectedWith('SQS has failed')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should be fulfilled if SQS succeeds', () => {
      const urlStub = sandbox.stub()
      urlStub.callsArgWith(1, null, { QueueUrl: 'a url' })
      AWS_MOCK.mock('SQS', 'getQueueUrl', urlStub)
      mocks.push('SQS')

      const testQueue = new Queue({ name: 'a queue', owner: 'an owner' })
      return testQueue.getQueueUrl().should.eventually.be.fulfilled
    })
  })

  describe('send message tests', () => {
    it('should call sendMessage with the correct parameters', () => {
      const sendStub = sandbox.stub()
      sendStub.callsArgWith(1, null, true)
      AWS_MOCK.mock('SQS', 'sendMessage', sendStub)
      mocks.push('SQS')

      const expected = {
        MessageBody: 'this is a test message',
        QueueUrl: 'a url'
      }

      const testQueue = new Queue({ name: 'a queue', owner: 'an owner' })
      testQueue.url = 'a url'
      return testQueue.sendMessage('this is a test message').then(() => {
        sendStub.should.have.been.calledWith(expected)
      })
    })

    it('should be rejected with an error if SQS fails', () => {
      const sendStub = sandbox.stub()
      sendStub.callsArgWith(1, new Error('SQS sendMessage has failed'), null)
      AWS_MOCK.mock('SQS', 'sendMessage', sendStub)
      mocks.push('SQS')

      const testQueue = new Queue({ name: 'a queue', owner: 'an owner' })
      testQueue.url = 'a url'

      return testQueue.sendMessage('this is a test message')
        .should.eventually.be.rejectedWith('SQS sendMessage has failed')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should be fulfilled with the SQS sendMessage response if SQS succeeds', () => {
      const sendStub = sandbox.stub()
      sendStub.callsArgWith(1, null, 'message sent')
      AWS_MOCK.mock('SQS', 'sendMessage', sendStub)
      mocks.push('SQS')

      const testQueue = new Queue({ name: 'a queue', owner: 'an owner' })
      testQueue.url = 'a url'

      return testQueue.sendMessage('this is a test message')
        .should.eventually.be.fulfilled
        .and.should.eventually.equal('message sent')
    })

    it('should call getQueueUrl if the Queue URL does not exist', () => {
      const testQueue = new Queue({ name: 'a queue', owner: 'an owner' })
      const getQueueUrlStub = sandbox.stub(testQueue, 'getQueueUrl')
      getQueueUrlStub.resolves(true)
      const sendMessageStub = sandbox.stub(testQueue.sqs, 'sendMessage')
      sendMessageStub.returns({
        promise: () => Promise.resolve()
      })

      return testQueue.sendMessage('this is a test message').then(() => {
        getQueueUrlStub.should.have.been.calledOnce
      })
    })

    it('should be rejected with a custom error if Queue#getQueueUrl is rejected', () => {
      const testQueue = new Queue({ name: 'a queue', owner: 'an owner' })
      const getQueueUrlStub = sandbox.stub(testQueue, 'getQueueUrl')
      getQueueUrlStub.rejects(new Error('an error from getQueueURL'))

      return testQueue.sendMessage('this is a test message').should.eventually.be.rejectedWith('Unable to get Queue URL')
    })

    it('should be rejected with the SQS#sendMessage error if SQS#sendMessage is rejected', () => {
      const testQueue = new Queue({ name: 'a queue', owner: 'an owner' })
      const getQueueUrlStub = sandbox.stub(testQueue, 'getQueueUrl')
      getQueueUrlStub.resolves(true)
      const sendMessageStub = sandbox.stub(testQueue.sqs, 'sendMessage')
      sendMessageStub.returns({
        promise: () => Promise.reject(new Error('an error from SQS#sendMessage'))
      })

      return testQueue.sendMessage('this is a test message').should.eventually.be.rejectedWith('an error from SQS#sendMessage')
    })
  })

  describe('_ensureUrl method tests', () => {
    it('should call getQueueUrl if the Queue URL does not exist', () => {
      const testQueue = new Queue({ name: 'a queue', owner: 'an owner' })
      const getQueueUrlStub = sandbox.stub(testQueue, 'getQueueUrl')
      getQueueUrlStub.resolves(true)

      return testQueue._ensureUrl().then(() => {
        getQueueUrlStub.should.have.been.calledOnce
      })
    })

    it('should be rejected with a custom error if Queue#getQueueUrl is rejected', () => {
      const testQueue = new Queue({ name: 'a queue', owner: 'an owner' })
      const getQueueUrlStub = sandbox.stub(testQueue, 'getQueueUrl')
      getQueueUrlStub.rejects(new Error('an error from getQueueURL'))

      return testQueue._ensureUrl().should.eventually.be.rejectedWith('Unable to get Queue URL')
    })

    it('should resolve without calling getQueueUrl if the Queue URL exists', () => {
      const testQueue = new Queue({ name: 'a queue', owner: 'an owner', url: uuid() })
      const getQueueUrlStub = sandbox.stub(testQueue, 'getQueueUrl')
      getQueueUrlStub.resolves(true)

      return testQueue._ensureUrl().then(() => {
        getQueueUrlStub.should.not.have.been.called
      })
    })
  })

  describe('receiveMessages method tests', () => {
    it('should call _ensureUrl', () => {
      const testQueue = new Queue({})
      const ensureUrlStub = sandbox.stub(testQueue, '_ensureUrl')
      ensureUrlStub.resolves()

      sandbox.stub(testQueue.sqs, 'receiveMessage').returns({
        promise: () => Promise.resolve({ Messages: null })
      })

      return testQueue.receiveMessages()
        .then(() => {
          ensureUrlStub.should.have.been.calledOnce
        })
    })

    it('should call SQS#recieveMessage', () => {
      const testUrl = uuid()
      const testQueue = new Queue({
        url: testUrl
      })
      const receiveMessageStub = sandbox.stub(testQueue.sqs, 'receiveMessage')
      receiveMessageStub.returns({
        promise: () => Promise.resolve({ Messages: null })
      })

      const maxMessages = Math.round(Math.random() * 10)

      return testQueue.receiveMessages(maxMessages)
        .then(() => {
          receiveMessageStub.should.have.been.calledWith({
            QueueUrl: testUrl,
            MaxNumberOfMessages: maxMessages
          })
        })
    })

    it('should default to a max of 10 messages', () => {
      const testUrl = uuid()
      const testQueue = new Queue({
        url: testUrl
      })
      const receiveMessageStub = sandbox.stub(testQueue.sqs, 'receiveMessage')
      receiveMessageStub.returns({
        promise: () => Promise.resolve({ Messages: null })
      })
      return testQueue.receiveMessages()
        .then(() => {
          receiveMessageStub.should.have.been.calledWith({
            QueueUrl: testUrl,
            MaxNumberOfMessages: 10
          })
        })
    })

    it('should return the Messages field of the response', () => {
      const testResponse = {
        Messages: [
          uuid(),
          uuid(),
          {
            name: uuid(),
            body: uuid()
          }
        ]
      }

      AWS_MOCK.mock('SQS', 'receiveMessage', testResponse)
      mocks.push('SQS')

      const testUrl = uuid()
      const testQueue = new Queue({
        url: testUrl
      })

      return testQueue.receiveMessages()
        .then(res => {
          res.should.deep.equal(testResponse.Messages)
        })
    })
  })

  describe('deleteMessage method tests', () => {
    it('should call _ensureUrl', () => {
      const testQueue = new Queue({})
      const ensureUrlStub = sandbox.stub(testQueue, '_ensureUrl')
      ensureUrlStub.resolves()

      sandbox.stub(testQueue.sqs, 'deleteMessage').returns({
        promise: () => Promise.resolve()
      })

      return testQueue.deleteMessage()
        .then(() => {
          ensureUrlStub.should.have.been.calledOnce
        })
    })

    it('should call SQS#deleteMessage', () => {
      const testUrl = uuid()
      const testQueue = new Queue({
        url: testUrl
      })
      const receiveMessageStub = sandbox.stub(testQueue.sqs, 'deleteMessage')
      receiveMessageStub.returns({
        promise: () => Promise.resolve()
      })

      const testReceiptHandle = uuid()

      return testQueue.deleteMessage(testReceiptHandle)
        .then(() => {
          receiveMessageStub.should.have.been.calledWith({
            QueueUrl: testUrl,
            ReceiptHandle: testReceiptHandle
          })
        })
    })
  })

  describe('_callOnSQS method tests', () => {
    it('should call _ensureUrl', () => {
      const testUrl = uuid()
      const testQueue = new Queue({
        url: testUrl
      })

      const ensureUrlStub = sandbox.stub(testQueue, '_ensureUrl')
      ensureUrlStub.resolves()

      const testMethod = uuid()
      const methodStub = sandbox.stub()
      methodStub.returns({
        promise: () => Promise.resolve()
      })
      testQueue.sqs[testMethod] = methodStub

      return testQueue._callOnSQS(testMethod)
        .then(() => {
          ensureUrlStub.should.have.been.calledOnce
        })
    })

    it('should call the provided method on SQS', () => {
      const testUrl = uuid()
      const testQueue = new Queue({
        url: testUrl
      })

      const testMethod = uuid()
      const methodStub = sandbox.stub()
      methodStub.returns({
        promise: () => Promise.resolve()
      })
      testQueue.sqs[testMethod] = methodStub

      return testQueue._callOnSQS(testMethod)
        .then(() => {
          methodStub.should.have.been.calledOnce
        })
    })

    it('should call the method with the passed parameters merged onto the URL parameter', () => {
      const testUrl = uuid()
      const testQueue = new Queue({
        url: testUrl
      })

      const testMethod = uuid()
      const methodStub = sandbox.stub()
      methodStub.returns({
        promise: () => Promise.resolve()
      })
      testQueue.sqs[testMethod] = methodStub

      const testParams = {
        thing1: uuid(),
        thing2: uuid()
      }

      const expected = {
        QueueUrl: testUrl,
        thing1: testParams.thing1,
        thing2: testParams.thing2
      }

      return testQueue._callOnSQS(testMethod, testParams)
        .then(() => {
          methodStub.should.have.been.calledWith(expected)
        })
    })
  })
})
