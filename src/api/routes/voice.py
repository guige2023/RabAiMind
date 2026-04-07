# -*- coding: utf-8 -*-
"""
Voice API - TTS generation and translation using edge-tts + Volcano AI

Author: Claude
Date: 2026-04-04
"""

import os
import uuid
import asyncio
import edge_tts
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

from ...config import settings
from ...services.volc_api import VolcEngineAPI

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voice", tags=["voice"])

# Output directory for generated audio files
AUDIO_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "output", "voice")
os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)

# Supported voices
VOICE_PROFILES = {
    "zh-CN-Xiaoxiao": {"lang": "zh-CN", "name": "晓晓 (女声)", "gender": "Female"},
    "zh-CN-Yunxi": {"lang": "zh-CN", "name": "云希 (男声)", "gender": "Male"},
    "zh-CN-Yunyang": {"lang": "zh-CN", "name": "云扬 (男声)", "gender": "Male"},
    "zh-CN-Xiaoyi": {"lang": "zh-CN", "name": "小艺 (女声)", "gender": "Female"},
    "zh-CN-XiaoMin": {"lang": "zh-CN", "name": "小敏 (粤语)", "gender": "Female"},
    "en-US-Jenny": {"lang": "en-US", "name": "Jenny (女声)", "gender": "Female"},
    "en-US-Guy": {"lang": "en-US", "name": "Guy (男声)", "gender": "Male"},
    "en-GB-Sonia": {"lang": "en-GB", "name": "Sonia (英式女声)", "gender": "Female"},
    "ja-JP-Nanami": {"lang": "ja-JP", "name": "七海 (女声)", "gender": "Female"},
    "ko-KR-Sunhi": {"lang": "ko-KR", "name": "Sunhi (女声)", "gender": "Female"},
    "fr-FR-Denise": {"lang": "fr-FR", "name": "Denise (女声)", "gender": "Female"},
    "de-DE-Katja": {"lang": "de-DE", "name": "Katja (女声)", "gender": "Female"},
    "es-ES-Elvira": {"lang": "es-ES", "name": "Elvira (女声)", "gender": "Female"},
}

TRANSLATION_LANGS = {
    "zh": "中文", "en": "英文", "ja": "日文", "ko": "韩文",
    "fr": "法文", "de": "德文", "es": "西班牙文", "pt": "葡萄牙文",
    "it": "意大利文", "ru": "俄文", "ar": "阿拉伯文",
}


class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize", max_length=5000)
    voice: str = Field(default="zh-CN-Xiaoxiao", description="Voice profile ID")
    rate: Optional[str] = Field(default="+0%", description="Speech rate adjustment")
    volume: Optional[str] = Field(default="+0%", description="Volume adjustment")
    pitch: Optional[str] = Field(default="+0Hz", description="Pitch adjustment")


class TranslateRequest(BaseModel):
    text: str = Field(..., description="Text to translate", max_length=3000)
    source_lang: str = Field(..., description="Source language code")
    target_lang: str = Field(..., description="Target language code")


class BatchTTSRequest(BaseModel):
    slides: List[dict] = Field(..., description="List of slides with text")
    voice: str = Field(default="zh-CN-Xiaoxiao")
    rate: Optional[str] = Field(default="+0%")


def _estimate_duration(text: str, rate: str = "+0%") -> float:
    """Estimate audio duration in seconds"""
    rate_num = 0
    if rate and rate != "+0%":
        try:
            rate_num = int(rate.replace("%", "").replace("+", ""))
        except ValueError:
            rate_num = 0
    chars_per_sec = 150 * (1 + rate_num / 100)
    return round(len(text) / chars_per_sec, 1)


@router.get("/voices")
async def list_voices():
    """List all available voice profiles"""
    return {
        "success": True,
        "data": [
            {"id": voice_id, **profile}
            for voice_id, profile in VOICE_PROFILES.items()
        ]
    }


@router.get("/languages")
async def list_languages():
    """List all supported translation languages"""
    return {
        "success": True,
        "data": [{"code": code, "name": name} for code, name in TRANSLATION_LANGS.items()]
    }


@router.post("/tts")
async def generate_tts(request: TTSRequest):
    """Generate TTS audio from text using edge-tts"""
    if request.voice not in VOICE_PROFILES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported voice: {request.voice}. Available: {list(VOICE_PROFILES.keys())}"
        )
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    file_id = uuid.uuid4().hex[:12]
    filename = f"tts_{file_id}.mp3"
    filepath = os.path.join(AUDIO_OUTPUT_DIR, filename)

    try:
        communicate = edge_tts.Communicate(
            request.text,
            request.voice,
            rate=request.rate or "+0%",
            volume=request.volume or "+0%",
            pitch=request.pitch or "+0Hz"
        )
        await communicate.save(filepath)
        logger.info(f"[TTS] Generated: {filepath} ({os.path.getsize(filepath)} bytes)")

        return {
            "success": True,
            "data": {
                "audio_url": f"/api/v1/voice/audio/{filename}",
                "filename": filename,
                "duration_sec": _estimate_duration(request.text, request.rate),
                "voice": request.voice,
                "voice_name": VOICE_PROFILES[request.voice]["name"],
                "text_length": len(request.text)
            }
        }
    except Exception as e:
        logger.error(f"[TTS] Error: {e}")
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": f"TTS generation failed: {str(e)}"})


@router.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serve generated audio files"""
    safe_path = os.path.abspath(os.path.join(AUDIO_OUTPUT_DIR, filename))
    if not safe_path.startswith(os.path.abspath(AUDIO_OUTPUT_DIR)):
        raise HTTPException(status_code=403, detail="Invalid filename")
    if not os.path.exists(safe_path):
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(safe_path, media_type="audio/mpeg", filename=filename)


@router.post("/translate")
async def translate_text(request: TranslateRequest):
    """Translate text using Volcano AI API"""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    if request.source_lang not in TRANSLATION_LANGS or request.target_lang not in TRANSLATION_LANGS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language. Available: {list(TRANSLATION_LANGS.keys())}"
        )

    try:
        volc_api = VolcEngineAPI()
        source_name = TRANSLATION_LANGS[request.source_lang]
        target_name = TRANSLATION_LANGS[request.target_lang]

        prompt = f"""You are a professional translator. Translate the following {source_name} text to {target_name}.
Only output the translated text, no explanations or notes.

Text to translate:
{request.text}

{target_name} translation:"""

        # Run sync API call in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: volc_api.text_generation(
                prompt=prompt,
                model=settings.VOLCANO_TEXT_MODEL,
                max_tokens=2000,
                temperature=0.3
            )
        )

        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Translation failed"))

        translated_text = result.get("content", "").strip()
        if not translated_text:
            raise HTTPException(status_code=500, detail="Translation returned empty result")

        logger.info(f"[Translate] {request.source_lang}->{request.target_lang}: {len(request.text)} -> {len(translated_text)} chars")

        return {
            "success": True,
            "data": {
                "original": request.text,
                "translated": translated_text,
                "source_lang": request.source_lang,
                "target_lang": request.target_lang,
                "source_lang_name": source_name,
                "target_lang_name": target_name
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Translate] Error: {e}")
        raise HTTPException(status_code=500, detail={"error": "ENDPOINT_ERROR", "detail": f"Translation failed: {str(e)}"})


@router.post("/tts-batch")
async def batch_tts(request: BatchTTSRequest):
    """Generate TTS for multiple slides at once"""
    if request.voice not in VOICE_PROFILES:
        raise HTTPException(status_code=400, detail=f"Unsupported voice: {request.voice}")

    results = []
    for slide in request.slides:
        index = slide.get("index", 0)
        narration = slide.get("narration", "")

        if not narration:
            title = slide.get("title", "")
            content = slide.get("content", "")
            narration = f"{title}。{content}" if title and content else (title or content)

        if not narration.strip():
            results.append({"index": index, "success": False, "error": "No text available"})
            continue

        file_id = uuid.uuid4().hex[:12]
        filename = f"tts_s{index}_{file_id}.mp3"
        filepath = os.path.join(AUDIO_OUTPUT_DIR, filename)

        try:
            communicate = edge_tts.Communicate(narration, request.voice, rate=request.rate or "+0%")
            await communicate.save(filepath)
            results.append({
                "index": index,
                "success": True,
                "audio_url": f"/api/v1/voice/audio/{filename}",
                "filename": filename,
                "text_length": len(narration)
            })
        except Exception as e:
            logger.error(f"[BatchTTS] Slide {index} error: {e}")
            results.append({"index": index, "success": False, "error": str(e)})

    return {
        "success": True,
        "data": {
            "voice": request.voice,
            "voice_name": VOICE_PROFILES[request.voice]["name"],
            "results": results
        }
    }
