"use strict";

var expect = require('chai').expect;
var soef = require(__dirname + '/../soef');

var log = {
    debug: console.log,
    info: console.log,
    eror: console.log
};

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
    this.adapterDir = 'c:\\1';
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
	};
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
    };
    this.objects = {};
    this.objects.getObject = this.getObject;

    this.setObject = function(id, obj, cb) {
    	self.test.results.objects[id] = obj;
    	cb(0, obj);
	};
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

    // console.log('node version=' + soef.getNodeVersion());
    // if (soef.getNodeVersion() >= 6000000) {
    //     it ('[x,y] = array', function () {
    //         var [a, b, c] = ['a', 'b', 'c'];     // ab node version 6!!!
    //         expect (a).to.be.equal ('a');
    //         expect (b).to.be.equal ('b');
    //         expect (c).to.be.equal ('c');
    //     });
    // }


    it ('let', function () {
        let i = 1;
        expect (i).to.be.equal (1);
    });
    it ('const', function () {
        const i = 1;
        expect (i).to.be.equal (1);
    });
    it('for of', function() {
        var o = [ 1, 2,3,4,5];
        var sum = 0;
        for (var i of o) {
            sum += o;
        }
        expect(sum).to.be.equal(15);
    });


    it('String formating', function() {
        var today = 'today', is = 'is';
        var now = new Date();
        var s = `${today} ${is} ${now.toJSON()}`;
        var o = today + ' ' + is + ' ' + now.toJSON();
        expect(s).to.be.equal(o);
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
        //expect(soef.sprintf('%08X', 0xffff00)).to.equal('00FFFF00');
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

    it('dcs', function(done) {
        expect(soef.njs.dcs('', '', '')).to.equal('');
        expect(soef.njs.dcs('1', '', '')).to.equal('1');
        expect(soef.njs.dcs('1', '2', '')).to.equal('1.2');
        expect(soef.njs.dcs('1', '2', '3')).to.equal('1.2.3');
        expect(soef.njs.dcs('1.', '.2..', '')).to.equal('1.2');
        expect(soef.njs.dcs('1', '2')).to.equal('1.2');

        expect(soef.njs.dcs('1.', '2..', '..3')).to.equal('3');
        expect(soef.njs.dcs('1.', '2..', '.3')).to.equal('3');
        expect(soef.njs.dcs('1.', '2..', '.3..')).to.equal('3');
        expect(soef.njs.dcs('1.', '2..', '..3..')).to.equal('3');
        expect(soef.njs.dcs('..1.', '2..', '3')).to.equal('1.2.3');
        expect(soef.njs.dcs('.1.', '2..', '3..')).to.equal('1.2.3');
        expect(soef.njs.dcs('1.', '2..', '3..')).to.equal('1.2.3');

        expect(soef.njs.dcs('.', '.', '.')).to.equal('');

        expect(soef.njs.dcs('1', '2', '.a.b')).to.equal('a.b');
        expect(soef.njs.dcs('1', '', '.a.b')).to.equal('a.b');
        expect(soef.njs.dcs('1', '.a.b')).to.equal('a.b');

        expect(soef.njs.dcs('1', '2.', '3.4')).to.equal('1.2.3.4');

        done();
    });

    it('CDvice.split', function(done) {
        var devices = new soef.Devices();
        var dev = new devices.CDevice();

        var terms = [
            { d: '', c: '', s: '.1.2', result: '1.2'},
            { d: 'd', c: 'c', s: '.1.2', result: '1.2', o: false },
            { d: 'd', c: 'c', s: '1.2', result: 'd.c.1.2', o: false},
        ];
        terms.forEach(function(v,i) {
            dev.setDevice('');
            dev.setChannelEx();
            if (v.d !== undefined) dev.setDevice(v.d);
            if (v.c !== undefined) dev.setChannel(v.c);
            var n = dev.__testSplit(v.s, 'valOrObj', 'showName');
            var o = dev.__testSplit__Old(v.s, 'valOrObj', 'showName');
            if (v.o === undefined) expect(n).to.equal(o);
            expect(n._id).to.equal(v.result);
        });
        done();
    });

    it('CDvice.add', function(done) {
        var devices = new soef.Devices();
        var dev = new devices.CDevice();

        var terms = [
            { d: '', c: '', s: '.1.2', val: 1, result: '1.2'},
            { d: 'd', c: 'c', s: '.1.2', val: true, result: '1.2', o: false },
            { d: 'd', c: 'c', s: '1.2', val: '', result: 'd.c.1.2', o: false},
            //{ d: '', c: '', s: '1.2' },
            //{ d: '', c: '', s: '1.2' },
        ];
        terms.forEach(function(v,i) {
            if (v.d !== undefined) dev.setDevice(v.d);
            if (v.c !== undefined) dev.setChannel(v.c);
            var n = dev.add(v.s, v.val, 'showName');

        });
        var o; // = dev.list.shift();
        o = dev.list.shift();
        expect(o._id).to.equal(terms[0].result);
        o = dev.list.shift();
        expect(o._id).to.equal('d');
        expect(o.type).to.equal('device');
        o = dev.list.shift();
        expect(o._id).to.equal('d.c');
        expect(o.type).to.equal('channel');
        o = dev.list.shift();
        expect(o._id).to.equal(terms[2].result);
        expect(o.type).to.equal('state');
        done();
    });

    it('_fullExtend', function(done) {
        var from = { a: 'a', b: { a: 'a' }};
        var dest = { };

        soef.njs._fullExtend (dest, from);

        expect(JSON.stringify(dest)).to.equal(JSON.stringify(from));
        dest.b.a = 'c';
        expect(dest.b.a).to.equal('c');
        expect(from.b.a).to.equal('a');

        done();

    });

    it('clone', function (done) {
        var orig = { a: 'a', o: { a: 'a'}, ar: [1,2,3] };

        var cl = soef.njs.clone(orig);
        expect(cl).to.be.an('object');
        expect(cl).to.eql(orig);
        cl.o.a = 'c';
        expect(orig.o.a).to.be.equal('a');
        cl.ar[0] = 0;
        expect(orig.ar[0]).to.be.equal(1);
        done();
    });

    // it('clone 2', function (done) {
    //     var ar2 = [11,22];
    //     var orig = { a: 'a', o: { a: 'a'}, ar: [1,2,ar2] };
    //
    //     var cl = soef.njs.clone(orig);
    //     expect(cl).to.be.an('object');
    //     expect(cl).to.eql(orig);
    //     cl.o.a = 'c';
    //     expect(orig.o.a).to.be.equal('a');
    //     cl.ar[0] = 0;
    //     expect(orig.ar[0]).to.be.equal(1);
    //
    //     cl.ar[2][0] = 44;
    //
    //     done();
    // });
    //

    it('Adapter', function(done) {
        var adp;
        this.timeout(3000);

        function onStateChange(state) {
        	adp.test.results.onStateChange = state;
        }
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
        }
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
    });

    after('Test after', function (done) {
        this.timeout(1000);
        done();
    });

});
