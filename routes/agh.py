import pandas as pd

# Load CSV
df = pd.read_csv("/Users/joshua.oliver/Desktop/AWN_UI/input_for_python_model/sample_weather_data.csv")

# Rename columns for convenience
df.columns = [
    'date', 'doy', 'radiation', 'tmax', 'tmin', 'rhmax',
    'rhmin', 'wind_speed', 'precipitation', 'evapotranspiration'
]

# Format date
df['date'] = pd.to_datetime(df['date'])
df['date'] = df['date'].dt.strftime('%a %b %d %Y 00:00:00 GMT+0000 (Coordinated Universal Time)')

# Flatten each day's data into one row with prefixed column names
flattened = {}
for idx, row in df.iterrows():
    prefix = f"weather_{idx + 1}_"
    flattened[prefix + 'date'] = row['date']
    flattened[prefix + 'doy'] = int(row['doy'])
    flattened[prefix + 'radiation'] = row['radiation']
    flattened[prefix + 'tmax'] = row['tmax']
    flattened[prefix + 'tmin'] = row['tmin']
    flattened[prefix + 'rhmax'] = row['rhmax']
    flattened[prefix + 'rhmin'] = row['rhmin']
    flattened[prefix + 'wind_speed'] = row['wind_speed']
    flattened[prefix + 'precipitation'] = row['precipitation']
    flattened[prefix + 'evapotranspiration'] = row['evapotranspiration']

# Output as a single-row DataFrame
output_df = pd.DataFrame([flattened])

# Save CSV
output_df.to_csv("flattened_weather_all.csv", index=False)
