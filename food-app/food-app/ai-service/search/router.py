from fastapi import APIRouter, Query, BackgroundTasks
from pydantic import BaseModel
from typing import List
import unicodedata
import time
from database import log_ai_interaction

import os
import httpx

router = APIRouter(prefix="/search", tags=["Search"])

API_URL = os.environ.get("NEXT_PUBLIC_API_URL", "http://localhost:4000")

class SearchResult(BaseModel):
    id: str
    name: str
    description: str
    category: str
    price: float
    score: float

class SearchResponse(BaseModel):
    results: List[SearchResult]
    query: str

# We will fetch items dynamically instead of static MOCK

def remove_accents(text: str) -> str:
    """
    Loại bỏ dấu tiếng Việt để hỗ trợ tìm kiếm không dấu
    """
    nfd = unicodedata.normalize('NFD', text)
    return ''.join(char for char in nfd if unicodedata.category(char) != 'Mn')

def calculate_score(item: dict, query_normalized: str) -> float:
    """
    Tính điểm relevance của món ăn với query
    """
    score = 0.0
    
    # Tìm trong tên (trọng số cao nhất)
    name_normalized = remove_accents(item["name"].lower())
    if query_normalized in name_normalized:
        score += 10.0
    
    # Tìm trong description
    desc_normalized = remove_accents(item["description"].lower())
    if query_normalized in desc_normalized:
        score += 5.0
    
    # Tìm trong category
    cat_normalized = remove_accents(item["category"].lower())
    if query_normalized in cat_normalized:
        score += 3.0
    
    # Tìm trong keywords
    keywords = item.get("tags") or []
    for keyword in keywords:
        if query_normalized in remove_accents(keyword.lower()):
            score += 2.0
    
    # Tìm từng từ riêng lẻ
    query_words = query_normalized.split()
    for word in query_words:
        if len(word) >= 2:  # Bỏ qua từ quá ngắn
            if word in name_normalized:
                score += 1.0
            if word in desc_normalized:
                score += 0.5
    
    return score

@router.get("/", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, description="Từ khóa tìm kiếm"),
    userId: str = Query("anonymous", description="User ID"),
    background_tasks: BackgroundTasks = None
):
    """
    Tìm kiếm món ăn theo từ khóa
    """
    start_time = time.time()
    query_normalized = remove_accents(q.lower().strip())
    
    # Lấy Món ăn thật từ backend NestJS
    menu_items = []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{API_URL}/products?limit=100")
            if resp.status_code == 200:
                data = resp.json()
                # data.data is the list of products if paginated, or data might be list directly
                # Checking structure
                if "data" in data:
                    menu_items = data["data"]
                else:
                    menu_items = data
    except Exception as e:
        print("Lỗi fetch Products:", e)
        menu_items = []

    # Tính điểm cho từng món
    scored_items = []
    for item in menu_items:
        # Check defaults if missing
        if "description" not in item or not item["description"]: item["description"] = ""
        if "category" not in item: item["category"] = ""
        
        score = calculate_score(item, query_normalized)
        if score > 0:
            scored_items.append({
                "item": item,
                "score": score
            })
    
    # Sắp xếp theo điểm giảm dần
    scored_items.sort(key=lambda x: x["score"], reverse=True)
    
    # Tạo kết quả
    results = [
        SearchResult(
            id=si["item"]["id"],
            name=si["item"]["name"],
            description=si["item"]["description"],
            category=si["item"]["category"],
            price=float(si["item"]["price"]),
            score=si["score"]
        )
        for si in scored_items
    ]
    
    response = SearchResponse(results=results, query=q)
    latency_ms = int((time.time() - start_time) * 1000)
    if background_tasks:
        background_tasks.add_task(
            log_ai_interaction, "search", userId, {"q": q}, response.model_dump(), latency_ms
        )
    return response
