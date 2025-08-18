import ast
import json
from pathlib import Path


def string_to_coordinates(coord_string) -> list:
    """
    Converts the string representation of coordinates to a list of lists.

    :param coord_string: Coordinates as a stringified list of lists.
    :return: A list of lists of coordinates.
    """
    if not coord_string:
        raise ValueError("Coordinates string is empty or None.")
    
    try:
        # Use ast.literal_eval to safely evaluate string to a Python literal
        coords = ast.literal_eval(coord_string)
        if not isinstance(coords, list) or not all(isinstance(item, list) and len(item) == 2 for item in coords):
            raise ValueError("Coordinates must be a list of [lat, lon] pairs.")
        return coords
    except (ValueError, SyntaxError) as e:
        raise Exception(f"Error occurred when parsing the coordinates string: {e}")


def process_coordinates(coords: list) -> dict:
    """
    Process the list of coordinates and converts them to a geoJSON object.

    :param coords: Coordinates as a list.
    :return: A geoJSON object.
    """
    # In GeoJSON, first coordinate and the last coordinate should be the same to close the polygon
    if coords[0] != coords[-1]:
        coords.append(coords[0])

    # Convert coordinates from (lat, lon) to (lon, lat) format
    coords = [(lon, lat) for lat, lon in coords]

    geo_json = {
        "type": "Polygon",
        "coordinates": [coords]
    }

    return geo_json


def load_configs():
    config_path = Path("config.json")
    if not config_path.is_file():
        raise FileNotFoundError("config.json not found")

    with open(config_path, "r") as f:
        configs = json.load(f)

    return configs
