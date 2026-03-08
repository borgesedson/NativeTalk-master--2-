const express = require('express');
const Call = require('../models/Call');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Middleware de autenticação
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// Iniciar chamada
router.post('/initiate', auth, async (req, res) => {
  try {
    const { receiverId, type, deviceInfo } = req.body;

    if (!receiverId || !type) {
      return res.status(400).json({
        success: false,
        message: 'ID do receptor e tipo da chamada são obrigatórios'
      });
    }

    if (!['video', 'audio'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de chamada deve ser "video" ou "audio"'
      });
    }

    // Verificar se receptor existe
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receptor não encontrado'
      });
    }

    // Verificar se não é uma auto-chamada
    if (req.user._id.toString() === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível ligar para si mesmo'
      });
    }

    // Criar registro da chamada
    const callId = uuidv4();
    const call = new Call({
      callId,
      caller: req.user._id,
      receiver: receiverId,
      type,
      status: 'initiated',
      deviceInfo: {
        caller: deviceInfo || {}
      }
    });

    await call.save();

    // Popular dados dos usuários
    await call.populate('caller receiver', 'name email avatar isOnline');

    res.status(201).json({
      success: true,
      message: 'Chamada iniciada',
      call: call
    });

  } catch (error) {
    console.error('Erro ao iniciar chamada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar status da chamada
router.patch('/:callId/status', auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, deviceInfo, endReason } = req.body;

    const call = await Call.findOne({ callId });
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Chamada não encontrada'
      });
    }

    // Verificar se o usuário está autorizado a atualizar
    const isAuthorized = call.caller.toString() === req.user._id.toString() || 
                        call.receiver.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    // Atualizar status e timestamps
    const previousStatus = call.status;
    call.status = status;

    if (status === 'answered' && previousStatus !== 'answered') {
      call.answeredAt = new Date();
    }

    if (status === 'ended' || status === 'declined' || status === 'missed') {
      call.endedAt = new Date();
      if (endReason) call.endReason = endReason;
      
      // Calcular duração se a chamada foi atendida
      if (call.answeredAt) {
        call.calculateDuration();
      }
    }

    // Atualizar device info
    if (deviceInfo) {
      if (call.receiver.toString() === req.user._id.toString()) {
        call.deviceInfo.receiver = deviceInfo;
      }
    }

    await call.save();
    await call.populate('caller receiver', 'name email avatar isOnline');

    res.json({
      success: true,
      message: 'Status da chamada atualizado',
      call
    });

  } catch (error) {
    console.error('Erro ao atualizar chamada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter histórico de chamadas
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, search } = req.query;

    const filter = {
      $or: [
        { caller: req.user._id },
        { receiver: req.user._id }
      ]
    };

    // Filtros opcionais
    if (type && ['video', 'audio'].includes(type)) {
      filter.type = type;
    }

    if (status) {
      filter.status = status;
    }

    // Busca por nome do contato
    if (search) {
      const users = await User.find({
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      filter.$or = [
        { caller: req.user._id, receiver: { $in: userIds } },
        { receiver: req.user._id, caller: { $in: userIds } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [calls, total] = await Promise.all([
      Call.find(filter)
        .populate('caller receiver', 'name email avatar isOnline')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip),
      Call.countDocuments(filter)
    ]);

    // Processar chamadas para incluir informações do contato
    const processedCalls = calls.map(call => {
      const isCallerMe = call.caller._id.toString() === req.user._id.toString();
      const contact = isCallerMe ? call.receiver : call.caller;
      
      return {
        ...call.toObject(),
        contact,
        direction: isCallerMe ? 'outgoing' : 'incoming',
        formattedDuration: call.getFormattedDuration()
      };
    });

    res.json({
      success: true,
      calls: processedCalls,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: calls.length,
        totalRecords: total
      }
    });

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Obter estatísticas das chamadas
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [totalCalls, missedCalls, todayCalls, avgDuration] = await Promise.all([
      // Total de chamadas
      Call.countDocuments({
        $or: [{ caller: userId }, { receiver: userId }]
      }),
      
      // Chamadas perdidas (onde eu era o receptor)
      Call.countDocuments({
        receiver: userId,
        status: 'missed'
      }),
      
      // Chamadas de hoje
      Call.countDocuments({
        $or: [{ caller: userId }, { receiver: userId }],
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
      
      // Duração média
      Call.aggregate([
        {
          $match: {
            $or: [{ caller: userId }, { receiver: userId }],
            status: 'ended',
            duration: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total: totalCalls,
        missed: missedCalls,
        today: todayCalls,
        avgDuration: Math.round(avgDuration[0]?.avgDuration || 0),
        answered: totalCalls - missedCalls
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Deletar chamada do histórico
router.delete('/:callId', auth, async (req, res) => {
  try {
    const { callId } = req.params;
    
    const call = await Call.findOne({ callId });
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Chamada não encontrada'
      });
    }

    // Verificar autorização
    const isAuthorized = call.caller.toString() === req.user._id.toString() || 
                        call.receiver.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    await Call.findByIdAndDelete(call._id);

    res.json({
      success: true,
      message: 'Chamada removida do histórico'
    });

  } catch (error) {
    console.error('Erro ao deletar chamada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Avaliar qualidade da chamada
router.post('/:callId/rate', auth, async (req, res) => {
  try {
    const { callId } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Avaliação deve estar entre 1 e 5'
      });
    }

    const call = await Call.findOne({ callId });
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Chamada não encontrada'
      });
    }

    // Verificar autorização
    const isAuthorized = call.caller.toString() === req.user._id.toString() || 
                        call.receiver.toString() === req.user._id.toString();
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Não autorizado'
      });
    }

    call.quality.rating = rating;
    if (feedback) {
      call.quality.feedback = feedback;
    }

    await call.save();

    res.json({
      success: true,
      message: 'Avaliação registrada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao avaliar chamada:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;