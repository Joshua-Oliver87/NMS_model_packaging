import pandas as pd
import importlib.resources as pkg_resources
from crop_model import irrigationtables  # <--- this is the data folder in the package

def load_csv(name, sep):
    with pkg_resources.files(irrigationtables).joinpath(name).open("r", encoding="utf-8") as f:
        return pd.read_csv(f, sep=sep, header=0)

cropparameter        = load_csv("tblcropdefaults.csv", sep=";")
soilparameter        = load_csv("tblsoildefaults.csv", sep=";")
cropregion           = load_csv("table_cropRegion.csv", sep=";")
stationregion        = load_csv("table_station2region.csv", sep=";")
agweathernetstation = load_csv("AgWeatherNet_Washington_State_UniversityWSU_Cougar_HeadWSU_Cougar_Head.csv", sep=",")

cropparameter = cropparameter.set_index('cropName')
soilparameter = soilparameter.set_index('soilTexture')
stationregion = stationregion.set_index('stationID')
