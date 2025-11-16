use serde::Deserialize;
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH, Duration};

#[derive(Deserialize, Debug)]
struct ExchangeRateResponse {
    rates: HashMap<String, f64>,
}

#[derive(Clone, Debug)]
struct CacheEntry {
    value: f64,
    timestamp: u64,
}

// Global cache with TTL (5 minutes)
lazy_static::lazy_static! {
    static ref CONVERSION_CACHE: Mutex<HashMap<String, CacheEntry>> = Mutex::new(HashMap::new());
}

const CACHE_TTL_SECS: u64 = 300; // 5 minutes

fn get_current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or(Duration::ZERO)
        .as_secs()
}

fn get_cached_conversion(key: &str) -> Option<f64> {
    if let Ok(cache) = CONVERSION_CACHE.lock() {
        if let Some(entry) = cache.get(key) {
            let now = get_current_timestamp();
            if now - entry.timestamp < CACHE_TTL_SECS {
                return Some(entry.value);
            }
        }
    }
    None
}

fn set_cache(key: String, value: f64) {
    if let Ok(mut cache) = CONVERSION_CACHE.lock() {
        // Clean old entries if cache is too large
        if cache.len() > 1000 {
            let now = get_current_timestamp();
            cache.retain(|_, entry| now - entry.timestamp < CACHE_TTL_SECS);
        }
        cache.insert(key, CacheEntry {
            value,
            timestamp: get_current_timestamp(),
        });
    }
}

fn get_currency_names() -> HashMap<String, String> {
    let mut names = HashMap::new();
    
    // Major global currencies
    names.insert("USD".to_string(), "United States Dollar".to_string());
    names.insert("EUR".to_string(), "Euro".to_string());
    names.insert("GBP".to_string(), "British Pound".to_string());
    names.insert("JPY".to_string(), "Japanese Yen".to_string());
    names.insert("CHF".to_string(), "Swiss Franc".to_string());
    
    // Asia-Pacific
    names.insert("CNY".to_string(), "Chinese Yuan".to_string());
    names.insert("INR".to_string(), "Indian Rupee".to_string());
    names.insert("SGD".to_string(), "Singapore Dollar".to_string());
    names.insert("HKD".to_string(), "Hong Kong Dollar".to_string());
    names.insert("AUD".to_string(), "Australian Dollar".to_string());
    names.insert("NZD".to_string(), "New Zealand Dollar".to_string());
    names.insert("THB".to_string(), "Thai Baht".to_string());
    names.insert("MYR".to_string(), "Malaysian Ringgit".to_string());
    names.insert("IDR".to_string(), "Indonesian Rupiah".to_string());
    
    // Americas
    names.insert("CAD".to_string(), "Canadian Dollar".to_string());
    names.insert("MXN".to_string(), "Mexican Peso".to_string());
    names.insert("BRL".to_string(), "Brazilian Real".to_string());
    names.insert("ARS".to_string(), "Argentine Peso".to_string());
    names.insert("CLP".to_string(), "Chilean Peso".to_string());
    
    // Europe (non-EUR)
    names.insert("SEK".to_string(), "Swedish Krona".to_string());
    names.insert("NOK".to_string(), "Norwegian Krone".to_string());
    names.insert("DKK".to_string(), "Danish Krone".to_string());
    names.insert("PLN".to_string(), "Polish Zloty".to_string());
    names.insert("CZK".to_string(), "Czech Koruna".to_string());
    names.insert("HUF".to_string(), "Hungarian Forint".to_string());
    names.insert("RON".to_string(), "Romanian Leu".to_string());
    
    // Africa & Middle East
    names.insert("ZAR".to_string(), "South African Rand".to_string());
    names.insert("SAR".to_string(), "Saudi Arabian Riyal".to_string());
    names.insert("AED".to_string(), "United Arab Emirates Dirham".to_string());
    names.insert("TRY".to_string(), "Turkish Lira".to_string());
    
    // CIS countries
    names.insert("RUB".to_string(), "Russian Ruble".to_string());
    names.insert("KZT".to_string(), "Kazakhstani Tenge".to_string());
    names.insert("UAH".to_string(), "Ukrainian Hryvnia".to_string());
    names.insert("BYN".to_string(), "Belarusian Ruble".to_string());
    names.insert("AMD".to_string(), "Armenian Dram".to_string());
    names.insert("GEL".to_string(), "Georgian Lari".to_string());
    names.insert("UZS".to_string(), "Uzbekistani Som".to_string());
    names.insert("KGS".to_string(), "Kyrgyzstani Som".to_string());
    names.insert("TJS".to_string(), "Tajikistani Somoni".to_string());
    
    names
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn get_currencies() -> Result<HashMap<String, String>, String> {
    // Return only curated list of popular and CIS currencies
    Ok(get_currency_names())
}

#[tauri::command]
async fn convert_currency(
    base_currency: String,
    target_currency: String,
    amount: f64,
) -> Result<f64, String> {
    if base_currency == target_currency {
        return Ok(amount);
    }
    
    // Generate cache key
    let cache_key = format!("{}|{}|{:.6}", base_currency, target_currency, amount);
    
    // Check cache first
    if let Some(cached_value) = get_cached_conversion(&cache_key) {
        return Ok(cached_value);
    }
    
    // Using exchangerate-api.com which supports CIS currencies
    let url = format!(
        "https://api.exchangerate-api.com/v4/latest/{}",
        base_currency
    );
    let resp = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?
        .json::<ExchangeRateResponse>()
        .await
        .map_err(|e| e.to_string())?;

    if let Some(rate) = resp.rates.get(&target_currency) {
        let result = amount * rate;
        
        // Store in cache
        set_cache(cache_key, result);
        
        Ok(result)
    } else {
        Err(format!("Target currency {} not found", target_currency))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, convert_currency, get_currencies])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
