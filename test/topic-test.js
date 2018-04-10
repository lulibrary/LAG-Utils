const AWS_MOCK = require('aws-sdk-mock');
const SNS = require('aws-sdk/clients/sns')
const sinon = require('sinon');

// Test libraries
const chai = require('chai');
const chai_as_promised = require('chai-as-promised')
const sinon_chai = require('sinon-chai')
chai.use(chai_as_promised);
chai.use(sinon_chai);
const should = chai.should();

// Test data
const eventTopicData = new Map([
  ["LOAN_CREATED", "arn:aws:sns:::"]
])

// Module under test
const Topic = require('../src/topic')

describe('Topic class tests', () => {

  describe('publish method tests', () => {
    afterEach(() => {
      AWS_MOCK.restore('SNS', 'publish')
    })

    it('should call SNS publish with the correct parameters', () => {
      const publishStub = sinon.stub();
      publishStub.callsArgWith(1, null, true)
      const input = {
        data: "some data"
      }
  
      const expected = {
        Message: '{"data":"some data"}',
        TargetArn: eventTopicData.get('LOAN_CREATED').sns_arn
      }
  
      AWS_MOCK.mock('SNS', 'publish', publishStub);
      const testTopic = new Topic(eventTopicData.get('LOAN_CREATED').sns_arn, 'eu-west-2')
      return testTopic.publish(input).then(() => {
        publishStub.should.have.been.calledWith(expected)
      });
    })
  
    it('should throw an error if SNS publish fails', () => {
      const publishStub = sinon.stub();
      publishStub.callsArgWith(1, new Error('Failed'), null)
      AWS_MOCK.mock('SNS', 'publish', publishStub);

      const testTopic = new Topic(eventTopicData.get('LOAN_CREATED').sns_arn, 'eu-west-2')
      return testTopic.publish("test").should.eventually.be.rejectedWith('Failed')
        .and.should.eventually.be.an.instanceOf(Error);
    })
  })

  describe('generate sns message method tests', () => {
    it('should stringify a data object', () => {
      const testData = {
        message: "this is a message",
        array: [1,2,3,4,5],
        obj: {
          param1: "value 1",
          param2: "value 2",
          param3: 3
        }
      }
      const testString = '{"message":"this is a message","array":[1,2,3,4,5],"obj":{"param1":"value 1","param2":"value 2","param3":3}}'

      const testTopic = new Topic("a topic", 'eu-west-2');
      const result = testTopic.generateSnsMessage(testData);

      result.Message.should.equal(testString)
    })
  })
})