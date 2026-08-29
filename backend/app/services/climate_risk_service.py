import httpx
import random

class ClimateRiskService:
    """
    Service to fetch real-world climate data from Open-Meteo (free API, no key required).
    Uses geographical coordinates (latitude, longitude) to assess current agricultural risk.
    """
    
    # Simple mapping of Indian states to approx center coordinates for demo
    # In a real app, we'd geocode the PIN code.
    STATE_COORDS = {
        "MH": {"lat": 19.7515, "lon": 75.7139}, # Maharashtra
        "UP": {"lat": 26.8467, "lon": 80.9462}, # Uttar Pradesh
        "MP": {"lat": 22.9734, "lon": 78.6569}, # Madhya Pradesh
        "GJ": {"lat": 22.2587, "lon": 71.1924}, # Gujarat
        "DEFAULT": {"lat": 20.5937, "lon": 78.9629} # Center India
    }

    @staticmethod
    async def get_climate_risk(state_code: str = "MH") -> dict:
        coords = ClimateRiskService.STATE_COORDS.get(state_code.upper(), ClimateRiskService.STATE_COORDS["DEFAULT"])
        
        try:
            # Open-Meteo API for daily precipitation and soil moisture/temperature
            url = f"https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": coords["lat"],
                "longitude": coords["lon"],
                "daily": "precipitation_sum",
                "timezone": "Asia/Kolkata",
                "past_days": 7
            }
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    # Calculate total precipitation in the last 7 days
                    precip_sum = sum([p for p in data.get('daily', {}).get('precipitation_sum', []) if p is not None])
                    
                    # Risk logic: If less than 10mm rain in 7 days, apply drought risk penalty
                    if precip_sum < 10.0:
                        risk_penalty = 0.05  # -5% to approval odds
                        condition = "DRY_SPELL"
                    elif precip_sum > 150.0:
                        risk_penalty = 0.08  # -8% due to flood risk
                        condition = "FLOOD_WARNING"
                    else:
                        risk_penalty = 0.00
                        condition = "OPTIMAL"
                        
                    return {
                        "climate_risk_penalty": risk_penalty,
                        "recent_precipitation_mm": precip_sum,
                        "condition": condition,
                        "location_coords": coords
                    }
        except Exception as e:
            print(f"Climate API Error: {e}")
            
        # Fallback if API fails
        return {
            "climate_risk_penalty": 0.0,
            "recent_precipitation_mm": 25.0,
            "condition": "API_UNAVAILABLE",
            "location_coords": coords
        }
