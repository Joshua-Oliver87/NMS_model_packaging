import pymysql
import requests
from shapely.geometry import shape, Polygon
import json
import utils
import time
import traceback

# Database configuration
DB_CONFIG = {
    "host": "44.225.21.21",
    "user": "awn_nms",
    "password": "w$u@wn2024NMS",
    "database": "awn",
    "connect_timeout": 10000
}

# Area limits for spatial resolution checks
SSURGO_MAX_AREA = 50_000
STATSGO2_MAX_AREA = 1_000_000

def fetch_soil_data(wkt_coordinates: str, use_statsgo2: bool = False) -> list:
    base_table = "statsgo2_mapunit" if use_statsgo2 else "mapunit"
    query = f"""
        SELECT
            mu.mukey AS "MuKey",
            mu.muname AS "MuName",
            ch.hzdept_r AS "Horizon #",
            chtgrp.texture AS "Texture",
            (ch.hzdepb_r - ch.hzdept_r) / 100.0 AS "Thickness (m)",
            ch.claytotal_r AS "Clay (%)",
            ch.silttotal_r AS "Silt (%)",
            ch.sandtotal_r AS "Sand (%)",
            ch.wthirdbar_r / 100.0 AS "Field Capacity Water Content (m/m)",
            ch.wfifteenbar_r / 100.0 AS "Permanent Wilting Point Water Content (m/m)",
            ch.om_r AS "Soil Organic Matter (%)"
        FROM 
            {base_table} mu
        LEFT OUTER JOIN component co ON co.mukey = mu.mukey
        LEFT OUTER JOIN chorizon ch ON ch.cokey = co.cokey
        LEFT OUTER JOIN chtexturegrp chtgrp ON chtgrp.chkey = ch.chkey
        LEFT OUTER JOIN chtexture cht ON cht.chtgkey = chtgrp.chtgkey
        WHERE mu.mukey IN (
            SELECT mukey from SDA_Get_Mukey_from_intersection_with_WktWgs84('{wkt_coordinates}')
        )
        ORDER BY co.comppct_r DESC, ch.hzdept_r ASC
    """
    response = requests.post(
        "https://sdmdataaccess.sc.egov.usda.gov/Tabular/SDMTabularService/post.rest",
        json={"format": "JSON", "query": query}
    )
    if response.status_code != 200:
        raise Exception(f"Error fetching data from API: {response.status_code}")
    return response.json().get("Table", [])

def process_soil_data_for_json(soil_data: list) -> list:
    headers = [
        "MuKey", "MuName", "Horizon #", "Texture", "Thickness (m)", "Clay (%)",
        "Silt (%)", "Sand (%)", "Field Capacity Water Content (m/m)",
        "Permanent Wilting Point Water Content (m/m)", "Soil Organic Matter (%)"
    ]
    TEXTURE_MAPPING = {
        "CL": "Clay Loam", "SIL": "Silt Loam", "L": "Loam", "SL": "Sandy Loam", "S": "Sand",
        "SCL": "Sandy Clay Loam", "SC": "Sandy Clay", "C": "Clay", "SI": "Silt",
        "LS": "Loamy Sand", "COS": "Coarse Sand", "F": "Fine Sand", "VFS": "Very Fine Sand",
        "LCOS": "Loamy Coarse Sand", "LFS": "Loamy Fine Sand", "LVFS": "Loamy Very Fine Sand",
        "COSL": "Coarse Sandy Loam", "FSL": "Fine Sandy Loam", "VFSL": "Very Fine Sandy Loam",
        "SICL": "Silty Clay Loam", "SIC": "Silty Clay"
    }
    processed_data = []
    for row in soil_data:
        processed_row = {headers[i]: row[i] if i < len(row) else None for i in range(len(headers))}
        if "Texture" in processed_row and processed_row["Texture"] in TEXTURE_MAPPING:
            processed_row["Texture"] = TEXTURE_MAPPING[processed_row["Texture"]]
        processed_data.append(processed_row)
    return processed_data

def validate_geometry_area(geometry: Polygon):
    area = geometry.area
    print(f"🧭 Geometry area: {area:.2f} m²")
    if area > STATSGO2_MAX_AREA:
        raise ValueError("❌ Geometry exceeds STATSGO2 resolution.")
    elif area > SSURGO_MAX_AREA:
        print("⚠️ Warning: Using STATSGO2 resolution.")
    else:
        print("✅ Geometry within SSURGO resolution.")

def fetch_and_store_soil_data():
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            query = """
                SELECT a.objid, a.name, a.coordinates 
                FROM table_planting_area AS a 
                WHERE a.objid NOT IN (
                    SELECT b.planting_area_id from table_planting_area_settings AS b
                )
            """
            cursor.execute(query)
            planting_areas = cursor.fetchall()

            for area in planting_areas:
                planting_area_id = area['objid']
                planting_area_name = area['name']
                coordinates = area['coordinates']
                print(f"\n🚜 Processing: {planting_area_name} (ID: {planting_area_id})")

                try:
                    geo_json_coords = utils.process_coordinates(utils.string_to_coordinates(coordinates))
                    polygon = shape(geo_json_coords)
                    validate_geometry_area(polygon)
                    wkt_coords = polygon.wkt
                    print(f"📍 WKT: {wkt_coords[:100]}...")

                    raw_soil_data = fetch_soil_data(wkt_coords)
                    print(f"🌱 Soil rows fetched: {len(raw_soil_data)}")

                    if not raw_soil_data:
                        print(f"⚠️ No soil data found for {planting_area_name}, skipping insert.")
                        continue

                    processed_soil_json = process_soil_data_for_json(raw_soil_data)
                    json_data = json.dumps(processed_soil_json)

                    insert_query = """
                        INSERT INTO table_planting_area_settings 
                        (planting_area_id, name, value, dateadded, status)
                        VALUES (%s, %s, %s, NOW(), 1)
                        ON DUPLICATE KEY UPDATE value = VALUES(value), dateadded = NOW()
                    """
                    cursor.execute(insert_query, (planting_area_id, planting_area_name, json_data))
                    connection.commit()

                    print(f"✅ Soil data stored for {planting_area_name} (ID: {planting_area_id})")

                except Exception as e:
                    print(f"❌ Error for {planting_area_name}: {str(e)}")
                    traceback.print_exc()
                    continue
    finally:
        connection.close()
        print("📦 Database connection closed.")

if __name__ == "__main__":
    fetch_and_store_soil_data()
    print("\n✅ Soil data fetching and storing complete.")
    print("🚀 Script finished running.")