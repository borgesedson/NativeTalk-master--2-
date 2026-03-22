import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload de áudio
 * POST /api/audio/upload
 * Body: { audioData: base64String, fileName: string }
 */
export async function uploadAudio(req, res) {
  try {
    const { audioData, fileName } = req.body;

    if (!audioData) {
      return res.status(400).json({ message: "Audio data is required" });
    }

    // Criar diretório de uploads se não existir
    const uploadsDir = path.join(__dirname, '../../uploads/audio');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Gerar nome único para o arquivo
    const uniqueName = `${Date.now()}-${fileName || 'audio.webm'}`;
    const filePath = path.join(uploadsDir, uniqueName);

    // Extrair base64 puro (remover qualquer prefixo data:audio/...;base64,)
    const base64Data = audioData.includes(',') ? audioData.split(',')[1] : audioData;
    const buffer = Buffer.from(base64Data, 'base64');

    // Salvar arquivo de forma síncrona (mais rápido para arquivos pequenos)
    await fs.writeFile(filePath, buffer);

    // Retornar URL pública
    const audioUrl = `/uploads/audio/${uniqueName}`;

    res.status(200).json({
      success: true,
      audioUrl,
      fileName: uniqueName,
      size: buffer.length
    });
  } catch (error) {
    console.error("❌ Erro ao fazer upload de áudio:", error.message);
    res.status(500).json({ 
      message: "Error uploading audio",
      error: error.message 
    });
  }
}
