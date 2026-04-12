"""
Food App — AI Service
FastAPI server cung cấp các chức năng AI:
- Gợi ý món ăn (recommendation)
- Chatbot hỗ trợ khách hàng
- Tìm kiếm NLP (search)
- Dự báo nhu cầu (forecasting)

Chỉ nhận request từ backend (internal network).
"""

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI, Depends, Header, HTTPException
import os
from recommendation.router import router as recommendation_router
from chatbot.router import router as chatbot_router
from search.router import router as search_router

API_KEY = os.environ.get("AI_SERVICE_API_KEY", "DEV_SECRET_KEY")

async def verify_api_key(x_api_key: str = Header(None)):
    if not x_api_key or x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")

app = FastAPI(
    title="Food App AI Service",
    version="0.1.0",
    docs_url="/docs",
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-service"}

app.include_router(recommendation_router, dependencies=[Depends(verify_api_key)])
app.include_router(chatbot_router, dependencies=[Depends(verify_api_key)])
app.include_router(search_router, dependencies=[Depends(verify_api_key)])
