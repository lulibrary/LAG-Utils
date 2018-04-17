require('aws-sdk/clients/dynamodb')
const AWS = require('aws-sdk/global')

class DB {
  constructor (tableName, region = 'eu-west-2') {
    this.docClient = new AWS.DynamoDB.DocumentClient({ region })
    this.tableName = tableName
  }

  save (data) {
    const params = {
      Item: data,
      TableName: this.tableName
    }

    return this.docClient.put(params).promise()
  }

  get (Key) {
    const params = {
      TableName: this.tableName,
      Key
    }

    const timeNow = Math.floor(Date.now() / 1000)

    return new Promise((resolve, reject) => {
      this.docClient.get(params, (err, data) => {
        if (err) {
          reject(err)
        } else if (!data.Item) {
          reject(new Error('No matching record found'))
        } else if (data.Item.expiry_date && data.Item.expiry_date < timeNow) {
          reject(new Error('No matching record found'))
        } else {
          resolve(data.Item)
        }
      })
    })
  }

  delete (Key) {
    const params = {
      TableName: this.tableName,
      Key
    }

    // return new Promise((resolve, reject) => {
    //   this.docClient.delete(params, (err, data) => {
    //     err ? reject(err) : resolve(data)
    //   })
    // })
    return this.docClient.delete(params).promise()
  }
}

module.exports = DB
