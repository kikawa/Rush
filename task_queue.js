//
// Copyright (c) Telefonica I+D. All rights reserved.
//
//

var redis = require('redis');
var config = require('./config_base').queue;

var path = require('path');
var log = require('./logger');
var logger = log.newLogger();
logger.prefix = path.basename(module.filename,'.js');

// ?????? Pool grande de conexiones a redis? Tiene sentido???

var rcli = redis.createClient(redis.DEFAULT_PORT, config.redis_host);
var rcliBlocking = redis.createClient(redis.DEFAULT_PORT, config.redis_host);


//redis.debug_mode = true;

function put(key, obj, err_fun) {
    "use strict";
    logger.debug('put', {key: key, obj: obj, err_fun: err_fun});

    var simple_req_str = JSON.stringify(obj);

    logger.debug('simple_req_str ', simple_req_str);

    rcli.lpush(key, simple_req_str,err_fun);
}

function get(keys, aux_queue_id, callback) {
    "use strict";
    logger.debug('get', {keys: keys, aux_queue_id: aux_queue_id, callback: callback});

    rcliBlocking.brpop(keys.control, keys.hpri, keys.lpri , 0, function onPop(err, data) {
            logger.debug("get",data);
            //technical DEBT dou to REDIS unsupported functionality
            //BRPOPLPUSH from multiple sources OR LUA Scripting
            rcli.lpush(aux_queue_id, data[1], function onPush(err){
                var obj = JSON.parse(data[1]);
                callback(err, { queueId: data[0], task: obj });
            });

    });

}

function get_pending(idconsumer, callback){
    "use strict";
    logger.debug('get_pending', {idconsumer: idconsumer, callback: callback});
    rcli.rpop(idconsumer, function onPendingData(err, data){
        var obj = JSON.parse(data);
        if(callback){callback(err, { queueId: 'PendingRecovery', task: obj });}
    });
}

function rem_processing_queue(idconsumer, callback) {
    "use strict";
    logger.debug('rem_processing_queue', {idconsumer: idconsumer, callback: callback});
    rcli.del(idconsumer, callback);
}

exports.put = put;
exports.get = get;
exports.rem_processing_queue = rem_processing_queue;
exports.get_pending = get_pending;
