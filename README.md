# LAG-Utils
A nodeJS package for interacting with AWS services

This package provides wrapper classes for AWS DynamoDB Tables, SNS Topics and SQS Queues

## Utils.Topic
This is a wrapper for SNS topics. It is constructed as 
```javascript
let myTopic = new Topic(arn, region)
```
### methods
`topic.publish(message)`
Publishes a message to the topic.

## Utils.Queue
A wrapper for SQS queues.
```javascript
let myQueue = new Queue({
    name: 'my_queue',
    owner: '123456789'
    url: 'https://12345678.sqs.amazaonaws.com/my_queue'
}) // Either the queue URL, or the name and owner are required to send messages to the queue
```
### methods
`queue.sendMessage(message)`
`queue.getQueueUrl()`
Resolve the Queue URL from the `name` and `owner` (if set)
`queue.receiveMessages(max)`
`queue.deleteMessage(receiptHandle)`
`addPending(message)`
Add a message to the list of pending messages to be sent
`sendPending()`
Send all pending messages as a batch

## DB
__NOTE: This class is not currently in use by any service in the Alma caching stack, and may be removed in the future.__
Wrapper for DynamoDB. 
```javascript
let myTable = new DB(tableName, region)
```
### methods
`db.get(Key)`
`db.delete(Key)`
`db.save(data)`

## Usage

`npm installgit+ssh://git@github.com/lulibrary/LAG-Utils.git#master`
```javascript
const { Queue, Topic, DB } = require('@lulibrary/lag-utils')
```

## Associated Services

There are four services that make up the Alma caching stack. These are:

- [alma-webhook-handler](https://github.com/lulibrary/alma-webhook-handler)       -   passes Alma webhook data to SNS topics :
- [LAG-sns-update-cache](https://github.com/lulibrary/LAG-sns-update-cache)       -   writes webhook data from SNS topics to  DynanoDB
- [LAG-bulk-update-cache](https://github.com/lulibrary/LAG-bulk-update-cache)     -   updates DynamoDB with data from Alma API for queued records
- [LAG-api-gateway](https://github.com/lulibrary/LAG-api-gateway)                 -   provides a REST API for cached Alma data with fallback to Alma API

There are also 3 custom packages on which these depend. These are:
- [LAG-Utils](https://github.com/lulibrary/LAG-Utils)                             -   utility library for AWS services
- [LAG-Alma-Utils](https://github.com/lulibrary/LAG-Alma-Utils)                   -   utility library for DynamoDB cache schemas
- [node-alma-api-wrapper](https://github.com/lulibrary/node-alma-api-wrapper)     -   utility library for querying Alma API


## Development
Contributions to this service or any of the associated services and packages are welcome.
