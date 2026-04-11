from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
import time
import os
import httpx
from database import log_ai_interaction

router = APIRouter(prefix="/chat", tags=["Chatbot"])

API_URL = os.environ.get("NEXT_PUBLIC_API_URL", "http://localhost:4000")

class ChatRequest(BaseModel):
    userId: str = "anonymous"
    message: str

class ChatResponse(BaseModel):
    reply: str
    status: str

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest, background_tasks: BackgroundTasks):
    """
    Chatbot hỗ trợ khách hàng về menu món ăn
    """
    start_time = time.time()
    message = req.message.lower().strip()
    
    # Lấy dữ liệu sản phẩm để phản hồi động
    menu_items = []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{API_URL}/products?limit=100")
            if resp.status_code == 200:
                data = resp.json()
                menu_items = data.get("data", data) if isinstance(data, dict) else data
    except Exception as e:
        print("Lỗi fetch Products:", e)

    def extract_names(items):
        return ", ".join([p.get('name', '') for p in items[:8]]) if items else ""

    # Simple keyword-based responses
    if any(word in message for word in ["menu", "món", "mon", "có gì", "co gi"]):
        if menu_items:
            reply = f"Chúng tôi đang có sẵn các món: {extract_names(menu_items)}... Bạn thích món nào?"
        else:
            reply = "Chúng tôi có: Phở Bò, Bún Chả, Bánh Mì, Cơm Tấm... Bạn thích món nào?"
    elif any(word in message for word in ["phở", "pho"]):
        pho_items = [p for p in menu_items if "phở" in str(p.get("name", "")).lower() or "pho" in str(p.get("name", "")).lower()]
        if pho_items:
            reply = f"Chúng tôi có {pho_items[0].get('name')} giá {pho_items[0].get('price')} VND. Rất ngon! Bạn có muốn đặt không?"
        else:
            reply = "Xin lỗi, hiện tại quán vừa hết Phở mất rồi. Có thể gọi Bún thay thế không ạ?"
    elif any(word in message for word in ["bún", "bun"]):
        reply = "Bún Chả Hà Nội là món đặc sản của chúng tôi! Bún chả nướng than hoa thơm lừng, giá 50,000 VND."
    elif any(word in message for word in ["cơm", "com"]):
        reply = "Cơm Tấm Sườn Bì Chả là lựa chọn tuyệt vời! Đầy đủ dinh dưỡng, giá 60,000 VND."
    elif any(word in message for word in ["chay", "vegetarian"]):
        reply = "Chúng tôi có các thức ăn và đồ uống thanh mát cho người ăn chay. Hãy search thử nhé!"
    elif any(word in message for word in ["cay", "spicy"]):
        reply = "Bánh Mì Thịt Nướng có ớt tươi, rất cay và ngon! Giá chỉ 30,000 VND."
    elif any(word in message for word in ["giá", "gia", "price", "bao nhiêu"]):
        reply = "Giá món ăn của chúng tôi từ 20,000 - 85,000 VND. Món nào bạn quan tâm?"
    elif any(word in message for word in ["giao", "delivery", "ship"]):
        reply = "Chúng tôi giao hàng tận nơi trong vòng 30-45 phút dựa trên Khoảng Cách GPS thực tế! Phí ship cơ bản 5000đ/Km."
    elif any(word in message for word in ["đặt", "dat", "order", "mua"]):
        reply = "Tuyệt vời! Bạn có thể thêm món vào giỏ hàng và thanh toán. Chúng tôi hỗ trợ COD, MoMo và VNPay."
    elif any(word in message for word in ["hello", "hi", "xin chào", "chao"]):
        reply = "Xin chào! Tôi là trợ lý ảo của Food App. Tôi có thể giúp bạn tìm món ăn ngon. Bạn muốn ăn gì hôm nay?"
    elif any(word in message for word in ["cảm ơn", "cam on", "thanks", "thank"]):
        reply = "Rất vui được hỗ trợ bạn! Chúc bạn ngon miệng! 😊"
    else:
        reply = "Tôi có thể giúp bạn tìm món ăn ngon! Bạn muốn ăn phở, bún, cơm hay món gì khác?"
    
    response = ChatResponse(reply=reply, status="ok")
    latency_ms = int((time.time() - start_time) * 1000)
    
    background_tasks.add_task(
        log_ai_interaction,
        "chatbot",
        req.userId,
        req.model_dump(),
        response.model_dump(),
        latency_ms
    )
    
    return response
