const SNS = require('aws-sdk/clients/sns');
const AWS = require('aws-sdk/global');

class Topic {
  constructor(arn, region) {    
    this.arn = arn;
    this.sns = new AWS.SNS({ region });
  }

  publish (data) {
    let params = this.generateSnsMessage(data);

    return new Promise((resolve, reject) => {
      this.sns.publish(params, (err, data) => {
        err ? reject(err) : resolve(data)
      })
    })
  }

  generateSnsMessage(data) {
    return {
      Message: typeof(data) == "string" ? data : JSON.stringify(data),
      TargetArn: this.arn
    }
  }
}

module.exports = Topic