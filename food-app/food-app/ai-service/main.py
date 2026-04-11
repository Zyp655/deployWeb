"""
Food App — AI Service
FastAPI server cung cấp các chức năng AI:
- Gợi ý món ăn (recommendation)
- Chatbot hỗ trợ khách hàng
- Tìm kiếm NLP (search)
- Dự báo nhu cầu (forecasting)

Chỉ nhận request từ backend (internal network).
"""

from fastapi import FastAPI
from recommendation.router import router as recommendation_router
from chatbot.router import router as chatbot_router
from search.router import router as search_router

app = FastAPI(
    title="Food App AI Service",
    version="0.1.0",
    docs_url="/docs",
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-service"}

app.include_router(recommendation_router)
app.include_router(chatbot_router)
app.include_router(search_router)
