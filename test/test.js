const chai = require('chai');
const should = chai.should();

// Module under test
const Utils = require('../src');

describe('module tests', () => {
  it('should export an object', () => {
    Utils.should.be.an('object')
  })
})