#!/usr/bin/env python3
"""
Simple script to view LangChain logs in real-time
Usage: python view-logs.py
"""

import json
import requests
import time
import sys

# Configuration
AGENT_URL = "http://localhost:8001"

def view_status_logs():
    """View logs from the /status endpoint"""
    try:
        response = requests.get(f"{AGENT_URL}/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            
            print("\n" + "="*80)
            print("🎭 KULFY AGENT - LANGCHAIN LOGS")
            print("="*80)
            print(f"Status: {'🟢 Running' if data.get('is_running') else '⚪ Idle'}")
            print(f"Current Step: {data.get('current_step', 'N/A')}")
            print(f"Last Run: {data.get('last_run', 'N/A')}")
            print(f"Total Logs: {data.get('log_count', len(data.get('logs', [])))}")
            print("-"*80)
            
            logs = data.get('logs', [])
            if logs:
                print("\n📋 LOGS:")
                print("-"*80)
                for i, log_entry in enumerate(logs, 1):
                    log_type = log_entry.get('type', 'info')
                    message = log_entry.get('message', '')
                    timestamp = log_entry.get('timestamp', '')
                    
                    # Color coding
                    prefix = {
                        'info': 'ℹ️ ',
                        'success': '✅',
                        'error': '❌',
                        'warning': '⚠️ '
                    }.get(log_type, '•')
                    
                    if timestamp:
                        print(f"{prefix} [{timestamp}] {message}")
                    else:
                        print(f"{prefix} {message}")
            else:
                print("\n📋 No logs yet. Start a generation to see logs!")
            
            print("\n" + "="*80)
            
            # Show last result summary if available
            last_result = data.get('last_result')
            if last_result:
                print("\n📊 LAST RESULT SUMMARY:")
                print("-"*80)
                if isinstance(last_result, dict):
                    summary = last_result.get('summary', {})
                    if summary:
                        print(f"Status: {summary.get('status', 'N/A')}")
                        print(f"Articles Scraped: {summary.get('articles_scraped', 0)}")
                        print(f"Concepts Generated: {summary.get('concepts_generated', 0)}")
                        print(f"Images Created: {summary.get('images_created', 0)}")
                        print(f"Successful Uploads: {summary.get('successful_uploads', 0)}")
                        print(f"Failed Uploads: {summary.get('failed_uploads', 0)}")
                        
                        upload_results = summary.get('upload_results', [])
                        if upload_results:
                            print("\n📤 Upload Results:")
                            for i, result in enumerate(upload_results, 1):
                                if result.get('success'):
                                    print(f"  ✅ {i}. {result.get('title', 'N/A')} - CID: {result.get('cid', 'N/A')[:20]}...")
                                else:
                                    print(f"  ❌ {i}. Failed: {result.get('error', 'Unknown error')}")
            
        else:
            print(f"❌ Error: Agent returned status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Error: Cannot connect to agent at {AGENT_URL}")
        print("   Make sure the agent is running: cd kulfy-agent && uvicorn main:app --reload")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


def view_file_logs():
    """View logs from langchain.log file"""
    try:
        with open('langchain.log', 'r') as f:
            lines = f.readlines()
            if lines:
                print("\n" + "="*80)
                print("📄 LANGCHAIN.LOG FILE")
                print("="*80)
                # Show last 50 lines
                for line in lines[-50:]:
                    print(line.rstrip())
                print("="*80)
            else:
                print("📄 langchain.log file is empty")
    except FileNotFoundError:
        print("📄 langchain.log file not found (no logs generated yet)")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="View Kulfy Agent LangChain logs")
    parser.add_argument('--file', action='store_true', help='View langchain.log file instead of status endpoint')
    parser.add_argument('--watch', action='store_true', help='Watch logs in real-time (refresh every 2 seconds)')
    
    args = parser.parse_args()
    
    if args.file:
        view_file_logs()
    elif args.watch:
        print("👀 Watching logs (Press Ctrl+C to stop)...")
        try:
            while True:
                view_status_logs()
                time.sleep(2)
                print("\n" * 2)  # Clear screen effect
        except KeyboardInterrupt:
            print("\n\n👋 Stopped watching logs")
    else:
        view_status_logs()



