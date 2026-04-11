from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from collections import Counter
import random

router = APIRouter(prefix="/recommend", tags=["Recommendation"])

class OrderHistoryItem(BaseModel):
    productId: str
    category: str
    quantity: int

class Product(BaseModel):
    id: str
    category: str
    name: str

class RecommendRequest(BaseModel):
    userId: Optional[str] = None
    orderHistory: List[OrderHistoryItem] = []
    availableProducts: List[Product]
    limit: int = 4

class RecommendResponseItem(BaseModel):
    productId: str
    score: float
    reason: str

@router.post("/", response_model=List[RecommendResponseItem])
async def recommend_products(req: RecommendRequest):
    if not req.userId or not req.orderHistory:
        # Fallback: Guest or no history -> Top popular / diverse items
        selected = req.availableProducts[:req.limit]
        return [
            RecommendResponseItem(
                productId=p.id,
                score=5.0,
                reason="Món phổ biến đang được yêu thích"
            ) for p in selected
        ]
    
    # Content-based filtering based on historical category preferences
    cat_scores = Counter()
    for item in req.orderHistory:
        cat_scores[item.category] += item.quantity
    
    total_qty = sum(cat_scores.values()) or 1
    top_cat = cat_scores.most_common(1)[0][0] if cat_scores else None

    scored_products = []
    
    for p in req.availableProducts:
        # Calculate affinity score based on how many times user orders this category
        base_score = (cat_scores[p.category] / total_qty) * 10
        
        # Add tiny random noise to shuffle items with exact same score
        base_score += random.uniform(0.1, 0.9)

        reason = "Gợi ý mới cho bạn"
        if base_score > 3 and top_cat == p.category:
            reason = f"Vì bạn thường thích món thuộc loại {p.category}"
        elif base_score > 1:
            reason = "Dựa trên lịch sử đặt hàng của bạn"

        scored_products.append((p.id, base_score, reason))
    
    # Sort and pick top K
    scored_products.sort(key=lambda x: x[1], reverse=True)
    top = scored_products[:req.limit]
    
    return [
        RecommendResponseItem(productId=pid, score=round(sc, 2), reason=res)
        for pid, sc, res in top
    ]
