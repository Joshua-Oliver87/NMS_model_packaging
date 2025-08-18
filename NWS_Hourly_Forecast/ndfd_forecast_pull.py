"""
NWS Forecast Data Retrieval and Processing Script

Author: Basavaraj Amogi
Date: 06/21/2024
Version: 1.0

Description:
This script retrieves and processes forecast data from the National Weather Service (NWS) API. 

Each National Weather Service forecast office issues numerical forecasts on a 2.5-kilometer grid across their entire forecast area. Each grid point is one of these 2.5km squares. The /gridpoints endpoint in the API provides access to this raw numerical data, while the /points endpoint (https://api.weather.gov/points/{lat},{lon}) allows you to retrieve metadata for a given latitude/longitude coordinate.

The data is presented as a JSON document containing metadata about the forecast grid and multiple layers of data (such as temperature). The layer data is presented as a time series. Much of the data is calculated for each hour of the forecast period, but to conserve bandwidth, the API merges consecutive values that are equal. Each data point has the following properties:
- validTime: This is the time interval that the value applies to, represented in ISO 8601 format (e.g., 2019-07-04T18:00:00+00:00/PT3H).
- value: This is the data that applies to that validTime interval.
- uom: This indicates the unit of measure for values that have a unit (e.g., temperature).

The script includes functions to:
- Fetch point information for given latitude and longitude coordinates.
- Fetch forecast data from the provided URL.
- Expand time intervals into continuous time series data.
- Parse grid forecast data into a DataFrame for database insertion.
- Calculate clear sky solar radiation using the HrlyClearSky method.
- Calculate solar radiation with cloud cover adjustment.
- Fetch and process forecast data for a list of grid points.

The main function processes forecast data for a list of grid points and returns a combined DataFrame of all forecasts.

Logging is set up to track the progress and status of requests and operations.

Updates:
- Version 1.0: Initial script creation and setup.

Usage:
- Ensure required libraries are installed.
- Set up logging as desired.
- Modify grid points as needed in the main function.
- Run the script to retrieve and process forecast data.

"""

import requests
import certifi
import logging
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
import isodate
import time
import pytz


# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Conversion functions
def celsius_to_fahrenheit(c):
    return (c * 9/5) + 32

def mm_to_inches(mm):
    return mm / 25.4

def kmph_to_mph(mps):
    return mps * 0.621371

def get_point_info(latitude, longitude):
    """Fetches the point information for the given latitude and longitude."""
    point_url = f"https://api.weather.gov/points/{latitude},{longitude}"
    logging.info(f"Requesting point info for {latitude}, {longitude}")
    response = requests.get(point_url, verify=certifi.where(), timeout=10)
    logging.info(f"Point info response status: {response.status_code}")
    response.raise_for_status()
    return response.json()

def get_forecast_data(forecast_url):
    """Fetches the forecast data from the provided URL."""
    logging.info(f"Requesting forecast data from {forecast_url}")
    response = requests.get(forecast_url, verify=certifi.where(), timeout=10)
    logging.info(f"Forecast data response status: {response.status_code}")
    response.raise_for_status()
    return response.json()

def expand_time_intervals(values, interval_hours=1):
    """Expands the time intervals into continuous time series data."""
    expanded_data = []
    for entry in values:
        start_time = isodate.parse_datetime(entry['validTime'].split('/')[0])
        duration = isodate.parse_duration(entry['validTime'].split('/')[1])
        end_time = start_time + duration

        while start_time < end_time:
            expanded_data.append({'validTime': start_time, 'value': entry['value']})
            start_time += timedelta(hours=interval_hours)
    return expanded_data

def parse_grid_forecast(grid_forecast_data, lat, long, elev):
    """Parses grid forecast data into a DataFrame for database insertion."""
    properties = grid_forecast_data['properties']
    
    validTimes = properties['validTimes']  # This represents the overall valid time range for all forecasts
    updateTimes = properties['updateTime']  # This represents the overall update time range for all forecasts

    temperature = expand_time_intervals(properties['temperature']['values'])
    relative_humidity = expand_time_intervals(properties['relativeHumidity']['values'])
    dewpoint = expand_time_intervals(properties['dewpoint']['values'])
    wind_speed = expand_time_intervals(properties['windSpeed']['values'])
    wind_direction = expand_time_intervals(properties['windDirection']['values'])
    precipitation = properties['quantitativePrecipitation']['values']
    min_temperature = properties['minTemperature']['values']
    max_temperature = properties['maxTemperature']['values']
    cloud_cover = expand_time_intervals(properties['skyCover']['values'])

    data = []
    all_times = set()
    for temp in temperature:
        all_times.add(temp['validTime'])
    for rh in relative_humidity:
        all_times.add(rh['validTime'])
    for dp in dewpoint:
        all_times.add(dp['validTime'])
    for ws in wind_speed:
        all_times.add(ws['validTime'])
    for wd in wind_direction:
        all_times.add(wd['validTime'])
    for pp in precipitation:
        all_times.add(isodate.parse_datetime(pp['validTime'].split('/')[0]))
    for min_temp in min_temperature:
        all_times.add(isodate.parse_datetime(min_temp['validTime'].split('/')[0]))
    for max_temp in max_temperature:
        all_times.add(isodate.parse_datetime(max_temp['validTime'].split('/')[0]))
    for cc in cloud_cover:
        all_times.add(cc['validTime'])

    #all_times = sorted(all_times)
    #print(all_times)
    all_times = sorted([time.astimezone(pytz.timezone('America/Los_Angeles')) for time in all_times])
    forecast_dict = {time: {} for time in all_times}

    for entry in temperature:
        forecast_dict[entry['validTime']]['AIR_TEMP'] = entry['value']
    for entry in relative_humidity:
        forecast_dict[entry['validTime']]['REL_HUMIDITY'] = entry['value']
    for entry in dewpoint:
        forecast_dict[entry['validTime']]['DEWPOINT'] = entry['value']
    for entry in wind_speed:
        forecast_dict[entry['validTime']]['WIND_SPEED'] = entry['value']
    for entry in wind_direction:
        forecast_dict[entry['validTime']]['WIND_DIR'] = entry['value']
    for entry in precipitation:
        forecast_dict[isodate.parse_datetime(entry['validTime'].split('/')[0])]['PRECIP'] = entry['value']
    for entry in min_temperature:
        forecast_dict[isodate.parse_datetime(entry['validTime'].split('/')[0])]['MIN_TEMP'] = entry['value']
    for entry in max_temperature:
        forecast_dict[isodate.parse_datetime(entry['validTime'].split('/')[0])]['MAX_TEMP'] = entry['value']
    for entry in cloud_cover:
        forecast_dict[entry['validTime']]['CLOUD_COVER'] = entry['value']

    for tstamp in all_times:
        air_temp = forecast_dict[tstamp].get('AIR_TEMP')
        rel_humidity = forecast_dict[tstamp].get('REL_HUMIDITY')
        dewpoint = forecast_dict[tstamp].get('DEWPOINT')
        wind_speed = forecast_dict[tstamp].get('WIND_SPEED')
        wind_dir = forecast_dict[tstamp].get('WIND_DIR')
        precip = forecast_dict[tstamp].get('PRECIP')
        min_temp = forecast_dict[tstamp].get('MIN_TEMP')
        max_temp = forecast_dict[tstamp].get('MAX_TEMP')
        cloud_cover = forecast_dict[tstamp].get('CLOUD_COVER')
        
        # Convert units
        if air_temp is not None:
            #air_temp = celsius_to_fahrenheit(air_temp)
            air_temp = air_temp * 1.8 + 32
        if dewpoint is not None:
            dewpoint = celsius_to_fahrenheit(dewpoint)
        if wind_speed is not None:
            wind_speed = kmph_to_mph(wind_speed)
        if precip is not None:
            precip = mm_to_inches(precip)
        if min_temp is not None:
            min_temp = celsius_to_fahrenheit(min_temp)
        if max_temp is not None:
            max_temp = celsius_to_fahrenheit(max_temp)

        cloud_cover = cloud_cover if cloud_cover is not None else 0
        solar_radiation = calculate_solar_radiation_with_cloud_cover(cloud_cover, tstamp, lat, long, elev) if cloud_cover is not None else None

        data.append({
            'TSTAMP': datetime.fromisoformat(str(tstamp)).strftime('%Y-%m-%d %H:%M:%S'),
            'AIR_TEMP': air_temp,
            'DEWPOINT': dewpoint,
            'REL_HUMIDITY': rel_humidity,
            'WIND_SPEED': wind_speed,
            'WIND_DIR': wind_dir,
            'PRECIP': precip,
            'MIN_TEMP': min_temp,
            'MAX_TEMP': max_temp,
            'CLOUD_COVER': cloud_cover,
            'SOLAR_RAD': solar_radiation,
            'NOTES': None,
            'TSTAMP_ISO': tstamp,
            'VALID_TIMES': validTimes,  # Include the overall valid times for all forecasts
            'UPDATE_TIME_UTC' : updateTimes
        })

    df = pd.DataFrame(data)
    return df

def calculate_clear_sky_radiation(DOY, L, t, lat, long, longZ, elev):
    """
    Calculates clear sky solar radiation using the HrlyClearSky method.

    Parameters:
    - DOY (int): Day of the year (1-365)
    - L (int): Length of the hour in hours (typically 1 hour)
    - t (float): Time of the day in hours (e.g., 14.5 for 2:30 PM)
    - lat (float): Latitude of the location in degrees
    - long (float): Longitude of the location in degrees
    - longZ (float): Standard longitude of the time zone in degrees
    - elev (float): Elevation of the location in meters

    Returns:
    - float: Clear sky solar radiation in W/m²

    The function uses several intermediate calculations to account for 
    atmospheric and geometric factors that influence solar radiation:
    - Solar Declination (SD)
    - Earth-Sun distance factor (dr)
    - Solar hour angles (w, w1, w2)
    - Solar radiation at the top of the atmosphere (Ra)
    - Atmospheric pressure adjustment (P)
    - Solar elevation angle factor (SinPhi)
    - Atmospheric transmittance (Kt)
    """

    # Calculate midpoint of the time interval
    t_mid = t - L / 2

    # Calculate solar declination and equation of time
    b = 2 * np.pi * (DOY - 81) / 364
    Sc = 0.1645 * np.sin(2 * b) - 0.1255 * np.cos(b) - 0.025 * np.sin(b)

    # Calculate solar hour angle and bounds for the time interval
    w = np.pi / 12 * ((t_mid + 0.06667 * (longZ - long) + Sc) - 12)
    w1 = w - np.pi * L / 24
    w2 = w + np.pi * L / 24

    # Convert latitude to radians
    lat_r = lat * np.pi / 180

    # Calculate the Earth-Sun distance factor
    dr = 1 + 0.033 * np.cos(2 * np.pi / 365 * DOY)

    # Calculate the solar declination
    SD = 0.4093 * np.sin(2 * np.pi / 365 * DOY - 1.39)

    # Calculate extraterrestrial radiation at the top of the atmosphere
    Ra = 12 * 60 / np.pi * 0.082 * dr * (
        (w2 - w1) * np.sin(lat_r) * np.sin(SD) + np.cos(lat_r) * np.cos(SD) * (np.sin(w2) - np.sin(w1))
    )
    Ra = 1000000 / 60 / 60 / L * Ra

    # Calculate atmospheric pressure adjustment
    P = 101.3 * ((293 - 0.0065 * elev) / 293) ** 5.26

    # Calculate the solar elevation angle factor
    SinPhi = np.sin(lat_r) * np.sin(SD) + np.cos(lat_r) * np.cos(SD) * np.cos(w)

    # Set atmospheric transmittance factor (Kt)
    Kt = 0.95

    # Calculate the clear sky solar radiation
    Rso = Ra * np.exp(-0.0021 * P / (Kt * SinPhi))
    
    # Check for infinite values
    if not np.isfinite(Rso):
        Rso = None
    
    return max(Rso, 0) if Rso is not None else 0



def calculate_solar_radiation_with_cloud_cover(cloud_cover, tstamp, lat, long, elev):
    """Calculates solar radiation with cloud cover adjustment."""
    DOY = tstamp.timetuple().tm_yday
    L = 1
    t = tstamp.hour
    longZ = long
    clear_sky_radiation = calculate_clear_sky_radiation(DOY, L, t, lat, long, longZ, elev)
    cloud_cover_fraction = cloud_cover / 100
    solar_radiation = clear_sky_radiation * (1 - cloud_cover_fraction)
    solar_radiation = round(solar_radiation, 5)
    return solar_radiation

def fetch_and_process_forecast(latitude, longitude):
    """Fetch and process forecast data for a given latitude and longitude."""
    try:
        point_info = get_point_info(latitude, longitude)
        if 'forecastGridData' in point_info['properties']:
            forecast_grid_url = point_info['properties']['forecastGridData']
            forecast_grid_data = get_forecast_data(forecast_grid_url)
            elev = forecast_grid_data['properties']['elevation']['value']
            forecast_df = parse_grid_forecast(forecast_grid_data, latitude, longitude, elev)
            return forecast_df
    except requests.exceptions.HTTPError as http_err:
        logging.error(f"HTTP error occurred: {http_err}")
    except requests.exceptions.SSLError as ssl_err:
        logging.error(f"SSL error occurred: {ssl_err}")
        logging.info("Retrying after SSL error...")
        time.sleep(5)
        return fetch_and_process_forecast(latitude, longitude)
    except Exception as err:
        logging.error(f"An error occurred: {err}")

def main(grid_points):
    """Fetch and process forecast data for a list of grid points."""
    all_forecasts = []

    for lat, lon in grid_points:
        forecast_df = fetch_and_process_forecast(lat, lon)
        if forecast_df is not None:
            all_forecasts.append(forecast_df)
    
    if all_forecasts:
        combined_forecast_df = pd.concat(all_forecasts, ignore_index=True)
        return combined_forecast_df
