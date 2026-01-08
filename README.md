# Wallet Service – Backend Assignment

This repository contains a simple wallet service built with NestJS.

Users have a balance which can be credited or debited via API calls.

## Solutions and Improvements

### 1. Concurrency and Race Conditions
**Issue**: The original implementation was susceptible to race conditions. Multiple simultaneous debit/credit requests for the same user could lead to inconsistent balances because the read-modify-write cycle was not atomic.
**Solution**: Implemented a **Promise-based locking mechanism** (`withLock`) in `WalletService`.
- It ensures that balance operations for a specific user are queued and executed sequentially.
- This maintains atomicity even in an asynchronous environment without using a traditional database lock.

### 2. Input Validation
**Issue**: The API accepted negative amounts (which could lead to logical errors) and didn't strictly validate the presence of `userId`.
**Solution**: 
- Added checks for `amount > 0`.
- Added checks for `userId` presence.
- Automatically initializes a wallet for a user during a `credit` operation if it doesn't already exist, improving the developer experience.

### 3. Asynchronous Consistency
**Issue**: Some methods were synchronous while others were asynchronous, making the API inconsistent and harder to refactor for future database integration.
**Solution**: Converted all service methods to `async`. This ensures consistent error handling (via Promises) and makes it trivial to swap the in-memory store for a persistent database (PostgreSQL/MongoDB) in the future.

### 4. Robust Error Handling
- Leveraged NestJS `BadRequestException` for consistent API error responses.
- Improved the `debit` method to strictly check for wallet existence and sufficient balance before proceeding.


---




---

## Duration
**45–60 minutes max**
---

## What’s provided
- A minimal NestJS application
- In-memory wallet storage
- APIs to credit and debit balance

Initial wallet balance for user `u1` is `100`.

---

## APIs

### POST /wallet/credit
Credit amount to a user's wallet.

**Request Body:**
```json
{
  "userId": "u1",
  "amount": 50
}
```

**Response:**
```json
{
  "balance": 150
}
```

### POST /wallet/debit
Debit amount from a user's wallet.

**Request Body:**
```json
{
  "userId": "u1",
  "amount": 30
}
```

**Response:**
```json
{
  "balance": 70
}
```

**Error Response (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "Insufficient balance"
}
```

### GET /wallet/balance
Get the current balance for a user.

**Query Parameters:**
- `userId` (required): The user ID (e.g., "u1")

**Response:**
```json
{
  "balance": 100
}
```  

---

## Task (mandatory)

1. Review the implementation.
2. Identify any potential issues and modify the implementation to address them.
3. Explain your approach and any assumptions or trade-offs.

You may refactor the service if needed, but minimal changes are preferred.

**Note:** Please ensure your code is well-documented with clear comments explaining your approach and any complex logic.

---

## Notes

- The storage is intentionally in-memory.
- There is no single "correct" solution.
- You may update this README if required to document your changes.

---

---

