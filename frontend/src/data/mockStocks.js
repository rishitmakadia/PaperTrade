// Simulated stock prices — used when dataMode === "mock" (market closed or offline)
// Prices fluctuate randomly every 3s in the components that use this.

const BASE_PRICES = {
  RELIANCE:   1274.00, TCS:        2204.10, HDFCBANK:    693.80,
  INFY:       1036.50, ICICIBANK:  1384.50, BHARTIARTL: 1839.00,
  WIPRO:       166.30, SBIN:       1009.70, TATAMOTORS:  300.50,
  MARUTI:    12590.00, BAJFINANCE: 1043.50, SUNPHARMA:  1861.00,
  LT:         3955.00, ASIANPAINT: 2498.10, NESTLEIND:  1386.20,
  HINDUNILVR: 1942.30, ITC:         259.30, KOTAKBANK:   416.55,
  AXISBANK:   1246.00, TMPV:        300.50,
};

const SECTORS = {
  RELIANCE: "Energy", TCS: "IT", HDFCBANK: "Banking", INFY: "IT",
  ICICIBANK: "Banking", BHARTIARTL: "Telecom", WIPRO: "IT", SBIN: "Banking",
  TATAMOTORS: "Auto", TMPV: "Auto", MARUTI: "Auto", BAJFINANCE: "NBFC",
  SUNPHARMA: "Pharma", LT: "Infrastructure", ASIANPAINT: "Consumer", NESTLEIND: "FMCG",
  HINDUNILVR: "FMCG", ITC: "FMCG", KOTAKBANK: "Banking", AXISBANK: "Banking",
};

const NAMES = {
  RELIANCE: "Reliance Industries Ltd", TCS: "Tata Consultancy Services",
  HDFCBANK: "HDFC Bank Ltd", INFY: "Infosys Ltd", ICICIBANK: "ICICI Bank Ltd",
  BHARTIARTL: "Bharti Airtel Ltd", WIPRO: "Wipro Ltd", SBIN: "State Bank of India",
  TATAMOTORS: "Tata Motors Ltd", TMPV: "Tata Motors Pass Veh Ltd", MARUTI: "Maruti Suzuki India",
  BAJFINANCE: "Bajaj Finance Ltd", SUNPHARMA: "Sun Pharmaceutical",
  LT: "Larsen & Toubro Ltd", ASIANPAINT: "Asian Paints Ltd", NESTLEIND: "Nestle India Ltd",
  HINDUNILVR: "Hindustan Unilever Ltd", ITC: "ITC Ltd", KOTAKBANK: "Kotak Mahindra Bank",
  AXISBANK: "Axis Bank Ltd",
};

// In-memory state so prices persist across component re-renders in same session
let _prices = { ...BASE_PRICES };
let _changes = {};
Object.keys(BASE_PRICES).forEach((sym) => { _changes[sym] = (Math.random() - 0.48) * 2; });

export function getMockStocks() {
  // Tick all prices slightly
  Object.keys(_prices).forEach((sym) => {
    const drift = (Math.random() - 0.49) * _prices[sym] * 0.001;
    _prices[sym] = parseFloat(Math.max(_prices[sym] + drift, BASE_PRICES[sym] * 0.7).toFixed(2));
    _changes[sym] = parseFloat((_prices[sym] - BASE_PRICES[sym]).toFixed(2));
  });

  return Object.keys(BASE_PRICES).map((sym) => ({
    symbol:        sym,
    name:          NAMES[sym],
    price:         _prices[sym],
    change:        _changes[sym],
    changePercent: parseFloat(((_changes[sym] / BASE_PRICES[sym]) * 100).toFixed(2)),
    volume:        (Math.random() * 10 + 1).toFixed(1) + "M",
    high:          parseFloat((_prices[sym] * 1.005).toFixed(2)),
    low:           parseFloat((_prices[sym] * 0.995).toFixed(2)),
    open:          parseFloat((_prices[sym] * 1.001).toFixed(2)),
    prevClose:     BASE_PRICES[sym],
    sector:        SECTORS[sym],
    marketCap:     "N/A",
  }));
}

export function getMockHistory(symbol, period) {
  const days = period === "1W" ? 7 : period === "1M" ? 30 : period === "3M" ? 90 : 365;
  const base  = BASE_PRICES[symbol] || 1000;
  let price   = base * 0.85;
  const now   = new Date();
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));
    const change = (Math.random() - 0.47) * price * 0.02;
    price = Math.max(price + change, base * 0.5);
    return {
      date:  date.toISOString().split("T")[0],
      open:  parseFloat((price * 0.999).toFixed(2)),
      high:  parseFloat((price * 1.005).toFixed(2)),
      low:   parseFloat((price * 0.995).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      value: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 5000000 + 500000),
    };
  });
}

export function searchMockStocks(query) {
  if (!query || !query.trim()) return getMockStocks();
  const q = query.trim().toUpperCase();
  const all = getMockStocks();
  const matches = all.filter(
    (s) =>
      s.symbol.includes(q) ||
      (s.name && s.name.toUpperCase().includes(q)) ||
      (s.sector && s.sector.toUpperCase().includes(q))
  );
  if (matches.length > 0) return matches;

  const cleanSym = q.replace(/[^A-Z0-9]/g, "");
  if (!cleanSym) return [];

  const basePrice = Math.floor(Math.random() * 2000 + 100);
  return [
    {
      symbol: cleanSym,
      name: `${query.trim()} Ltd`,
      price: basePrice,
      change: parseFloat(((Math.random() - 0.48) * 10).toFixed(2)),
      changePercent: parseFloat(((Math.random() - 0.48) * 3).toFixed(2)),
      volume: "1.2M",
      high: parseFloat((basePrice * 1.02).toFixed(2)),
      low: parseFloat((basePrice * 0.98).toFixed(2)),
      open: parseFloat(basePrice.toFixed(2)),
      prevClose: basePrice,
      sector: "Other",
      marketCap: "N/A",
    },
  ];
}
