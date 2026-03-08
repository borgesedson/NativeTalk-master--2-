"""
NativeTalk Translation & Transcription Server
===============================================
Servidor unificado que roda:
  - ArgosTranslate (tradução de texto)
  - OpenAI Whisper (transcrição de áudio)

Endpoints:
  POST /translate     - Traduz texto entre idiomas
  POST /transcribe    - Transcreve áudio e opcionalmente traduz
  GET  /languages     - Lista idiomas disponíveis
  GET  /health        - Health check

Deploy: python3 server.py
"""

import os
import io
import base64
import tempfile
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

# ============================================================
# Config
# ============================================================
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")  # tiny, base, small, medium, large
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "5000"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nativetalk")

# ============================================================
# Global models (loaded once at startup)
# ============================================================
whisper_model = None
argos_installed_languages = set()


def load_models():
    """Load Whisper and Argos models at startup."""
    global whisper_model, argos_installed_languages

    # --- Whisper ---
    try:
        import whisper
        logger.info(f"Carregando Whisper modelo '{WHISPER_MODEL}'...")
        whisper_model = whisper.load_model(WHISPER_MODEL)
        logger.info("✅ Whisper carregado com sucesso!")
    except ImportError:
        logger.warning("⚠️ openai-whisper não instalado. Transcrição desabilitada.")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar Whisper: {e}")

    # --- Argos ---
    try:
        import argostranslate.package
        import argostranslate.translate
        argostranslate.package.update_package_index()
        installed = argostranslate.translate.get_installed_languages()
        argos_installed_languages = {lang.code for lang in installed}
        logger.info(f"✅ ArgosTranslate carregado! Idiomas: {argos_installed_languages}")
    except ImportError:
        logger.warning("⚠️ argostranslate não instalado. Tradução desabilitada.")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar Argos: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models()
    yield

app = FastAPI(title="NativeTalk AI Server", lifespan=lifespan)

# CORS - permite todas as origens
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Models (Request/Response)
# ============================================================
from pydantic import BaseModel, Field

class TranslateRequest(BaseModel):
    text: str = Field(..., alias="q")
    source: Optional[str] = Field("en", alias="from")
    target: Optional[str] = Field("pt", alias="to")

    class Config:
        populate_by_name = True

class TranscribeRequest(BaseModel):
    audioData: str  # base64 encoded audio
    sourceLanguage: Optional[str] = None
    targetLanguage: Optional[str] = "en"

class STTTranslateRequest(BaseModel):
    audio: Optional[str] = None  # base64 (fallback)
    audio_url: Optional[str] = None # Direct URL
    from_language: Optional[str] = Field(None, alias="from")
    to_language: Optional[str] = Field(None, alias="to")

    class Config:
        populate_by_name = True

    @property
    def from_val(self): return self.from_language or "pt"
    @property
    def to_val(self): return self.to_language or "en"


# ============================================================
# /translate - Tradução de texto
# ============================================================
@app.post("/translate")
async def translate(req: TranslateRequest):
    text = req.text
    source = req.source or "en"
    target = req.target or "pt"

    if not text or not text.strip():
        raise HTTPException(400, "Texto vazio")

    if source == target:
        return {"translatedText": text}

    try:
        import argostranslate.translate
        import argostranslate.package

        # Garantir que os pacotes estão instalados (opcionalmente)
        # Note: No ambiente do usuário, os pacotes já devem estar lá, 
        # mas adicionamos um log para diagnosticar se falhar.
        
        result = argostranslate.translate.translate(text, source, target)
        logger.info(f"Tradução: [{source}→{target}] '{text[:50]}' → '{result[:50]}'")
        return {"translatedText": result}
    except Exception as e:
        logger.error(f"Erro tradução: {e}")
        # Retorna o original em caso de falha técnica
        return {"translatedText": text}


# ============================================================
# /transcribe - Transcrição de áudio (Whisper)
# ============================================================
@app.post("/transcribe")
async def transcribe(req: TranscribeRequest):
    if not whisper_model:
        raise HTTPException(503, "Whisper não carregado")

    if not req.audioData:
        raise HTTPException(400, "audioData é obrigatório")

    try:
        # Decodificar base64
        audio_bytes = req.audioData
        if "," in audio_bytes:
            audio_bytes = audio_bytes.split(",", 1)[1]
        audio_data = base64.b64decode(audio_bytes)

        # Salvar em arquivo temporário
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name

        try:
            # Transcrever com Whisper
            result = whisper_model.transcribe(
                tmp_path,
                language=req.sourceLanguage if req.sourceLanguage else None,
            )
            original_text = result.get("text", "").strip()
            detected_lang = result.get("language", "en")

            logger.info(f"Transcrição: [{detected_lang}] '{original_text[:80]}'")

            # Traduzir se necessário
            translated_text = original_text
            target_lang = req.targetLanguage or "en"

            if original_text and detected_lang != target_lang:
                try:
                    import argostranslate.translate
                    translated_text = argostranslate.translate.translate(
                        original_text, detected_lang, target_lang
                    )
                    logger.info(f"Tradução áudio: '{translated_text[:80]}'")
                except Exception as te:
                    logger.warning(f"Tradução do áudio falhou: {te}")

            return {
                "originalTranscription": original_text,
                "translatedTranscription": translated_text,
                "detectedLanguage": detected_lang,
                "targetLanguage": target_lang,
            }
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    except Exception as e:
        logger.error(f"Erro transcrição: {e}")
        raise HTTPException(500, f"Erro na transcrição: {str(e)}")


# ============================================================
# /stt-and-translate - Unified STT + Translation (Requested)
# ============================================================
@app.post("/stt-and-translate")
async def stt_and_translate(req: STTTranslateRequest):
    """
    Unified endpoint.
    Request: { audio_url, audio, from, to }
    Response: { transcript, translated, language }
    """
    if not whisper_model:
        raise HTTPException(503, "Whisper não carregado")

    if not req.audio and not req.audio_url:
        raise HTTPException(400, "audio ou audio_url é obrigatório")

    tmp_path = None
    try:
        # 1. Obter áudio (URL ou Base64)
        if req.audio_url:
            logger.info(f"Baixando áudio de: {req.audio_url}")
            import urllib.request
            # Whisper suporta muitos formatos, mas webm/mp3 são comuns
            suffix = ".webm"
            if ".mp3" in req.audio_url: suffix = ".mp3"
            elif ".wav" in req.audio_url: suffix = ".wav"
            
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                urllib.request.urlretrieve(req.audio_url, tmp.name)
                tmp_path = tmp.name
        else:
            # Fallback Base64
            audio_bytes = req.audio
            if "," in audio_bytes:
                audio_bytes = audio_bytes.split(",", 1)[1]
            audio_data = base64.b64decode(audio_bytes)
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name

        try:
            # 2. Transcrever com Whisper
            result = whisper_model.transcribe(
                tmp_path,
                language=req.from_val,
            )
            transcript = result.get("text", "").strip()
            detected_lang = result.get("language", "en")

            logger.info(f"STT-Unified: [{detected_lang}] '{transcript[:80]}'")

            # 3. Traduzir
            translated = transcript
            target_lang = req.to_val

            if transcript and detected_lang != target_lang:
                try:
                    import argostranslate.translate
                    translated = argostranslate.translate.translate(
                        transcript, detected_lang, target_lang
                    )
                    logger.info(f"Tradução-Unified: '{translated[:80]}'")
                except Exception as te:
                    logger.warning(f"Tradução-Unified falhou: {te}")

            return {
                "transcript": transcript,
                "translated": translated,
                "language": detected_lang,
            }
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)
    except Exception as e:
        logger.error(f"Erro stt-and-translate: {e}")
        raise HTTPException(500, f"Erro no serviço unificado: {str(e)}")


# ============================================================
# /languages - Lista idiomas disponíveis
# ============================================================
@app.get("/languages")
async def languages():
    try:
        import argostranslate.translate
        installed = argostranslate.translate.get_installed_languages()
        return [{"code": lang.code, "name": lang.name} for lang in installed]
    except:
        return []


# ============================================================
# /health - Health check
# ============================================================
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "whisper": whisper_model is not None,
        "whisper_model": WHISPER_MODEL,
        "argos_languages": list(argos_installed_languages),
    }


# ============================================================
# Run
# ============================================================
if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
