from fastapi import APIRouter, Query, BackgroundTasks
from pydantic import BaseModel
from typing import List
import unicodedata
import time
from database import log_ai_interaction

router = APIRouter(prefix="/search", tags=["Search"])

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

# Mock database - danh sách món ăn
MENU_ITEMS = [
    {
        "id": "1",
        "name": "Phở Bò Tái",
        "description": "Phở bò truyền thống với nước dùng ninh xương 12 tiếng, thịt bò tái mềm, rau thơm tươi",
        "category": "Món nước",
        "price": 55000,
        "keywords": ["pho", "bo", "mon nuoc", "truyen thong"]
    },
    {
        "id": "2",
        "name": "Bún Chả Hà Nội",
        "description": "Bún chả nướng than hoa thơm lừng, kèm nước mắm pha chua ngọt và rau sống",
        "category": "Món nước",
        "price": 50000,
        "keywords": ["bun", "cha", "ha noi", "nuong", "mon nuoc"]
    },
    {
        "id": "3",
        "name": "Bánh Mì Thịt Nướng",
        "description": "Bánh mì giòn rụm, nhân thịt nướng đậm đà, đồ chua, rau mùi, ớt tươi",
        "category": "Món khô",
        "price": 30000,
        "keywords": ["banh mi", "thit", "nuong", "cay", "mon kho"]
    },
    {
        "id": "4",
        "name": "Cơm Tấm Sườn Bì Chả",
        "description": "Cơm tấm Sài Gòn đặc biệt: sườn nướng, bì, chả trứng, mỡ hành, nước mắm",
        "category": "Cơm",
        "price": 60000,
        "keywords": ["com", "tam", "suon", "bi", "cha", "sai gon"]
    },
    {
        "id": "5",
        "name": "Gỏi Cuốn Tôm Thịt",
        "description": "Gỏi cuốn tươi mát với tôm, thịt luộc, bún, rau sống, chấm tương đậu phộng",
        "category": "Khai vị",
        "price": 35000,
        "keywords": ["goi", "cuon", "tom", "thit", "khai vi", "healthy"]
    },
    {
        "id": "6",
        "name": "Bò Lúc Lắc",
        "description": "Thịt bò Úc xào lúc lắc với tỏi, tiêu đen, ăn kèm cơm trắng nóng hổi",
        "category": "Món mặn",
        "price": 85000,
        "keywords": ["bo", "luc lac", "uc", "xao", "mon man", "cao cap"]
    },
    {
        "id": "7",
        "name": "Chè Thái",
        "description": "Chè thập cẩm kiểu Thái với nước cốt dừa, trái cây tươi, thạch lá dứa",
        "category": "Tráng miệng",
        "price": 25000,
        "keywords": ["che", "thai", "trang mieng", "ngot", "chay"]
    },
    {
        "id": "8",
        "name": "Trà Sen Vàng",
        "description": "Trà ướp sen tươi Tây Hồ, hương thơm nhẹ nhàng, thanh mát giải nhiệt",
        "category": "Đồ uống",
        "price": 20000,
        "keywords": ["tra", "sen", "do uong", "healthy", "chay"]
    }
]

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
    for keyword in item["keywords"]:
        if query_normalized in keyword:
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
    
    # Tính điểm cho từng món
    scored_items = []
    for item in MENU_ITEMS:
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
            price=si["item"]["price"],
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
