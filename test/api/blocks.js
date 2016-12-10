'use strict'; /*jslint mocha:true, expr:true */

var node = require('./../node.js');

/*expecting testnet genesis block for tests*/
var block = {
	blockHeight: 1,
	id: 7807109686729042739,
	generatorPublicKey: '73ec4adbd8f99f0d46794aeda3c3d86b245bd9d27be2b282cdd38ad21988556b',
	totalAmount: 100000000,
	totalFee: 0, 
};

describe("Blocks API", function() {

  /*Define functions for use within tests*/
  function getLastBlocks(id, done) {
        node.get('/api/getLastBlocks?n=' + id, done);
  }

  function getBlock(id, done) {
        node.get('/api/getBlock?blockId=' + id, done);
  }

  function getHeight(id, done) {
        node.get('/api/getHeight?height=' + id, done);
  }

  /*Define api endpoints to test */
  describe("GET /api/getLastBlocks", function() {

        it('should be ok', function(done) {
                getLastBlocks('0', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('blocks').to.be.a('array');
		node.expect(res.body.blocks.length).to.equal(20);
                done();
                 });
         });
  });

  describe("GET /api/getBlockStatus", function() {
	it('should be ok', function(done) {
		node.get('/api/getBlockStatus', function(err, res) {
		node.expect(res.body).to.have.property('success').to.be.ok;
		node.expect(res.body).to.have.property('broadhash').to.be.a('string');
		node.expect(res.body).to.have.property('epoch').to.be.a('string');
		node.expect(res.body).to.have.property('height').to.be.a('number');
		node.expect(res.body).to.have.property('fee').to.be.a('number');
		node.expect(res.body).to.have.property('milestone').to.be.a('number');
		node.expect(res.body).to.have.property('nethash').to.be.a('string');
		node.expect(res.body).to.have.property('reward').to.be.a('number');
		node.expect(res.body).to.have.property('supply').to.be.a('number');
		done();
     		 });
   	 });
  });

  describe("GET /api/getBlock", function() {

  	it('using known blockId should be ok', function(done) {
	getBlock('7807109686729042739', function(err, res) {
		node.expect(res.body).to.have.property('success').to.be.ok;
		node.expect(res.body).to.have.property('block').to.be.a('object');
		node.expect(res.body.block).to.have.property('id').to.be.a('string');
		done();
		});
   	});


	it('using unknown blockId should fail', function (done) {
	getBlock('9928719876370886655', function (err, res) {
		node.expect(res.body).to.have.property('success').to.be.not.ok;
		node.expect(res.body).to.have.property('error').to.be.a('string');
		done();
		});
	});

	it('using no blockId should fail', function (done) {
	getBlock('', function (err, res) {
		node.expect(res.body).to.have.property('success').to.be.not.ok;
		node.expect(res.body).to.have.property('error').to.be.a('string');
		done();
		});
	});
  });

  describe("GET /api/getHeight", function() {

        it('using known height be ok ', function(done) {
                getHeight('1', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.ok;
                node.expect(res.body).to.have.property('block').to.be.a('object');
		node.expect(res.body.block.id).to.equal('7807109686729042739');
                done();
                 });
         });

        it('using invalid heightshould fail', function(done) {
                getHeight('-1', function(err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error').to.be.a('string');
                done();
                 });
         });

        it('using no height should fail', function (done) {
      		getHeight('', function (err, res) {
                node.expect(res.body).to.have.property('success').to.be.not.ok;
                node.expect(res.body).to.have.property('error').to.be.a('string');
                done();
                });
        });
  });

});
