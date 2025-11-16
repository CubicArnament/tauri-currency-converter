use serde::Deserialize;
use std::collections::HashMap;

#[derive(Deserialize, Debug)]
struct ExchangeRateResponse {
    rates: HashMap<String, f64>,
}

fn get_currency_names() -> HashMap<String, String> {
    let mut names = HashMap::new();
    // Popular & CIS currencies with descriptions
    names.insert("USD".to_string(), "United States Dollar".to_string());
    names.insert("EUR".to_string(), "Euro".to_string());
    names.insert("GBP".to_string(), "British Pound".to_string());
    names.insert("JPY".to_string(), "Japanese Yen".to_string());
    names.insert("CAD".to_string(), "Canadian Dollar".to_string());
    names.insert("AUD".to_string(), "Australian Dollar".to_string());
    names.insert("CHF".to_string(), "Swiss Franc".to_string());
    names.insert("CNY".to_string(), "Chinese Yuan".to_string());
    names.insert("INR".to_string(), "Indian Rupee".to_string());
    names.insert("MXN".to_string(), "Mexican Peso".to_string());
    // CIS currencies
    names.insert("RUB".to_string(), "Russian Ruble".to_string());
    names.insert("KZT".to_string(), "Kazakhstani Tenge".to_string());
    names.insert("UAH".to_string(), "Ukrainian Hryvnia".to_string());
    names.insert("BYN".to_string(), "Belarusian Ruble".to_string());
    names.insert("AMD".to_string(), "Armenian Dram".to_string());
    names.insert("GEL".to_string(), "Georgian Lari".to_string());
    names.insert("UZS".to_string(), "Uzbekistani Som".to_string());
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
        Ok(amount * rate)
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
