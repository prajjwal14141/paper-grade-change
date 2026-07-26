def simulate_factory():
    print("🏭 Starting Continuous Interactive Simulator...")
    
    phase = "NORMAL"
    ticks = random.randint(15, 25)
    delay_ticks = 0
    
    while True:
        # 1. Non-blocking Poll for Command
        cmd = "HOLD"
        try:
            res = requests.get(COMMAND_URL, timeout=0.5)
            if res.status_code == 200:
                cmd = res.json().get("command", "HOLD")
        except:
            pass

        # 2. State Machine Logic
        if phase == "NORMAL":
            ticks -= 1
            if ticks <= 0:
                phase = "ANOMALY"
                state["grade_change_active"] = True
                state["target_basis_weight"] = 90.0
                state["recipe_limits"] = "Grade_B_Transition"
                print("\n⚠️ SYSTEM FAULT INJECTED...\n")
            else:
                state["basis_weight"] = add_gaussian_noise(80.0, 0.2)
                state["status"] = "In-Spec"

        elif phase == "ANOMALY":
            # Variables diverge
            state["steam_pressure"] -= random.uniform(0.5, 1.5) 
            state["stock_flow"] += random.uniform(1.0, 2.0)
            deviation = (100.0 - state["steam_pressure"]) * 0.15
            state["basis_weight"] = add_gaussian_noise(80.0 + deviation, 0.5)
            
            if abs(state["basis_weight"] - 90.0) > (90.0 * 0.025):
                state["status"] = "Off-Spec"
                phase = "WAITING"
                print(f"⚠️ OFF-SPEC REACHED (Weight: {state['basis_weight']}) - Waiting...")
            else:
                state["status"] = "In-Spec"
                
        elif phase == "WAITING":
            # System wanders
            state["steam_pressure"] = add_gaussian_noise(state["steam_pressure"], 0.3)
            state["basis_weight"] = add_gaussian_noise(state["basis_weight"], 0.6)
            
            if cmd == "ACCEPT":
                print("\n✅ AI ACCEPTED: Fast Recovery...\n")
                phase = "RECOVERY_AI"
            elif cmd == "REJECT":
                print("\n❌ AI REJECTED: Waiting for manual intervention...\n")
                delay_ticks = random.randint(2, 4) # 4-8 seconds (2-4 ticks * 2s)
                phase = "DELAY_MANUAL"

        elif phase == "DELAY_MANUAL":
            delay_ticks -= 1
            if delay_ticks <= 0:
                print("\n🔧 MANUAL STABILIZATION DONE: Recovering...\n")
                phase = "RECOVERY_MANUAL"

        elif phase in ["RECOVERY_AI", "RECOVERY_MANUAL"]:
            speed = 0.30 if phase == "RECOVERY_AI" else 0.10
            # Gradual interpolation
            state["steam_pressure"] = add_gaussian_noise(move_towards(state["steam_pressure"], 60.0, speed), 0.2)
            state["basis_weight"] = add_gaussian_noise(move_towards(state["basis_weight"], 90.0, speed), 0.3)

            # Check if stabilized
            if abs(state["basis_weight"] - 90.0) < 0.5:
                state["status"] = "In-Spec"
                print("\n✅ SYSTEM STABLE. Resetting...\n")
                # Reset cycle
                state["recipe_limits"] = "Grade_A_Standard"
                state["steam_pressure"] = 50.0
                state["stock_flow"] = 100.0
                phase = "NORMAL"
                ticks = random.randint(15, 25)

        # Print & Post Payload
        print(f"[{phase}] Steam: {round(state['steam_pressure'], 1)} | Weight: {state['basis_weight']}")
        
        # (Keep your existing payload and request.post code here)
        payload = { ... } # [Use your existing payload dict]
        try:
            requests.post(API_URL, json=payload)
        except:
            pass
            
        time.sleep(2)