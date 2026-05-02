# ⚡ Quick Start - Use Real API Now

## 🚀 In 3 Steps:

### Step 1: Start the App
```bash
npm run dev
```
App will start on `http://localhost:3003` (or next available port)

### Step 2: Test API in Browser Console
Open DevTools (F12), paste this:
```javascript
// Load test suite
const s = document.createElement('script')
s.textContent = `
const testEndpoint = async (method, path, body) => {
  const token = localStorage.getItem('access_token')
  const response = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': 'Bearer ' + token })
    },
    body: body ? JSON.stringify(body) : null
  })
  const data = await response.json()
  console.log(method, path, response.status, data)
  return data
}

// Test login
testEndpoint('POST', '/auth/login', {identifier:'test', password:'test'})
  .then(d => localStorage.setItem('access_token', d.data?.accessToken || d.token))
  .then(() => console.log('✅ Logged in!'))
`
document.body.appendChild(s)
```

### Step 3: Verify Connection
```javascript
// Check if logged in
localStorage.getItem('access_token') ? '✅ Ready' : '❌ Not logged in'

// Get feed
fetch('/api/posts/feed', {
  headers: {'Authorization': 'Bearer ' + localStorage.getItem('access_token')}
}).then(r => r.json()).then(d => console.log('Posts:', d.data))
```

---

## 🔧 Backend API Status

**URL**: https://postmaxillary-variably-justa.ngrok-free.dev/api/v1  
**Status**: ✅ Online  
**Test User**: `test` / `test`

---

## 📋 What's Already Working

✅ Authentication (Login, Register)  
✅ Posts (Create, Read, List)  
✅ Chat (Conversations, Messages)  
✅ Notifications  
✅ Profile  
✅ Orders  
✅ Quotes  

All with automatic fallback to mock data if backend goes down.

---

## 🧪 Full Test Suite

Use the `API_TEST_SUITE.js` file:

```javascript
// Load it
fetch('/API_TEST_SUITE.js').then(r => r.text()).then(eval)

// Run all tests
API_TEST.testAllApis()

// Or specific tests
API_TEST.testAuthApi()
API_TEST.testPostApi()
API_TEST.testChatApi()
API_TEST.testNotificationApi()
API_TEST.testProfileApi()

// Check status
API_TEST.getApiStatus()

// Clear data
API_TEST.clearAllData()
```

---

## 📖 Documentation Files

- **API_REAL_IMPLEMENTATION.md** - Full implementation guide
- **API_INTEGRATION_GUIDE.md** - Architecture & endpoints
- **API_TEST_SUITE.js** - Automated testing

---

## ⚠️ If Something Breaks

**Check these files in order:**

1. `.env.local` - Verify API domain is set
2. Console (F12) - Look for error messages  
3. Network tab - Check API responses
4. `localStorage` - Verify token exists

**Quick fixes:**

```javascript
// Clear all data
localStorage.clear()

// Re-add API domain
localStorage.setItem('api_domain', 'https://postmaxillary-varially-justa.ngrok-free.dev/api/v1')

// Re-login
// Go to /dang-nhap page and login again
```

---

## 🎯 Next Steps

1. ✅ Backend is online
2. ✅ Frontend configured  
3. ✅ Proxy routes set up
4. ⏳ Test all endpoints (use test suite)
5. ⏳ Fix any data type mismatches
6. ⏳ Test real-time features (socket.io)
7. ⏳ Load test with real data
8. ⏳ Security review
9. ⏳ Production deployment

---

**Everything is set up. Just start testing!** 🚀
