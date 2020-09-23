const mongoose = require('mongoose');

var locationSchema = mongoose.Schema ({
  Name : {type: String, required: true},
  Contae : {type: String, required: true},
  Cuige : {type: String, required: true},
  ImagePath : String,
});
const bcrypt = require('bcryptjs');

var userSchema = mongoose.Schema ({
  Ainm:{type: String, required: true},
  Password : {type: String, required: true},
  Email : {type: String, required: true},
  Characters : [{
    ainm:String,
    class:String,	
  }]
});
userSchema.statics.hashPassword = function(password) {
  return bcrypt.hashSync(password, 10);
};
userSchema.methods.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.Password);
};


var Location = mongoose.model('Location', locationSchema);
var User = mongoose.model('User', userSchema);

module.exports.Location = Location;
module.exports.User = User;
