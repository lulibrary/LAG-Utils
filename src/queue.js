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
    return (this.url
      ? Promise.resolve()
      : this.getQueueUrl()
        .catch(e => {
          throw new Error('Unable to get Queue URL')
        }))
      .then(() => {
        return this.sqs.sendMessage({
          MessageBody: message,
          QueueUrl: this.url
        }).promise()
      })
  }
}

module.exports = Queue
