const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const router = express.Router();

// Configurar nodemailer (configurar com suas credenciais)
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou outro provedor
  auth: {
    user: process.env.EMAIL_USER, // seu email
    pass: process.env.EMAIL_PASS  // sua senha de app
  }
});

// Registro
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, nativeLanguage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email já está em uso'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      nativeLanguage: nativeLanguage || 'en-US'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        nativeLanguage: user.nativeLanguage,
        isOnline: user.isOnline
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Atualizar status online
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        nativeLanguage: user.nativeLanguage,
        isOnline: user.isOnline
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Verificar token
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        nativeLanguage: user.nativeLanguage,
        isOnline: user.isOnline
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    console.error('Erro na verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();
      }
    }

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

  } catch (error) {
    // Mesmo com erro, considerar logout bem-sucedido
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  }
});

// Solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email é obrigatório'
      });
    }

    // Buscar usuário
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Gerar código de recuperação (6 dígitos)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    // Salvar código no usuário (expira em 15 minutos)
    user.passwordResetToken = resetCodeHash;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutos
    await user.save();

    // Enviar email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperação de Senha - Streamify',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🔐 Recuperação de Senha</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333;">Olá, ${user.name}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Recebemos uma solicitação para redefinir sua senha no <strong>Streamify</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="margin: 0; color: #333; font-size: 14px;">Seu código de verificação:</p>
              <h1 style="margin: 10px 0; color: #667eea; font-size: 32px; letter-spacing: 5px; font-family: monospace;">
                ${resetCode}
              </h1>
              <p style="margin: 0; color: #666; font-size: 12px;">
                Este código expira em <strong>15 minutos</strong>
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              ⚠️ Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este é um email automático, não responda.<br>
              © ${new Date().getFullYear()} Streamify - Conectando o mundo através da comunicação
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Código de recuperação enviado para seu email',
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mascarar email
    });

  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Verificar código de recuperação
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email e código são obrigatórios'
      });
    }

    // Hash do código fornecido
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    // Buscar usuário com código válido
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: codeHash,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido ou expirado'
      });
    }

    // Gerar token temporário para redefinição
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({
      success: true,
      message: 'Código verificado com sucesso',
      resetToken
    });

  } catch (error) {
    console.error('Erro ao verificar código:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Redefinir senha
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'As senhas não coincidem'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.type !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Buscar usuário
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    await user.save();

    // Enviar email de confirmação
    const confirmationMail = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Senha Alterada com Sucesso - Streamify',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Senha Alterada</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333;">Olá, ${user.name}!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Sua senha foi alterada com sucesso em <strong>${new Date().toLocaleString('pt-BR')}</strong>.
            </p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #155724;">
                🔒 Sua conta está segura. Se você não fez esta alteração, entre em contato conosco imediatamente.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Streamify
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(confirmationMail);

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;