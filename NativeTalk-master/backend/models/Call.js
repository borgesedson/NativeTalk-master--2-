const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  // Participantes da chamada
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Detalhes da chamada
  callId: {
    type: String,
    unique: true,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'audio'],
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'answered', 'ended', 'missed', 'declined', 'failed'],
    default: 'initiated'
  },
  
  // Timestamps importantes
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  answeredAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  
  // Duração calculada
  duration: {
    type: Number, // em segundos
    default: 0
  },
  
  // Qualidade da chamada
  quality: {
    avgBandwidth: { type: Number, default: 0 },
    packetsLost: { type: Number, default: 0 },
    latency: { type: Number, default: 0 },
    rating: { type: Number, min: 1, max: 5, default: null }
  },
  
  // Metadados
  endReason: {
    type: String,
    enum: ['normal', 'network_error', 'user_ended', 'timeout', 'declined'],
    default: null
  },
  deviceInfo: {
    caller: {
      browser: String,
      os: String,
      device: String
    },
    receiver: {
      browser: String,
      os: String,
      device: String
    }
  },
  
  // Para chamadas em grupo (futuro)
  isGroupCall: {
    type: Boolean,
    default: false
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    leftAt: Date
  }]
}, {
  timestamps: true
});

// Índices para performance
callSchema.index({ caller: 1, createdAt: -1 });
callSchema.index({ receiver: 1, createdAt: -1 });
callSchema.index({ callId: 1 });
callSchema.index({ status: 1 });
callSchema.index({ type: 1 });
callSchema.index({ createdAt: -1 });

// Métodos úteis
callSchema.methods.calculateDuration = function() {
  if (this.answeredAt && this.endedAt) {
    this.duration = Math.floor((this.endedAt - this.answeredAt) / 1000);
  }
  return this.duration;
};

callSchema.methods.getFormattedDuration = function() {
  if (!this.duration) return '0s';
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

module.exports = mongoose.model('Call', callSchema);