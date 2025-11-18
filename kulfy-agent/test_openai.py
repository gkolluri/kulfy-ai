#!/usr/bin/env python3
"""
Quick test script to verify OpenAI API connectivity
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

print("="*60)
print("🔍 Testing OpenAI API Connection")
print("="*60)

# Check API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("❌ OPENAI_API_KEY environment variable is not set!")
    exit(1)

print(f"✅ API Key found: {api_key[:10]}...{api_key[-4:]}")
print(f"   Length: {len(api_key)} characters")
print(f"   Starts with 'sk-': {api_key.startswith('sk-')}")

# Try a simple API call
print("\n🧪 Testing simple API call...")
try:
    client = OpenAI(api_key=api_key)
    
    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "user", "content": "Say 'API is working!' in JSON format"}
        ],
        response_format={"type": "json_object"},
        timeout=30.0
    )
    
    print("✅ API call successful!")
    print(f"   Model: {response.model}")
    print(f"   Response: {response.choices[0].message.content}")
    print("\n🎉 OpenAI API is working correctly!")
    
except Exception as e:
    print(f"❌ API call failed: {str(e)}")
    print(f"   Error type: {type(e).__name__}")
    exit(1)

print("="*60)

