var expect = require('chai').expect;
var soef = require(__dirname + '/../soef');

var log = {
    debug: console.log,
    info: console.log,
    eror: console.log
}

var Adapter = function(options) {
    
    var self = this;
    if (options !== undefined) {
        for (var n in options) {
            if (typeof options[n] === 'function') {
                this[n] = options[n];
            }
        }
    }
    
    this.test = {
        results: { objects: {}, states: {} },
    	oldVersion: '0.1.15',
        //newVersion: '0.0.16'
		setVersions: function(o, n) {
        	this.test.oldVersion = 0;
        	this.ioPack.common.version = n;
		}
    };
    this.log = log;
    this.adapterDir = 'c:\1';
    this.namespace = 'soef.0';
    this.ioPack = { common: { version: '0.1.16' } };
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

    this.getState = function (id, cb) {
    	switch(id) {
            case 'system.adapter.soef.0.prevVersion':
            	cb(0, { val: self.test.oldVersion } );
                break;
        }
	}
	this.states = {};
    this.states.getState = this.getState;
    this.states.setState = function(id, obj, cb) {
    	self.test.results.states[id] = obj;
    	cb && typeof cb === 'function' && cb(0, {})
    };
    
    this.getObject = function (id, cb) {
        switch(id) {
            case 'system.adapter.soef.0.prevVersion':
                return cb(-1, 0);
        }
        cb(0, {});
    }
    this.objects = {};
    this.objects.getObject = this.getObject;
    
    this.setObject = function(id, obj, cb) {
    	self.test.results.objects[id] = obj;
    	cb(0, obj);
	}
	this.objects.setObject = this.setObject;

};

var adapter = new Adapter();

function test() {
}
//test();
//return;



describe('Test soef', function() {
    before('Test before', function (done) {
        this.timeout(2000);
        done();
    });

    it('Timer()', function (done) {
        this.timeout(1500);
        var timer = soef.Timer();
        timer.set(function(v) {
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
    
    it('Object.assign()', function (done) {
        this.timeout(1500);
        var o = {
            p1: 1,
            o: {
                p1: 0,
            },
            ar: [1,2,3]
        };
        var oo = Object.assign({}, o);
        o.p1 = 2;
        o.ar.pop();
        o.o.p1 = 2;
        expect(oo).not.to.be.null;
        expect(oo.ar.length).to.equal(2);
        expect(oo.p1).to.equal(1);
        expect(oo.o.p1).to.equal(2);
        done();
    });
    
    it('Devices', function(done) {
        var devices = new soef.Devices(adapter);
        expect(devices).not.to.be.null;
        expect(devices).to.be.an('object');
        var dev = new devices.CDevice();
        expect(dev).not.to.be.null;
        expect(dev).to.be.an('object');
        
        dev.createNew('name', { name: 'reconnectInternet', val: false, common: { min: false, max: true }, native: { }  });
        //expect(oo.o.p1).to.equal(2);
        
        devices.setAdapter(undefined);
        done();
    });
    
    it('hasProp', function(done) {
    	var testObj = { a: { b: { c: 1 }}};
    	expect(soef.hasProp()).to.equal(false);
        expect(soef.hasProp(testObj, 'x')).to.equal(false);
        expect(soef.hasProp(testObj, 'a.b.c')).to.equal(true);
    	done();
	});
    
    it('getProp', function(done) {
        var testObj = { a: { b: { c: 314 }}};
        expect(soef.getProp()).to.equal(undefined);
        expect(soef.getProp(testObj, 'x')).to.equal(undefined);
        expect(soef.getProp(testObj, 'a.b.c')).to.equal(314);
        done();
    });
    
    it('CNamespace', function(done) {
        var ns = soef.CNamespace (adapter);
        expect(ns).to.be.an('object');
        expect(ns.no('soef.0.state')).to.equal('state');
        expect(ns.no('')).to.equal('');
        expect(ns.add('state')).to.equal('soef.0.state');
        expect(ns.add('soef.0.state')).to.equal('soef.0.state');
        expect(ns.is('soef.0.state')).to.equal(true);
        expect(ns.is('state')).to.equal(false);
        done();
    });
    
    it('Adapter', function(done) {
        var adp;
        this.timeout(3000);

        function onStateChange(state) {
        	adp.test.results.onStateChange = state;
        };
        function onUpdate(oldVersion, newVersion, cb) {
            adp.test.results.onUpdate = 'o:'+oldVersion + ',n:'+newVersion;
            cb();
        }
        function main() {
            expect(adp).to.be.an('object');
            expect(adp.test.results.onUpdate).to.equal('o:1015,n:1016');
            expect(adp.test.results.onStateChange).to.equal('stateval');

            expect(adp.test.results.objects ['system.adapter.soef.0.prevVersion'].common.name).to.equal('version');
            expect(adp.test.results.states ['system.adapter.soef.0.prevVersion'].val).to.equal(adp.ioPack.common.version);

            done();
        };
        function adapter(options) {
            var ret = new Adapter(options);
            setTimeout(onStateChange, 100, 'stateval')
            setTimeout(function() {
                ret.ready();
            }, 500);
            return ret;
        }
        adp = soef.Adapter(
            onStateChange,
            main,
            adapter,
            onUpdate,
            {name: 'soef'}
        );
    })
	
    after('Test after', function (done) {
        this.timeout(1000);
        done();
    });
    
});
