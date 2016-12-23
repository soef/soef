var expect = require('chai').expect;
var soef = require(__dirname + '/../soef');

var Adapter = function() {
	this.adapterDir = 'c:\1',
	this.namespace = 'soef.0',
	this.getForeignStates = function(filter, options, cb) {
		var states = {
			'soef.0.device.channel.state': {
				id: 1,
				val: 'Value'
			}
		};
		cb(0, states);
	};
	this.getDevices = function(cb) {
		var device = { _id: this.namespace + '.device', common: {name: 'device name'} };
		var devices = [];
		devices.push(device);
		cb(0, devices);
	};
    this.getChannels = function(name, cb) {
		if (typeof(name) == 'function') {
			cb = name;
			name = '';
		}
		var channel = { _id: this.namespace + '.device.channel', common: {name: 'channel name'} };
		var channels = [];
		channels.push(channel);
		cb(0, channels);
	};
			
};

var adapter = new Adapter();

describe('Test soef', function() {
    before('Test before', function (_done) {
        this.timeout(600000); // because of first install from npm
        _done();
    });

    it('Timer()', function (done) {
        this.timeout(1010);
		var timer = soef.Timer();
		timer.set(function(v) {
            //expect(v).to.be.null;
            // expect(obj).to.be.an('object');
            expect(v).not.to.be.null;
			expect(v).to.be.a('number');
			expect(v).to.equal(314);
            done();
        }, 1000, 314);
    });

    it('main()', function (done) {
		this.timeout(1000);
		soef.main(adapter, function() {
			expect(devices).to.be.an('object');
			expect(devices.getval('device.channel.state1', 'default')).to.equal('default');
			expect(devices.getval('device.channel.state')).to.equal('Value');
			done();
		});
    });
	it('sprintf()', function(done) {
		expect(soef.sprintf('%08X', 0xffff00)).to.equal('00FFFF00');
		done();
	});

    after('Test after', function (done) {
        this.timeout(10000);

            done();
    });
});
