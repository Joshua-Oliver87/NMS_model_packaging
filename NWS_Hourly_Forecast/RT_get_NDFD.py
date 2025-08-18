"""
NWS Forecast Data Retrieval and Database Insertion Script

Author: Basavaraj Amogi
Date: 06/24/2024
Version: 1.0

Description:
This script pulls weather forecast data from the National Weather Service (NWS) API,
processes the data, and stores it in a MySQL database. The data includes various weather
parameters such as air temperature, dewpoint, relative humidity, wind speed, wind direction,
precipitation, and cloud cover.

The script performs the following functions:
- Fetches metadata for active weather stations from the `view_active_stations` table.
- Retrieves forecast data for each active station using the NWS API.
- Parses and processes the forecast data, including converting units (e.g., temperature from Celsius to Fahrenheit).
- Saves the forecast data into a MySQL database, creating tables as needed and adding columns if they do not exist.

Key Components:
1. **fetch_active_stations**: Fetches active stations from the `view_active_stations` table.
2. **create_table_if_not_exists**: Creates the forecast data table if it does not exist.
3. **add_columns_if_not_exist**: Adds missing columns (`VALID_TIMES`, `UPDATE_TIME_UTC`, `TSTAMP_ISO`) to the forecast data table if they do not exist.
4. **save_forecast_to_db**: Saves the forecast data DataFrame to the database, ensuring proper data formats.

Updates:
- Version 1.0: Initial script creation and setup.

Usage:
- Ensure required libraries are installed.
- Configure database connection details.
- Run the script to retrieve and process forecast data, saving it into the database.

"""

import json
import logging
import pymysql
from ndfd_forecast_pull import main as fetch_forecast_data
from datetime import datetime
import numpy as np
import pytz
import os
import parser

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Environment variables for database connection
# Database connection details
DB_DETAILS = {
    'host': '44.225.21.21',
    'user': 'automata',
    'password': 'w$u@wn2022c88g',
    'forecast_db': 'awnfc',
    'metadata_db': 'awn'
}

# Timezone setup
PST = pytz.timezone('America/Los_Angeles')

def fetch_active_stations():
    """
    Fetches active stations from the view_active_stations table.

    Connects to the metadata database to retrieve the UNIT_ID, STATION_LATDEG,
    and STATION_LNGDEG of all active stations.

    Returns:
        list[dict]: A list of dictionaries, each containing UNIT_ID, STATION_LATDEG,
                    and STATION_LNGDEG for an active station.
    """
    connection = pymysql.connect(
        host=DB_DETAILS['host'],
        user=DB_DETAILS['user'],
        password=DB_DETAILS['password'],
        db=DB_DETAILS['metadata_db'],
        cursorclass=pymysql.cursors.DictCursor
    )
    try:
        with connection.cursor() as cursor:
            query = """
            SELECT UNIT_ID, STATION_LATDEG, STATION_LNGDEG 
            FROM view_active_stations
            """
            cursor.execute(query)
            result = cursor.fetchall()
    finally:
        connection.close()
    return result

def create_table_if_not_exists(connection, table_name):
    """
    Creates the table if it does not exist.

    This function checks if a table with the specified name exists in the database.
    If it does not exist, it creates the table with the following columns:
    - UNIT_ID: char(17)
    - INDATE: date
    - INTIME: time
    - DATE_RETRIEVED: datetime
    - TSTAMP: datetime
    - AIR_TEMP: decimal(11,5)
    - DEWPOINT: decimal(11,5)
    - REL_HUMIDITY: decimal(11,5)
    - WIND_SPEED: decimal(11,5)
    - WIND_DIR: decimal(11,5)
    - PRECIP: decimal(11,5)
    - CLOUD_COVER: decimal(11,5)
    - SOLAR_RAD: decimal(11,5)
    - NOTES: text

    Parameters:
        connection (pymysql.connections.Connection): The database connection object.
        table_name (str): The name of the table to create.

    Returns:
        None
    """
    create_table_query = f"""
    CREATE TABLE IF NOT EXISTS `{table_name}` (
        `UNIT_ID` char(17) DEFAULT NULL,
        `INDATE` date NOT NULL DEFAULT '0000-00-00',
        `INTIME` time NOT NULL DEFAULT '00:00:00',
        `DATE_RETRIEVED` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
        `TSTAMP` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
        `AIR_TEMP` decimal(11,5) DEFAULT NULL,
        `DEWPOINT` decimal(11,5) DEFAULT NULL,
        `REL_HUMIDITY` decimal(11,5) DEFAULT NULL,
        `WIND_SPEED` decimal(11,5) DEFAULT NULL,
        `WIND_DIR` decimal(11,5) DEFAULT NULL,
        `PRECIP` decimal(11,5) DEFAULT NULL,
        `CLOUD_COVER` decimal(11,5) DEFAULT NULL,
        `SOLAR_RAD` decimal(11,5) DEFAULT NULL,
        `NOTES` text DEFAULT NULL,
        `TSTAMP_ISO` varchar(50) DEFAULT NULL,
        `VALID_TIMES` varchar(50) DEFAULT NULL,
        `UPDATE_TIME_UTC` varchar(50) DEFAULT NULL,
        PRIMARY KEY (`TSTAMP_ISO`, `VALID_TIMES`)
    ) ENGINE=MyISAM DEFAULT CHARSET=latin1;
    """
    with connection.cursor() as cursor:
        cursor.execute(create_table_query)
        connection.commit()


def add_columns_if_not_exist(connection, table_name):
    """
    Adds the VALID_TIMES and UPDATE_TIME_UTC columns if they do not exist.

    This function modifies the specified table by adding the following columns if they are not already present:
    - VALID_TIMES: varchar(50)
    - UPDATE_TIME_UTC: varchar(50)

    Parameters:
        connection (pymysql.connections.Connection): The database connection object.
        table_name (str): The name of the table to modify.

    Returns:
        None
    """
    alter_table_query = f"""
    ALTER TABLE `{table_name}` 
    ADD COLUMN IF NOT EXISTS `TSTAMP_ISO` VARCHAR(50) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `VALID_TIMES` VARCHAR(50) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS `UPDATE_TIME_UTC` VARCHAR(50) DEFAULT NULL;
    """
    with connection.cursor() as cursor:
        cursor.execute(alter_table_query)
        connection.commit()

def save_forecast_to_db(connection, forecast_df, table_name, unit_id):
    """
    Saves the forecast data DataFrame to the database.

    This function performs the following steps:
    1. Ensures the table exists by calling `create_table_if_not_exists`.
    2. Ensures the required columns exist by calling `add_columns_if_not_exist`.
    3. Replaces NaN values in the DataFrame with None to avoid database insertion errors.
    4. Converts the current UTC time to PST.
    5. Iterates over the DataFrame and inserts each row into the database.

    Parameters:
        connection (pymysql.connections.Connection): The database connection object.
        forecast_df (pd.DataFrame): The DataFrame containing the forecast data.
        table_name (str): The name of the table to insert data into.
        unit_id (str): The UNIT_ID to associate with the forecast data.

    Returns:
        None
    """
    create_table_if_not_exists(connection, table_name)
    add_columns_if_not_exist(connection, table_name)

    # Replace NaN values with None
    forecast_df = forecast_df.replace({np.nan: None})

    now_utc = datetime.now(pytz.utc)
    now_pst = now_utc.astimezone(PST)

    replace_query = f"""
    REPLACE INTO `{table_name}` (
        `UNIT_ID`, `INDATE`, `INTIME`, `DATE_RETRIEVED`, `TSTAMP`,
        `AIR_TEMP`, `DEWPOINT`, `REL_HUMIDITY`, `WIND_SPEED`, `WIND_DIR`,
        `CLOUD_COVER`, `SOLAR_RAD`, `NOTES`, `VALID_TIMES`, `UPDATE_TIME_UTC`,`TSTAMP_ISO`
    ) VALUES (
        %(UNIT_ID)s, %(INDATE)s, %(INTIME)s, %(DATE_RETRIEVED)s, %(TSTAMP)s,
        %(AIR_TEMP)s, %(DEWPOINT)s, %(REL_HUMIDITY)s, %(WIND_SPEED)s, %(WIND_DIR)s,
        %(CLOUD_COVER)s, %(SOLAR_RAD)s, %(NOTES)s, %(VALID_TIMES)s, %(UPDATE_TIME_UTC)s, %(TSTAMP_ISO)s
    )
    """
    with connection.cursor() as cursor:
        for index, row in forecast_df.iterrows():
            # Handle potential errors for each variable
            try:
                air_temp = row['AIR_TEMP']
                if air_temp is not None and not (-99999.99999 <= air_temp <= 99999.99999):
                    air_temp = None
            except Exception as e:
                logging.error(f"Error processing AIR_TEMP for row {index}: {e}")
                air_temp = None

            try:
                dewpoint = row['DEWPOINT']
                if dewpoint is not None and not (-99999.99999 <= dewpoint <= 99999.99999):
                    dewpoint = None
            except Exception as e:
                logging.error(f"Error processing DEWPOINT for row {index}: {e}")
                dewpoint = None

            try:
                rel_humidity = row['REL_HUMIDITY']
                if rel_humidity is not None and not (-99999.99999 <= rel_humidity <= 99999.99999):
                    rel_humidity = None
            except Exception as e:
                logging.error(f"Error processing REL_HUMIDITY for row {index}: {e}")
                rel_humidity = None

            try:
                wind_speed = row['WIND_SPEED']
                if wind_speed is not None and not (-99999.99999 <= wind_speed <= 99999.99999):
                    wind_speed = None
            except Exception as e:
                logging.error(f"Error processing WIND_SPEED for row {index}: {e}")
                wind_speed = None

            try:
                wind_dir = row['WIND_DIR']
                if wind_dir is not None and not (-99999.99999 <= wind_dir <= 99999.99999):
                    wind_dir = None
            except Exception as e:
                logging.error(f"Error processing WIND_DIR for row {index}: {e}")
                wind_dir = None

            try:
                cloud_cover = row['CLOUD_COVER']
                if cloud_cover is not None and not (-99999.99999 <= cloud_cover <= 99999.99999):
                    cloud_cover = None
            except Exception as e:
                logging.error(f"Error processing CLOUD_COVER for row {index}: {e}")
                cloud_cover = None

            try:
                solar_rad = row['SOLAR_RAD']
                if solar_rad is not None and not (-99999.99999 <= solar_rad <= 99999.99999):
                    solar_rad = None
            except Exception as e:
                logging.error(f"Error processing SOLAR_RAD for row {index}: {e}")
                solar_rad = None

            try:
                precip = row['PRECIP']
                if precip is not None and not (-99999.99999 <= precip <= 99999.99999):
                    precip = None
            except Exception as e:
                logging.error(f"Error processing PRECIP for row {index}: {e}")
                precip = None
                
            row_data = {
                'UNIT_ID': unit_id,
                'INDATE': now_pst.strftime('%Y-%m-%d'),
                'INTIME': now_pst.strftime('%H:%M:%S'),
                'DATE_RETRIEVED': now_pst.strftime('%Y-%m-%d %H:%M:%S'),
                'TSTAMP': row['TSTAMP'],
                'AIR_TEMP': air_temp,
                'DEWPOINT': dewpoint,
                'REL_HUMIDITY': rel_humidity,
                'WIND_SPEED': wind_speed,
                'WIND_DIR': wind_dir,
                'CLOUD_COVER': cloud_cover,
                'SOLAR_RAD': solar_rad,
                'NOTES': row['NOTES'],
                'VALID_TIMES': row['VALID_TIMES'],
                'UPDATE_TIME_UTC': row['UPDATE_TIME_UTC'],                
                'TSTAMP_ISO': row['TSTAMP_ISO']
            }
            cursor.execute(replace_query, row_data)
        connection.commit()
        logging.info(f"Forecast data saved to table {table_name} successfully.")

def main():
    active_stations = fetch_active_stations()
    
    if active_stations:
        connection = pymysql.connect(
            host=DB_DETAILS['host'],
            user=DB_DETAILS['user'],
            password=DB_DETAILS['password'],
            db=DB_DETAILS['forecast_db'],
            cursorclass=pymysql.cursors.DictCursor
        )
        try:
            for station in active_stations:
                unit_id = station['UNIT_ID']
                latitude = float(station['STATION_LATDEG'])
                longitude = float(station['STATION_LNGDEG']) if float(station['STATION_LNGDEG']) < 0 else -float(station['STATION_LNGDEG'])
                grid_points = [(latitude, longitude)]
                forecast_df = fetch_forecast_data(grid_points)
                if forecast_df is not None:
                    table_name = f"forecast{unit_id}"  # Use the UNIT_ID as the table name
                    forecast_df.to_csv('test_NDFD.csv', index=False)
                    # save_forecast_to_db(connection, forecast_df, table_name, unit_id)
        finally:
            connection.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps('Forecast data processed and saved to database.')
    }

if __name__ == "__main__":
    result = main()