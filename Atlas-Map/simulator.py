import requests
import time
import random

COLLECTOR_URL = "http://localhost:5002/trace"

services = [
    "Auth-Service", "Gateway", "User-Service", "Payment-API", 
    "Inventory-DB", "Shipping-Provider", "Notification-Hub", 
    "Legacy-ERP", "Analytics-Engine"
]

def send_trace(source, target, status="OK"):
    try:
        payload = {"source": source, "target": target, "status": status}
        requests.post(COLLECTOR_URL, json=payload)
        print(f"Trace sent: {source} -> {target} [{status}]")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Starting Atlas-Map Simulation...")
    while True:
        # Padrão Normal
        for _ in range(5):
            src = random.choice(services)
            dest = random.choice(services)
            if src != dest:
                send_trace(src, dest, "OK")
        
        # Padrão de Erro (Gargalo simulado)
        if random.random() > 0.7:
            critical_service = random.choice(["Payment-API", "Legacy-ERP", "Inventory-DB"])
            print(f"!!! Simulating bottleneck on {critical_service} !!!")
            send_trace("Gateway", critical_service, "ERROR")
            send_trace(critical_service, "Auth-Service", "ERROR")

        time.sleep(5)
