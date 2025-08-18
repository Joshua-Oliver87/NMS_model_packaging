from datetime import datetime, timedelta
import json
import urllib.request
import numpy as np
import pandas as pd
import pymysql
import os
from concurrent.futures import ThreadPoolExecutor

MAX_STATIONS = 600
THREADS = 5
TIMEOUT = 5

def fetch_precip_for_station(st):
    try:
        point_url = f"https://api.weather.gov/points/{st['STATION_LATDEG']},{st['STATION_LNGDEG']}"
        point_data = urllib.request.urlopen(point_url, timeout=TIMEOUT).read()
        frc_info = json.loads(point_data)

        grid_url = frc_info['properties']['forecastGridData']
        grid_data = urllib.request.urlopen(grid_url, timeout=TIMEOUT).read()
        frc_data = json.loads(grid_data)
        precip_values = frc_data['properties']['quantitativePrecipitation']['values']

        precip = pd.DataFrame(precip_values).rename(columns={'validTime': 'TSTAMP', 'value': 'PRECIP'})
        precip['TSTAMP'] = precip['TSTAMP'].str.split('/').str[0]
        precip['TSTAMP'] = pd.to_datetime(precip['TSTAMP']).dt.tz_localize(None) - timedelta(hours=8)
        precip['date'] = precip['TSTAMP'].dt.date
        precip_daily = precip.groupby(['date'])['PRECIP'].sum().reset_index()
        precip_daily['UNIT_ID'] = st['UNIT_ID']

        return precip_daily
    except Exception:
        return pd.DataFrame()

def get_precipitation_forecast():
    conn = pymysql.connect(
        host='44.225.21.21',
        user='awn_nms',
        password='w$u@wn2024NMS',
        database='awn',
        port=3306
    )
    cur = conn.cursor()
    cur.execute("SELECT Unit_id, station_latdeg, station_lngdeg FROM awn.view_active_stations")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    stations = pd.DataFrame(rows, columns=['UNIT_ID', 'STATION_LATDEG', 'STATION_LNGDEG'])
    stations = stations[stations['STATION_LATDEG'].str.contains(r'[0-9]') & stations['STATION_LNGDEG'].str.contains(r'[0-9]')]
    stations['STATION_LATDEG'] = stations['STATION_LATDEG'].astype(float).round(4)
    stations['STATION_LNGDEG'] = stations['STATION_LNGDEG'].astype(float).round(4)
    stations['STATION_LNGDEG'] = np.where(stations['STATION_LNGDEG'] > 0, stations['STATION_LNGDEG'] * -1, stations['STATION_LNGDEG'])

    stations = stations.head(MAX_STATIONS)

    with ThreadPoolExecutor(max_workers=THREADS) as executor:
        results = list(executor.map(fetch_precip_for_station, [row[1] for row in stations.iterrows()]))

    precip_all = pd.concat(results, ignore_index=True)

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(project_root, "input_for_python_model")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "daily_precipitation_forecasts.csv")
    precip_all.to_csv(output_path, index=False)

if __name__ == "__main__":
    get_precipitation_forecast()
    print("Precipitation forecast saved to input_for_python_model/daily_precipitation_forecasts.csv")
