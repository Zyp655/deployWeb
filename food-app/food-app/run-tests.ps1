# Comprehensive API Testing Script for Food Ordering Platform
# Run this script: powershell -ExecutionPolicy Bypass -File .\run-tests.ps1

$results = @()
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$BaseUrl = "http://localhost:4000"
$AiServiceUrl = "http://localhost:8000"

function Test-Endpoint {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null
    )
    
    $url = "$BaseUrl$Endpoint"
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $url -Method GET -Headers $headers -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -Body (ConvertTo-Json $Body) -ErrorAction Stop
        }
        
        return @{
            StatusCode = $response.StatusCode
            Body = $response.Content
            Success = $true
        }
    } catch {
        return @{
            StatusCode = $_.Exception.Response.StatusCode.Value
            Body = $_.Exception.Message
            Success = $false
            Error = $_
        }
    }
}

Write-Host "===== FOOD APP API TESTING =====" -ForegroundColor Green
Write-Host "Started: $timestamp" -ForegroundColor Cyan
Write-Host ""

# MODULE 1: Basic API Connectivity & Products
Write-Host "MODULE 1: Basic API Connectivity & Products" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

# Test 1.1: GET /products
Write-Host "Test 1.1: GET /products"
$result = Test-Endpoint -Endpoint "/products"
Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
if ($result.Success) {
    $products = ConvertFrom-Json $result.Body
    Write-Host "Result: ✅ PASS - Retrieved $(($products | Measure-Object).Count) products" -ForegroundColor Green
    Write-Host "First product: $($products[0].name)" -ForegroundColor Gray
} else {
    Write-Host "Result: ❌ FAIL - $($result.Body)" -ForegroundColor Red
}
Write-Host ""

# Test 1.2: GET /products/:id
Write-Host "Test 1.2: GET /products/1"
$result = Test-Endpoint -Endpoint "/products/1"
Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
if ($result.Success) {
    $product = ConvertFrom-Json $result.Body
    Write-Host "Result: ✅ PASS - Product: $($product.name)" -ForegroundColor Green
} else {
    Write-Host "Result: ❌ FAIL" -ForegroundColor Red
}
Write-Host ""

# MODULE 2: Authentication
Write-Host "MODULE 2: Authentication & Users" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

# Test 2.1: POST /auth/register
Write-Host "Test 2.1: POST /auth/register"
$registerBody = @{
    email = "testuser@foodapp.vn"
    password = "Test@12345"
    name = "Test User"
}
$result = Test-Endpoint -Method "POST" -Endpoint "/auth/register" -Body $registerBody
Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
if ($result.StatusCode -eq 201 -or $result.StatusCode -eq 200) {
    $response = ConvertFrom-Json $result.Body
    if ($response.access_token) {
        Write-Host "Result: ✅ PASS - User registered, token received" -ForegroundColor Green
        $script:TestToken = $response.access_token
    } else {
        Write-Host "Result: ✅ PASS - User registered (possibly already exists)" -ForegroundColor Green
    }
} else {
    Write-Host "Result: ⚠️  Status $($result.StatusCode)" -ForegroundColor Yellow
    Write-Host "Response: $($result.Body.Substring(0, [Math]::Min(200, $result.Body.Length)))" -ForegroundColor Gray
}
Write-Host ""

# Test 2.2: POST /auth/login
Write-Host "Test 2.2: POST /auth/login"
$loginBody = @{
    email = "testuser@foodapp.vn"
    password = "Test@12345"
}
$result = Test-Endpoint -Method "POST" -Endpoint "/auth/login" -Body $loginBody
Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
if ($result.Success -and $result.StatusCode -eq 200) {
    $response = ConvertFrom-Json $result.Body
    Write-Host "Result: ✅ PASS - Login successful, token received" -ForegroundColor Green
    $script:TestToken = $response.access_token
    $script:UserId = $response.user.id
    Write-Host "Token: $($script:TestToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "User ID: $($script:UserId)" -ForegroundColor Gray
} else {
    Write-Host "Result: ❌ FAIL - Login failed: $($result.Body.Substring(0, 100))" -ForegroundColor Red
}
Write-Host ""

# Test 2.3: Admin Login
Write-Host "Test 2.3: POST /auth/login (Admin)"
$adminLoginBody = @{
    email = "admin@foodapp.com"
    password = "Admin@123"
}
$result = Test-Endpoint -Method "POST" -Endpoint "/auth/login" -Body $adminLoginBody
Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
if ($result.Success -and $result.StatusCode -eq 200) {
    $response = ConvertFrom-Json $result.Body
    Write-Host "Result: ✅ PASS - Admin login successful" -ForegroundColor Green
    $script:AdminToken = $response.access_token
} else {
    Write-Host "Result: ⚠️  Could not login as admin - may need to be created" -ForegroundColor Yellow
}
Write-Host ""

# MODULE 3: Orders
Write-Host "MODULE 3: Orders & Cart Flow" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

if ($script:TestToken) {
    # Test 3.1: Create Order
    Write-Host "Test 3.1: POST /orders (Create Order)"
    $orderBody = @{
        items = @(
            @{
                productId = 1
                quantity = 2
                notes = "no ice"
            }
        )
        shippingAddress = "123 Nguyen Trai, District 1, HCMC"
        phone = "0901234567"
        paymentMethod = "COD"
    }
    $result = Test-Endpoint -Method "POST" -Endpoint "/orders" -Body $orderBody -Token $script:TestToken
    Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
    if ($result.Success -and ($result.StatusCode -eq 201 -or $result.StatusCode -eq 200)) {
        $orderResponse = ConvertFrom-Json $result.Body
        Write-Host "Result: ✅ PASS - Order created" -ForegroundColor Green
        $script:OrderId = $orderResponse.id
        Write-Host "Order ID: $($script:OrderId)" -ForegroundColor Gray
    } else {
        Write-Host "Result: ⚠️  Status $($result.StatusCode) - $($result.Body.Substring(0, 150))" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Test 3.2: Get User Orders
    Write-Host "Test 3.2: GET /orders/my (User Orders)"
    $result = Test-Endpoint -Endpoint "/orders/my" -Token $script:TestToken
    Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
    if ($result.Success) {
        Write-Host "Result: ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "Result: ⚠️  Could not retrieve orders" -ForegroundColor Yellow
    }
    Write-Host ""
}

# MODULE 4: Reviews
Write-Host "MODULE 4: Reviews & Ratings" -ForegroundColor Yellow
Write-Host "===========================" -ForegroundColor Yellow

if ($script:TestToken) {
    Write-Host "Test 4.1: POST /reviews (Create Review)"
    $reviewBody = @{
        productId = 1
        rating = 5
        comment = "Rất ngon!"
    }
    $result = Test-Endpoint -Method "POST" -Endpoint "/reviews" -Body $reviewBody -Token $script:TestToken
    Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
    if ($result.Success -and $result.StatusCode -eq 201) {
        Write-Host "Result: ✅ PASS - Review created" -ForegroundColor Green
    } else {
        Write-Host "Result: ⚠️  Could not create review" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Test 4.2: GET Reviews
Write-Host "Test 4.2: GET /products/1/reviews"
$result = Test-Endpoint -Endpoint "/products/1/reviews"
Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
if ($result.Success) {
    $reviews = ConvertFrom-Json $result.Body
    Write-Host "Result: ✅ PASS - Retrieved reviews" -ForegroundColor Green
} else {
    Write-Host "Result: ⚠️  Could not retrieve reviews" -ForegroundColor Yellow
}
Write-Host ""

# MODULE 5: Admin Endpoints
Write-Host "MODULE 5: Admin Endpoints" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow

if ($script:AdminToken) {
    Write-Host "Test 5.1: GET /admin/stats"
    $result = Test-Endpoint -Endpoint "/admin/stats" -Token $script:AdminToken
    Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
    if ($result.Success) {
        Write-Host "Result: ✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "Result: ⚠️  $($result.Body.Substring(0, 100))" -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "⚠️  Admin token not available - skipping admin tests" -ForegroundColor Yellow
}

# MODULE 6: Error Handling & Security
Write-Host "MODULE 6: Error Handling & Security" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow

Write-Host "Test 6.1: GET /admin/stats (without token)"
$result = Test-Endpoint -Endpoint "/admin/stats"
Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
if ($result.StatusCode -eq 401) {
    Write-Host "Result: ✅ PASS - Correctly denied without auth" -ForegroundColor Green
} else {
    Write-Host "Result: ⚠️  Expected 401, got $($result.StatusCode)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Test 6.2: GET /products/99999 (non-existent)"
$result = Test-Endpoint -Endpoint "/products/99999"
Write-Host "Status: $($result.StatusCode)" -ForegroundColor Green
if ($result.StatusCode -eq 404 -or $result.StatusCode -eq 400) {
    Write-Host "Result: ✅ PASS - Correctly returned error" -ForegroundColor Green
} else {
    Write-Host "Result: ⚠️  Expected 404, got $($result.StatusCode)" -ForegroundColor Yellow
}
Write-Host ""

# MODULE 7: AI Service
Write-Host "MODULE 7: AI Service Endpoints" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow

Write-Host "Test 7.1: Check AI Service - GET /docs"
try {
    $response = Invoke-WebRequest -Uri "$AiServiceUrl/docs" -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Result: ✅ PASS - AI Service accessible" -ForegroundColor Green
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value)" -ForegroundColor Yellow
    Write-Host "Result: ⚠️  AI Service may not be running" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "===== TEST EXECUTION COMPLETED =====" -ForegroundColor Green
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
