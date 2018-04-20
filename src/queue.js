require('aws-sdk/clients/sqs')
const AWS = require('aws-sdk/global')

class Queue {
  constructor (name, owner) {
    this.name = name
    this.owner = owner
    this.sqs = new AWS.SQS()
  }

  getQueueUrl () {
    const params = {
      QueueName: this.name,
      QueueOwnerAWSAccountId: this.owner
    }

    return new Promise((resolve, reject) => {
      this.sqs.getQueueUrl(params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          this.url = data.QueueUrl
          resolve()
        }
      })
    })
  }

  sendMessage (message) {
    if (this.url) {
      const params = {
        MessageBody: message,
        QueueUrl: this.url
      }

      return this.sqs.sendMessage(params).promise()
    } else {
      throw new Error('Queue URL has not been set')
    }
  }
}

module.exports = Queue
