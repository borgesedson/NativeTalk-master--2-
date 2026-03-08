const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  nativeLanguage: {
    type: String,
    enum: [
      'zh-CN', 'es-ES', 'en-US', 'hi-IN', 'ar-SA', 'pt-BR', 'bn-BD', 'ru-RU', 'ja-JP', 'pa-IN',
      'de-DE', 'jv-ID', 'ko-KR', 'fr-FR', 'tr-TR', 'it-IT', 'th-TH', 'gu-IN', 'vi-VN', 'te-IN',
      'mr-IN', 'ta-IN', 'ur-PK', 'fa-IR', 'sw-KE', 'nl-NL', 'pl-PL', 'ro-RO', 'uk-UA', 'cs-CZ',
      'sv-SE', 'no-NO', 'da-DK', 'fi-FI', 'el-GR', 'he-IL', 'hu-HU', 'id-ID', 'ms-MY', 'tl-PH'
    ],
    default: 'en-US'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }]
}, {
  timestamps: true
});

// Índices para performance
userSchema.index({ email: 1 });
userSchema.index({ isOnline: 1, lastSeen: -1 });
userSchema.index({ name: 'text', email: 'text' });
userSchema.index({ nativeLanguage: 1 });

module.exports = mongoose.model('User', userSchema);