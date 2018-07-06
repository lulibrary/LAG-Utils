require('aws-sdk/clients/sqs')
const AWS = require('aws-sdk/global')

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
    return this._ensureUrl()
      .then(() => {
        return this.sqs.sendMessage({
          MessageBody: message,
          QueueUrl: this.url
        }).promise()
      })
  }

  receiveMessages (max = 10) {
    return this._ensureUrl()
      .then(() => {
        return this.sqs.receiveMessage({
          QueueUrl: this.url,
          MaxNumberOfMessages: max
        }).promise()
      })
  }

  deleteMessage (receiptHandle) {
    return this._ensureUrl()
      .then(() => {
        return this.sqs.deleteMessage({
          QueueUrl: this.url,
          ReceiptHandle: receiptHandle
        }).promise()
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
