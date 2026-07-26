import requests
import time
import random
from datetime import datetime

API_URL = "https://paper-grade-change.onrender.com/api/ingest"
COMMAND_URL = "https://paper-grade-change.onrender.com/api/command"

state = {
    "target_basis_weight": 80.0,
    "basis_weight": 80.0,
    "stock_flow": 100.0,
    "steam_pressure": 50.0,
    "machine_speed": 1000.0,
    "filler_flow": 25.0,
    "moisture": 5.5,
    "ash": 12.0,
    "caliper": 102.0,
    "ambient_humidity": 45.0,
    "recipe_limits": "Grade_A_Standard",
    "grade_change_active": False,
    "status": "In-Spec"
}

def add_gaussian_noise(value, variance):
    return round(value + random.gauss(0, variance), 2)

def move_towards(current, target, step_percentage):
    """Calculates gradual interpolation for smooth chart recovery"""
    return current + ((target - current) * step_percentage)

def simulate_factory():
    print("Starting Interactive Digital Twin Simulator...")
    
    phase = "NORMAL"
    ticks = random.randint(15, 25)
    delay_ticks = 0
    
    while True:
        # 2. State Machine Physics
        if phase == "NORMAL":
            ticks -= 1
            if ticks <= 0:
                phase = "ANOMALY"
                state["grade_change_active"] = True
                state["target_basis_weight"] = 90.0
                state["recipe_limits"] = "Grade_B_Transition"
                print("\n⚠️ SYSTEM FAULT INJECTED: Initiating Transition Anomaly...\n")
            else:
                state["basis_weight"] = add_gaussian_noise(80.0, 0.2)
                state["stock_flow"] = add_gaussian_noise(100.0, 0.5)
                state["steam_pressure"] = add_gaussian_noise(50.0, 0.3)
                state["ambient_humidity"] = add_gaussian_noise(45.0, 1.0)
                state["filler_flow"] = add_gaussian_noise(25.0, 0.1)
                state["moisture"] = add_gaussian_noise(5.5, 0.05)
                state["ash"] = add_gaussian_noise(12.0, 0.1)
                state["caliper"] = add_gaussian_noise(102.0, 0.2)
                state["status"] = "In-Spec"

        elif phase == "ANOMALY":
            # Variables diverge rapidly
            state["steam_pressure"] -= random.uniform(0.5, 1.5) 
            state["stock_flow"] += random.uniform(1.0, 2.0)
            state["ambient_humidity"] += random.uniform(1.0, 2.0)
            state["moisture"] += random.uniform(0.1, 0.3) 
            state["caliper"] -= random.uniform(0.2, 0.5)  
            
            deviation = (100.0 - state["steam_pressure"]) * 0.15
            state["basis_weight"] = add_gaussian_noise(80.0 + deviation, 0.5)
            
            if abs(state["basis_weight"] - 90.0) > (90.0 * 0.025):
                state["status"] = "Off-Spec"
                phase = "WAITING"
                print(f"⚠️ OFF-SPEC REACHED (Weight: {state['basis_weight']}) - Waiting for Operator Override...")
            else:
                state["status"] = "In-Spec"
                
        elif phase == "WAITING":
            # 1. ONLY Poll the Node server when we are actually waiting!
            cmd = "HOLD"
            try:
                res = requests.get(COMMAND_URL, timeout=1)
                if res.status_code == 200:
                    cmd = res.json().get("command", "HOLD")
            except Exception as e:
                pass

            # System wanders, remaining broken
            state["steam_pressure"] = add_gaussian_noise(state["steam_pressure"], 0.3)
            state["basis_weight"] = add_gaussian_noise(state["basis_weight"], 0.6)
            
            if cmd == "ACCEPT":
                print("\n✅ AI OVERRIDE ACCEPTED: Executing Fast Gradual Recovery...\n")
                phase = "RECOVERY_AI"
            elif cmd == "REJECT":
                print("\n❌ AI REJECTED: System remains unstable...\n")
                # Wait 2 to 4 ticks (4 to 8 seconds)
                delay_ticks = random.randint(2, 4)
                phase = "DELAY_MANUAL"

        elif phase == "DELAY_MANUAL":
            # Operator ignored AI, system continues to print bad paper
            state["steam_pressure"] = add_gaussian_noise(state["steam_pressure"], 0.5)
            state["basis_weight"] = add_gaussian_noise(state["basis_weight"], 0.8)
            delay_ticks -= 1
            
            if delay_ticks <= 0:
                print("\n🔧 MANUAL STABILIZATION DONE: Floor operators manually adjusting valves (Slow Recovery)...\n")
                phase = "RECOVERY_MANUAL"

        elif phase in ["RECOVERY_AI", "RECOVERY_MANUAL"]:
            # AI fixes the system 3x faster (30% per tick) than manual intervention (10% per tick)
            speed = 0.30 if phase == "RECOVERY_AI" else 0.10
            
            # Gradually interpolate all variables back to Grade B optimal limits
            state["steam_pressure"] = add_gaussian_noise(move_towards(state["steam_pressure"], 60.0, speed), 0.2)
            state["stock_flow"] = add_gaussian_noise(move_towards(state["stock_flow"], 120.0, speed), 0.4)
            state["ambient_humidity"] = add_gaussian_noise(move_towards(state["ambient_humidity"], 45.0, speed), 0.5)
            state["moisture"] = add_gaussian_noise(move_towards(state["moisture"], 6.0, speed), 0.05)
            state["caliper"] = add_gaussian_noise(move_towards(state["caliper"], 105.0, speed), 0.2)
            state["filler_flow"] = add_gaussian_noise(move_towards(state["filler_flow"], 28.0, speed), 0.1)
            state["basis_weight"] = add_gaussian_noise(move_towards(state["basis_weight"], 90.0, speed), 0.3)

            # Once it reaches target, finalize recovery and loop back
            if abs(state["basis_weight"] - 90.0) < 0.5 and abs(state["steam_pressure"] - 60.0) < 1.0:
                state["status"] = "In-Spec"
                state["recipe_limits"] = "Grade_B_Standard"
                print("\n✅ SYSTEM STABLE. Resetting for continuous demo loop...\n")
                
                # Reset instantly to Grade A starting values to keep the demo cycling cleanly
                state["target_basis_weight"] = 80.0
                state["recipe_limits"] = "Grade_A_Standard"
                state["steam_pressure"] = 50.0
                state["stock_flow"] = 100.0
                phase = "NORMAL"
                ticks = random.randint(15, 25)

        # Print current tick status
        print(f"[{phase}] Steam: {round(state['steam_pressure'], 1)} | Weight: {state['basis_weight']}")

        # Prepare and send payload
        payload = {
            "timestamp": datetime.now().isoformat(),
            "target_basis_weight": state["target_basis_weight"],
            "basis_weight": state["basis_weight"],
            "stock_flow": round(state["stock_flow"], 2),
            "steam_pressure": round(state["steam_pressure"], 2),
            "machine_speed": state["machine_speed"],
            "filler_flow": round(state["filler_flow"], 2),
            "moisture": round(state["moisture"], 2),
            "ash": round(state["ash"], 2),
            "caliper": round(state["caliper"], 2),
            "recipe_limits": state["recipe_limits"],
            "ambient_humidity": round(state["ambient_humidity"], 2),
            "status": state["status"],
            "grade_change_active": state["grade_change_active"]
        }

        try:
            requests.post(API_URL, json=payload)
        except Exception as e:
            pass

        time.sleep(2)

if __name__ == "__main__":
    simulate_factory()