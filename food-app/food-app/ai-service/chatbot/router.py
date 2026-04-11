from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/chat", tags=["Chatbot"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    status: str

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    Chatbot hỗ trợ khách hàng về menu món ăn
    """
    message = req.message.lower().strip()
    
    # Simple keyword-based responses
    if any(word in message for word in ["phở", "pho"]):
        reply = "Chúng tôi có Phở Bò Tái rất ngon với nước dùng ninh xương 12 tiếng. Giá 55,000 VND. Bạn có muốn đặt không?"
    elif any(word in message for word in ["bún", "bun"]):
        reply = "Bún Chả Hà Nội là món đặc sản của chúng tôi! Bún chả nướng than hoa thơm lừng, giá 50,000 VND."
    elif any(word in message for word in ["cơm", "com"]):
        reply = "Cơm Tấm Sườn Bì Chả là lựa chọn tuyệt vời! Đầy đủ dinh dưỡng, giá 60,000 VND."
    elif any(word in message for word in ["chay", "vegetarian"]):
        reply = "Chúng tôi có Chè Thái và Trà Sen Vàng cho người ăn chay. Cả hai đều rất thanh mát và healthy!"
    elif any(word in message for word in ["cay", "spicy"]):
        reply = "Bánh Mì Thịt Nướng có ớt tươi, rất cay và ngon! Giá chỉ 30,000 VND."
    elif any(word in message for word in ["giá", "gia", "price", "bao nhiêu"]):
        reply = "Giá món ăn của chúng tôi từ 20,000 - 85,000 VND. Món nào bạn quan tâm?"
    elif any(word in message for word in ["giao", "delivery", "ship"]):
        reply = "Chúng tôi giao hàng tận nơi trong vòng 30-45 phút. Phí ship 15,000 VND cho đơn dưới 100,000 VND."
    elif any(word in message for word in ["menu", "món", "mon", "có gì", "co gi"]):
        reply = "Chúng tôi có: Phở Bò, Bún Chả, Bánh Mì, Cơm Tấm, Gỏi Cuốn, Bò Lúc Lắc, Chè Thái, Trà Sen. Bạn thích món nào?"
    elif any(word in message for word in ["đặt", "dat", "order", "mua"]):
        reply = "Tuyệt vời! Bạn có thể thêm món vào giỏ hàng và thanh toán. Chúng tôi hỗ trợ COD, MoMo và VNPay."
    elif any(word in message for word in ["hello", "hi", "xin chào", "chao"]):
        reply = "Xin chào! Tôi là trợ lý ảo của Food App. Tôi có thể giúp bạn tìm món ăn ngon. Bạn muốn ăn gì hôm nay?"
    elif any(word in message for word in ["cảm ơn", "cam on", "thanks", "thank"]):
        reply = "Rất vui được hỗ trợ bạn! Chúc bạn ngon miệng! 😊"
    else:
        reply = "Tôi có thể giúp bạn tìm món ăn ngon! Bạn muốn ăn phở, bún, cơm hay món gì khác?"
    
    return ChatResponse(reply=reply, status="ok")
