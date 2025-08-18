#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Sep  6 09:04:57 2024

@author: liuming
"""
class CropParameter:
    Crop_Name = ""
    #Transpiration Parameters
    Midseason_Crop_Coefficient = -9999.0                                       #Midseason (maximum) Crop Coefficient
    Maximum_Crop_Water_Uptake = -9999.0                                        #Maximum Crop Water Uptake with Full Interception of Solar Radiation (mm/day)
    LWP_Onset_Stomatal_Closure = -9999.0                                       #Leaf Water Potential at the Onset of Stomatal Closure (J/kg)
    LWP_Permanent_Wilting = -9999.0                                            #Leaf Water Potential at Permanent Wilting (zero transpiration) (J/kg)
    Seeding_Depth = -9999.0                                                    #Seeding Depth (m)
    Initial_Root_Depth_From_Germinated_Seed = -9999.0                          #Initial Root Depth From Germinated Seed(m)
    Maximum_Root_Depth = -9999.0                                               #Maximum Root Depth (m)
    Maximum_Crop_Height = -9999.0                                              #Maximum Crop Height (m)
    #Canopy Growth Parameters
    Initial_Green_Canopy_Cover = -9999.0                                       #Initial Green Canopy Cover (Fraction 0 - 1)
    Maximum_Green_Canopy_Cover = -9999.0                                       #Maximum Green Canopy Cover (Fraction 0 - 1)
    Maturity_Green_Canopy_Cover = -9999.0                                      #Maturity Green Canopy Cover (Fraction 0 - 1)
    #Biomass Growth Parameters
    Transpiration_Use_Efficiency_1_kPa = -9999.0                               #Transpiration Use Efficiency at 1 kPa(kg/kg)
    Slope_Daytime_VPD_Function = -9999.0                                       #Slope of Power Function of Daytime VPD
    #Nitrogen Uptake Parameters
    Maximum_N_Concentration_Emergence = -9999.0                                #Maximum N concentration at emergence (kg/kg)
    Critical_N_Concentration_Emergence = -9999.0                               #Critical N concentration at emergence  (kg/kg)
    Minimum_N_Concentration_Emergence = -9999.0                                #Minimum N concentration at emergence (kg/kg)
    Biomass_Start_Dilution_Maximum_N_Concentration = -9999.0                   #Biomass to start dilution of maximum N concentration (Mg/ha)
    Biomass_Start_Dilution_Critical_N_Concentration = -9999.0                  #Biomass to start dilution of critical N concentration (Mg/ha)
    Biomass_Start_Dilution_Minimum_N_Concentration = -9999.0                   #Biomass to start dilution of minimum N concentration (Mg/ha)
    N_Dilution_Slope = -9999.0#N Dilution slope
    Maximum_N_Concentration_Maturity = -9999.0                                 #Maximum N concentration at maturity (kg/kg)
    Critical_N_Concentration_Maturity = -9999.0                                #Critical N concentration at maturity (kg/kg)
    Minimum_N_Concentration_Maturity = -9999.0                                 #Minimum N concentration at maturity (kg/kg)
    Maximum_Daily_N_Uptake_Rate = -9999.0                                      #Maximum nitrogen uptake daily rate (kg/day) 'Mingliang 7/19/2025
    #Potential_N_Uptake = -9999.0                                               #Potential N Uptake (kg/ha/day)
    
    
class CropGrowth:
    Crop_Name = ""
    Expected_Yield = 0
    Planting_DOY = 0
    Emergence_DOY = 0
    Full_Canopy_DOY = 0
    Beging_Senescence_DOY = 0
    Maturity_DOY = 0
    Harvest_DOY = 0
    Maturity_DAE = 0
    Harvest_DAE = 0
    
class CropState:
    Potential_Green_Canopy_Cover = dict()
    Green_Canopy_Cover = dict()
    Total_Canopy_Cover = dict()
    Potential_Total_Canopy_Cover = dict()
    Total_CC_Transition = dict()
    Root_Depth = dict()
    Crop_Height = dict()
    Root_Depth_At_Emergence = dict()
    Today_Biomass_Gain = dict()
    Cumulative_Crop_Biomass = dict()
    Cumulative_Potential_Crop_Biomass = dict() #(366)
    Potential_Crop_Biomass = dict()
    Crop_N_Mass = dict()
    N_Uptake = dict()
    Seasonal_N_Uptake = dict()
    Nitrate_N_Uptake = dict() #(366) As Double
    Ammonium_N_Uptake = dict() #(366) As Double
    Cumulative_N_Uptake = dict()
    Crop_N_Concentration = dict()
    Maximum_N_Concentration = dict()
    Maximum_N_Concentration_At_Transition = 0
    Daily_Change_Maximum_N_Concentration = 0
    Critical_N_Concentration = dict()
    Critical_N_Concentration_At_Transition = 0
    Daily_Change_Critical_N_Concentration = 0
    Minimum_N_Concentration = dict()
    Minimum_N_Concentration_At_Transition = 0
    Daily_Change_Minimum_N_Concentration = 0
    DOY_Of_Transition = 0
    Nitrogen_Stress_Index = dict()
    Maximum_Green_Canopy_Cover_Reached = False
    Seasonal_Biomass = 0.
    Seasonal_N_Uptake = 0.
    DAE_Begin_Senescence = 0
    
    Recommended_N_Fertilization = False #'Mingliang 7/12/2025
    Nitrate_N_Recommended = 0. 
    N_Fert_Recommended_DOY = dict() #(366) As Double    'XXXX OJO Mingliang 7/23/2025 This is only for output
    N_Fert_Recommended_Amount = dict() #(366) As Double 'XXXX OJO Mingliang 7/23/2025 This is only for output
    
    
    