const mongoose = require('mongoose');
const crypto = require('crypto');
const { v1: uuidv1 } = require('uuid');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    hashed_password: {
      type: String,
      required: false,
    },
    hashed_refreshToken: {
      type: String,
      required: false,
    },
    salt: String,
    role: {
      type: Number,
      default: 0,
      required: false
    }
  },
  { timestamps: true }
);

// virtual field
userSchema
  .virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = uuidv1();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

// userSchema
//   .virtual('password')
//   .set(function (password) {
//     this._password = password;
//     this.salt = uuidv1();
//     this.hashed_password = this.encryptPassword(password);
//   })
//   .get(function () {
//     return this._password;
//   });

userSchema.methods = {
  authenticate: function(plainText, email) {
    return this.encryptPassword(plainText) === this.hashed_password && email == this.email;
  },

  encryptPassword: function (password) {
    if (!password) return '';
    try {
      let x = crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex');
      return x;
    } catch (err) {
      return '';
    }
  },

  encryptRefreshToken: function (refreshToken) {
      // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    const sharedSecret = crypto.randomBytes(32);

    // Create a cipher object with the AES-256-CBC algorithm and the random initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(sharedSecret, 'hex'), Buffer.from(iv,'hex'));

    // Encrypt the refresh token using the cipher object
    let encrypted = cipher.update(refreshToken);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    console.log("encrypted.toString('hex'): " + encrypted.toString('hex'));
    return {token: encrypted.toString('hex'), iv: iv.toString('hex')}
  },
};

module.exports = mongoose.model('User', userSchema);
