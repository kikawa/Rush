var redis = require('redis');
var rc = redis.createClient(6379, 'localhost');
rc.select(1);

exports.cleanDb = function(done){

  rc.flushall(function(err, res){
    if (done) done();
  });
}

exports.exit = function(){
  rc.quit();
}
