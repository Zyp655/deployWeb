# Food Ordering Platform — AI-Integrated

## Project Overview

Nền tảng đặt đồ ăn trực tuyến tích hợp AI. Hỗ trợ gợi ý món ăn thông minh, theo dõi đơn hàng realtime, và thanh toán an toàn.

## Project Structure

```
food-app/
├── frontend/          # Next.js 14 — Giao diện người dùng
├── backend/           # NestJS — API server, business logic, WebSocket
├── ai-service/        # FastAPI — AI recommendation, NLP
├── docker-compose.yml
└── AGENTS.md
```

### frontend/

- Framework: **Next.js 14** (App Router)
- Styling: **Tailwind CSS**
- State: **Zustand** (cart, user session)
- Gọi API **chỉ qua backend**, không gọi trực tiếp `ai-service`
- Order tracking realtime qua **WebSocket** kết nối tới backend

### backend/

- Framework: **NestJS** (Node.js)
- ORM: **Prisma** → PostgreSQL
- Realtime: **WebSocket Gateway** (order tracking)
- Cache: **Redis** (session, rate-limit, menu cache)
- Là trung gian duy nhất giao tiếp với `ai-service`

### ai-service/

- Framework: **FastAPI** (Python)
- Database: **MongoDB** (logs, training data, user behavior)
- Chức năng: gợi ý món ăn, phân tích đơn hàng, NLP search
- Chỉ nhận request từ backend (internal network)

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | Next.js 14, Tailwind CSS, Zustand |
| Backend   | NestJS, Prisma, WebSocket         |
| AI        | FastAPI, scikit-learn / PyTorch    |
| DB chính  | PostgreSQL                        |
| DB AI     | MongoDB                           |
| Cache     | Redis                             |
| Infra     | Docker, Docker Compose            |

## Commands

```bash
# Frontend
cd frontend && npm install && npm run dev      # Dev server: http://localhost:3000

# Backend
cd backend && npm install && npm run start:dev  # Dev server: http://localhost:4000

# AI Service
cd ai-service && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# Docker (all services)
docker-compose up --build
```

## Do

- ✅ Gọi AI service **qua backend** — frontend không gọi trực tiếp
- ✅ Dùng **Tailwind CSS** cho toàn bộ styling
- ✅ Dùng **Zustand** cho cart state và client-side state
- ✅ Dùng **Prisma** cho mọi truy vấn PostgreSQL
- ✅ Tracking đơn hàng qua **WebSocket**, không polling
- ✅ Mọi payment request phải có **`idempotency_key`** (UUID v4)
- ✅ Validate input ở cả frontend và backend
- ✅ Log mọi request tới AI service vào MongoDB
- ✅ Dùng `.env` cho mọi config nhạy cảm
- ✅ Viết DTO / schema cho mọi API endpoint

## Don't

- ❌ Không hardcode secret, API key, DB password trong code
- ❌ Không để frontend gọi trực tiếp tới `ai-service`
- ❌ Không dùng `any` type trong TypeScript (trừ trường hợp bất khả kháng)
- ❌ Không lưu thông tin thanh toán (card number) vào database
- ❌ Không commit file `.env`, `node_modules`, `__pycache__`
- ❌ Không dùng inline style — luôn dùng Tailwind classes
- ❌ Không tạo API endpoint mà không có auth guard (trừ public route)

## Domain Rules

### Order Flow

```
User chọn món → Thêm vào cart (Zustand)
  → Đặt hàng (POST /orders)
  → Backend tạo order (Prisma → PostgreSQL)
  → Backend gửi event qua WebSocket
  → Restaurant nhận đơn → Xác nhận → Giao hàng
  → Cập nhật trạng thái realtime qua WebSocket
```

### Order Statuses

`pending` → `confirmed` → `preparing` → `delivering` → `delivered` | `cancelled`

### Payment

- Mỗi request thanh toán **bắt buộc** có `idempotency_key`
- Không retry payment mà không có idempotency check
- Lưu transaction log đầy đủ

### AI Recommendation

- Backend gọi `ai-service` endpoint `/recommend`
- Input: `user_id`, `order_history`, `time_of_day`
- Output: danh sách `menu_item_id` được gợi ý
- Fallback: nếu AI service lỗi → trả về món phổ biến nhất

## Safety

- Mọi secret phải nằm trong `.env` và được load qua config module
- API rate-limiting bắt buộc (Redis-backed)
- CORS chỉ cho phép origin từ frontend domain
- Auth: JWT access token (15m) + refresh token (7d)
- Sanitize mọi user input trước khi lưu DB
- AI service chỉ accessible từ internal network

## PR Checklist

- [ ] Code không chứa hardcoded secret
- [ ] Có DTO/validation cho mọi endpoint mới
- [ ] Migration Prisma đã được tạo (nếu thay đổi schema)
- [ ] Unit test cho business logic mới
- [ ] API endpoint có auth guard (hoặc được đánh dấu public)
- [ ] Payment flow có idempotency_key
- [ ] WebSocket event được document trong code
- [ ] Không có `console.log` thừa trong production code
- [ ] Tailwind classes — không inline style
- [ ] AI service fallback hoạt động khi service down
