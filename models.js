const mongoose = require('mongoose');

var locationSchema = mongoose.Schema ({
  Title : {type: String, required: true},
  Description : {type: String, required: true},
  Status : {
    Name : String,
    Description : String
  },
  Taoiseach : {
    Name : String,
    Bio : String,
    DOB: Date
  },
  ImagePath : String,
  Featured : Boolean
});
const bcrypt = require('bcryptjs');

var userSchema = mongoose.Schema ({
  Username : {type: String, required: true},
  Password : {type: String, required: true},
  Email : {type: String, required: true},
  DOB : Date,
  FavouriteMovies : [{type: mongoose.Schema.Types.ObjectId, ref:'Movie'}]
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
