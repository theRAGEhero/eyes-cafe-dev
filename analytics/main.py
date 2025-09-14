#!/usr/bin/env python3

import os
from fastapi import FastAPI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Eyes Café Analytics Service", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Eyes Café Analytics Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ANALYTICS_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)