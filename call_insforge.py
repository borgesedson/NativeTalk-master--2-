import subprocess
import json
import sys

def call_method(method_name, params={}):
    cmd = [
        "npx", "-y", "@insforge/mcp@latest",
        "--api_key", "ik_a725f6f8f31f2bec1c5f40adfbb4e653",
        "--api_base_url", "https://7qi47s5n.us-west.insforge.app"
    ]
    
    payload = {
        "jsonrpc": "2.0",
        "method": method_name,
        "params": params,
        "id": 1
    }
    
    process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding='utf-8',
        errors='ignore',
        shell=True
    )
    
    print(f"Sending payload to {method_name}: {json.dumps(payload)}")
    stdout, stderr = process.communicate(input=json.dumps(payload) + "\n")
    
    with open("insforge_stdout.json", "w", encoding="utf-8") as f:
        f.write(stdout)
    with open("insforge_stderr.log", "w", encoding="utf-8") as f:
        f.write(stderr)
    
    print(f"--- Results for {method_name} written to insforge_stdout.json and insforge_stderr.log ---")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        call_method("tools/list", {})
    else:
        tool = sys.argv[1] if len(sys.argv) > 1 else "get-backend-metadata"
        
        import os
        if os.path.exists("args.json"):
            with open("args.json", "r", encoding="utf-8") as f:
                args = json.load(f)
        else:
            args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
            
        call_method("tools/call", {"name": tool, "arguments": args})
