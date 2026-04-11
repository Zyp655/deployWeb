import os
from datetime import datetime
from pymongo import MongoClient

# Thiết lập MongoDB Connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)
db = client.get_database("food_app_ai")
logs_collection = db.get_collection("ai_logs")

def log_ai_interaction(service_name: str, user_id: str, request_data: dict, response_data: dict, latency_ms: int):
    """
    Hàm được gọi dưới dạng Background Task để lưu log AI.
    - service_name: phân loại ("chatbot", "recommendation", "search")
    - request_data: Nội dung gửi lên đầu vào
    - response_data: Kết quả AI trả về
    - latency_ms: Thời gian phản hồi mạng và tính toán
    """
    try:
        log_document = {
            "service": service_name,
            "userId": user_id,
            "input": request_data,
            "output": response_data,
            "latency_ms": latency_ms,
            "timestamp": datetime.utcnow()
        }
        logs_collection.insert_one(log_document)
        print(f"✅ Logged AI [{service_name}] for User[{user_id}] - Latency: {latency_ms}ms")
    except Exception as e:
        print(f"❌ Failed to log AI interaction: {e}")
