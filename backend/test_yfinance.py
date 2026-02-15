
import yfinance as yf
try:
    ticker = yf.Ticker("TATASTEEL.NS")
    hist = ticker.history(period="1mo")
    if not hist.empty:
        print("Success: Fetched data for TATASTEEL.NS")
        print(hist.tail(3))
    else:
        print("Failed: No data found")
except Exception as e:
    print(f"Error: {e}")
