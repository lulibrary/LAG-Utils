require('aws-sdk/clients/sqs')
const AWS = require('aws-sdk/global')

const _merge = require('lodash.merge')

class Queue {
  constructor (queueParms) {
    this.name = queueParms.name
    this.owner = queueParms.owner
    this.url = queueParms.url
    this.sqs = new AWS.SQS()
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

  receiveMessages (max = 10) {
    return this._callOnSQS('receiveMessage', { MaxNumberOfMessages: max })
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
