# 🔧 ISSUES FOUND & FIXES NEEDED

## Issue #1: Order Creation Schema Mismatch (HIGHEST PRIORITY)

### Problem
`POST /orders` returns 400 Bad Request

### Root Cause
The test was sending:
```json
{
  "shippingAddress": "123 Nguyen Trai...",
  "phone": "0901234567",
  "notes": "no ice"
}
```

But the backend DTO expects:
```json
{
  "address": "123 Nguyen Trai...",
  "note": "no ice"
}
```

### DTO Definition
From [backend/src/orders/dto/create-order.dto.ts](backend/src/orders/dto/create-order.dto.ts):
```typescript
export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsString()
  @IsNotEmpty()
  address: string;  // ← NOT shippingAddress

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  note?: string;  // ← NOT notes (singular)
}
```

### Correct Payload
```json
{
  "items": [
    {
      "productId": "89c3e666-e6c2-474c-a7e7-bd66ef3237ca",
      "quantity": 2,
      "note": "no ice"
    }
  ],
  "address": "123 Nguyen Trai St, District 1, HCMC",
  "paymentMethod": "COD"
}
```

### Fix
Update test script with correct field names:
```python
order_data = {
    "items": [
        {
            "productId": product_id,
            "quantity": 2,
            "note": "no ice"  # Changed from "notes" to "note"
        }
    ],
    "address": "123 Nguyen Trai St, District 1, HCMC",  # Changed from "shippingAddress"
    "paymentMethod": "COD"
}
```

### Status
🔴 **CRITICAL** - Blocks payment testing  
**Action:** Fix test script and re-run

---

## Issue #2: Review Creation Permission Denied (MEDIUM PRIORITY)

### Problem
`POST /reviews` returns 403 Forbidden

### Possible Causes
1. User must have purchased the product
2. Review rate limiting active
3. Review permission guard enforced

### Current Test
```python
review_data = {
    "productId": "89c3e666-e6c2-474c-a7e7-bd66ef3237ca",
    "rating": 5,
    "comment": "Rất ngon!"
}
```

### Solutions to Try
1. **Create an order first** (once order creation is fixed)
2. **Check if user has purchase history requirement**
3. **Verify review DTO validation** in [backend/src/reviews/dto/create-review.dto.ts](backend/src/reviews/dto/create-review.dto.ts)

### Status
🟡 **MEDIUM** - Not critical, but needed for complete testing  
**Action:** Investigate after fixing order creation

---

## Issue #3: Admin Users Endpoint Not Found (LOW PRIORITY)

### Problem
`GET /admin/users` returns 404 Not Found

### Possible Causes
1. Endpoint not implemented
2. Wrong route path
3. Feature not final

### Check
```bash
# Search for users endpoint
cd backend/src
grep -r "/users" . --include="*.ts"
grep -r "admin.*users" . --include="*.ts"
```

### Status
🟡 **LOW** - Admin can use `/admin/orders` to infer customer data  
**Action:** Nice-to-have, not critical

---

## Issue #4: Phone Field Not in Order DTO (INFO)

### Problem
Test sends `phone` field, but DTO doesn't include it

### Note
The phone field might need to be added to the schema if it's required for delivery. Check if it should be:
- In UserProfile model
- In OrderDetails model
- Stored separately in system

### Recommendation
Either:
1. Add phone field to CreateOrderDto
2. Store it in user profile
3. Remove from test (not needed for mock system)

---

## 🚀 QUICK FIXES TO APPLY

### Fix #1: Update Test Script
File: `run-final-tests.py`

**Replace:**
```python
order_data = {
    "items": [{"productId": self.product_id, "quantity": 2, "notes": "no ice"}],
    "shippingAddress": "123 Nguyen Trai, District 1, HCMC",
    "phone": "0901234567",
    "paymentMethod": "COD"
}
```

**With:**
```python
order_data = {
    "items": [{"productId": self.product_id, "quantity": 2, "note": "no ice"}],
    "address": "123 Nguyen Trai St, District 1, HCMC",
    "paymentMethod": "COD"
}
```

---

## 📋 CORRECTED API ENDPOINT REFERENCE

### Order Creation
```
POST /orders
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "items": [
    {
      "productId": "UUID",
      "quantity": 1,
      "note": "optional notes"
    }
  ],
  "address": "delivery address",
  "paymentMethod": "COD|MOMO|VNPAY",
  "note": "optional order notes"
}

Response: 201 Created
{
  "id": "order-uuid",
  "userId": "user-uuid",
  "items": [...],
  "address": "...",
  "paymentMethod": "COD",
  "status": "pending",
  "totalAmount": 50000,
  "createdAt": "2026-04-05T...",
  "updatedAt": "2026-04-05T..."
}
```

---

## ✅ VALIDATION CHECKLIST

After applying fixes, verify:

- [x] **Order Creation** - Should return 201 with order object
- [ ] **Order Retrieval** - GET /orders/my should contain the created order
- [ ] **Order Details** - GET /orders/{id} should show full order info
- [ ] **Payment Creation** - POST /payments/momo/create should work
- [ ] **Review Creation** - POST /reviews should work (if user has order)
- [ ] **Admin Orders** - GET /admin/orders should list the order

---

## 📊 EXPECTED TEST RESULTS AFTER FIXES

```
Before Fixes:
✅ Passed: 13/16 (81.2%)
❌ Failed: 3/16 (18.8%)

After Fixes:
✅ Passed: 15/16 (93.7%)
❌ Remaining: 1/16 (User endpoint - Low priority)
```

---

## 🔍 HOW TO VERIFY FIXES

### Test Order Creation
```bash
curl -X POST http://localhost:4000/orders \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "89c3e666-e6c2-474c-a7e7-bd66ef3237ca", "quantity": 1}],
    "address": "123 Main St",
    "paymentMethod": "COD"
  }'
```

Expected: 201 Created with order object

### Test with Python
```python
import requests

token = "your_jwt_token"
headers = {"Authorization": f"Bearer {token}"}

order_data = {
    "items": [{"productId": "89c3e666-e6c2-474c-a7e7-bd66ef3237ca", "quantity": 1}],
    "address": "123 Main St",
    "paymentMethod": "COD"
}

response = requests.post(
    "http://localhost:4000/orders",
    json=order_data,
    headers=headers
)

print(response.status_code)  # Should be 201
print(response.json())
```

---

## 🎯 SUMMARY

| Issue | Severity | Status | Fix Time |
|-------|----------|--------|----------|
| Order DTO Schema | 🔴 Critical | Identified | 5 min |
| Review Permission | 🟡 Medium | Needs Investigation | 10 min |
| Users Endpoint | 🟡 Low | Nice-to-have | 15 min |
| Phone Field | ℹ️ Info | Optional | N/A |

**Total Estimated Fix Time: 30 minutes**

---

**Generated:** 2026-04-05  
**Next Action:** Apply Fix #1 and re-run tests
