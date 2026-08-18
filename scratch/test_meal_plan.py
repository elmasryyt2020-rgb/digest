import urllib.request
import json
import time

url = "http://41.33.93.209:8000/functions/v1/generate-meal-plan"
anon_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg2OTY2MTIwLCJleHAiOjIxMDIzMjYxMjB9.j7RDOdlc1CatH5ZttQhHaj7BeeBI75ggnS4d6XCvh1c"

payload = {
    "gender": "male",
    "age": 28,
    "weight_kg": 82,
    "height_cm": 180,
    "activity_level": "moderately_active",
    "health_goal": "lose_weight",
    "diet_type": "classic",
    "exclusions": [],
    "country": "EG",
    "budget": "medium"
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {anon_key}",
    "apikey": anon_key
}

print("Invoking generate-meal-plan on VPS...")
t0 = time.time()
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        t1 = time.time()
        print(f"STATUS: {resp.status} in {round(t1 - t0, 2)}s")
        data = json.loads(resp.read().decode('utf-8'))
        print("Target calories:", data.get("target_calories"))
        meals = data.get("meals", {})
        print("Meals days:", list(meals.keys()))
        for day, dayMeals in meals.items():
            titles = [f"{cat}: {m.get('title_en')} ({m.get('total_calories')} kcal)" for cat, m in dayMeals.items()]
            print(f"  {day.upper()}: {', '.join(titles)}")
        print("Grocery items count:", len(data.get("grocery_list", [])))
        print("SUCCESS!")
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code, e.read().decode('utf-8'))
except Exception as e:
    print("ERROR:", e)
