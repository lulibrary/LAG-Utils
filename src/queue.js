require('aws-sdk/clients/sqs')
const AWS = require('aws-sdk/global')

const _merge = require('lodash.merge')

class Queue {
  constructor (queueParms) {
    this.name = queueParms.name
    this.owner = queueParms.owner
    this.url = queueParms.url
    this.sqs = new AWS.SQS()
    this.pendingMessages = []
  }

  getQueueUrl () {
    const params = {
      QueueName: this.name,
      QueueOwnerAWSAccountId: this.owner
    }

    return this.sqs.getQueueUrl(params)
      .promise()
      .then(data => {
        this.url = data.QueueUrl
      })
  }

  sendMessage (message) {
    return this._callOnSQS('sendMessage', { MessageBody: message })
  }

  sendPending () {
    return this._callOnSQS('sendMessageBatch', { Entries: this.pendingMessages })
      .then(res => {
        this.pendingMessages = []
        return res
      })
  }

  addPending (message) {
    this.pendingMessages.push({
      MessageBody: message
    })
  }

  receiveMessages (max = 10) {
    return this._callOnSQS('receiveMessage', { MaxNumberOfMessages: max })
      .then(data => data.Messages)
  }

  deleteMessage (receiptHandle) {
    return this._callOnSQS('deleteMessage', { ReceiptHandle: receiptHandle })
  }

  _callOnSQS (method, params = {}) {
    return this._ensureUrl()
      .then(() => {
        return this.sqs[method](_merge({ QueueUrl: this.url }, params)).promise()
      })
  }

  _ensureUrl () {
    return this.url
      ? Promise.resolve()
      : this.getQueueUrl()
        .catch(e => {
          throw new Error('Unable to get Queue URL')
        })
  }
}

module.exports = Queue
