from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
import time
import os
import httpx
from database import log_ai_interaction
from openai import AsyncOpenAI

router = APIRouter(prefix="/chat", tags=["Chatbot"])

API_URL = os.environ.get("NEXT_PUBLIC_API_URL", "http://localhost:4000")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

class ChatRequest(BaseModel):
    userId: str = "anonymous"
    message: str

class ChatResponse(BaseModel):
    reply: str
    status: str

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest, background_tasks: BackgroundTasks):
    """
    Chatbot hỗ trợ khách hàng về menu món ăn sử dụng OpenAI
    """
    start_time = time.time()
    message = req.message.strip()
    
    # Lấy dữ liệu sản phẩm để phản hồi động
    menu_items = []
    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(f"{API_URL}/products?limit=100")
            if resp.status_code == 200:
                data = resp.json()
                menu_items = data.get("data", data) if isinstance(data, dict) else data
    except Exception as e:
        print("Lỗi fetch Products:", e)

    # Context menu
    menu_context = ""
    if menu_items:
        items_str = ", ".join([f"{p.get('name', '')} ({p.get('price', 0)} VND)" for p in menu_items[:25]])
        menu_context = f"Menu hiện tại của nhà hàng gồm có: {items_str}."

    system_prompt = f"""Bạn là trợ lý ảo thân thiện của ứng dụng đặt món ăn (Food App). 
Hãy tư vấn cho khách hàng bằng tiếng Việt một cách lịch sự, nhiệt tình và tự nhiên nhất.
{menu_context}
Hãy trả lời ngắn gọn (dưới 4 câu) và tập trung vào các câu hỏi liên quan tới thức ăn, đặt hàng, phí ship (phí cơ bản 5000đ/Km), và menu. Nếu khách hàng hỏi món không có, hãy gợi ý món khác trong menu."""

    reply = "Xin lỗi, hiện tại tôi đang quá tải. Vui lòng thử lại sau chút nhé!"
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=250,
            temperature=0.7
        )
        reply = response.choices[0].message.content
    except Exception as e:
        print("Lỗi gọi OpenAI API:", e)
    
    response_data = ChatResponse(reply=reply.strip(), status="ok")
    latency_ms = int((time.time() - start_time) * 1000)
    
    background_tasks.add_task(
        log_ai_interaction,
        "chatbot",
        req.userId,
        req.model_dump(),
        response_data.model_dump(),
        latency_ms
    )
    
    return response_data
