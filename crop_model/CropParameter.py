#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Sep  6 09:04:57 2024

@author: liuming
"""
class CropParameter:
    def __init__(self):
        self.Crop_Name = ""
        #Transpiration Parameters
        self.Midseason_Crop_Coefficient = -9999.0                                       #Midseason (maximum) Crop Coefficient
        self.Maximum_Crop_Water_Uptake = -9999.0                                        #Maximum Crop Water Uptake with Full Interception of Solar Radiation (mm/day)
        self.LWP_Onset_Stomatal_Closure = -9999.0                                       #Leaf Water Potential at the Onset of Stomatal Closure (J/kg)
        self.LWP_Permanent_Wilting = -9999.0                                            #Leaf Water Potential at Permanent Wilting (zero transpiration) (J/kg)
        self.Seeding_Depth = -9999.0                                                    #Seeding Depth (m)
        self.Initial_Root_Depth_From_Germinated_Seed = -9999.0                          #Initial Root Depth From Germinated Seed(m)
        self.Maximum_Root_Depth = -9999.0                                               #Maximum Root Depth (m)
        self.Maximum_Crop_Height = -9999.0                                              #Maximum Crop Height (m)
        #Canopy Growth Parameters
        self.Initial_Green_Canopy_Cover = -9999.0                                       #Initial Green Canopy Cover (Fraction 0 - 1)
        self.Maximum_Green_Canopy_Cover = -9999.0                                       #Maximum Green Canopy Cover (Fraction 0 - 1)
        self.Maturity_Green_Canopy_Cover = -9999.0                                      #Maturity Green Canopy Cover (Fraction 0 - 1)
        #Biomass Growth Parameters
        self.Transpiration_Use_Efficiency_1_kPa = -9999.0                               #Transpiration Use Efficiency at 1 kPa(kg/kg)
        self.Slope_Daytime_VPD_Function = -9999.0                                       #Slope of Power Function of Daytime VPD
        #Nitrogen Uptake Parameters
        self.Maximum_N_Concentration_Emergence = -9999.0                                #Maximum N concentration at emergence (kg/kg)
        self.Critical_N_Concentration_Emergence = -9999.0                               #Critical N concentration at emergence  (kg/kg)
        self.Minimum_N_Concentration_Emergence = -9999.0                                #Minimum N concentration at emergence (kg/kg)
        self.Biomass_Start_Dilution_Maximum_N_Concentration = -9999.0                   #Biomass to start dilution of maximum N concentration (Mg/ha)
        self.Biomass_Start_Dilution_Critical_N_Concentration = -9999.0                  #Biomass to start dilution of critical N concentration (Mg/ha)
        self.Biomass_Start_Dilution_Minimum_N_Concentration = -9999.0                   #Biomass to start dilution of minimum N concentration (Mg/ha)
        self.N_Dilution_Slope = -9999.0#N Dilution slope
        self.Maximum_N_Concentration_Maturity = -9999.0                                 #Maximum N concentration at maturity (kg/kg)
        self.Critical_N_Concentration_Maturity = -9999.0                                #Critical N concentration at maturity (kg/kg)
        self.Minimum_N_Concentration_Maturity = -9999.0                                 #Minimum N concentration at maturity (kg/kg)
        self.Maximum_Daily_N_Uptake_Rate = -9999.0                                      #Maximum nitrogen uptake daily rate (kg/day) 'Mingliang 7/19/2025
        #Potential_N_Uptake = -9999.0                                               #Potential N Uptake (kg/ha/day)
    
class CropAutoFertilizationParameter:
    def __init__(self):
        self.Auto_Fert_Split_DOYs = {}  # instance variable
        self.Auto_Fert_Split_Percents = {}  # instance variable

    
class CropGrowth:
    def __init__(self):
        self.Crop_Name = ""
        self.Expected_Yield = 0
        self.Planting_DOY = 0
        self.Emergence_DOY = 0
        self.Full_Canopy_DOY = 0
        self.Beging_Senescence_DOY = 0
        self.Maturity_DOY = 0
        self.Harvest_DOY = 0
        self.Maturity_DAE = 0
        self.Harvest_DAE = 0
    
class CropState:
    def __init__(self):
        self.Potential_Green_Canopy_Cover = dict()
        self.Green_Canopy_Cover = dict()
        self.Total_Canopy_Cover = dict()
        self.Potential_Total_Canopy_Cover = dict()
        self.Total_CC_Transition = dict()
        self.Root_Depth = dict()
        self.Crop_Height = dict()
        self.Root_Depth_At_Emergence = dict()
        self.Today_Biomass_Gain = dict()
        self.Cumulative_Crop_Biomass = dict()
        self.Cumulative_Potential_Crop_Biomass = dict() #(366)
        self.Potential_Crop_Biomass = dict()
        self.Crop_N_Mass = dict()
        self.N_Uptake = dict()
        self.Seasonal_N_Uptake = dict()
        self.Nitrate_N_Uptake = dict() #(366) As Double
        self.Ammonium_N_Uptake = dict() #(366) As Double
        self.Cumulative_N_Uptake = dict()
        self.Crop_N_Concentration = dict()
        self.Maximum_N_Concentration = dict()
        self.Maximum_N_Concentration_At_Transition = 0
        self.Daily_Change_Maximum_N_Concentration = 0
        self.Critical_N_Concentration = dict()
        self.Critical_N_Concentration_At_Transition = 0
        self.Daily_Change_Critical_N_Concentration = 0
        self.Minimum_N_Concentration = dict()
        self.Minimum_N_Concentration_At_Transition = 0
        self.Daily_Change_Minimum_N_Concentration = 0
        self.DOY_Of_Transition = 0
        self.Nitrogen_Stress_Index = dict()
        self.Maximum_Green_Canopy_Cover_Reached = False
        self.Seasonal_Biomass = 0.
        self.Seasonal_N_Uptake = 0.
        self.DAE_Begin_Senescence = 0
        
        self.Recommended_N_Fertilization = False #'Mingliang 7/12/2025
        self.Nitrate_N_Recommended = 0. 
        self.N_Fert_Recommended_DOY = dict() #(366) As Double    'XXXX OJO Mingliang 7/23/2025 This is only for output
        self.N_Fert_Recommended_Amount = dict() #(366) As Double 'XXXX OJO Mingliang 7/23/2025 This is only for output