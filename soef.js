/**
 tools for an ioBroker Adapter v0.0.0.1

 Copyright (c) 2016 soef <soef@gmx.net>
 All rights reserved.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
 DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 **/

"use strict";

//var ES6 = false;
//
//function determinateNodeVersion() {
//    var ar = process.version.substr(1).split('.');
//    ES6 = ar[0] >> 0 > 0 || (ar[1] >> 0 >= 12);
//}
//determinateNodeVersion();

function hasProp (obj, propString) {
    if (!obj) return false;
    var ar = propString.split('.');
    var len = ar.length;
    for (var i = 0; i < len; i++) {
        obj = obj[ar[i]];
        if (obj === undefined) return false;
    }
    return true;
}
exports.hasProp = hasProp;
exports.hasProperty = hasProp;

function getProp (obj, propString) {
    if (!obj) return undefined;
    var ar = propString.split('.');
    var len = ar.length;
    for (var i = 0; i < len; i++) {
        obj = obj[ar[i]];
        if (obj === undefined) return undefined;
    }
    return obj;
}
exports.getProp = getProp;

//Object.prototype.hasProp = function(v) {
//    return hasProp (this,v);
//};


var njs = {

    iscb: function (cb) {
        return typeof cb === 'function';
    },

    bind: function(func, that) {
        return function() {
            return func.apply(that, arguments);
        };
    },

    _fullExtend: function (dest, from) {
        var props = Object.getOwnPropertyNames(from), destination;

        props.forEach(function (name) {
            if (typeof from[name] === 'object') {
                if (typeof dest[name] !== 'object') {
                    dest[name] = {}
                }
                _fullExtend(dest[name],from[name]);
            } else {
                destination = Object.getOwnPropertyDescriptor(from, name);
                Object.defineProperty(dest, name, destination);
            }
        });
    },
    fullExtend: function (dest, from) {
        _fullExtend(dest, from);
        return dest;
    },

    safeCallback: function safeCallback(callback, val1, val2) {
        if (njs.iscb(callback)) {
            callback(val1, val2);
        }
    },

    forEachCB: function (maxcnt, func, readyCallback) {
        var cnt = -1;

        function doit(ret) {
            if (++cnt >= maxcnt) {
                return njs.safeCallback(readyCallback, ret);
            }
            func(cnt, doit);
        }

        doit(-1);
    },
    forEachSync: function (maxcnt, func, readyCallback) {
        var cnt = -1;

        function doit(ret) {
            if (++cnt >= maxcnt) {
                return njs.safeCallback(readyCallback, ret);
            }
            func(cnt, doit);
        }

        doit(-1);
    },

    forEachObjSync: function (objects, step, func, readyCallback) {
        if(typeof step === 'function') {
            readyCallback = func;
            func = step;
            step = 1;
        }
        var objs = [];
        if (!(objects instanceof Array)) {
            for (var i in objects) {
                objs.push(i);
            }
        } else {
            objs = objects;
        }
        var pop = step == -1 ? objs.pop : objs.shift;

        function doit(ret) {
            if (objs.length <= 0) {
                return safeCallback(readyCallback, ret);
            }
            func(pop.call(objs), doit);
        }

        doit(-1);
    },

    dcs: function (deviceName, channelName, stateName) {
        if (stateName === undefined) {
            stateName = channelName;
            channelName = '';
        }
        if (stateName[0] === '.') {
            return stateName.substr(1);
        }
        var ret = '';
        //if (ES6) {
        //    for (var i of [deviceName, channelName, stateName]) {
        //        if (!ret) ret = i;
        //        else if (i) ret += '.' + i;
        //    }
        //} else {
        var ar = [deviceName, channelName, stateName];
        for (var i = 0; i < ar.length; i++) {//[deviceName, channelName, stateName]) {
            var s = ar[i];
            if (!ret) ret = s;
            else if (s) ret += '.' + s;
        }
        //}
        return ret;
    },

    pattern2RegEx: function (pattern) {
        if (pattern != '*') {
            if (pattern[0] == '*' && pattern[pattern.length - 1] != '*') pattern += '$';
            if (pattern[0] != '*' && pattern[pattern.length - 1] == '*') pattern = '^' + pattern;
        }
        pattern = pattern.replace(/\./g, '\\.');
        pattern = pattern.replace(/\*/g, '.*');
        return pattern;
    },

    tr: {
        '\u00e4': 'ae',
        '\u00fc': 'ue',
        '\u00f6': 'oe',
        '\u00c4': 'Ae',
        '\u00d6': 'Oe',
        '\u00dc': 'Ue',
        '\u00df': 'ss',
        ' ': '_',
        '.': '_'
    },

    normalizedName: function (name) {
        return name.replace(/[\u00e4\u00fc\u00f6\u00c4\u00d6\u00dc\u00df .]/g, function ($0) {
            return njs.tr[$0]
        })
    },

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    //hasProp: hasProp,

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    idWithoutNamespace: function (id, _adapter) {
        if (_adapter == undefined) _adapter = adapter;
        return id.substr(_adapter.namespace.length+1);
    },

    removeAllObjects: function  (adapter, callback) {

        adapter.getStates('*', function (err, states) {
            var st = [];
            for (var i in states) {
                st.push(i);
            }
            var s = 0;

            function dels() {

                if (s >= st.length) {
                    adapter.getChannels(function (err, channels) {
                        var c = 0;

                        function delc() {
                            if (c >= channels.length) {
                                adapter.getDevices(function (err, devices) {
                                    var d = 0;

                                    function deld() {
                                        if (d >= devices.length) {
                                            callback();
                                            return;
                                        }
                                        var did = devices[d++]._id;
                                        did = idWithoutNamespace(did);
                                        //adapter.delDevice(did, function(err,obj) {
                                        adapter.deleteDevice(did, function (err,obj) {
                                            deld();
                                        });
                                    }
                                    deld();
                                });
                                return;
                            }
                            adapter.deleteChannel(channels[c]._id, function () {
                                delc();
                            });
                        }
                        delc();
                    });
                    return;
                }
                var nid = st[s++];
                adapter.delState(nid, function () {
                    adapter.delObject(nid, function() {
                        dels();
                    });
                });
            }
            dels();
        });
    },

    REMOVE_ALL: function  (adapter, callback) {
        if (callback) callback();
    },

    //REMOVE_ALL: function  (adapter, callback) {
    //
    //    function idWitoutNamespace(id, _adapter) {
    //        if (_adapter == undefined) _adapter = adapter;
    //        return id.substr(_adapter.namespace.length+1);
    //    }
    //
    //    adapter.getForeignStates(adapter.namespace + '.*', {}, function(err, states) {
    //        if (err || !states) return;
    //        for (var fullId in states) {
    //            adapter.delState(idWitoutNamespace(fullId));
    //        }
    //        adapter.getDevices(function (err, devices) {
    //            for (var d = 0; d < devices.length; d++) {
    //                adapter.deleteDevice(idWitoutNamespace(devices[d]._id));
    //            }
    //            adapter.log.debug("devices deleted");
    //            adapter.getChannels('', function (err, channels) {
    //                for (var d = 0; d < channels.length; d++) {
    //                    adapter.deleteChannel(idWitoutNamespace(channels[d]._id));
    //                }
    //                adapter.log.debug("channels deleted");
    //                adapter.getStates('*', {}, function (err, states) {
    //                    for (var d in states) {
    //                        adapter.delState(idWitoutNamespace(d));
    //                    }
    //                    adapter.log.debug("states deleted");
    //                    safeCallback(callback);
    //                });
    //            });
    //        });
    //    });
    //    return true;
    //},


//REMOVE_ALL: function  (adapter, callback) {
//
//        adapter.getForeignStates(adapter.namespace + '.*', {}, function(err, states) {
//            if (err || !states) return;
//            for (var fullId in states) {
//                adapter.delState(fullId);
//            }
//            adapter.getDevices(function (err, devices) {
//                for (var d = 0; d < devices.length; d++) {
//                    adapter.deleteDevice(devices[d]._id);
//                }
//                adapter.log.debug("devices deleted");
//                adapter.getChannels('', function (err, channels) {
//                    for (var d = 0; d < channels.length; d++) {
//                        adapter.deleteChannel(channels[d]._id);
//                    }
//                    adapter.log.debug("channels deleted");
//                    adapter.getStates('*', {}, function (err, states) {
//                        for (var d in states) {
//                            adapter.delState(d);
//                        }
//                        adapter.log.debug("states deleted");
//                        safeCallback(callback);
//                    });
//                });
//            });
//        });
//        return true;
//    },

    valtype: function (val) {
        switch (val) {
            //fastest way for most states
            case 'true':
                return true;
            case 'false':
                return false;
            case '0':
                return 0;
            case '1':
                return 1;
            case '2':
                return 2;
            case '3':
                return 3;
            case '4':
                return 4;
            case '5':
                return 5;
            case '6':
                return 6;
            case '7':
                return 7;
            case '8':
                return 8;
            case '9':
                return 9;
        }
        var number = parseInt(val);
        if (number.toString() === val) return number;
        var float = parseFloat(val);
        if (float.toString() === val) return float;
        return val;
    },

    formatValue: function (value, decimals, _format) {
        if (_format === undefined) _format = ".,";
        if (typeof value !== "number") value = parseFloat(value);

        var ret = isNaN(value) ? "" : value.toFixed(decimals || 0).replace(_format[0], _format[1]).replace(/\B(?=(\d{3})+(?!\d))/g, _format[0]);
        return (ret);
    }

};

for (var i in njs) {
    global[i] = njs[i];
    //module.parent[i] = njs[i];
}

function extendGlobalNamespace() {
    for (var i in njs) {
        global[i] = njs[i];
    }
}

var adapter;
function errmsg () { console.debug("adapter not assigned, use Device.setAdapter(yourAdapter)") };

//if (module.parent.exports['adapter']) {
if (hasProp(module, 'parent.exports.adapter')) {
    adapter = module.parent.exports.adapter;
} else {
    adapter = {
        setState: errmsg,
        setObject: errmsg,
        setObjectNotExists: errmsg,
        getStates: errmsg
    };
}

var objects = {};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function setObject(id, obj, options, callback) {
    return adapter.objects.setObject(adapter.namespace + '.' + id, obj, options, callback);
}
function getObject(id, options, callback) {
    return adapter.objects.getObject(adapter.namespace + '.' + id, options, callback);
}
function setState(id, val, ack) {
    ack = ack || true;
    adapter.setState(id, val, ack);
}

function setObjectNotExists(id, newObj, callback) {
    getObject(id, {}, function (err, o) {
        if (!o) {
            setObject(id, newObj, {}, callback)
            return;
        }
        safeCallback(callback, "exists", o);
    })
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Devices (_adapter, _callback) {

    //if (_adapter && !(_adapter instanceof Adapter)) {
    if (!_adapter || !_adapter.adapterDir) {
        _callback = _adapter;
        _adapter = undefined;
    }
    var that = this;
    this.list = [];

    this.setAdapter = function (_adapter) {
        adapter = _adapter;
    };
    this.has = function (id, prop) {
        var b = objects.hasOwnProperty(id);
        if (prop === undefined) return b;
        return (b && objects[id] !== null && objects[id].hasOwnProperty(prop));
    };
    this.get = function (id) {
        return (objects[id]);
    };
    this.remove = function(id) {
        delete objects[id];
    };
    this.setraw = function (id, obj) {
        objects[id] = obj;
    };

    this.getobjex = function (id) {
        var obj = this.get(id);
        if (obj || !adapter || !adapter.namespace) return obj;
        id = id.substr(adapter.namespace.length+1);
        return objects[id];
    };
    this._getobjex = function(id) {
        return this.getobjex(id) || { val: undefined };
    };
    this.invalidate = function (id) {
        this._getobjex(id).val = undefined;
    };
    this.setrawval = function (id, val) {
        this._getobjex(id).val = val;
    };

    this.getKeys = function (pattern) {
        var r = new RegExp(pattern2RegEx(pattern));
        var result = [];
        for (var id in objects) {
            if (r.test(id)) result.push(id);
        }
        return result;
    };

    this.foreach = function (pattern, callback) {
        var r = new RegExp(pattern2RegEx(pattern));
        for (var id in objects) {
            if (r.test(id)) {
                if (callback (id, objects[id]) === false) {
                    return { id: id, val: objects[id]};
                }
            }
        }
    };

    this.createObjectNotExists = function (id, obj, callback) {
        var val;
        var newobj = {
            type: 'state',
            common: {
                name: id,
                type: 'string',
                role: obj.type || 'state',
                //enumerable: true
                //writable: false
            },
            native: { }
        };
        _fullExtend(newobj, obj);

        if (obj['val'] !== undefined) {
            newobj.common.type = typeof obj.val;
            val = obj.val;
            delete newobj.val;
        }
        setObjectNotExists(id, newobj, function(err, o) {
            if (!err) {
                //that.states[newobj._id] = newobj;
                objects[newobj._id] = newobj;
                if (val !== undefined) {
                    that.setState(newobj._id, val, true)
                }
            }
            safeCallback(callback, err, o);
        });
    };

    this.setState = function (id, val, ack) {
        if (val !== undefined) objects[id].val = val;
        else val = objects[id].val;
        ack = ack || true;
        setState(id, val, ack);
    };

    this.setStateEx = function (id, newObj, ack, callback) {
        if (typeof ack === 'function') {
            callback = ack;
            ack = true
        }
        if (typeof newObj !== 'object') {
            newObj = { val: newObj };
        }
        if (ack === undefined) ack = true;
        if (!that.has(id)) {
            that.createObjectNotExists(id, newObj, callback);
        } else {
            if (objects[id].val !== newObj.val) {
                that.setState(id, newObj.val, ack);
            }
            safeCallback(callback, 0);
        }
    };

    function val2obj(valOrObj, showName) {
        //if (valOrObj === null) return;
        if (!valOrObj) return;
        if (typeof valOrObj === 'object') {
            var obj = valOrObj;
        } else {
            var obj = {};
            if (valOrObj !== undefined) {
                obj.val = valtype(valOrObj);
            }
        }
        if (showName) {
            _fullExtend(obj, { common: { name: showName}});
        }
        return obj;
    }

    this.updateAsync = function (list, callback) {
        if (typeof list === 'function') {
            callback = list;
            list = null;
        }
        if (!list) {
            list = that.list;
            that.list = {};
        }
        if (!list) return callback(-1);
        if (Array.isArray(list)) {
            for (var i=0; i<list.length; i++) {
                var objName = Object.keys( list[i] )[ 0 ];
                this.setStateEx(objName, list[i][objName]);
            }
        } else {
            for (var id in list) {
                this.setStateEx(id, list[id]);
            }
        }
        safeCallback(callback, 0);
    };

    this.update = function (list, callback) {
        if (typeof list === 'function') {
            callback = list;
            list = null;
        }
        if (!list || that.list === list) {
            list = that.list;
            that.list = [];
            if (that.root.list) that.root.list = that.list;
        }
        if (!list || list.length == 0) return safeCallback(callback, -1);

        forEachObjSync(list, function (obj, doit) {
                that.setStateEx(obj._id, obj, true, doit);
            },
            callback
        );
    };

    function _setobjname(o, name) {
        if (o['common'] === undefined) {
            o['common'] = { name: name};
        } else {
            o.common['name'] = name;
        }
    }

    this.setObjectName = function (id, name) {
        if (!objects[id] || !objects[id].common || !objects[id].common.name) {
            var o = {common: {name: ''} };
            if (!objects[id]) {
                objects[id] = {};
            }
            _setobjname(objects[id], '');
        }
        if (objects[id].common.name !== name) {
            adapter.getObject(id, {}, function (err, obj) {
                if (err || !obj) {
                    return;
                }
                if (obj.common.name !== name) {
                    obj.common.name = name;
                    adapter.setObject(id, {}, obj);
                }
                objects[id].common.name = name;
            });
        }
    };

    this.readAllExistingObjects = function (callback) {
        //adapter.getStatesOf('', '', {}, function(err, states) {
        //adapter.getStates("*", {}, function (err, states) {
        adapter.getForeignStates(adapter.namespace + '.*', {}, function(err, states) {
            if (err || !states) return callback(-1);
            var namespacelen = adapter.namespace.length + 1;
            for (var fullId in states) {
                var id = fullId.substr(namespacelen),
                    as = id.split('.'),
                    s = as[0];
                for (var i=1; i<as.length; i++) {
                    //if (!that.has(s)) that.setraw(s, { exist: true });
                    //!!
                    if (!that.has(s)) that.setraw(s, {});
                    s += '.' + as[i];
                }
                that.setraw(id, { val: states[fullId] ? states[fullId].val : null});
            }

            function setObjectProperty(obj, names, val) {
                var dot = names.indexOf('.');
                if (dot > 0) {
                    var n = names.substr(0, dot-1);
                    if (obj[n] === undefined) {
                        obj[n] = {};
                    }
                    setObjectProperty(obj[n], names.substr(dot+1), val);
                }
                obj[names] = val;
            }

            function doIt(list) {
                for (var i = 0; i < list.length; i++) {
                    var id = list[i]._id.substr(namespacelen);
                    var o = {common: {name: list[i].common.name}};
                    if (!objects[id]) {
                        objects[id] = {};
                    };
                    if (list[i].native !== undefined) {
                        o['native'] = list[i].native;
                    }
                    fullExtend(objects[id], o);
                }
            }

            adapter.getDevices(function (err, devices) {
                doIt(devices);
                adapter.getChannels('', function (err, channels) {
                    doIt(channels);
                    safeCallback(callback, 0);
                });
            });
        });
    };


    this.CDevice = function CDevice (_name, showName, list) {
        if (!(this instanceof that.CDevice)) {
            return new that.CDevice(_name, showName, list);
        }

        var deviceName = '', channelName = '';
        var self = this;
        this.list = (list === undefined) ? that.list : list;

        function push (obj) {
            for (var i=0; i<self.list.length; i++) {
                if (self.list[i]._id === obj._id) {
                    return fullExtend(self.list[i], obj);
                }
            }
            self.list.push(obj);
            return obj;
        }

        this.setDevice = function (name, options) {
            channelName = "";
            if (!name) return;
            deviceName = normalizedName (name);
            var obj = { type: 'device', _id: deviceName };
            if (options) {
                Object.assign(obj, options);
            }
            return push(obj);
        };
        //this.setDevice(_name, showName ? { common : { name: showName}} : undefined);
        this.setDevice(_name, showName && typeof showName == 'string' ? {common: {name: showName}} : showName);

        this.setObjectName = function (id, showName) {
            for (var i=0; i<self.list.length; i++) {
                if (self.list[i]._id == id) {
                    _setobjname(self.list[i], showName);
                    return i;
                }
            }
            return -1;
        };

        this.setChannel = function (name, showNameOrObject) {
            if (name === undefined) channelName = "";
            else {
                channelName = name;
                var id = dcs(deviceName, channelName);
                if (!that.has(id)) {
                    if (typeof showNameOrObject == 'object') {
                        var obj = {type: 'channel', _id: id, common: {name: name} };
                        if (showNameOrObject.common) obj.common = showNameOrObject.common;
                        if (showNameOrObject.native) obj.native = showNameOrObject.native;
                    } else {
                        var obj = {type: 'channel', _id: id, common: {name: showNameOrObject || name}};
                    }
                    return push(obj);
                }
            }
        };

        function split(id, valOrObj, showName) {
            var ar = ((id && id[0] == '.') ? id.substr(1) : dcs(deviceName, channelName, id)).split('.');
            var dName = deviceName, cName = channelName;
            switch(ar.length) {
                case 3:
                    self.setDevice(ar.shift());
                case 2:
                    self.setChannel(ar.shift());
                default:
                    var ret = add (ar[0], valOrObj, showName);
                    deviceName = dName;
                    channelName = cName;
                    return ret;
            }
        }

        function add (name, valOrObj, showName) {
            //if (valOrObj === null) return;
            if (valOrObj == null) return;
            if (name.indexOf('.') >= 0) {
                return split(name, valOrObj, showName);
            }
            //var obj = val2obj(valOrObj, showName || name);
            //var obj = val2obj(valOrObj, valOrObj.common && valOrObj.common.name ? undefined : showName || name);
            var obj = val2obj(valOrObj, hasProp(valOrObj, 'common.name') ? undefined : showName || name);
            obj._id = dcs(deviceName, channelName, name);
            obj.type = 'state';
            return push(obj);
        }

        function __setVal(_id, newObj) {
            var val = newObj['val'] !== undefined ? newObj.val : newObj;
            if (objects[_id].val !== val) {
                that.setState(_id, val, true);
            }
        }

        this.dset = function(d,s,v,showName) {
            var _id = dcs(d, '', s);
            if (!objects[_id]) {
                return add ('.'+_id, v, showName);
            }
            __setVal(_id, v);
        };


        this.rset = function (id, newObj, showName) {
            return this.set('.' + id, newObj, showName);
        };

        this.set = function (id, newObj, showName) {
            if (newObj == undefined) return;
            var _id = dcs(deviceName, channelName, id);
            if (!objects[_id]) {
                return add (id, newObj, showName);
            }
            var val = newObj['val'] !== undefined ? newObj.val : newObj;
            if (objects[_id].val !== val) {
                that.setState(_id, val, true);
                return true;
            }
            return false; //objects[_id];
        };
        this.setex = function (id, newObj, showName) {
            if (adapter && id.substr(0, adapter.namespace.length) == adapter.namespace) {
                id = id.substr(adapter.namespace.length+1);
            }
            return this.set(id, newObj, showName);
        };

        this.getobjex = function (id) {
            var id = dcs(deviceName, channelName, id);
            return that.getobjex(id);
        };
        this._getobjex = function(id) {
            return this.getobjex(id) || { val: undefined };
        };
        this.invalidate = function (id) {
            this._getobjex(id).val = undefined;
        };
        this.setraw = function (id, val) {
            this._getobjex(id).val = val;
        };

        this.add = this.set;
        this.getFullId = function (id) {
            return dcs(deviceName, channelName, id);
        };
        this.get = function(channel, id) {
            if (id == undefined) {
                var _id = dcs(deviceName, channelName, channel);
            } else {
                var _id = dcs(deviceName, channel, id);
            }
            return objects[_id]
        };
        this.createNew = function (id, newObj, showName) {
            if (this.get(id)) return;
            this.set(id, newObj, showName);
        };
        this.setAndUpdate = function (id, newObj) {
            this.set(id, newObj);
            this.update();
        };
        this.setImmediately = this.setAndUpdate;

        this.update = function (callback) {
            if (this.list.length > 0) {
                that.update(this.list, callback);
            } else {
                safeCallback(callback);
            }
        };

    };

    this.CState = this.CDevice;
    this.root = new this.CDevice('');
    this.init = function (_adapter, callback) {
        this.setAdapter(_adapter);
        this.readAllExistingObjects(callback);
    };

    if (_adapter) {
        this.init(_adapter, _callback);
    }

    return this;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function parseIntVersion(vstr) {
    if (!vstr || vstr=='') return 0;
    var ar = vstr.split('.');
    var iVer = 0;
    for (var i=0; i<ar.length; i++) {
        iVer *= 1000;
        iVer += ar[i] >> 0;
    }
    return iVer;
}

function nop() {}

function savePrevVersion() {
    if(!hasProp(adapter, 'ioPack.common.version')) return;
    var id = 'system.adapter.' + adapter.namespace;
    var vid = id + '.prevVersion';

    function set() {
        adapter.states.setState(vid, { val: adapter.ioPack.common.version, ack: true, from: id });
    }

    adapter.objects.getObject(vid, function(err, obj) {
        if (err || !obj) {
            adapter.objects.setObject(vid, {
                type: 'state',
                common: {name: 'version', role: "indicator.state", desc: 'version check for updates'},
                native: {}
            }, function (err, obj) {
                set();
            });
            return;
        }
        set();
    })
}

function checkIfUpdated(doUpdateCallback, callback) {
    if(!adapter) return safeCallback(callback);
    if (!callback) callback = nop;
    var id = 'system.adapter.' + adapter.namespace;
    var vid = id + '.prevVersion';
    adapter.states.getState(vid, function(err, state) {
        var prevVersion = 0;
        var aktVersion = parseIntVersion(adapter.ioPack.common.version);
        prevVersion = parseIntVersion(hasProp(state, 'val') ? state.val : '0');
        if (prevVersion < aktVersion) {
            if (typeof doUpdateCallback == 'function') {
                doUpdateCallback(prevVersion, aktVersion, function (err) {
                    savePrevVersion();
                    callback();
                });
                return;
            } else {
                savePrevVersion();
            }
        }
        callback();
    });
}


function _main (_adapter, options, callback ) {

    if (!_adapter || !_adapter.adapterDir) {
        options = _adapter;
        callback = options;
        _adapter = adapter;
    }

    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    var _devices;
    if (options.devices) {
        _devices = options.devices;
    } else {
        _devices = new Devices();
        global.devices = _devices;
    }

    if (!options.doNotExportAdapter) {
        module.parent.exports = {
            adapter: _adapter
        };
    }

    var timer;
    var initDone = false;
    _adapter.getForeignObject('system.adapter.' + _adapter.namespace, function(err, obj) {
        if (!err && getProp(obj, 'common.enabled') === false) {
            // running in debuger
            _adapter.log.debug = console.log;
            _adapter.log.info = console.log;
            _adapter.log.warn = console.log;
            module.parent.__DEBUG__ = true;
        }
        if (!initDone) {
            if(timer) clearTimeout(timer);
            _devices.init(_adapter, function(err) {
                callback();
            });
        }
    });
    timer = setTimeout(function() {
        initDone = true;
        _devices.init(_adapter, function(err) {
            callback();
        });
    }, 10000)
};
exports.main = _main;

exports.Adapter = function (_args) {
    var args = arguments, fns = {};
    for (var i=0; i<args.length; i++) {
        var param = args[i];
        switch (typeof param) {
            case 'function':
                fns[param.name] = param;
                break;
            case 'object':
                fns.options = param;
                break;
        }
    }
    if (!fns.adapter) {
        fns.adapter = require(__dirname + '/../../lib/utils').adapter;
    }
    var options = fns.options;
    if (!options.unload) {
        options.unload = function (callback) {
            try {
                fns.onUnload ? onUnload(calback) : callback();
            } catch (e) {
                callback();
            }
        }
    }
    if (!options.stateChange && fns.onStateChange) {
        options.stateChange = function (id, state) {
            if (state && !state.ack) {


                ///!!/////xxxxxxxxxxx//////////////////////////////////////
                //var _id = id.substr(fns.adapter.namespace.length+1);
                //_id = id.slice(fns.adapter.namespace.length+1);
                //if (global.devices) {
                //    global.devices.setrawval(_id, state.val);
                //}
                /////////////////////////////////////////////////////////

                fns.onStateChange(id, state);
            }
        };
    }
    if (!options.ready && fns.main) {
        options.ready = function () {
            checkIfUpdated(fns.onUpdate, function() {
                _main(fns.main);
            });

            //if (fns.onUpdate) {
            //    checkIfUpdated(fns.onUpdate, function() {
            //        _main(fns.main);
            //    });
            //    return;
            //}
            //savePrevVersion();
            //_main(fns.main);
        }
    }
    if (!options.objectChange) {
        options.objectChange = function (id, obj) {
            if (id && obj == null && global.devices) {
                global.devices.remove(idWithoutNamespace(id));
            }
        }
    }
    if (!options.message && fns.onMessage) {
        options.message = function(obj) {
            if (obj) fns.onMessage(obj);
        }
    }
    fns.adapter = fns.adapter(options);
    if (!adapter || !adapter.adapterDir) {
        adapter = fns.adapter;
    }
    return fns.adapter;
};

//module.exports =  function(useGlobalNamespace) {
//    if (useGlobalNamespace) {
//        //for (var i in njs) {
//        //    module.parent[i] = njs[i];
//        //}
//        extendGlobalNamespace ();
//    }
//    return { Devices: Devices, CDeviceQueue: CDeviceQueue, /*njs: njs,*/ extendGlobalNamespace: extendGlobalNamespace}
//}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


exports.TimeDiff = function () {
    if (!(this instanceof exports.TimeDiff)) return new exports.TimeDiff();
    this.get = process.hrtime;

    this.getDif = function() {
        var ar = this.get();
        var start = this.start[0] * 1e9 + this.start[1];
        var end = ar[0] * 1e9 + ar[1];
        return end - start;
    };

    this.getMillis = function() {
        return this.getDif() / 1000000 >> 0;
    };
    this.getMicros = function() {
        return this.getDif() / 1000 >> 0;
    };
    this.start = function () {
        this.start = this.get();
    };

    this.start = process.hrtime();
    return this;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.Devices = Devices;
exports.njs = njs;
exports.extendGlobalNamespace = extendGlobalNamespace;

try {
    var _sprintf = require('sprintf-js');
    exports.sprintf = _sprintf.sprintf;
    exports.vsprintf = _sprintf.vsprintf;
} catch(e) {
    exports.sprintf = function(fs) { return 'sprintf-js not loaded ' + fs}
    exports.vsprintf = exports.sprintf
}

