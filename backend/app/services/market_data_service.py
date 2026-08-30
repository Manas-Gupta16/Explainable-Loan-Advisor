import httpx
import re
import urllib3
import time
from datetime import datetime, timedelta

# Disable insecure request warnings for simplicity when scraping standard http pages if needed
urllib3.disable_warnings()

class MarketDataService:
    """
    Service to fetch live macroeconomic data (like the RBI Repo Rate)
    to power External Benchmark Lending Rates (EBLR) for the simulator.
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MarketDataService, cls).__new__(cls)
            cls._instance._cache = None
            cls._instance._last_fetched = None
            cls._instance._cache_ttl = timedelta(hours=24) # Cache for 24 hours
        return cls._instance

    def get_rbi_repo_rate(self) -> float:
        """
        Fetches the live RBI Repo rate. Uses an in-memory cache to avoid spamming the RBI website.
        """
        now = datetime.now()
        
        # Return cached value if it's still fresh
        if self._cache is not None and self._last_fetched is not None:
            if now - self._last_fetched < self._cache_ttl:
                return self._cache
                
        # Otherwise, fetch fresh data
        try:
            print("Fetching live RBI Repo Rate from rbi.org.in...")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            # Using synchronous httpx since this is just a quick regex scrape
            response = httpx.get('https://rbi.org.in/home.aspx', headers=headers, verify=False, timeout=10.0)
            
            if response.status_code == 200:
                # Search for "Policy Repo Rate" followed by a percentage
                match = re.search(r'Policy Repo Rate.*?(\d+\.\d+)%', response.text, re.IGNORECASE | re.DOTALL)
                
                if match:
                    rate = float(match.group(1))
                    self._cache = rate
                    self._last_fetched = now
                    print(f"Successfully scraped live RBI Repo Rate: {rate}%")
                    return rate
                else:
                    print("Warning: Could not parse Repo Rate from RBI HTML. Falling back to default.")
            else:
                print(f"Warning: Failed to fetch RBI website (Status {response.status_code}). Falling back to default.")
                
        except Exception as e:
            print(f"Error fetching RBI Repo Rate: {e}")
            
        # Fallback to standard 6.50% if website is down or layout changed heavily
        fallback_rate = 6.50
        print(f"Using fallback RBI Repo Rate: {fallback_rate}%")
        self._cache = fallback_rate
        self._last_fetched = now
        return fallback_rate

market_data_service = MarketDataService()
