require('aws-sdk/clients/sqs')
const AWS = require('aws-sdk/global')

class Queue {
  constructor (name, owner) {
    this.name = name
    this.owner = owner
    this.sqs = new AWS.SQS()
  }

  getQueueUrl () {
    return new Promise((resolve, reject) => {
      this.sqs.getQueueUrl({
        QueueName: this.name,
        QueueOwnerAWSAccountId: this.owner
      }, (err, data) => {
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

      return new Promise((resolve, reject) => {
        this.sqs.sendMessage(params, (err, data) => {
          err ? reject(err) : resolve(data)
        })
      })
    } else {
      throw new Error('Queue URL has not been set')
    }
  }
}

module.exports = Queue
