const AWS_MOCK = require('aws-sdk-mock')
const sinon = require('sinon')

const chai = require('chai')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
chai.should()

const sandbox = sinon.sandbox.create()

// Module under test
const Queue = require('../src/queue')

describe('queue class tests', () => {
  afterEach(() => {
    sandbox.restore()
    AWS_MOCK.restore('SQS')
  })

  describe('get queue url tests', () => {
    it('should call getQueueUrl with the correct parameters', () => {
      const urlStub = sandbox.stub()
      urlStub.callsArgWith(1, null, { QueueUrl: 'a url' })
      AWS_MOCK.mock('SQS', 'getQueueUrl', urlStub)

      const expected = {
        QueueName: 'a queue',
        QueueOwnerAWSAccountId: 'me'
      }

      const testQueue = new Queue('a queue', 'me')
      return testQueue.getQueueUrl().then(() => {
        urlStub.should.have.been.calledWith(expected)
      })
    })

    it('should update the queue object url', () => {
      AWS_MOCK.mock('SQS', 'getQueueUrl', { QueueUrl: 'a url' })

      const testQueue = new Queue('a queue', 'me')
      return testQueue.getQueueUrl().then(() => {
        testQueue.url.should.equal('a url')
      })
    })

    it('should be rejected with an error if SQS fails', () => {
      const urlStub = sandbox.stub()
      urlStub.callsArgWith(1, new Error('SQS has failed'), null)
      AWS_MOCK.mock('SQS', 'getQueueUrl', urlStub)

      const testQueue = new Queue('a queue', 'an owner')
      return testQueue.getQueueUrl().should.eventually.be.rejectedWith('SQS has failed')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should be fulfilled if SQS succeeds', () => {
      const urlStub = sandbox.stub()
      urlStub.callsArgWith(1, null, { QueueUrl: 'a url' })
      AWS_MOCK.mock('SQS', 'getQueueUrl', urlStub)

      const testQueue = new Queue('a queue', 'an owner')
      return testQueue.getQueueUrl().should.eventually.be.fulfilled
    })
  })

  describe('send message tests', () => {
    it('should call sendMessage with the correct parameters', () => {
      const sendStub = sandbox.stub()
      sendStub.callsArgWith(1, null, true)
      AWS_MOCK.mock('SQS', 'sendMessage', sendStub)

      const expected = {
        MessageBody: 'this is a test message',
        QueueUrl: 'a url'
      }

      const testQueue = new Queue('a queue', 'me')
      testQueue.url = 'a url'
      return testQueue.sendMessage('this is a test message').then(() => {
        sendStub.should.have.been.calledWith(expected)
      })
    })

    it('should be rejected with an error if SQS fails', () => {
      const sendStub = sandbox.stub()
      sendStub.callsArgWith(1, new Error('SQS sendMessage has failed'), null)
      AWS_MOCK.mock('SQS', 'sendMessage', sendStub)

      const testQueue = new Queue('a queue', 'me')
      testQueue.url = 'a url'

      return testQueue.sendMessage('this is a test message')
        .should.eventually.be.rejectedWith('SQS sendMessage has failed')
        .and.should.eventually.be.an.instanceOf(Error)
    })

    it('should be fulfilled with the SQS sendMessage response if SQS succeeds', () => {
      const sendStub = sandbox.stub()
      sendStub.callsArgWith(1, null, 'message sent')
      AWS_MOCK.mock('SQS', 'sendMessage', sendStub)

      const testQueue = new Queue('a queue', 'me')
      testQueue.url = 'a url'

      return testQueue.sendMessage('this is a test message')
        .should.eventually.be.fulfilled
        .and.should.eventually.equal('message sent')
    })
  })
})
