import urllib.request
import json

url = "http://41.33.93.209:8000/functions/v1/generate-recipe"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg2OTY2MTIwLCJleHAiOjIxMDIzMjYxMjB9.j7RDOdlc1CatH5ZttQhHaj7BeeBI75ggnS4d6XCvh1c"

payload = {
    "ingredients": ["eggs", "tomatoes", "onions"],
    "dietType": "classic",
    "country": "EG"
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {anon_key}",
    "apikey": anon_key
}

print("Invoking generate-recipe on VPS...")
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        print("STATUS:", resp.status)
        data = json.loads(resp.read().decode('utf-8'))
        print("Recipe title:", data.get("title_en"))
        print("SUCCESS!")
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code, e.read().decode('utf-8'))
except Exception as e:
    print("ERROR:", e)
