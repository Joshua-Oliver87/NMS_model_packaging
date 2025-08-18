#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Sep 6 2024

@author: liuming
"""
import pandas as pd
#import WaterUptakeConfig as Soil
#from CropWaterUptakeClass import *
#from SoilWater import *
from .CropParameter import *
from .SoilHydrolics import *
from .Crop import *
#from canopycover import *
#from CS_ET import *
from .accessagweathernet import *
from .ism_default_parameters import *
import datetime
from .accessssurgo_functions import *
from .Balances import *
from .AutoIrrigation import *
from .OrganicCandN import *
import json
import sys
import os

def run_simulation(json_data: dict) -> dict:

    def is_blank(s):
        return not s or not s.strip()
    
    def get_json_boolean(json_data, key):
        """
        Get a boolean from JSON input using common truthy strings.
        """
        true_values = {'true', '1', 'yes', 'on', 'y'}
        val = json_data.get(key, False)
        return str(val).strip().lower() in true_values

    
    def mm_to_inch(mm):
        return mm / 25.4  # 1 inch = 25.4 mm

    def KgPerSquareMeter_to_KgPerHa(kg_m2):
        return kg_m2 * 10000.0

    class CS_Weather:
        Solar_Radiation = dict()                                                   #MJ/m2
        Tmax = dict()                                                              #Celsius degree
        Tmin = dict()
        RHmax = dict()                                                             #%
        RHmin = dict()
        Wind_Speed = dict()                                                        #m/s
        Precipitation = dict()                                                     #mm
        FAO_ETo = dict()                                                           #mm
    class CS_Fertilization:
        Fertilization_DOY = dict()
        Mineral_Fertilizer_Name = dict()
        Mineral_Fertilization_Rate = dict()
        #Nitrate_Fraction = dict()
        #Ammonium_Fraction = dict()
        #Ammonia_Fraction = dict()
        Nitrate_Fertilization_Rate = dict()
        Ammonium_Fertilization_Rate = dict()
        Organic_Fertilizer_Name = dict()
        Organic_Fertilizer_Rate = dict()
        #Organic_Fertilizer_C_Fraction = dict()
        #Organic_Fertilizer_N_Fraction = dict()
        Organic_Fertilizer_C_Mass = dict()
        Organic_Fertilizer_N_Mass = dict()
        Application_Method_Number = dict()
        
        #and others
    class CS_Min_Fertilizer:
        Mineral_Fert_Name = ""
        Nitrate_mass_percentage = -9999
        Ammonium_mass_percentage = -9999
        Ammonia_mass_percentage = -9999
        
    class CS_Organic_Fertilizer:
        Organic_Fertilizer_Name = ""
        Carbon_mass_percentage = -9999
        Nitrogen_mass_percentage = -9999
        HalfLife_days = -9999
        #and others

    def InitFertilization(pCS_Fertilization):
        for i in range(1,367):
            pCS_Fertilization.Fertilization_DOY[i] = i
            pCS_Fertilization.Mineral_Fertilizer_Name[i] = ''
            pCS_Fertilization.Mineral_Fertilization_Rate[i] = 0.
            #pCS_Fertilization.Nitrate_Fraction[i] = 0.
            #pCS_Fertilization.Ammonium_Fraction[i] = 0.
            #pCS_Fertilization.Ammonia_Fraction[i] = 0.
            pCS_Fertilization.Nitrate_Fertilization_Rate[i] = 0.
            pCS_Fertilization.Ammonium_Fertilization_Rate[i] = 0.
            pCS_Fertilization.Organic_Fertilizer_Name[i] = ''
            pCS_Fertilization.Organic_Fertilizer_Rate[i] = 0.
            #pCS_Fertilization.Organic_Fertilizer_C_Fraction[i] = 0.
            #pCS_Fertilization.Organic_Fertilizer_N_Fraction[i] = 0.
            pCS_Fertilization.Organic_Fertilizer_C_Mass[i] = 0.
            pCS_Fertilization.Organic_Fertilizer_N_Mass[i] = 0.
            pCS_Fertilization.Application_Method_Number[i] = 0


    def ReadCropParameters(json_data, crop_name, Crop):
        # Find the crop with the given name
        crop_data = next((crop for crop in json_data["crops"] if crop["name"] == crop_name), None)
        if not crop_data:
            raise ValueError(f"Crop '{crop_name}' not found in JSON data.")

        parameters = crop_data["parameters"]
        Crop.Crop_Name = crop_name
        Crop.Midseason_Crop_Coefficient = float(parameters["midseason_crop_coefficient"])
        Crop.Maximum_Crop_Water_Uptake = float(parameters["maximum_crop_water_uptake_mm_per_day"])
        Crop.LWP_Onset_Stomatal_Closure = float(parameters["leaf_water_potential_onset_of_stomatal_closure_j_per_kg"])
        Crop.LWP_Permanent_Wilting = float(parameters["leaf_water_potential_permanent_wilting_j_per_kg"])
        Crop.Seeding_Depth = float(parameters["seeding_depth_m"])
        Crop.Initial_Root_Depth_From_Germinated_Seed = float(parameters["initial_root_depth_m"])
        Crop.Maximum_Root_Depth = float(parameters["maximum_root_depth_m"])
        Crop.Maximum_Crop_Height = float(parameters["maximum_crop_height_m"])
        Crop.Initial_Green_Canopy_Cover = float(parameters["initial_green_canopy_cover_fraction_0_1"])
        Crop.Maximum_Green_Canopy_Cover = float(parameters["maximum_green_canopy_cover_fraction_0_1"])
        Crop.Maturity_Green_Canopy_Cover = float(parameters["maturity_green_canopy_cover_fraction_0_1"])
        Crop.Transpiration_Use_Efficiency_1_kPa = float(parameters["transpiration_use_efficiency_kg_per_kg"])
        Crop.Slope_Daytime_VPD_Function = float(parameters["slope_of_daytime_vpd_power_function"])
        Crop.Maximum_N_Concentration_Emergence = float(parameters["maximum_n_concentration_at_emergence_kg_per_kg"])
        Crop.Critical_N_Concentration_Emergence = float(parameters["critical_n_concentration_at_emergence_kg_per_kg"])
        Crop.Minimum_N_Concentration_Emergence = float(parameters["minimum_n_concentration_at_emergence_kg_per_kg"])
        Crop.Biomass_Start_Dilution_Maximum_N_Concentration = float(
            parameters["biomass_start_dilution_maximum_n_concentration_mg_per_ha"])
        Crop.Biomass_Start_Dilution_Critical_N_Concentration = float(
            parameters["biomass_start_dilution_critical_n_concentration_mg_per_ha"])
        Crop.Biomass_Start_Dilution_Minimum_N_Concentration = float(
            parameters["biomass_start_dilution_minimum_n_concentration_mg_per_ha"])
        Crop.N_Dilution_Slope = float(parameters["n_dilution_slope"])
        Crop.Maximum_N_Concentration_Maturity = float(parameters["maximum_n_concentration_at_maturity_kg_per_kg"])
        Crop.Critical_N_Concentration_Maturity = float(parameters["critical_n_concentration_at_maturity_kg_per_kg"])
        Crop.Minimum_N_Concentration_Maturity = float(parameters["minimum_n_concentration_at_maturity_kg_per_kg"])
        Crop.Maximum_Daily_N_Uptake_Rate = float(parameters["maximum_daily_n_uptake_rate"]) / 10000.

    def is_number(s):
        try:
            t = float(s)
            if math.isnan(t):
                return False
            else:
                return True
        except ValueError:
            return False

    def ReadSoilHorizonParamegters(json_data, pSoilHorizon):
        soil_horizons = json_data.get("soil_horizons", [])
        pSoilHorizon.Number_Of_Horizons = len(soil_horizons)
        total_horizon_depth = 0.0  # 05192025LML

        for i, horizon in enumerate(soil_horizons, start=1):
            # thickness, clay, silt, sand
            pSoilHorizon.Horizon_Thickness[i] = round(float(horizon["horizon_thickness"]),1)#round(float(Cells.iloc[22 + i - 1, 3 - 1]),1) #'Thickness is rounded to one decimal
            total_horizon_depth += pSoilHorizon.Horizon_Thickness[i]
            pSoilHorizon.Clay[i] = float(horizon["percent_clay"])
            pSoilHorizon.Silt[i] = float(horizon["percent_silt"])
            pSoilHorizon.Sand[i] = float(horizon["percent_sand"])

            # field capacity & permanent wilting point, with is_number check
            sFC  = horizon.get("field_capacity")
            sPWP = horizon.get("wilting_point")
            if (sFC != None):
                if is_number(sFC):
                    pSoilHorizon.FC_WC[i]  = float(sFC)
                else:
                    pSoilHorizon.FC_WC[i]  = -9999.0
            if (sPWP != None):
                if is_number(sPWP):
                    pSoilHorizon.PWP_WC[i] = float(sPWP)
                else:
                    pSoilHorizon.PWP_WC[i] = -9999.0

            # organic matter
            pSoilHorizon.Percent_Soil_Organic_Matter[i] = float(horizon["organic_matter_percentage"])

    #same as before – uncomment/adjust if you need to extend bottom horizon
    #depth_deficit = MAX_Number_Model_Layers * Thickness_Model_Layers - total_horizon_depth
    #if depth_deficit > 0.:
    #    pSoilHorizon.Horizon_Thickness[pSoilHorizon.Number_Of_Horizons] += round(depth_deficit,1)


    def GetSoilHorizonParamegtersFromSSURGO(df_SSURGO,pSoilHorizen,bNotUseFC_PWP_Sat_WC):
         #06042025LML added bNotUseFC_PWP_Sat_WC to let model calculate these properties
        #'Soil description
        pSoilHorizen.Number_Of_Horizons = df_SSURGO.shape[0]
        total_horizon_depth = 0
        for i in range(1, pSoilHorizen.Number_Of_Horizons+1):
            t = df_SSURGO.loc[i-1,'hzdept_r']                                        #cm
            b = df_SSURGO.loc[i-1,'hzdepb_r']                                        #cm
            pSoilHorizen.Horizon_Thickness[i] = round((b - t) / 100.0,1)           #'Thickness is rounded to one decimal
            total_horizon_depth += pSoilHorizen.Horizon_Thickness[i]
            pSoilHorizen.Clay[i] = float(df_SSURGO.loc[i-1, 'claytotal_r'])
            pSoilHorizen.Silt[i] = float(df_SSURGO.loc[i-1, 'silttotal_r'])
            pSoilHorizen.Sand[i] = float(df_SSURGO.loc[i-1, 'sandtotal_r'])
            pSoilHorizen.FC_WP[i] = -33.0 #kPa
            if is_blank(df_SSURGO.loc[i-1, 'wthirdbar_r']) or bNotUseFC_PWP_Sat_WC:
                pSoilHorizen.FC_WC[i] = -9999.0
            else:
                pSoilHorizen.FC_WC[i] = float(df_SSURGO.loc[i-1, 'wthirdbar_r']) / 100.0
            pSoilHorizen.PWP_WP[i] = -1500.0 #kPa
            if is_blank(df_SSURGO.loc[i-1, 'wfifteenbar_r']) or bNotUseFC_PWP_Sat_WC:
                pSoilHorizen.PWP_WC[i] = -9999.0
            else:
                pSoilHorizen.PWP_WC[i] = float(df_SSURGO.loc[i-1, 'wfifteenbar_r']) / 100.0
            if is_blank(df_SSURGO.loc[i-1, 'wsatiated_r'] or bNotUseFC_PWP_Sat_WC):
                pSoilHorizen.Sat_WC[i] = -9999.0
            else:
                pSoilHorizen.Sat_WC[i] = float(df_SSURGO.loc[i-1, 'wsatiated_r']) / 100.0
            if is_blank(df_SSURGO.loc[i-1, 'om_r']):
                pSoilHorizen.Soil_Organic_Carbon[i] = 0.0
                pSoilHorizen.Percent_Soil_Organic_Matter[i] = 0.0
            else:
                pSoilHorizen.Soil_Organic_Carbon[i] = float(df_SSURGO.loc[i-1, 'om_r'])
                pSoilHorizen.Percent_Soil_Organic_Matter[i] = pSoilHorizen.Soil_Organic_Carbon[i]
            if is_blank(df_SSURGO.loc[i-1, 'dbthirdbar_r']) or bNotUseFC_PWP_Sat_WC:
                pSoilHorizen.Bulk_Dens[i] = -9999.0
            else:
                pSoilHorizen.Bulk_Dens[i] = float(df_SSURGO.loc[i-1, 'dbthirdbar_r'])

        
        #depth_deficit = MAX_Number_Model_Layers * Thickness_Model_Layers - total_horizon_depth #05192025LML
        #if depth_deficit < 0.: #05192025LML in case total horizon depth less than model required depth, extent the bottom horizon
        #    pSoilHorizen.Horizon_Thickness[pSoilHorizen.Number_Of_Horizons] += round(-depth_deficit,1)

    def ReadCropGrowth(json_data, crop_name, pCropGrowth):
        # Find the crop with the given name
        crop_data = next((crop for crop in json_data["crops"] if crop["name"] == crop_name), None)
        if not crop_data:
            raise ValueError(f"Crop '{crop_name}' not found in JSON data.")

        growth = crop_data["growth"]
        pCropGrowth.Crop_Name = crop_name
        pCropGrowth.Expected_Yield = float(growth["expected_yield"])
        pCropGrowth.Planting_DOY = int(growth["planting_doy"])
        pCropGrowth.Emergence_DOY = int(growth["emergence_doy"])
        pCropGrowth.Full_Canopy_DOY = int(growth["full_canopy_doy"])
        pCropGrowth.Beging_Senescence_DOY = int(growth["begin_senescence_doy"])
        pCropGrowth.Maturity_DOY = int(growth["maturity_doy"])
        pCropGrowth.Harvest_DOY = int(growth["harvest_doy"])

        # Calculate days after emergence for maturity and harvest
        if pCropGrowth.Emergence_DOY > pCropGrowth.Maturity_DOY:
            pCropGrowth.Maturity_DAE = (365 - pCropGrowth.Emergence_DOY) + pCropGrowth.Maturity_DOY
        else:
            pCropGrowth.Maturity_DAE = pCropGrowth.Maturity_DOY - pCropGrowth.Emergence_DOY

        if pCropGrowth.Emergence_DOY > pCropGrowth.Harvest_DOY:
            pCropGrowth.Harvest_DAE = (365 - pCropGrowth.Emergence_DOY) + pCropGrowth.Harvest_DOY
        else:
            pCropGrowth.Harvest_DAE = pCropGrowth.Harvest_DOY - pCropGrowth.Emergence_DOY


    def GetISMCropGrowthDOYParameters(agWeatherStationID,ISM_cropname,pCropGrowth):
        if int(agWeatherStationID) in stationregion.index:
            cropRegionCode = stationregion.loc[int(agWeatherStationID)]['regionID']
        else:
            print(f'{agWeatherStationID} is not in stationRegion Table, set region as default\n')
            cropRegionCode = 720 #default
        ISM_cropInfo = cropparameter.loc[ISM_cropname][cropparameter.loc[ISM_cropname,'cropRegion'] == cropRegionCode].squeeze()
        pCropGrowth.Crop_Name = ISM_cropname
        #pCropGrowth.Expected_Yield = 
        pCropGrowth.Planting_DOY = int(ISM_cropInfo['plantDate']) - 10
        pCropGrowth.Emergence_DOY = int(ISM_cropInfo['plantDate'])
        pCropGrowth.Full_Canopy_DOY = int(ISM_cropInfo['growthMaxDate'])
        pCropGrowth.Beging_Senescence_DOY = int(ISM_cropInfo['growthDeclineDate'])
        pCropGrowth.Maturity_DOY = int(ISM_cropInfo['growthEndDate'])
        #pCropGrowth.Harvest_DOY = int(ISM_cropInfo['plantDate'])


    def ReadFertilization(json_data, pCS_Fertilization, pCS_Min_Fertilizer, pCS_Organic_Fertilizer):
        fertilizations = json_data.get("fertilization", [])
        Seasonal_Scheduled_Fertilization = 0
        for fert in fertilizations:
            doy = int(fert["date"])
            if (doy > 0):
                pCS_Fertilization.Fertilization_DOY[doy] = doy
                pCS_Fertilization.Mineral_Fertilizer_Name[doy] = fert["fertilizer_name"]
                 #mineral fertilizer
                if fert["fertilizer_name"]:
                    pCS_Fertilization.Mineral_Fertilizer_Name[doy] = fert["fertilizer_name"]
                    pCS_Fertilization.Mineral_Fertilization_Rate[doy] = float(fert["mineral_rate"])
                    #pCS_Fertilization.Nitrate_Fraction[doy] = float(fert.get("nitrate_fraction", 0.0))
                    #pCS_Fertilization.Ammonium_Fraction[doy] = float(fert.get("ammonium_fraction", 0.0))
                    #pCS_Fertilization.Ammonia_Fraction[doy] = float(fert.get("ammonia_fraction", 0.0))

                    
                    Nitrate_Fract = 0.
                    Ammonium_Fract = 0.
                    Ammonia_Fract = 0.
                    if pCS_Fertilization.Mineral_Fertilizer_Name[doy] in pCS_Min_Fertilizer:
                        Nitrate_Fract = pCS_Min_Fertilizer[pCS_Fertilization.Mineral_Fertilizer_Name[doy]].Nitrate_mass_percentage / 100. 
                        Ammonium_Fract = pCS_Min_Fertilizer[pCS_Fertilization.Mineral_Fertilizer_Name[doy]].Ammonium_mass_percentage / 100. 
                        Ammonia_Fract = pCS_Min_Fertilizer[pCS_Fertilization.Mineral_Fertilizer_Name[doy]].Ammonia_mass_percentage / 100. 
                
                    pCS_Fertilization.Nitrate_Fertilization_Rate[doy] = (pCS_Fertilization.Mineral_Fertilization_Rate[doy] * Nitrate_Fract) / 10000. # 'Convert kg/ha to kg/m2
                    pCS_Fertilization.Ammonium_Fertilization_Rate[doy] = (pCS_Fertilization.Mineral_Fertilization_Rate[doy] * (Ammonium_Fract + Ammonia_Fract)) / 10000. # 'Convert kg/ha to kg/m2
                    Seasonal_Scheduled_Fertilization += pCS_Fertilization.Nitrate_Fertilization_Rate[doy] \
                                                        + pCS_Fertilization.Ammonium_Fertilization_Rate[doy]
                # Organic fertilizer
                if fert["organic_fertilizer_name"]:
                    pCS_Fertilization.Organic_Fertilizer_Name[doy] = fert["organic_fertilizer_name"]
                    pCS_Fertilization.Organic_Fertilizer_Rate[doy] = float(fert["organic_fertilizer_rate"])
                    pCS_Fertilization.Organic_Fertilizer_C_Fraction[doy] = float(fert.get("organic_fertilizer_c_fraction", 0.0))
                    pCS_Fertilization.Organic_Fertilizer_N_Fraction[doy] = float(fert.get("organic_fertilizer_n_fraction", 0.0))
                    pCS_Fertilization.Organic_Fertilizer_HalfLife[doy] = float(fert.get("organic_fertilizer_half_life", 0.0))

                    pCS_Fertilization.Organic_Fertilizer_Carbon_Mass[doy] = (
                        pCS_Fertilization.Organic_Fertilizer_C_Fraction[doy]
                        * pCS_Fertilization.Organic_Fertilizer_Rate[doy]
                    )
                    pCS_Fertilization.Organic_Fertilizer_Nitrogen_Mass[doy] = (
                        pCS_Fertilization.Organic_Fertilizer_N_Fraction[doy]
                        * pCS_Fertilization.Organic_Fertilizer_Rate[doy]
                    )

                # Application method
                pCS_Fertilization.Application_Method_Number[doy] = int(fert.get("application_method_number", 0))
        return Seasonal_Scheduled_Fertilization

    def ReadMinFertilizer(json_data, pCS_Min_Fertilizer):
        mineral_ferts = json_data.get("mineral_fertilizers", [])
        for fert in mineral_ferts:
            name = fert.get("fertilizer_name")
            if name and name not in pCS_Min_Fertilizer:
                pCS_Min_Fertilizer[name] = CS_Min_Fertilizer()
                pCS_Min_Fertilizer[name].Mineral_Fert_Name = name
                pCS_Min_Fertilizer[name].Nitrate_mass_percentage = float(fert.get("nitrate_fraction", 0.0))
                pCS_Min_Fertilizer[name].Ammonium_mass_percentage = float(fert.get("ammonium_fraction", 0.0))
                pCS_Min_Fertilizer[name].Ammonia_mass_percentage = float(fert.get("ammonia_fraction", 0.0))

    def ReadOrganicFertilizer(json_data, pCS_Organic_Fertilizer):
        organic_ferts = json_data.get("organic_fertilizers", [])
        for fert in organic_ferts:
            name = fert.get("fertilizer_name")
            if name and name not in pCS_Organic_Fertilizer:
                pCS_Organic_Fertilizer[name] = CS_Organic_Fertilizer()
                pCS_Organic_Fertilizer[name].Organic_Fertilizer_Name = name
                pCS_Organic_Fertilizer[name].Carbon_mass_percentage = float(fert.get("organic_fertilizer_c_fraction", 0.0))
                pCS_Organic_Fertilizer[name].Nitrogen_mass_percentage = float(fert.get("organic_fertilizer_n_fraction", 0.0))
                pCS_Organic_Fertilizer[name].HalfLife_days = float(fert.get("organic_fertilizer_half_life", 0.0))

            
    def ReadNetIrrigation(json_data, Irrigation):
        # Treat missing OR null "irrigation" as empty list
        irrigations = json_data.get("irrigation") or []
        DOY_Last_Scheduled_Irrigation = 0

        for ir in irrigations:
            try:
                # Safely pull values
                doy_raw = ir.get("doy")
                net_raw = ir.get("net")

                # Require both fields
                if doy_raw is None or net_raw is None:
                    continue

                doy = int(doy_raw)
                net = float(net_raw)

                # Basic sanity check (adjust if your model allows 0 or 366+)
                if not (1 <= doy <= 366):
                    continue

                # Works whether Irrigation is a dict or a pre-sized list
                Irrigation[doy] = net
                if doy > DOY_Last_Scheduled_Irrigation:
                    DOY_Last_Scheduled_Irrigation = doy

            except (ValueError, TypeError):
                # Skip malformed entries like "", "N/A", etc.
                continue

        return DOY_Last_Scheduled_Irrigation


    def ReadWeather(json_data, pCS_Weather):
        weather_data = json_data.get("weather", [])
        for weather in weather_data:
            doy = int(weather["doy"])
            pCS_Weather.Solar_Radiation[doy] = float(weather["radiation"])
            pCS_Weather.Tmax[doy] = float(weather["tmax"])
            pCS_Weather.Tmin[doy] = float(weather["tmin"])
            pCS_Weather.RHmax[doy] = float(weather["rhmax"])
            pCS_Weather.RHmin[doy] = float(weather["rhmin"])
            pCS_Weather.Wind_Speed[doy] = float(weather["wind_speed"])
            pCS_Weather.Precipitation[doy] = float(weather["precipitation"])
            pCS_Weather.FAO_ETo[doy] = float(weather["evapotranspiration"])
            
    def U2WindSpeed(ws_m_s,AnemomH_m):
        return ws_m_s * 4.87 / (math.log(67.8 * AnemomH_m - 5.42))
    
    def GetAgWeatherNetDailyWeather(stationid,AnemomH_m,styear,stdoy,edyear, eddoy,pCS_Weather):
        #get agWeather daily climate data
        sy,sm,sd = get_date_from_YDOY(styear,stdoy)
        ey,em,ed = get_date_from_YDOY(edyear,eddoy)
        start_date = f'{sy}-{sm:02}-{sd:02}'
        end_date = f'{ey}-{em:02}-{ed:02}'
        data = fetch_AgWeatherNet_data(stationid,start_date,end_date,True)
        numdays = (datetime.date(ey,em,ed) - datetime.date(sy,sm,sd)).days + 1
        good_data = True
        validadays = 0
        if data.shape[0] == numdays:
            for index, row in data.iterrows():
                if (row['JULDATE_PST'] != "" and
                    not math.isnan(row['SR_MJM2']) and
                    not math.isnan(row['MAX_AT_F']) and
                    not math.isnan(row['MIN_AT_F']) and
                    not math.isnan(row['MAX_REL_HUMIDITY']) and
                    not math.isnan(row['MIN_REL_HUMIDITY']) and
                    not math.isnan(row['P_INCHES']) and
                    not math.isnan(row['ETO'])):
                        tdate = datetime.datetime.strptime(row['JULDATE_PST'], "%Y-%m-%d").date()
                        day_of_year = tdate.timetuple().tm_yday
                        #print(f"{index} {row['JULDATE_PST']} {day_of_year}")
                        doy = int(day_of_year)
                        pCS_Weather.Solar_Radiation[doy] = row['SR_MJM2']
                        pCS_Weather.Tmax[doy] = fahrenheit_to_celsius(row['MAX_AT_F'])
                        pCS_Weather.Tmin[doy] = fahrenheit_to_celsius(row['MIN_AT_F'])
                        pCS_Weather.RHmax[doy] = row['MAX_REL_HUMIDITY']
                        pCS_Weather.RHmin[doy] = row['MIN_REL_HUMIDITY']
                        pCS_Weather.Wind_Speed[doy] = row['WS_MPH'] * 0.44704                  #MPH to m/s
                        pCS_Weather.Precipitation[doy] = row['P_INCHES'] * 25.4                #inch to mm
                        pCS_Weather.FAO_ETo[doy] = row['ETO'] * 25.4                           #inch to mm
                        validadays += 1
                else:
                    good_data = False
                    print(f'Error: {tdate.year}/{tdate.month}/{tdate.day} has NaN value!')
            if validadays < numdays:
                missing_days = numdays - validadays
                good_data = False
                print(f'Error: {missing_days} days missing climate data\n')
        else:
            good_data = False
            print(f'Error: Returned less days climate data: need {numdays} returned:{data.shape[0]}.\n')
            #exit()
        return good_data
        
    def ReadSoilInitial(Run_First_Doy, Run_Last_Doy, json_data, pSoilState, pSoilModelLayer, pSoilHorizen, pSoilFlux):
        #NUnit: ppm ot kgN_ha
        InitSoilState(pSoilState)
        initial_conditions = json_data.get("initial_soil_conditions", [])
        Number_Initial_Conditions_Layers = len(initial_conditions)
        if Number_Initial_Conditions_Layers <= 0 or pd.isna(Number_Initial_Conditions_Layers): 
            Number_Initial_Conditions_Layers = 10 #06042025LML initialize a big number

        Thickness_Model_Layers = 0.1

        Thickness = {}
        Number_Of_Sublayers = {}
        Water = {}
        Nitrate = {}
        Ammonium = {}

        DOY = int(Run_First_Doy)

        #NUnit: ppm ot kgN_ha
        unit_str = json_data.get("nunit", "ppm").lower()  # default to ppm
        if "kg" in unit_str and "ha" in unit_str:
            NUnit = "kgN_ha"
        elif "ppm" in unit_str:
            NUnit = "ppm"
        else:
            NUnit = "ppm"

        #06042025LML added check thickness
        valid_Number_Initial_Conditions_Layers = 0

        for i, condition in enumerate(initial_conditions, start=1):
            Thickness[i] = round(float(condition["thickness"]),1)
            if not pd.isna(Thickness[i]) and Thickness[i] > 0:
                valid_Number_Initial_Conditions_Layers += 1
                Number_Of_Sublayers[i] = round(Thickness[i] / Thickness_Model_Layers)
                Water[i] = float(condition["water"])
                if NUnit == "kgN_ha":
                    Nitrate[i] = float(condition["nitrate_n"])  # keep in kg/ha for now
                    Ammonium[i] = float(condition["ammonium_n"])  # keep in kg/ha
                elif NUnit == "ppm":
                    Nitrate[i] = float(condition["nitrate_n"])
                    Ammonium[i] = float(condition["ammonium_n"])
        
        Number_Initial_Conditions_Layers = valid_Number_Initial_Conditions_Layers  #06042025LML

        if Number_Initial_Conditions_Layers == 0:
            Number_Initial_Conditions_Layers = 5
            for i in range(1, Number_Initial_Conditions_Layers + 1):
                Thickness[i] = 0.2
                Number_Of_Sublayers[i] = round(Thickness[i] / Thickness_Model_Layers)
                Water[i] = -9999.
                Nitrate[i] = -9999.
                Ammonium[i] = -9999.
            
        #print(f'adjusted valid_Number_Initial_Conditions_Layers: {valid_Number_Initial_Conditions_Layers} Number_Initial_Conditions_Layers:{Number_Initial_Conditions_Layers}')

        # Distribute variables for each model layer of thickness 0.1 m
        Cum_J = 1
        for i in range(1, Number_Initial_Conditions_Layers + 1):
            NL = Number_Of_Sublayers[i]
            k = Cum_J
            L = (k + NL - 1)
            for j in range(k, L + 1):
                pSoilModelLayer.Layer_Thickness[j] = Thickness[i] / Number_Of_Sublayers[i]
                if j <= pSoilModelLayer.Number_Model_Layers:
                    print(f"Layer {j} on DOY {DOY}: OM% = {pSoilModelLayer.Percent_Soil_Organic_Matter[j] / 100},")

                    if Water[i] >= 0 and not pd.isna(Water[i]):
                        pSoilState.Water_Content[DOY][j] = min(pSoilModelLayer.FC_Water_Content[j], Water[i])
                        pSoilState.Water_Content[DOY][j] = max(pSoilModelLayer.PWP_Water_Content[j], pSoilState.Water_Content[DOY][j]) #06132025LML incase user set zero
                    else:
                        pSoilState.Water_Content[DOY][j] = pSoilModelLayer.FC_Water_Content[j] * 0.7 + pSoilModelLayer.PWP_Water_Content[j] * 0.3   #'Mingliang 6/17/2025
                        
                    pSoilState.Water_Filled_Porosity[DOY][j] = pSoilState.Water_Content[DOY][j] / pSoilModelLayer.Saturation_Water_Content[i]
                   #pSoilState.Soil_Water_Potential[j] = WP(pSoilModelLayer.Saturation_Water_Content[i], Water[i], pSoilModelLayer.Air_Entry_Potential[i], pSoilModelLayer.B_value[i])
                    pSoilState.Soil_Water_Potential[DOY][j] = WP(pSoilModelLayer.Saturation_Water_Content[i], pSoilState.Water_Content[DOY][j], pSoilModelLayer.Air_Entry_Potential[i], pSoilModelLayer.B_value[i])
                    if Nitrate[i] >= 0 and not pd.isna(Nitrate[i]):
                        if NUnit == 'kgN_ha':
                            pSoilState.Nitrate_N_Content[DOY][j] = Nitrate[i] / 10000. / Number_Of_Sublayers[i]    #'Convert kg/ha to kg/m2
                        elif NUnit == 'ppm':
                            pSoilState.Nitrate_N_Content[DOY][j] = Nitrate[i] * pSoilModelLayer.Bulk_Density[j] * pSoilModelLayer.Layer_Thickness[j] / 1000    #'Convert ppm to kg/m2
                    else:
                        pSoilState.Nitrate_N_Content[DOY][j] = 0. #10 / 10000   #'Convert kg/ha to kg/m2         'Mingliang 6/17/2025
                        
                    if Ammonium[i] >= 0 and not pd.isna(Ammonium[i]):
                        if NUnit == 'kgN_ha':
                            pSoilState.Ammonium_N_Content[DOY][j] = Ammonium[i] / 10000. / Number_Of_Sublayers[i]  #'Convert kg/ha to kg/m2
                        elif NUnit == 'ppm':
                            pSoilState.Ammonium_N_Content[DOY][j] = Ammonium[i] * pSoilModelLayer.Bulk_Density[j] * pSoilModelLayer.Layer_Thickness[j] / 1000. #'Convert ppm to kg/m2
                    else:
                        pSoilState.Ammonium_N_Content[DOY][j] = 0 #'Convert kg/ha to kg/m2                  'Mingliang 6/17/2025
                        
                    #print(f'Num_layers: {pSoilModelLayer.Number_Model_Layers} NUnit:{NUnit} i:{i} j:{j} Bulk_Density:{pSoilModelLayer.Bulk_Density[j]} WC:{pSoilState.Water_Content[DOY][j]} Nitrate_N_Content:{pSoilState.Nitrate_N_Content[DOY][j]} Ammonium:{pSoilState.Ammonium_N_Content[DOY][j]}')
                    pSoilModelLayer.Soil_Mass[j] = pSoilModelLayer.Bulk_Density[j] * 1000 * pSoilModelLayer.Layer_Thickness[j] #'kg/m2 in each soil layer. Bulk density converted from Mg/m3 to kg/m3
                    SOC = pSoilModelLayer.Soil_Mass[j] * (pSoilModelLayer.Percent_Soil_Organic_Matter[j] / 100.) * Carbon_Fraction_In_SOM #'kg/m2
                    
                    pSoilState.Soil_Organic_Carbon[DOY][j] = SOC
                    pSoilState.Soil_Organic_Nitrogen[DOY][j] = SOC / SOC_C_N_Ratio
                
            Cum_J = L + 1
            #print(f'Cum_J:{Cum_J}')
            #05192025 COS_LML
            #if Cum_J > Number_Initial_Conditions_Layers:
            #    #print(f'Cum_J: {Cum_J} Number_Initial_Conditions_Layers:{Number_Initial_Conditions_Layers}')
            #    break
    #Number_Model_Layers = Cum_J - 1
        #'Determine the thickness of the soil water evaporation layer
        #Percent_Sand = ReadInputs.PercentSand(1)
        #Thickness_Evaporative_Layer = Round(-0.001 * Percent_Sand + 0.169, 2)
        #Layer_Thickness(1) = Thickness_Evaporative_Layer
        #'Set accumulators to zero
        
        #'Mingliang: Begin of new section added
        Number_Initialization_Layers = Cum_J - 1 #'Mingliang 4/15/2025
        NML = pSoilModelLayer.Number_Model_Layers #'Mingliang 4/15/2025 'This is the total number of simulation model layers 'Mingliang 4/15/2025
        for i in range(Number_Initialization_Layers + 1, NML + 1):
                pSoilModelLayer.Layer_Thickness[i] = pSoilModelLayer.Layer_Thickness[Number_Initialization_Layers]
                pSoilState.Water_Content[DOY][i] =pSoilState.Water_Content[DOY][Number_Initialization_Layers]
                pSoilState.Water_Filled_Porosity[DOY][i] = pSoilState.Water_Filled_Porosity[DOY][Number_Initialization_Layers] #pSoilState.Water_Content[DOY][i] / pSoilModelLayer.Saturation_Water_Content[i]
                #'Mingliang Soil water potential was changed to a two-dimensional array
                #'        Soil_Water_Potential(i) = WP(Saturation_Water_Content(i), Water_Content(DOY, i), Air_Entry_Potential(i), B_value(i))
                pSoilState.Soil_Water_Potential[DOY][i] = pSoilState.Soil_Water_Potential[DOY][Number_Initialization_Layers] #WP(pSoilModelLayer.Saturation_Water_Content[i], pSoilState.Water_Content[DOY][i], pSoilModelLayer.Air_Entry_Potential[i], pSoilModelLayer.B_value[i])
                pSoilState.Nitrate_N_Content[DOY][i] = pSoilState.Nitrate_N_Content[DOY][Number_Initialization_Layers]
                pSoilState.Ammonium_N_Content[DOY][i] = pSoilState.Ammonium_N_Content[DOY][Number_Initialization_Layers]
                #'        Initialize soil organi carbon and nitrogen
                #'        Convert percent organic matter to soil organic carbon in kg C/m2 soil
                pSoilModelLayer.Soil_Mass[i] = pSoilModelLayer.Bulk_Density[i] * 1000. * pSoilModelLayer.Layer_Thickness[i] #'kg/m2 in each soil layer. Bulk density converted from Mg/m3 to kg/m3
                #SOC = pSoilModelLayer.Soil_Mass[i] * (pSoilModelLayer.Percent_Soil_Organic_Matter[i] / 100.) * Carbon_Fraction_In_SOM #'kg/m2
                SOC = pSoilModelLayer.Soil_Mass[i] * (pSoilModelLayer.Percent_Soil_Organic_Matter[Number_Initialization_Layers] / 100.) * Carbon_Fraction_In_SOM #'kg/m2
                pSoilState.Soil_Organic_Carbon[DOY][i] = SOC
                pSoilState.Soil_Organic_Nitrogen[DOY][i] = SOC / SOC_C_N_Ratio
                #print(f'i:{i} OM:{pSoilState.Soil_Organic_Carbon[DOY][i]}')
        #'Mingliang: End of new section added
        
        
        #Cumulative_Deep_Drainage = 0
        #Cumulative_N_Leaching = 0
        
        #Percent_Sand = pSoilHorizen.Sand[1]
        #Thickness_Evaporative_Layer = round(-0.001 * Percent_Sand + 0.169, 1)
        #pSoilModelLayer.Layer_Thickness[1] = Thickness_Evaporative_Layer           #TODO 11/15/2024LML High risk since the soil properties already initialized with default layer depth
        #'Set simulation period accumulators to zero
        #04252025COS-LML pSoilFlux.Simulation_Total_N_Leaching = 0
        #04252025COS-LML pSoilFlux.Simulation_Total_Deep_Drainage = 0
        #04252025COS-LML pSoilFlux.Simulation_Total_Irrigation = 0
        #04252025COS-LML pSoilFlux.Simulation_Total_Fertilization = 0


    def WriteCropSummaryOutput(Crop_Number, DOY, CropSumOutputs, 
                        pSoilFlux, pSoilState, pSoilModelLayer, 
                        pETState, json_data_to_write):
    
        Profile_Nitrate_Content = 0.
        Profile_Ammonium_Content = 0.
        for i in range(1, pSoilModelLayer.Number_Model_Layers + 1):
            Profile_Nitrate_Content += pSoilState.Nitrate_N_Content[DOY][i]
            Profile_Ammonium_Content += pSoilState.Ammonium_N_Content[DOY][i]
        
        CropSumColumns_data = {
            "Cumulative Deep Drainage(mm)": pSoilFlux.Cumulative_Deep_Drainage,
            "Cumulative N Leaching (kg/ha)": pSoilFlux.Cumulative_N_Leaching,
            "Cumulative mineralization, 0.0 m - 0.3 m soil layer (kg/ha)": pSoilFlux.Cumulative_Mineralization_Top_Three_Layers_Crop[Crop_Number] * 10000, #'Convert kg/m2 to kg/ha
            "Cumulative mineralization, 0.3 m - 0.6 m soil layer (kg/ha)": pSoilFlux.Cumulative_Mineralization_Next_Three_Layers_Crop[Crop_Number] * 10000, #'Convert kg/m2 to kg/ha
            "Residual soil profile nitrate (kg/ha)": Profile_Nitrate_Content * 10000., # 'Convert kg/m2 to kg/ha,
            "Residual soil profile ammonium (kg/ha)": Profile_Ammonium_Content * 10000, # 'Convert kg/m2 to kg/ha,
            "Cumulative irrigation (mm)": pSoilFlux.Cumulative_Irrigation,
            "Cumulative N fertilization (kg/ha)": pSoilFlux.Cumulative_Fertilization * 10000, #'Convert kg/m2 to kg/ha,
            "Seasonal Transpiration (mm)": pETState.Total_Transpiration,
            "Seasonal Soil Water Evaporation (mm)": pETState.Crop_Soil_Water_Evaporation,
            "Seasonal N Uptake (kg/ha)": pCropState.Seasonal_N_Uptake * 10000, # 'Convert kg/m2 to kg/ha ,
            "Expected Potential Biomass at maturity (kg/ha)": pCropState.Cumulative_Potential_Crop_Biomass[DOY - 1] * 10000, # 'Convert kg/m2 to kg/ha,
            "Biomass at maturity or harvest, whichever is first (kg/ha)": pCropState.Seasonal_Biomass * 10000 # 'Convert kg/m2 to kg/ha
        }

         #  Convert Row to JSON
        crop_summary_json = json.dumps(CropSumColumns_data, indent=4)

        json_data_to_write["seasonal_data"].append(CropSumColumns_data)


        #  Append to DataFrame
        CropSumOutputs[Crop_Number].loc[len(CropSumOutputs[Crop_Number])] = CropSumColumns_data
        
    def WriteCropOutput(Crop_Number, DOY, DAE, CropOutputs, 
                        pCropState, pETState, pSoilState, json_data_to_write):
        preday_Cumulative_N_Uptake = 0
        #handle first day issue
        if DOY == 1: 
            if 366 in pCropState.Cumulative_N_Uptake and pCropState.Cumulative_N_Uptake[366] > 1e-12:
                preday_Cumulative_N_Uptake = pCropState.Cumulative_N_Uptake[366]
            else:
                preday_Cumulative_N_Uptake = pCropState.Cumulative_N_Uptake[365]
        else:
            preday_Cumulative_N_Uptake = pCropState.Cumulative_N_Uptake[DOY - 1]

        CropOutRow = {
            "DAE": DAE,
            "DOY": DOY,
            "Pot Green Canopy Cover": pCropState.Potential_Green_Canopy_Cover[DOY],
            "Pot crop Transpiration (mm/day)": pETState.Potential_Crop_Transpiration[DOY],
            "Pot Biomass (kg/ha)": pCropState.Cumulative_Potential_Crop_Biomass[DOY] * 10000, #'Convert kg/m2 to kg/ha,
            "Green Canopy Cover": pCropState.Green_Canopy_Cover[DOY],
            "Biomass (kg/ha)": pCropState.Cumulative_Crop_Biomass[DOY] * 10000, #'Convert kg/m2 to kg/ha,
            "Transpiration (mm)": pETState.Actual_Transpiration[DOY],
            "Soil Evap (mm)": pETState.Actual_Soil_Water_Evaporation[DOY],
            "Root Depth (m)": pCropState.Root_Depth[DOY],
            "Height (m)": pCropState.Crop_Height[DOY],
            "Max N Conc (kg/kg)": pCropState.Maximum_N_Concentration[DOY],
            "Crit N Conc (kg/kg)": pCropState.Critical_N_Concentration[DOY],
            "Min N Conc (kg/kg)": pCropState.Minimum_N_Concentration[DOY],
            "Crop N Conc (kg/kg)": pCropState.Crop_N_Concentration[DOY],
            "Crop N Mass (kg/ha)": pCropState.Crop_N_Mass[DOY] * 10000, #'Convert kg/m2 to kg/ha
            "N Uptake (kg/ha)": pCropState.Cumulative_N_Uptake[DOY] * 10000, #'Convert kg/m2 to kg/ha
            "Crop WSI (0-1)": pETState.Water_Stress_Index[DOY],
            "Crop NSI (0-1)": pCropState.Nitrogen_Stress_Index[DOY],
            "PAW Depletion Profile (0-1)": pSoilState.PAW_Depletion[DOY],
            #"PAW Depletion Top 50 cm (0-1)": pSoilState.PAW_Depletion_Top50cm[DOY],
            #"PAW Depletion Mid 50 cm (0-1)": pSoilState.PAW_Depletion_Mid50cm[DOY],
            #"PAW Depletion bottom 50 cm (0-1)": pSoilState.PAW_Depletion_Bottom50cm[DOY],
            "Water Content Top 50 cm (0-1)": pSoilState.Water_Content_Top50cm[DOY],
            "Water Content Mid 50 cm (0-1)": pSoilState.Water_Content_Mid50cm[DOY],
            "Water Content bottom 50 cm (0-1)": pSoilState.Water_Content_Bottom50cm[DOY],
            "N Mass Top 50 cm (kg/ha)": pSoilState.N_Mass_Top50cm[DOY],
            "N Mass Mid 50 cm (kg/ha)": pSoilState.N_Mass_Mid50cm[DOY],
            "N Mass bottom 50 cm (kg/ha)": pSoilState.N_Mass_Bottom50cm[DOY],
            "N Leaching (kg/ha)":pSoilFlux.N_Leaching_Accumulated[DOY] * 10000, #'Convert kg/m2 to kg/ha 'NEW Mingliang
            "Soil N Mass down to 150 cm (kg/ha)": pSoilState.N_Mass_Top50cm[DOY] + pSoilState.N_Mass_Mid50cm[DOY] + pSoilState.N_Mass_Bottom50cm[DOY],
            "N Uptake Rate (kg/ha/day)": (pCropState.Cumulative_N_Uptake[DOY] - preday_Cumulative_N_Uptake) * 10000 #'Convert kg/m2 to kg/ha
        }

        #print(f'preday_Cumulative_N_Uptake: {preday_Cumulative_N_Uptake * 10000} today_cum: {pCropState.Cumulative_N_Uptake[DOY] * 10000} N Uptake Rate:{(pCropState.Cumulative_N_Uptake[DOY] - preday_Cumulative_N_Uptake) * 10000}')
            #  Convert Row to JSON
        crop_output_json = json.dumps(CropOutRow, indent=4)
        # Append to JSON structure
        json_data_to_write["daily_data"].append(CropOutRow)
        #  Append to DataFrame
        CropOutputs[Crop_Number].loc[len(CropOutputs[Crop_Number])] = CropOutRow
            
    def WriteCropSoilOutput(Crop_Number, DOY, DAE, SoilLayers, SoilOutputs, 
                        pCropState, pSoilFlux, json_data_to_write):
        SoilOutRow = dict()
        SoilOutRow["DAE"] = DAE
        SoilOutRow["DOY"] = DOY
        SoilOutRow["Crop Number"] = Crop_Number
        #print(f"DEBUG: SoilLayers = {SoilLayers}, Expected max layer index = {max(pSoilState.Water_Content[DOY].keys())}")
        for i in range(1,SoilLayers + 1):
            SoilOutRow[f'Water (m/m) L{i}'] = pSoilState.Water_Content[DOY][i]
            SoilOutRow[f'NO3-N (kg/ha) L{i}'] = pSoilState.Nitrate_N_Content[DOY][i] * 10000 #'Convert kg/m2 to kg/ha
            SoilOutRow[f'NH4-N (kg/ha) L{i}'] = pSoilState.Ammonium_N_Content[DOY][i] * 10000 #'Convert kg/m2 to kg/ha
        for i in range(1,7):
            SoilOutRow[f'Mineralized-N (kg/ha) L{i}'] = pSoilFlux.Layer_Mineralization[DOY][i] * 10000 #'Convert kg/m2 to kg/ha
        
        json_data_to_write["daily_data"].append(SoilOutRow)

        if Crop_Number != 0:
            SoilOutputs[Crop_Number].loc[len(SoilOutputs[Crop_Number])] = SoilOutRow

        
        
    def WriteTotalSimPeriodOutput(TotalSimPeriodOutput, RunLastDOY, 
                                SoilLayers, pSoilState, pSoilFlux, json_data_to_write):
        Profile_Nitrate_Content = 0
        Profile_Ammonium_Content = 0
        Last_Simulation_DOY = RunLastDOY # - 1
        for i in range(1, SoilLayers + 1):
            Profile_Nitrate_Content += pSoilState.Nitrate_N_Content[Last_Simulation_DOY - 1][i]
            Profile_Ammonium_Content += pSoilState.Ammonium_N_Content[Last_Simulation_DOY - 1][i]
        TotalSimPeriodRow = {
            "Crop Number": "All",
            "Cumulative Deep Drainage(mm)": pSoilFlux.Simulation_Total_Deep_Drainage,
            "Cumulative N Leaching (kg/ha)": pSoilFlux.Simulation_Total_N_Leaching,
            "Cumulative mineralization, 0.0 m - 0.3 m soil layer (kg/ha)": pSoilFlux.Cumulative_Mineralization_Top_Three_Layers_All_Days * 10000, # 'Convert kg/m2 to kg/ha,
            "Cumulative mineralization, 0.3 m - 0.6 m soil layer (kg/ha)": pSoilFlux.Cumulative_Mineralization_Next_Three_Layers_All_Days * 10000, # 'Convert kg/m2 to kg/ha,
            "Residual soil profile nitrate (kg/ha)": Profile_Nitrate_Content * 10000, #  'Convert kg/m2 to kg/ha
            "Residual soil profile ammonium (kg/ha)": Profile_Ammonium_Content * 10000, #  'Convert kg/m2 to kg/ha
            "Cumulative irrigation (mm)": pSoilFlux.Simulation_Total_Irrigation,
            "Cumulative N fertilization (kg/ha)": pSoilFlux.Simulation_Total_Fertilization * 10000 #  'Convert kg/m2 to kg/ha
            }
        TotalSimPeriodOutput.loc[len(TotalSimPeriodOutput)] = TotalSimPeriodRow

        json_data_to_write["seasonal_data"].append(TotalSimPeriodRow)
    
    def WriteDailyWaterAndNitrogenBudgetTable(DailyBudgetOutputs, Crop_Number, DOY, 
                                          DAE, SoilLayers, 
                                          pCropState, pSoilFlux, pETState, 
                                          pSoilState, pCS_Weather, irrigations,
                                          Irrigation_Recommendation,
                                          pCS_Fertilization, Today_Crop_N_Demand, 
                                          Available_For_Active_Uptake,
                                          N_Fert_Recommended_Amount, DOY_Last_Scheduled_Irrigation):
    #Items from "7-day daily budget table" of Irrigation Schedular, plus nitrogen 
    #budget

        #06122025LML consistent with crop outputAdd commentMore actions
        # Items from "7-day daily budget table" of Irrigation Scheduler, plus nitrogen budget
        preday_Cumulative_N_Uptake = 0
        if pCropState is not None:
            if DOY == 1:
                if 366 in pCropState.Cumulative_N_Uptake and pCropState.Cumulative_N_Uptake[366] > 1e-12:
                    preday_Cumulative_N_Uptake = pCropState.Cumulative_N_Uptake[366]
                else:
                    preday_Cumulative_N_Uptake = pCropState.Cumulative_N_Uptake[365]
            else:
                preday_Cumulative_N_Uptake = pCropState.Cumulative_N_Uptake[DOY - 1]

        if DOY_Last_Scheduled_Irrigation > 0:
            days_since_last_irrigation = DOY - DOY_Last_Scheduled_Irrigation
        else:
            days_since_last_irrigation = "N/A"

        if irrigations[DOY] > 0:
            days_since_last_irrigation = 0
            DOY_Last_Scheduled_Irrigation = DOY

        BudgetOutRow = {
            "DAE": DAE,
            "DOY": DOY,
            "Water Use (in)": mm_to_inch(pETState.Actual_Transpiration[DOY] + pETState.Actual_Soil_Water_Evaporation[DOY]),
            "Rain and Irrig (in)": mm_to_inch(pCS_Weather.Precipitation[DOY] + irrigations[DOY]),
            "Irrig (in)": mm_to_inch(irrigations[DOY]),
            "PAW Depletion (0-1)": pSoilState.PAW_Depletion[DOY],
            "Irrigation_Recommendation (in)": mm_to_inch(Irrigation_Recommendation),
            "Water_Stress_Index (0-1)": pETState.Water_Stress_Index[DOY],
            "N Fertilization (kg/ha)": KgPerSquareMeter_to_KgPerHa(
                pCS_Fertilization.Nitrate_Fertilization_Rate[DOY] + pCS_Fertilization.Ammonium_Fertilization_Rate[DOY]
            ),
            "N Available (kg/ha)": KgPerSquareMeter_to_KgPerHa(Available_For_Active_Uptake),
            "N Uptake Rate (kg/ha/day)": (pCropState.Cumulative_N_Uptake[DOY] - preday_Cumulative_N_Uptake) * 10000
                                        if pCropState is not None else 0,
            "Nitrogen_Stress_Index (0-1)": pCropState.Nitrogen_Stress_Index[DOY]
                                        if pCropState is not None else 0,
            "N Fertilization Recommendation (kg/ha)": KgPerSquareMeter_to_KgPerHa(N_Fert_Recommended_Amount),
            "Days Since Last Irrigation": days_since_last_irrigation
        }

        DailyBudgetOutputs[Crop_Number].loc[len(DailyBudgetOutputs[Crop_Number])] = BudgetOutRow
        json_data_to_write["budget_data"].append(BudgetOutRow)

                
        DailyBudgetOutputs[Crop_Number].loc[len(DailyBudgetOutputs[Crop_Number])] = BudgetOutRow

#Main
    # Initialize JSON structure
    json_data_to_write = {"daily_data": [], "seasonal_data": [], "budget_data": []}

    #user option
    soil_propertities_from_SSURGO = False
    crop_growth_parameter_from_ISM = False
    weather_from_AgWeatherNet = False
    bNotUseFC_PWP_Sat_WC = True    #06042025LML If True, use model to estimate FC, PWP,  Sat WC, and bulkdensity; Otherwise, use user inputs or from soil database

    Irrigation_Recommendation_Option = None # 'CWSI' 'Refill' 
    Irrigation_Recommendation_Parameter = None

    data_entry = json_data[0]
    # Farm and field description
    Farm_Name = data_entry["farm_name"]
    Field_Number = int(data_entry["field_number"])
    Field_Name = data_entry["field_name"]
    Area = float(data_entry["area"])
    Irrigation_Method = data_entry["irrigation_method"]
    Water_Source = int(data_entry["water_source"])
    Water_N_Conc = float(data_entry["water_n_concentration"])   #(mg/L)

    Auto_Fertilization = get_json_boolean(data_entry, "Auto_Fertilization")   #'Mingliang 7/18/2025  Should set True for estimating N recommendation after TODAY.
    Auto_Irrigation  = get_json_boolean(data_entry,'Auto_Irrigation')     #'Mingliang 7/20/2025  Should set True for estimating irrigation recommendation after TODAY.
    Seasonal_Scheduled_Fertilization = 0. #'Mingliang 7/20/2025

    Begin_Crop_Senescence = False    #'Mingliang 6/21/2025
    Potential_Biomass_At_Maturity = 0


    ISM_cropnames = {'Triticale': 'Triticale (for forage)','Silage Corn': 'Corn (silage)'}  #TODO
    field_lat = 45.97
    field_lon = -119.26
    wkt_geometry = f'point ({field_lon} {field_lat})'

    #test for polygon
    wkt_geometry = 'POLYGON((-119.745 46.263,-119.745 46.27,-119.72 46.27,-119.72 46.263,-119.745 46.263))'
    AnemomH = 1.5                                                                  #elevation of anemometer (m)

    #'First simulation run day of tghe year
    First_DOY = data_entry["first_doy"]


    if weather_from_AgWeatherNet:
        agWeatherStationID,dist = FindClosestStationAndDistance(field_lat,field_lon,
                                                                agweathernetstation,
                                                                "Latitude(N)",
                                                                "Longitude(W)",
                                                                "Station ID")
        
    '''
        NOTE: only weather_from_AgWeatherNet is set to True in the output below

        Default agWeatherStationID returned by FindClosestStationAndDistance() fails -----> 100353
        agWeatherStationID = 100066 ----> Fails via "AttributeError: 'NoneType' object has no attribute 'shape'"
        agWeatherStationID = 330024 ----> Works, but has two defined default Region Codes so crop_parameter_from_ISM fails.
        agWeatherStationID = 100031 ----> Works
        agWeatherStationID = 300032 --> Fails via "Error: Returned less days climate data: need 362 returned:358."

    '''
    #'Soil description
    pSoilHorizen = SoilHorizons()
    pSoilModelLayer = SoilModelLayer()
    if soil_propertities_from_SSURGO == False:                                     #User set soil horizental properties
        ReadSoilHorizonParamegters(data_entry,pSoilHorizen)
    else:
        if 'point' in wkt_geometry:
            point = wkt.loads(wkt_geometry)
            mukey,muname,percent = get_mukey_muname_from_geocoordinate(point.x,point.y)
        else:
            mukey,muname,percent = get_dominant_mukey_muname_from_polygon(wkt_geometry, 20)
        if mukey is not None:
            #print(f'{mukey}:{muname}')
            result = get_all_components_soil_properties(mukey)
            result['comppct_r'] = result['comppct_r'].astype(float)
            result['hzdept_r'] = result['hzdept_r'].astype(float)
            result['hzdepb_r'] = result['hzdepb_r'].astype(float)
            max_cmppct = result['comppct_r'].max()
            max_cmppct_rows = result[result['comppct_r'] == max_cmppct]
            max_cmppct_rows_unique_rows = max_cmppct_rows.drop_duplicates(subset=['ch.chkey'], keep='first').sort_values(by='hzdept_r').reset_index(drop=True)
            GetSoilHorizonParamegtersFromSSURGO(max_cmppct_rows_unique_rows,pSoilHorizen, bNotUseFC_PWP_Sat_WC)
        else:
            print('Warning: Cannot find SSURGO data for this field!')
    CalculateHydraulicProperties(pSoilHorizen.Number_Of_Horizons,pSoilHorizen,pSoilModelLayer,True) #06042025LML hard-coded to always calculate FC, PWP, and Sat WC

    ISM_cropnames = {'Triticale': 'Triticale (for forage)','Corn': 'Corn'}

    #'Crop description
    Number_Of_Crops = len(data_entry["crops"])
    CropNames = {i + 1: crop["name"] for i, crop in enumerate(data_entry["crops"])}
    CropGrowths = {i + 1: CropGrowth() for i in range(Number_Of_Crops)}
    CropParameters = {i + 1: CropParameter() for i in range(Number_Of_Crops)}

    for crop_index, crop_name in CropNames.items():
        ISM_cropname = ISM_cropnames[crop_name.title()]
        ReadCropParameters(data_entry, crop_name, CropParameters[crop_index])
        ReadCropGrowth(data_entry, crop_name, CropGrowths[crop_index])

        if crop_growth_parameter_from_ISM:
            GetISMCropGrowthDOYParameters(agWeatherStationID, ISM_cropname, CropGrowths[crop_index])

    #fertilization
    pCS_Fertilization = CS_Fertilization()

    pCS_Min_Fertilizer = dict()
    pCS_Organic_Fertilizer = dict()

    ReadMinFertilizer(data_entry,pCS_Min_Fertilizer)
    ReadOrganicFertilizer(data_entry,pCS_Organic_Fertilizer)
    InitFertilization(pCS_Fertilization)
    ReadFertilization(data_entry,pCS_Fertilization, pCS_Min_Fertilizer, pCS_Organic_Fertilizer)
    Seasonal_Scheduled_Fertilization = ReadFertilization(data_entry,pCS_Fertilization,pCS_Min_Fertilizer,pCS_Organic_Fertilizer)

    #irrigation
    DOY_Last_Scheduled_Irrigation = 0
    net_irrigations = {i: 0.0 for i in range(1, 367)}
    DOY_Last_Scheduled_Irrigation = ReadNetIrrigation(data_entry, net_irrigations)


    #'Automatic irrigation
    AutoIrrigations = AutoIrrigationEvents()
    Emergence_DOY_1 = CropGrowths[1].Emergence_DOY
    Maturity_DOY_1 = CropGrowths[1].Maturity_DOY
    if Number_Of_Crops == 2:
        Emergence_DOY_2 = CropGrowths[2].Emergence_DOY
        Maturity_DOY_2 = CropGrowths[2].Maturity_DOY
    else:
        Emergence_DOY_2 = None      # here
        Maturity_DOY_2 = None       # here
    ReadAutoIrrigation(data_entry,AutoIrrigations,DOY_Last_Scheduled_Irrigation,
                    Emergence_DOY_1,Maturity_DOY_1,Emergence_DOY_2,Maturity_DOY_2)

    #05202025LML create a look-up table to get autoirrigation parameters, including scheduling methodAdd commentMore actions
    autoirrigation_info = dict() #index by DOY; include DOY for stop auto irrigation
    for i in range(1, AutoIrrigations.Number_Of_Auto_Entries + 1):
        if AutoIrrigations.Events[i].DOY_To_Start_Auto_Irrigation is not None:
            if AutoIrrigations.Events[i].Scheduling_Method == 1: #PAW
                autoirrigation_info[AutoIrrigations.Events[i].DOY_To_Start_Auto_Irrigation] = [1,AutoIrrigations.Events[i].Maximum_Allowable_PAW_Depletion]
            elif AutoIrrigations.Events[i].Scheduling_Method == 2: #CWSI
                autoirrigation_info[AutoIrrigations.Events[i].DOY_To_Start_Auto_Irrigation] = [2,AutoIrrigations.Events[i].Maximum_Allowable_CWSI]
        elif AutoIrrigations.Events[i].DOY_To_Stop_Auto_Irrigation is not None:
            autoirrigation_info[AutoIrrigations.Events[i].DOY_To_Stop_Auto_Irrigation] = [None, None]

    #agWeatherStation = '100031' #McNary
    CropColums = {
        "DAE": "int32",
        "DOY": "int32",
        "Pot Green Canopy Cover": "float64",
        "Pot crop Transpiration (mm/day)": "float64",
        "Pot Biomass (kg/ha)": "float64",
        "Green Canopy Cover": "float64",
        "Biomass (kg/ha)": "float64",
        "Transpiration (mm)": "float64",
        "Soil Evap (mm)": "float64",
        "Root Depth (m)": "float64",
        "Height (m)": "float64",
        "Max N Conc (kg/kg)": "float64",
        "Crit N Conc (kg/kg)": "float64",
        "Min N Conc (kg/kg)": "float64",
        "Crop N Conc (kg/kg)": "float64",
        "Crop N Mass (kg/ha)": "float64",
        "N Uptake (kg/ha)": "float64",
        "Crop WSI (0-1)": "float64",
        "Crop NSI (0-1)": "float64",
        "PAW Depletion Profile (0-1)": "float64",
        #"PAW Depletion Top 50 cm (0-1)": "float64", #'NEW Mingliang
        #"PAW Depletion Mid 50 cm (0-1)": "float64", #'NEW Mingliang
        #"PAW Depletion bottom 50 cm (0-1)": "float64", #'NEW Mingliang
        "Water Top 50 cm (m/m)": "float64", #'NEW Mingliang
        "Water Mid 50 cm (m/m)": "float64", #'NEW Mingliang
        "Water bottom 50 cm (m/m)": "float64", #'NEW Mingliang
        "N Mass Top 50 cm (kg/ha)": "float64", #'NEW Mingliang
        "N Mass Mid 50 cm (kg/ha)": "float64", #'NEW Mingliang
        "N Mass bottom 50 cm (kg/ha)": "float64", #'NEW Mingliang
        "N Leaching (kg/ha)": "float64", #'NEW Mingliang
        "Soil N Mass down to 150 cm (kg/ha)": "float64", #'NEW Mingliang
        "N Uptake Rate (kg/ha/day)": "float64"
    }

    CropOutputs = dict()
    for crop in range(1,Number_Of_Crops + 1):
        CropOutputs[crop] = pd.DataFrame({col: pd.Series(dtype=dt) for col, dt in CropColums.items()})

    #output_mode_file_name = 'Water_Uptake_output_mode.csv'
    #output_file_name = 'wateruptake_out.csv'

    #all crop parameters
    #crop_parameters = dict()
    #Use the user selected ISM cropname
    #crop_parameters[ISM_cropname] = crop_paramater

    #Crop growth inputs
    #pCropGrowth = CropGrowth()
    #CropGrowths = dict()

    #Get some growth parameters from user
    #crop_row_index = 38
    #ReadCropGrowth(InputCells,pCropGrowth,crop_row_index)
    #pCropGrowth.Crop_Name = ISM_cropname  #Not using the crop name in the Excel table
    #if crop_growth_parameter_from_ISM:  #update some DOY parameters from ISM
    #    GetISMCropGrowthDOYParameters(agWeatherStationID,ISM_cropname,pCropGrowth)

    #CropGrowths[ISM_cropname] = pCropGrowth




    #Soil initial conditions


    #SoilOutput
    SoilLayers = pSoilModelLayer.Number_Model_Layers

    SoilColums = dict()
    SoilColums["DAE"] = "int32"
    SoilColums["DOY"] = "int32"
    for i in range(1,SoilLayers + 1):
        SoilColums[f'Water (m/m) L{i}'] = "float64"
        SoilColums[f'NO3-N (kg/ha) L{i}'] = "float64"
        SoilColums[f'NH4-N (kg/ha) L{i}'] = "float64"
    for i in range(1,7):
        SoilColums[f'Mineralized-N (kg/ha) L{i}'] = "float64"
        
    SoilOutputs = dict()
    for crop in range(1,Number_Of_Crops + 1):
        SoilOutputs[crop] = pd.DataFrame({col: pd.Series(dtype=dt) for col, dt in SoilColums.items()})

    
    #Daily Budget Outputs (From emergence to maturity)
    DailyBudgetColums = {
        "DAE": "int32",
        "DOY": "int32",
        "Water Use (in)": "float64",
        "Rain and Irrig (in)": "float64", 
        "Irrig (in)": "float64",
        "PAW Depletion (0-1)": "float64", 
        "Irrigation_Recommendation (in)": "float64", 
        "Water_Stress_Index (0-1)": "float64", 
        #"Today_Crop_N_Demand (kg/ha)": "float64",
        "N Uptake Rate (kg/ha/day)": "float64",  
        "N Fertilization (kg/ha)": "float64",
        "N Available (kg/ha)": "float64",
        #"N Deficit (kg/ha)": "float64",
        "Nitrogen_Stress_Index (0-1)": "float64",
        "N Fertilization Recommendation (kg/ha)": "float64",
        "Days Since Last Irrigation": "int32"
        }
    
    DailyBudgetOutputs = dict()
    for crop in range(1,Number_Of_Crops + 1):
        DailyBudgetOutputs[crop] = pd.DataFrame({col: pd.Series(dtype=dt) for col, dt in DailyBudgetColums.items()})

    #CROP OUTPUT (From emergence to maturity)
    CropSumColums = {
        "Cumulative Deep Drainage(mm)": "float64",
        "Cumulative N Leaching (kg/ha)": "float64",
        "Cumulative mineralization, 0.0 m - 0.3 m soil layer (kg/ha)": "float64",
        "Cumulative mineralization, 0.3 m - 0.6 m soil layer (kg/ha)": "float64",
        "Residual soil profile nitrate (kg/ha)": "float64",
        "Residual soil profile ammonium (kg/ha)": "float64",
        "Cumulative irrigation (mm)": "float64",
        "Cumulative N fertilization (kg/ha)": "float64",
        "Seasonal Transpiration (mm)": "float64",
        "Seasonal Soil Water Evaporation (mm)": "float64", #'Mingliang 4/17/2025
        "Seasonal N Uptake (kg/ha)": "float64",
        "Expected Potential Biomass at maturity (kg/ha)": "float64",
        "Biomass at maturity or harvest, whichever is first (kg/ha)": "float64"
        }

    CropSumOutputs = dict()
    for crop in range(1,Number_Of_Crops + 1):
        CropSumOutputs[crop] = pd.DataFrame({col: pd.Series(dtype=dt) for col, dt in CropSumColums.items()})

    #TOTALS FOR SIMULATION PERIOD
    TotalSimPeriodColumns = {
        "Cumulative Deep Drainage(mm)": "float64",
        "Cumulative N Leaching (kg/ha)": "float64",
        "Cumulative mineralization, 0.0 m - 0.3 m soil layer (kg/ha)": "float64",
        "Cumulative mineralization, 0.3 m - 0.6 m soil layer (kg/ha)": "float64",
        "Residual soil profile nitrate (kg/ha)": "float64",
        "Residual soil profile ammonium (kg/ha)": "float64",
        "Cumulative irrigation (mm)": "float64",
        "Cumulative N fertilization (kg/ha)": "float64",
        }
    TotalSimPeriodOutput = pd.DataFrame({col: pd.Series(dtype=dt) for col, dt in TotalSimPeriodColumns.items()})

    #RECORD FOR FEILD Irigation & Fertilization events
    FieldManagementsLogs = {
        "DOY": "int32",
        "Crop": "int32",
        "Irrigation (mm)": "float64",
        "Fertilizer (kg/ha)": "float64"
        }
    FieldManagementsLogsOutput = pd.DataFrame({col: pd.Series(dtype=dt) for col, dt in FieldManagementsLogs.items()})

    #Irrigation N concentration
    #WaterNConc = float(get_excel_value(InputCells,'D12'))



    #for i in range(1, pSoilHorizen.Number_Of_Horizons+1):
    #    print(f'i:{i} Horizon_Thickness:{pSoilHorizen.Horizon_Thickness[i]} Clay:{pSoilHorizen.Clay[i]}') #'Thickness is rounded to one decimal
    #for i in range(1, pSoilLayer.Number_Model_Layers+1):
    #    print(f'i:{i} FC_Water_Content:{pSoilLayer.FC_Water_Content[i]} PWP_Water_Content:{pSoilLayer.PWP_Water_Content[i]}') #'Thickness is rounded to one decimal
        
    Number_Of_Days_To_Simulate = 0
    Year_Number = 0
    DAE = 0
    DOY_At_DAE = dict() #(366) As Integer
    Crop_Active = False

    Run_First_Doy = int(data_entry["first_doy"])
    Crop_Active = False

    Already_Done_Crop_Sum_Output = {1 : False, 2 : False}                          #04282025LML control crop sum ouputs

    #crop_states = dict()

    pCropState = CropState()
    InitCropState(pCropState)

    pETState = ETState()
    InitETState(pETState)


    pBalance = Balances()

    #Number_Of_Crops = int(get_excel_value(InputCells,'A31'))
    if Number_Of_Crops == 2: DOY_Planting_Second_Crop = CropGrowths[2].Planting_DOY
    if Number_Of_Crops == 1: 
        Run_Last_Doy = int(CropGrowths[1].Harvest_DOY)
    else: 
        Run_Last_Doy = int(CropGrowths[2].Harvest_DOY)

    #Set weather data
    sim_st_year = 2023
    sim_start_doy = int(Run_First_Doy)

    sim_end_doy = Run_Last_Doy
    if sim_start_doy > sim_end_doy:
        sim_end_year = sim_st_year + 1
    else:
        sim_end_year = sim_start_doy

    #Weather data
    pCS_Weather = CS_Weather()
    if weather_from_AgWeatherNet == False:
        ReadWeather(data_entry,pCS_Weather)
    else:
        bdaily = True
        good_data = GetAgWeatherNetDailyWeather(agWeatherStationID,AnemomH,sim_st_year,sim_start_doy,sim_end_year,sim_end_doy,pCS_Weather)
        if good_data == False:
            print('Error: AgWeatherNet data fetch error!\n')
            sys.exit()
        
    pSoilState = SoilState()
    pSoilFlux = SoilFlux()
    InitSoilState(pSoilState)
    InitSoilFlux(pSoilFlux)
    #ReadSoilInitial(Run_First_DOY,SoilInitCells,pSoilState,pSoilModelLayer)
    ReadSoilInitial(Run_First_Doy, Run_Last_Doy, data_entry, pSoilState,
                    pSoilModelLayer, pSoilHorizen, pSoilFlux)
    #print(f"DEBUG: Number_Model_Layers = {pSoilModelLayer.Number_Model_Layers}")

    #05222025LML moved here
    pSoilState.Auto_Irrigation = False
    for i in range(Run_First_Doy, Run_Last_Doy + 1):
        pSoilFlux.Net_Irrigation_Depth[i] = 0.


    #First_Crop_Name = pCropGrowth.Crop_Name
    #Run_Last_DOY = CropGrowths[First_Crop_Name].Harvest_DOY

    #crop_states[First_Crop_Name] = CropState()

    #first_crop_growth = CropGrowths[First_Crop_Name]
    #first_crop_state = CropState()

    #'Begin time loop

    #pCropParameter = crop_parameters[First_Crop_Name]
    #pCropState = crop_states[First_Crop_Name]
    #pCropGrowth = CropGrowths[First_Crop_Name]



    #InitETState(pETState)
    #ReadSoilInitial(Run_First_DOY,SoilInitCells,pSoilState,pSoilModelLayer)
    #InitCropState(pCropState)
    if Run_First_Doy > Run_Last_Doy: 
        Number_Of_Days_To_Simulate = (365 - Run_First_Doy) + Run_Last_Doy 
    else:
        Number_Of_Days_To_Simulate = Run_Last_Doy - Run_First_Doy
    Days_Elapsed = 0
    DOY = Run_First_Doy
    Year_Number = 1
    Crop_Number = 0
    DAE = 0
    #'Begin time loop

    print("number of days to simulate", Number_Of_Days_To_Simulate)
    Number_Of_Layers = pSoilModelLayer.Number_Model_Layers
    # Begin time loop
    while Days_Elapsed < Number_Of_Days_To_Simulate + 1:
        Today_Crop_N_Demand = 0.0
        Today_N_Uptake = 0.0
        Available_N = 0.0
        #Crop_Number = ReadInputs.CropOrder(1)
        InitialSoilProfile(DOY,pBalance,pSoilState,pSoilModelLayer)
        Begin_Crop_Senescence = False    #'Mingliang 6/21/2025
        Recommended_N_Fertilization = False
        N_Fert_Recommended_Amount = 0.
        #'Set up Crop Number 1
        if DOY == CropGrowths[1].Emergence_DOY:
            Crop_Active = True
            Crop_Number = 1
            DAE = 1
            InitializeCrop(DOY,pCropState,pSoilFlux,CropParameters[1],pETState)

            #'Convert days of the year to days after emergence
            if CropGrowths[1].Emergence_DOY > CropGrowths[1].Maturity_DOY:
                DAE_At_Maturity = (365 - CropGrowths[1].Emergence_DOY) + CropGrowths[1].Maturity_DOY
            else:
                DAE_At_Maturity = CropGrowths[1].Maturity_DOY - CropGrowths[1].Emergence_DOY
            #'Set state variables for the potential crop for the entire season. The potential crop grows without water and N stress
            Day_Of_The_Year = CropGrowths[1].Emergence_DOY
            for Days_After_Emergence in range(0, DAE_At_Maturity + 1):

                PotentialCanopyCover(Crop_Number, Days_After_Emergence,
                                    Day_Of_The_Year, CropParameters[1],
                                    pCropState, CropGrowths[1]) #Calculate potential green canopy cover for the entire season
                PotET(Day_Of_The_Year, True, Crop_Active, pCropState, CropParameters[1], pCS_Weather, pETState) #Calculations are for the potential crop and the crop is active

                Biomass(Day_Of_The_Year, True, pCropState, CropParameters[1], pCS_Weather, pETState) #Calculate potential biomass for the entire season
                Begin_Crop_Senescence = ReferencePlantNConcentration(Day_Of_The_Year, pCropState, CropParameters[1], CropGrowths[1], Begin_Crop_Senescence)
                Day_Of_The_Year += 1
                if Day_Of_The_Year > 365: Day_Of_The_Year = 1

            tpre_doy = Day_Of_The_Year - 1
            if tpre_doy == 0: tpre_doy = 365
            Potential_Biomass_At_Maturity = pCropState.Cumulative_Potential_Crop_Biomass[tpre_doy]
                # right after you finish loading your JSON into CropParamaters[1]:
                #print("→ crop parameters via JSON:")
                #for k,v in vars(CropParameters[1]).items():
                #    print(f"   {k}: {v}")
            
        Begin_Crop_Senescence = False
        if 2 in CropGrowths and DOY == CropGrowths[2].Emergence_DOY:
            #'Set up Crop Number 2
            if DOY == CropGrowths[2].Emergence_DOY:
                Crop_Active = True
                Crop_Number = 2
                DAE = 1
                InitializeCrop(DOY,pCropState,pSoilFlux,CropParameters[2],pETState)

                #'Convert days of the year to days after emergence
                if CropGrowths[2].Emergence_DOY > CropGrowths[2].Maturity_DOY:
                    DAE_At_Maturity = (365 - CropGrowths[2].Emergence_DOY) + CropGrowths[2].Maturity_DOY
                else:
                    DAE_At_Maturity = CropGrowths[2].Maturity_DOY - CropGrowths[2].Emergence_DOY

                #'Set state variables for the potential crop for the entire season. The potential crop grows without water and N stress
                Day_Of_The_Year = CropGrowths[2].Emergence_DOY
                for Days_After_Emergence in range(0, DAE_At_Maturity + 1):
                    PotentialCanopyCover(Crop_Number, Days_After_Emergence, 
                                        Day_Of_The_Year, CropParameters[2],
                                        pCropState, CropGrowths[2]) #Calculate potential green canopy cover for the entire season
                    PotET(Day_Of_The_Year, True, Crop_Active, pCropState, 
                        CropParameters[2], pCS_Weather, pETState) #Calculations are for the potential crop and the crop is active
                    Biomass(Day_Of_The_Year, True, pCropState, CropParameters[2],
                            pCS_Weather, pETState) #Calculate potential biomass for the entire season
                    Begin_Crop_Senescence = ReferencePlantNConcentration(Day_Of_The_Year, pCropState, 
                                         CropParameters[2], CropGrowths[2], Begin_Crop_Senescence)
                    Day_Of_The_Year += 1
                    if Day_Of_The_Year > 365: Day_Of_The_Year = 1

                tpre_doy = Day_Of_The_Year - 1
                if tpre_doy == 0: tpre_doy = 365
                Potential_Biomass_At_Maturity = pCropState.Cumulative_Potential_Crop_Biomass[tpre_doy]
        #print(f'DOY:{DOY} DAE:{DAE} Crop_Number:{Crop_Number}')


        if Crop_Number == 1 and (DOY == CropGrowths[1].Maturity_DOY or DOY == CropGrowths[1].Harvest_DOY):
            Crop_Active = False
            #Crop_Number = 0
            #DAE = 0
            pSoilState.Auto_Irrigation = False
            #Auto_Irrigation = False

        if Number_Of_Crops >= 2 and Crop_Number == 2 and (DOY == CropGrowths[2].Maturity_DOY or DOY == CropGrowths[2].Harvest_DOY):
            Crop_Active = False
            #Crop_Number = 0
            #DAE = 0
            pSoilState.Auto_Irrigation = False
            #Auto_Irrigation = False


        if Crop_Active: 
            CanopyCover(DOY, DAE, Crop_Number, pCropState, 
                        CropParameters[Crop_Number], CropGrowths[Crop_Number],
                        pETState)
            GrowRoot(DOY, pCropState, CropParameters[Crop_Number])
            GrowHeight(DOY, pCropState, CropParameters[Crop_Number])

            PotET(DOY, False, Crop_Active, pCropState, CropParameters[Crop_Number],
                pCS_Weather, pETState)
            
            ActualTranspiration(DOY, CropParameters[Crop_Number], pSoilModelLayer,
                                pCropState, pETState, pSoilState)
            ActEvaporation(DOY,pSoilModelLayer,pSoilState,pETState, Crop_Active)
            Biomass(DOY, False, pCropState, CropParameters[Crop_Number],
                    pCS_Weather, pETState)
                    
            Today_Crop_N_Demand,Available_N, Today_N_Uptake = \
                NitrogenUptake(DOY, pCropState, CropParameters[Crop_Number],
                            CropGrowths[Crop_Number], pETState, pSoilModelLayer, 
                            pSoilState)
            
            Recommended_N_Fertilization, N_Fert_Recommended_Amount = \
                FertilizerRecommendation(DOY, pCropState, CropParameters[Crop_Number], 
                                    CropGrowths[Crop_Number], pETState, 
                                    pSoilModelLayer, pSoilState, 
                                    Seasonal_Scheduled_Fertilization, pCS_Fertilization, 
                                    Potential_Biomass_At_Maturity, Auto_Fertilization)
            #'synchronize days after emergence (DAE) and day of the year (DOY)
            DOY_At_DAE[DAE] = DOY
            #DAE += 1
        else:
            PotET(DOY, False, False, pCropState, None, pCS_Weather, pETState) #Crop is not active and only potential and actual evaporation is calculated
            ActEvaporation(DOY,pSoilModelLayer,pSoilState,pETState, False)
            
        SoilTemperature(DOY,pCS_Weather.Tmax[DOY],pCS_Weather.Tmin[DOY],
                        pSoilModelLayer,pSoilState)
        Mineralization(DOY, Crop_Number, pSoilModelLayer, pSoilState, pSoilFlux, Crop_Active)
        Nitrification(DOY,pSoilModelLayer,pSoilState,pSoilFlux)

        #02072025LML estimate the irrigation recommendations 
        Irrigation_Recommendation = 0.0
        #Always calculate PAW Depletion for that day
        PAW_Depletion_Today,Water_Depth_To_Refill_fc = calc_PAW_depletion(DOY, 
            Number_Of_Layers, pSoilState, pETState, pSoilModelLayer)
        
        """
        #05202025LML identify irrigation method for estimating recommendation
        if DOY in autoirrigation_info:
            if autoirrigation_info[DOY][0] == 1:
                Irrigation_Recommendation_Option = 'PAW Depletion'
                Irrigation_Recommendation_Parameter = autoirrigation_info[DOY][1]
            elif autoirrigation_info[DOY][0] == 2:
                Irrigation_Recommendation_Option = 'CWSI'
                Irrigation_Recommendation_Parameter = autoirrigation_info[DOY][2]
            else:
                Irrigation_Recommendation_Option = None
                Irrigation_Recommendation_Parameter = None
        #print(f'{Irrigation_Recommendation_Option} {Irrigation_Recommendation_Parameter}')

        if Crop_Active and Irrigation_Recommendation_Option == 'PAW Depletion':
            Irrigation_Recommendation = \
                SetAutoIrrigation(DOY, True, False, Number_Of_Layers, 
                                    Irrigation_Recommendation_Parameter, -9999, False, 
                                    -9999, pSoilState, pETState, pSoilModelLayer, Water_Depth_To_Refill_fc)
        elif Crop_Active and Irrigation_Recommendation_Option == 'CWSI':
            Irrigation_Recommendation = \
                SetAutoIrrigation(DOY, False, True, Number_Of_Layers, 
                                    -9999, Irrigation_Recommendation_Parameter, False, 
                                    -9999, pSoilState, pETState, pSoilModelLayer, Water_Depth_To_Refill_fc)  
        elif Irrigation_Recommendation_Option == 'Refill':
            Irrigation_Recommendation = \
                SetAutoIrrigation(DOY, False, False, Number_Of_Layers, 
                                    -9999, -9999, True, 
                                    Irrigation_Recommendation_Parameter, pSoilState, 
                                    pETState, pSoilModelLayer, Water_Depth_To_Refill_fc)
        """
        # before the chain, set a default
        Irrigation_Recommendation = 0.0

        if Auto_Irrigation:  # 08052025LML
            if DOY in autoirrigation_info:
                if autoirrigation_info[DOY][0] == 1:
                    Irrigation_Recommendation_Option = 'PAW Depletion'
                    Irrigation_Recommendation_Parameter = autoirrigation_info[DOY][1]
                elif autoirrigation_info[DOY][0] == 2:
                    Irrigation_Recommendation_Option = 'CWSI'
                    rec = autoirrigation_info[DOY]
                    Irrigation_Recommendation_Parameter = rec[1] if len(rec) > 1 else None
                else:
                    Irrigation_Recommendation_Option = None
                    Irrigation_Recommendation_Parameter = None

            # ---- only tiny guards added below ----
            if Crop_Active and Irrigation_Recommendation_Option == 'PAW Depletion':
                try:
                    _paw = float(Irrigation_Recommendation_Parameter)
                except (TypeError, ValueError):
                    _paw = None
                if _paw is not None:
                    Irrigation_Recommendation = SetAutoIrrigation(
                        DOY, True, False, Number_Of_Layers,
                        _paw, -9999, False, -9999,
                        pSoilState, pETState, pSoilModelLayer, Water_Depth_To_Refill_fc
                    )

            elif Crop_Active and Irrigation_Recommendation_Option == 'CWSI':
                try:
                    _cwsi = float(Irrigation_Recommendation_Parameter)
                except (TypeError, ValueError):
                    _cwsi = None
                if _cwsi is not None:
                    Irrigation_Recommendation = SetAutoIrrigation(
                        DOY, False, True, Number_Of_Layers,
                        -9999, _cwsi, False, -9999,
                        pSoilState, pETState, pSoilModelLayer, Water_Depth_To_Refill_fc
                    )

            elif Irrigation_Recommendation_Option == 'Refill':
                try:
                    _refill = float(Irrigation_Recommendation_Parameter)
                except (TypeError, ValueError):
                    _refill = None
                if _refill is not None:
                    Irrigation_Recommendation = SetAutoIrrigation(
                        DOY, False, False, Number_Of_Layers,
                        -9999, -9999, True, _refill,
                        pSoilState, pETState, pSoilModelLayer, Water_Depth_To_Refill_fc
                    )
        else:
            Irrigation_Recommendation = 0.0


        #print(f'Irrigation_Recommendation:{Irrigation_Recommendation} ')    
        net_irrigation_today,fertilizer_today = \
            WaterAndNTransport(DOY, pSoilModelLayer, pSoilState, net_irrigations, 
                            Water_N_Conc, 
                            pCS_Weather.Precipitation[DOY], 
                            #pCS_Fertilization.Nitrate_Fertilization_Rate[DOY], 
                            #pCS_Fertilization.Ammonium_Fertilization_Rate[DOY], 
                            #pCS_Fertilization.Nitrate_Fraction[DOY], 
                            #pCS_Fertilization.Nitrate_Fertilization_Rate[DOY], 
                            #pCS_Fertilization.Ammonium_Fertilization_Rate[DOY], 
                            pCS_Fertilization,
                            -9999., 
                            AutoIrrigations,
                            pSoilFlux, 
                            Crop_Active,
                            pETState,
                            Water_Depth_To_Refill_fc,
                            Auto_Irrigation,
                            Recommended_N_Fertilization, 
                            N_Fert_Recommended_Amount)
        
        #output managements
        if net_irrigation_today >= 1e-12 or fertilizer_today >=1e-12:
            FieldManagementsLogsOutput.loc[len(FieldManagementsLogsOutput)] = {
                "DOY": DOY,
                "Crop": Crop_Number,
                "Irrigation (mm)": net_irrigation_today,
                "Fertilizer (kg/ha)": fertilizer_today * 10000 #  'Convert kg/m2 to kg/ha
                }
            
        pSoilFlux.Net_Irrigation_Depth[DOY] = net_irrigation_today                 #06042025
        balance_item,account,balance = BalancesAll(DOY,pBalance,pSoilState,pSoilFlux,pSoilModelLayer,pCS_Weather,
                pETState,pCS_Fertilization,pCropState)
        if balance == False:
            print(f'Balance error!\n{balance_item},{account},{balance}')
            #sys.exit(1) 
            
        #'Write Daily and summary Outputs by crop number at harvest time
        
        if Crop_Active and DOY != CropGrowths[Crop_Number].Harvest_DOY:
            #CropOutput
            WriteCropOutput(Crop_Number, DOY, DAE, CropOutputs, pCropState, 
                            pETState, pSoilState, json_data_to_write)
            #SoilOutput
            WriteCropSoilOutput(Crop_Number, DOY, DAE, SoilLayers, SoilOutputs, 
                                pCropState, pSoilFlux, json_data_to_write)
            
                #Budget output
            WriteDailyWaterAndNitrogenBudgetTable(DailyBudgetOutputs, Crop_Number, DOY, 
                                                    DAE, SoilLayers, 
                                                    pCropState, pSoilFlux, pETState, 
                                                    pSoilState, pCS_Weather, net_irrigations,
                                                    Irrigation_Recommendation,
                                                    pCS_Fertilization, Today_Crop_N_Demand, 
                                                    Available_N, N_Fert_Recommended_Amount, DOY_Last_Scheduled_Irrigation)
        elif not Crop_Active and DAE == 0:
            #add budget output before emergence
            #08052025LML It's a tricky to set the Crop_Number before the crop is planted
            #here set the crop that is going to be planted
            if Number_Of_Crops == 1:
                Crop_Num = 1
            else:
                if Emergence_DOY_2 > Emergence_DOY_1: #within one year
                    if DOY < Emergence_DOY_1: Crop_Num = 1
                    else: Crop_Num = 2
                else: #Crop 1 emerged in first year; crop 2 emerged in second year
                    if DOY < Emergence_DOY_1 and DOY > Emergence_DOY_2: Crop_Num = 1
                    else: Crop_Num = 2
            
            tAvailable_N = 0.0
            #08052025LML: for budget output before emergence day
            for Layer in range(2, Number_Of_Layers + 1):
                tAvailable_N += pSoilState.Nitrate_N_Content[DOY][Layer] + pSoilState.Ammonium_N_Content[DOY][Layer]
                
            WriteDailyWaterAndNitrogenBudgetTable(DailyBudgetOutputs, Crop_Num, DOY, 
                                                    0, SoilLayers, 
                                                    None, pSoilFlux, pETState, 
                                                    pSoilState, pCS_Weather, net_irrigations,
                                                    Irrigation_Recommendation,
                                                    pCS_Fertilization, Today_Crop_N_Demand, 
                                                    tAvailable_N, N_Fert_Recommended_Amount, DOY_Last_Scheduled_Irrigation)
            
        #Important Notes:
        #NOTE										
        #If the crop nitrogen concentration (Crop N Conc) is below  the Critical Nitrogen Concentration, 										
        #then the crop will experience nitrogen stress and reduced biomass production.										
        #NOTE										
        #The fertilization recommendations are made until the beginning of senescence, and given uncertainties 										
        #in mineralization, leaching, and other factors,  the Crop N Conc may be below the Crit N Conc later in the growing										
        #season. IN THAT CASE, YOU SHOULD SCHEDULE A FERTILIZATION AT AN APPROPRIATE TIME										
        #OR INCREASE THE SIZE OF THE RECOMMENDED FERTILIZATION IF ANY.										
        #NOTE										
        #Even if no nitrogen stress is present (Ctrop N Conc below Crit N Conc), YOU MAY CONSIDER INCREASING										
        # (REDUCING) FERTILIZATION IF A HIGHER (LOWER) CROP N  CONCENTRATION AT HARVEST IS PREFERRED.
        
        
        #SummaryOutput
        #if DOY == CropGrowths[1].Maturity_DOY or DOY == CropGrowths[1].Harvest_DOY:
        #if Crop_Number == 1 and DOY == CropGrowths[1].Harvest_DOY: output cumulations before harvest day
        if Crop_Number == 1 and (DOY == CropGrowths[1].Maturity_DOY or DOY == CropGrowths[1].Harvest_DOY) and Already_Done_Crop_Sum_Output[1] == False: #max(CropGrowths[1].Maturity_DOY,CropGrowths[1].Harvest_DOY):
            WriteCropSummaryOutput(1, DOY, CropSumOutputs, 
                                pSoilFlux, pSoilState, pSoilModelLayer, 
                                pETState,json_data_to_write)
            Already_Done_Crop_Sum_Output[1] = True
            #print(f'WriteCropSummaryOutput:{DOY} Crop_Number:{Crop_Number} Maturity_DOY:{CropGrowths[1].Maturity_DOY} Harvest_DOY:{CropGrowths[1].Harvest_DOY}')
            #Crop_Number = 0
        if Crop_Number == 2 and (DOY == CropGrowths[2].Maturity_DOY or DOY == CropGrowths[2].Harvest_DOY) and Already_Done_Crop_Sum_Output[2] == False:
            WriteCropSummaryOutput(2, DOY, CropSumOutputs, 
                                pSoilFlux, pSoilState, pSoilModelLayer, 
                                pETState,json_data_to_write)
            Already_Done_Crop_Sum_Output[2] = True
                
            
        if (Crop_Number == 1 and DOY == CropGrowths[1].Harvest_DOY) or \
        (Crop_Number == 2 and DOY == CropGrowths[2].Harvest_DOY):
            Crop_Number = 0
            DAE = 0
            
            
        if Crop_Active: 
            DAE += 1
        DOY += 1
        if DOY > 365:
            DOY = 1
            Year_Number += 1
        Days_Elapsed += 1

    final_day = Run_Last_Doy
    Nitrification(final_day, pSoilModelLayer, pSoilState, pSoilFlux)

    # now dump the totals for the simulation period
    WriteTotalSimPeriodOutput(
        TotalSimPeriodOutput,
        Run_Last_Doy,
        SoilLayers,
        pSoilState,
        pSoilFlux,
        json_data_to_write
    )

    here = os.path.dirname(os.path.abspath(__file__))
    output_path = here

    # you can tweak these suffixes to whatever you like:
    crop_output_excel_csv = "CropOutput.csv"
    soil_output_excel_csv = "SoilOutput.csv"
    budget_output_excel_csv = "BudgetOutput.csv"

    for crop in range(1, Number_Of_Crops + 1):
        CropOutputs[crop]\
            .to_csv(
                os.path.join(output_path,
                             f"FM_{Farm_Name}_FD_{Field_Name}_crop_{crop}_{crop_output_excel_csv}"
                ),
                index=False
            )
        SoilOutputs[crop]\
            .to_csv(
                os.path.join(output_path,
                             f"FM_{Farm_Name}_FD_{Field_Name}_crop_{crop}_{soil_output_excel_csv}"
                ),
                index=False
            )
        # summarize seasonal (transpose + index reset for easier reading)
        CropSumOutputs[crop].T.reset_index()\
            .to_csv(
                os.path.join(output_path,
                             f"FM_{Farm_Name}_FD_{Field_Name}_crop_{crop}_CropSum.csv"
                ),
                index=False, header=True
            )
        DailyBudgetOutputs[crop]\
            .to_csv(
                os.path.join(output_path,
                             f"FM_{Farm_Name}_FD_{Field_Name}_crop_{crop}_{budget_output_excel_csv}"
                ),
                index=False
            )

    # totals for the whole run
    TotalSimPeriodOutput.T.reset_index()\
        .to_csv(
            os.path.join(output_path,
                         f"FM_{Farm_Name}_FD_{Field_Name}_TotalSimPeriodOutput.csv"
            ),
            index=False, header=True
        )
    FieldManagementsLogsOutput\
        .to_csv(
            os.path.join(output_path,
                         f"FM_{Farm_Name}_FD_{Field_Name}_FieldManagementLogs.csv"
            ),
            index=False
        )
    
    return json_data_to_write


if __name__ == "__main__":
    import json, os

    # 1. find the location of your input file
    here = os.path.dirname(os.path.abspath(__file__))
    in_path = os.path.join(here, "input_data.json")

    # 2. load the JSON into a Python list/dict
    with open(in_path, "r") as f:
        input_data = json.load(f)

    # 3. call your simulation
    output = run_simulation(input_data)

    # 4. write the results back out
    out_path = os.path.join(here, "output_data.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"Results written to {out_path}")

    

 
