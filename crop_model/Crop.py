#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Sep  6 15:38:03 2024

@author: liuming
"""
import math
#from canopycover import *

def InitializeCrop_OBSOLETE(DOY,pCropState, pCropParameter, pETState):
    pCropState.Green_Canopy_Cover[DOY] = pCropParameter.Initial_Green_Canopy_Cover
    pCropState.Total_Canopy_Cover[DOY] = pCropParameter.Initial_Green_Canopy_Cover
    Depth_Of_Seed = pCropParameter.Seeding_Depth
    Root_Depth_At_Emergence = Depth_Of_Seed + pCropParameter.Initial_Root_Depth_From_Germinated_Seed
    pCropState.Root_Depth[DOY] = Root_Depth_At_Emergence
    pCropState.Cumulative_Crop_Biomass[DOY-1] = 0 #'0.002    'OJO IMPROVE ON THIS
    pCropState.Seasonal_Biomass = pCropState.Cumulative_Crop_Biomass[DOY-1]
    pETState.Water_Stress_Index[DOY] = 0
    pETState.Cumulative_Potential_Crop_Biomass[DOY - 1] = pCropState.Cumulative_Crop_Biomass[DOY-1]
    pETState.Crop_N_Mass[DOY-1] = pCropState.Cumulative_Crop_Biomass[DOY-1] * pCropParameter.Maximum_N_Concentration_Emergence
    pETState.Cumulative_N_Uptake[DOY] = 0
    #Soil.CumulativeIrrigation = 0
    #Soil.CumulativeFertilization = 0
    #Soil.CumulativeDeepDrainage = 0
    #Soil.CumulativeNLeaching = 0
    #ET.TotalTranspiration = 0
    pETState.Seasonal_N_Uptake = 0
    

def Biomass(DOY, Potential_Crop, pCropState, pCropParameter, pCS_Weather, pETState):
    Transpiration_Use_Efficiency_At_1kpa = pCropParameter.Transpiration_Use_Efficiency_1_kPa
    TUE_Slope = pCropParameter.Slope_Daytime_VPD_Function
    
    Maximum_Temperature = pCS_Weather.Tmax[DOY]
    Minimum_Relative_Humidity = pCS_Weather.RHmin[DOY]
    Daytime_VPD = max(0.5, 0.66 * 0.611 * math.exp(17.502 * Maximum_Temperature / (Maximum_Temperature + 240.97)) * (1 - Minimum_Relative_Humidity / 100.))
    Daily_Transpiration_Use_Efficiency = Transpiration_Use_Efficiency_At_1kpa / math.pow(Daytime_VPD, TUE_Slope)

    if Potential_Crop: 
        Potential_Crop_Transpiration = pETState.Potential_Crop_Transpiration[DOY]
        Potential_Crop_Biomass_Gain = Potential_Crop_Transpiration * Daily_Transpiration_Use_Efficiency #'kg biomass per m2 ground area
        if DOY == 1:
            pCropState.Cumulative_Potential_Crop_Biomass[DOY] = pCropState.Cumulative_Potential_Crop_Biomass[365] + Potential_Crop_Biomass_Gain
        else:
            pCropState.Cumulative_Potential_Crop_Biomass[DOY] = pCropState.Cumulative_Potential_Crop_Biomass[DOY - 1] + Potential_Crop_Biomass_Gain
    else:
        Actual_Crop_Transpiration = pETState.Actual_Transpiration[DOY]
        Pot_Transp = pETState.Potential_Crop_Transpiration[DOY]
        WSF = Actual_Crop_Transpiration / Pot_Transp #'Water Stress Factor
        if DOY == 1:
            NSF = 1 - pCropState.Nitrogen_Stress_Index[365] #'Nitrogen Stress Factor
        else:
            NSF = 1 - pCropState.Nitrogen_Stress_Index[DOY - 1]
        Actual_Crop_Biomass_Gain = Pot_Transp * Daily_Transpiration_Use_Efficiency * min(NSF, WSF) #'kg biomass per m2 ground area
        if DOY == 1:
            pCropState.Cumulative_Crop_Biomass[DOY] = pCropState.Cumulative_Crop_Biomass[365] + Actual_Crop_Biomass_Gain
        else:
            pCropState.Cumulative_Crop_Biomass[DOY] = pCropState.Cumulative_Crop_Biomass[DOY - 1] + Actual_Crop_Biomass_Gain
        pCropState.Seasonal_Biomass += Actual_Crop_Biomass_Gain

def ReferencePlantNConcentration(DOY, pCropState, pCropParameter, pCropGrowth, End_Nitrogen_Dilution):
    #'Read input parameters
    N_Critical_Concentration_At_Emergence = pCropParameter.Critical_N_Concentration_Emergence
    N_Maximum_Concentration_At_Emergence = pCropParameter.Maximum_N_Concentration_Emergence
    N_Minimum_Concentration_At_Emergence = pCropParameter.Minimum_N_Concentration_Emergence
    Biomass_To_Start_Dilution_Maximum_N_Concentration = pCropParameter.Biomass_Start_Dilution_Maximum_N_Concentration
    Biomass_To_Start_Dilution_Critical_N_Concentration = pCropParameter.Biomass_Start_Dilution_Critical_N_Concentration
    Biomass_To_Start_Dilution_Minimum_N_Concentration = pCropParameter.Biomass_Start_Dilution_Minimum_N_Concentration
    Slope = pCropParameter.N_Dilution_Slope
    Maximum_N_Concentration_At_Maturity = pCropParameter.Maximum_N_Concentration_Maturity
    Critical_N_Concentration_At_Maturity = pCropParameter.Critical_N_Concentration_Maturity
    Minimum_N_Concentration_At_Maturity = pCropParameter.Minimum_N_Concentration_Maturity
    #DOY_Begin_Decline = pCropGrowth.Beging_Senescence_DOY #'Mingliang 8/13/2025
    DOY_End_Nitrogen_Dilution = pCropGrowth.Full_Canopy_DOY + 10 #'Mingliang 8/13/2025
    Days_Elapsed = 0
    #'Start processing
    Amax = N_Maximum_Concentration_At_Emergence / math.pow(Biomass_To_Start_Dilution_Maximum_N_Concentration, Slope)
    Acrit = N_Critical_Concentration_At_Emergence / math.pow(Biomass_To_Start_Dilution_Critical_N_Concentration, Slope)
    Amin = N_Minimum_Concentration_At_Emergence / math.pow(Biomass_To_Start_Dilution_Minimum_N_Concentration, Slope)
    DOY_Season_End = pCropGrowth.Maturity_DOY
    Cumulative_Top_Biomass = pCropState.Cumulative_Potential_Crop_Biomass[DOY] * 10.  #'Convert kg/m2 to Mg/ha
    #Begin_Crop_Senescence = False
    #global Begin_Crop_Senescence
    if not End_Nitrogen_Dilution:   #DOY <= DOY_Begin_Decline and Cumulative_Top_Biomass > 0:
        tBiomass = math.pow(Cumulative_Top_Biomass, Slope)
        pCropState.Maximum_N_Concentration[DOY] = min(N_Maximum_Concentration_At_Emergence, Amax * tBiomass)
        pCropState.Critical_N_Concentration[DOY] = min(N_Critical_Concentration_At_Emergence, Acrit * tBiomass)
        pCropState.Minimum_N_Concentration[DOY] = min(N_Minimum_Concentration_At_Emergence, Amin * tBiomass)
        if DOY == DOY_End_Nitrogen_Dilution: #'Mingliang 8/13/2025
            End_Nitrogen_Dilution = True  #'Mingliang 8/13/2025
            pCropState.Maximum_Green_Canopy_Cover_Reached = True
            pCropState.DOY_Of_Transition = DOY
            
            pCropState.Maximum_N_Concentration_At_Transition = pCropState.Maximum_N_Concentration[DOY]
            pCropState.Critical_N_Concentration_At_Transition = pCropState.Critical_N_Concentration[DOY]
            pCropState.Minimum_N_Concentration_At_Transition = pCropState.Minimum_N_Concentration[DOY]
            
            Days_Elapsed = 0
            if DOY > DOY_Season_End:
                Days_Elapsed = (365 - DOY) + DOY_Season_End 
            else: 
                Days_Elapsed = DOY_Season_End - DOY
            
            pCropState.Daily_Change_Maximum_N_Concentration = (pCropState.Maximum_N_Concentration_At_Transition - Maximum_N_Concentration_At_Maturity) / Days_Elapsed
            pCropState.Daily_Change_Critical_N_Concentration = (pCropState.Critical_N_Concentration_At_Transition - Critical_N_Concentration_At_Maturity) / Days_Elapsed
            pCropState.Daily_Change_Minimum_N_Concentration = (pCropState.Minimum_N_Concentration_At_Transition - Minimum_N_Concentration_At_Maturity) / Days_Elapsed
    else:
        pCropState.Maximum_N_Concentration[DOY] = pCropState.Maximum_N_Concentration_At_Transition - pCropState.Daily_Change_Maximum_N_Concentration * (DOY - pCropState.DOY_Of_Transition)
        pCropState.Critical_N_Concentration[DOY] = pCropState.Critical_N_Concentration_At_Transition - pCropState.Daily_Change_Critical_N_Concentration * (DOY - pCropState.DOY_Of_Transition)
        pCropState.Minimum_N_Concentration[DOY] = pCropState.Minimum_N_Concentration_At_Transition - pCropState.Daily_Change_Minimum_N_Concentration * (DOY - pCropState.DOY_Of_Transition)
        
    return End_Nitrogen_Dilution

def CanopyCover_OBSOLETE(DOY, pCropState, pCropParameter, pCropGrowth, pETState):
    DOY_Begin_Decline = pCropGrowth.Beging_Senescence_DOY
    WSF = 1 - pETState.Water_Stress_Index[DOY - 1]
    NSF = 1 - pCropState.Nitrogen_Stress_Index[DOY - 1]
    Canopy_Expansion = (pCropState.Potential_Green_Canopy_Cover[DOY] - pCropState.Potential_Green_Canopy_Cover[DOY - 1]) * min(WSF, NSF)
    pCropState.Green_Canopy_Cover[DOY] = pCropState.Green_Canopy_Cover[DOY - 1] + Canopy_Expansion
    pCropState.Total_Canopy_Cover[DOY] = pCropState.Green_Canopy_Cover[DOY]
    #GCC_Transition = pCropState.Green_Canopy_Cover[DOY]
    #'Senescence
    if DOY >= DOY_Begin_Decline: 
        Canopy_Senescence = (pCropState.Potential_Green_Canopy_Cover[DOY - 1] - pCropState.Potential_Green_Canopy_Cover[DOY])
        pCropState.Green_Canopy_Cover[DOY] = max(0, pCropState.Green_Canopy_Cover[DOY - 1] - Canopy_Senescence)
        pCropState.Total_Canopy_Cover[DOY] = pCropState.Total_Canopy_Cover[DOY - 1]
        
def GrowRoot(DOY, pCropState, pCropParameter): #'OJO OJO Calculate root fraction here
    RD_Max = pCropParameter.Maximum_Root_Depth
    GCC_Max = pCropParameter.Maximum_Green_Canopy_Cover
    GCC_Ini = pCropParameter.Initial_Green_Canopy_Cover
    Root_Depth_At_Emergence = pCropParameter.Seeding_Depth + pCropParameter.Initial_Root_Depth_From_Germinated_Seed
    Total_Canopy_Cover = pCropState.Total_Canopy_Cover[DOY]
    if Total_Canopy_Cover < GCC_Ini:
        Total_Cover = GCC_Ini
    else: 
        Total_Cover = Total_Canopy_Cover
    Rd = Root_Depth_At_Emergence + (RD_Max - Root_Depth_At_Emergence) * (Total_Cover - GCC_Ini) / (GCC_Max - GCC_Ini)
    if Rd > RD_Max: Rd = RD_Max
    pCropState.Root_Depth[DOY] = Rd

def GrowHeight(DOY, pCropState, pCropParameter):
    CH_Max = pCropParameter.Maximum_Crop_Height
    GCC_Max = pCropParameter.Maximum_Green_Canopy_Cover
    GCC_Ini = pCropParameter.Initial_Green_Canopy_Cover
    CH = CH_Max * (pCropState.Total_Canopy_Cover[DOY] - GCC_Ini) / (GCC_Max - GCC_Ini)
    pCropState.Crop_Height[DOY] = CH
    
def NAvailabilityFactor(Soil_N_Conc_ppm_Where_N_Uptake_Decreases, 
                        Residual_N_Not_Available_For_Uptake):
    #'The constants for N_availability_adj were derived from a fitted power trend.
    N_Conc_Where_N_Uptake_Decreases_Minus_Residual_N = (
        Soil_N_Conc_ppm_Where_N_Uptake_Decreases 
        - Residual_N_Not_Available_For_Uptake)
    NAF = 0.0
    if N_Conc_Where_N_Uptake_Decreases_Minus_Residual_N > 0.00001:
        NAF = (4.9259 
            * pow(N_Conc_Where_N_Uptake_Decreases_Minus_Residual_N, -0.9821))
    else:
        NAF = 0
    return NAF

def WaterAvailabilityFactor(PAW_Where_N_Upake_Rate_Decreases):
    #'The constants for water_availability_coef were derived from a fitted power trend.
    return 5.259 * pow(PAW_Where_N_Upake_Rate_Decreases, -1.0246)


def NitrogenUptake(DOY, pCropState, pCropParameter, pCropGrowth, pETState, pSoilModelLayer, pSoilState):
    Soil_N_Mass = dict() #(20) As Double
    Soil_NO3_Mass = dict() #(20) As Double
    Soil_NH4_Mass = dict() #(20) As Double
    Nitrate_Mass_Fraction = dict() #(20) As Double
    Ammonium_Mass_Fraction = dict() #(20) As Double
    Water_Uptake = dict() #(20) As Double
    Soil_Solution_N_Conc = dict() #(20) As Double
    Potential_Passive_N_Uptake = dict() #(20) As Double
    Potential_Active_N_Uptake = dict() #(20) As Double
    Actual_Passive_N_Uptake = dict() #(20) As Double
    Active_N_Uptake = dict() #(20) As Double
    Layer_Active_NH4_N_Uptake = dict() #(20) As Double
    Layer_Active_NO3_N_Uptake = dict() #(20) As Double
    
    Maximum_Active_N_Uptake = dict() #(20) As Double
    Relative_Active_Uptake = dict() #(20) As Double
    
    Available_N = 0.0

    yesterday_DOY = DOY - 1
    if yesterday_DOY == 0: yesterday_DOY = 365
        
    Water_Density = 1000 #'kg/m3
    Crop_N = pCropState.Crop_N_Mass[yesterday_DOY]
    #'Maximum_Daily_N_Uptake = ReadInputs.PotentialNUptake(Crop_Number) / 10000# 'Convert kg/ha/day to kg/m2/day
    #'Mingliang 8/13/2025 Five lines deleted
    #Cumulative_Top_Biomass = pCropState.Cumulative_Crop_Biomass[DOY] #'kg/m2
    #Today_Plant_N_Max = pCropState.Maximum_N_Concentration[DOY]
    #COS LML 02252025 Surplus = max(0, Crop_N - Today_Plant_N_Max * Cumulative_Top_Biomass)
    #COS LML 02252025 Today_Crop_N_Demand = max(0, Cumulative_Top_Biomass * Today_Plant_N_Max - Crop_N - Surplus) #'Convert biomass from Mg/ha to kg/m2
    #Today_Crop_N_Demand = max(0, Cumulative_Top_Biomass * Today_Plant_N_Max - Crop_N) #'Convert biomass from Mg/ha to kg/m2
    #Today_Crop_N_Demand = min(pCropParameter.Maximum_Daily_N_Uptake_Rate, Today_Crop_N_Demand) #'Mingliang 7/19/2025 CROP PARAMETER WAS ADDED
    
    #'Mingliang 8/13/2025 BEGIN new section

    Yesterday_Biomass = pCropState.Cumulative_Crop_Biomass[yesterday_DOY]
    Today_Biomass = pCropState.Cumulative_Crop_Biomass[DOY]
    Today_Plant_N_Max = pCropState.Maximum_N_Concentration[DOY]
    Yesterday_Plant_N_Conc = pCropState.Crop_N_Concentration[yesterday_DOY]
    Surplus_Or_Deficit = Yesterday_Biomass * (Yesterday_Plant_N_Conc - Today_Plant_N_Max)   #'Surplus: Positive sign, Deficit: Negative sign
    Today_Crop_N_Demand = (Today_Biomass - Yesterday_Biomass) * Today_Plant_N_Max - Surplus_Or_Deficit
    Today_Crop_N_Demand = max(0, Today_Crop_N_Demand)
    Today_Crop_N_Demand = min(pCropParameter.Maximum_Daily_N_Uptake_Rate, Today_Crop_N_Demand)
    #'Mingliang 8/13/2025 END new section
    
    Today_N_Uptake = 0.
    Today_NO3_N_Uptake = 0.
    Today_NH4_N_Uptake = 0.
    
    if Today_Crop_N_Demand > 0: #'Mingliang 7/20/2025
        #'Calculate daily potential PASSIVE crop N uptake
        Total_Potential_Passive_N_Uptake = 0.
        Total_Water_Uptake = 0.
        Number_Of_Layers = pSoilModelLayer.Number_Model_Layers
        for Layer in range(2, Number_Of_Layers + 1):
            Water_Uptake[Layer] = pETState.Soil_Water_Uptake[DOY][Layer]
            if Water_Uptake[Layer] > 0: Total_Water_Uptake += Water_Uptake[Layer]
            Soil_NO3_Mass[Layer] = pSoilState.Nitrate_N_Content[DOY][Layer]
            Soil_NH4_Mass[Layer] = pSoilState.Ammonium_N_Content[DOY][Layer]
            Available_N += Soil_NO3_Mass[Layer] + Soil_NH4_Mass[Layer]
            Water_Content = pSoilState.Water_Content[DOY][Layer]
            Layer_Thickness = pSoilModelLayer.Layer_Thickness[Layer]
            Soil_Solution_N_Conc[Layer] = Soil_NO3_Mass[Layer] / (Water_Content * Water_Density * Layer_Thickness) #'kg/kg   Only nitrate considered for passive uptake
            if Water_Uptake[Layer] > 0:
                Potential_Passive_N_Uptake[Layer] = Water_Uptake[Layer] * Soil_Solution_N_Conc[Layer]  #'kg/m2
            else:
                Potential_Passive_N_Uptake[Layer] = 0
    
            if Potential_Passive_N_Uptake[Layer] > Soil_NO3_Mass[Layer]: Potential_Passive_N_Uptake[Layer] = Soil_NO3_Mass[Layer]
            Total_Potential_Passive_N_Uptake += Potential_Passive_N_Uptake[Layer]
    
        Today_Expected_Passive_N_Uptake = min(Today_Crop_N_Demand, Total_Potential_Passive_N_Uptake)
        #'Determine actual passive NO3-N uptake and update soil nitrate mass
        Total_Actual_Passive_N_Upt = 0.
        for Layer in range(2, Number_Of_Layers + 1):
            Actual_Passive_N_Uptake[Layer] = 0.
            if Total_Potential_Passive_N_Uptake > 0:
                Actual_Passive_N_Uptake[Layer] = Potential_Passive_N_Uptake[Layer] * Today_Expected_Passive_N_Uptake / Total_Potential_Passive_N_Uptake
    
            Total_Actual_Passive_N_Upt += Actual_Passive_N_Uptake[Layer]
            Soil_NO3_Mass[Layer] -= Actual_Passive_N_Uptake[Layer]
    
        Passive_Uptake_Deficit = max(0, Today_Crop_N_Demand - Total_Actual_Passive_N_Upt)
        for Layer in range(2, Number_Of_Layers + 1):
            if Passive_Uptake_Deficit > 0 and Total_Actual_Passive_N_Upt > 0: #'Calculate daily potential ACTIVE uptake by layer
                    Maximum_Active_N_Uptake[Layer] = Passive_Uptake_Deficit * Actual_Passive_N_Uptake[Layer] / Total_Actual_Passive_N_Upt
            else:
                if Water_Uptake[Layer] > 0:
                    Maximum_Active_N_Uptake[Layer] = Passive_Uptake_Deficit * Water_Uptake[Layer] / Total_Water_Uptake
                else:
                    Maximum_Active_N_Uptake[Layer] = 0.
            Soil_Solution_N_Conc[Layer] = (Soil_NO3_Mass[Layer] + Soil_NH4_Mass[Layer]) / (Water_Content * Water_Density * Layer_Thickness) #'kg/kg   [NO3] + [NH4] added for active uptake
            
            #'Hard-Coded Parameters for Michaelis-Menten for relative active uptake (0 to 1) based on the soil solution N concentration
            Min_Conc_For_Active_Uptake = 0.00005
            Km = 0.00005
            if Soil_Solution_N_Conc[Layer] < Min_Conc_For_Active_Uptake:
                Relative_Active_Uptake[Layer] = 0
            else:
                Relative_Active_Uptake[Layer] = max(0, (Soil_Solution_N_Conc[Layer] - Min_Conc_For_Active_Uptake) / (Km + Soil_Solution_N_Conc[Layer] - Min_Conc_For_Active_Uptake))
    
            Active_N_Uptake[Layer] = Maximum_Active_N_Uptake[Layer] * Relative_Active_Uptake[Layer]
            Available_For_Active_Uptake = Soil_NO3_Mass[Layer] + Soil_NH4_Mass[Layer]
            if Active_N_Uptake[Layer] > Available_For_Active_Uptake: Active_N_Uptake[Layer] = Available_For_Active_Uptake
            #'Update Soil N
            Layer_Active_NH4_N_Uptake[Layer] = min(Active_N_Uptake[Layer], Soil_NH4_Mass[Layer])
            Layer_Active_NO3_N_Uptake[Layer] = max(0.,Active_N_Uptake[Layer] - Layer_Active_NH4_N_Uptake[Layer])
    
        for Layer in range(2, Number_Of_Layers + 1):
            pSoilState.Ammonium_N_Content[DOY][Layer] -= Layer_Active_NH4_N_Uptake[Layer]
            pSoilState.Nitrate_N_Content[DOY][Layer] -= Layer_Active_NO3_N_Uptake[Layer] + Actual_Passive_N_Uptake[Layer]
            Today_NO3_N_Uptake += Layer_Active_NO3_N_Uptake[Layer] + Actual_Passive_N_Uptake[Layer]
            Today_NH4_N_Uptake += Layer_Active_NH4_N_Uptake[Layer]
            Today_N_Uptake += Actual_Passive_N_Uptake[Layer] + Layer_Active_NH4_N_Uptake[Layer] + Layer_Active_NO3_N_Uptake[Layer]
    else: #'Mingliang 7/20/2025
        Today_N_Uptake = 0.
        
    if DOY == 1:
        pCropState.Seasonal_N_Uptake = pCropState.Cumulative_N_Uptake[365] + Today_N_Uptake 
    else: 
        pCropState.Seasonal_N_Uptake = pCropState.Cumulative_N_Uptake[DOY - 1] + Today_N_Uptake
    Crop_N += Today_N_Uptake #'Crop N mass different to cumulative N uptake only if Crop N mass set at emergence or foliar applications considered
    #Crop_N_Conc = Crop_N / Cumulative_Top_Biomass #Mingliang 7/20/2025
    
    #'Mingliang 7/20/2025
    #'If N uptake is zero and the maximum N concentration is always decreasing, then there will be excess crop N that is lost as gas
    #if Today_N_Uptake == 0.:
    #    Crop_N_Conc = Today_Plant_N_Max
    #else:
    #    Crop_N_Conc = Crop_N / Cumulative_Top_Biomass
    Crop_N_Conc = Crop_N / Today_Biomass   #'Mingliang 8/13/2025
    
    #if Crop_N_Conc < 0: raise Exception("Crop_N_Conc < 0")
    #if Crop_N_Conc > Today_Plant_N_Max: raise Exception("Crop_N_Conc > Today_Plant_N_Max")


    #'Update variables
    pCropState.Crop_N_Mass[DOY] = Crop_N
    pCropState.N_Uptake[DOY] = Today_N_Uptake
    pCropState.Nitrate_N_Uptake[DOY] = Today_NO3_N_Uptake
    pCropState.Ammonium_N_Uptake[DOY] = Today_NH4_N_Uptake
    pCropState.Cumulative_N_Uptake[DOY] = pCropState.Seasonal_N_Uptake
    pCropState.Crop_N_Concentration[DOY] = Crop_N_Conc
    if pCropState.Crop_N_Concentration[DOY] >= pCropState.Critical_N_Concentration[DOY]:
        pCropState.Nitrogen_Stress_Index[DOY] = 0
    else:
        pCropState.Nitrogen_Stress_Index[DOY] = min(1, 1 - (pCropState.Crop_N_Concentration[DOY] - pCropState.Minimum_N_Concentration[DOY]) / (pCropState.Critical_N_Concentration[DOY] - pCropState.Minimum_N_Concentration[DOY]))
        
    return Today_Crop_N_Demand,Available_N, Today_N_Uptake

def FertilizerRecommendation(DOY, pCropState, pCropParameter, 
                             pCropGrowth, pETState, pSoilModelLayer, pSoilState, 
                             Scheduled_Fertilization, pCS_Fertilization, 
                             Potential_Biomass_At_Maturity, Auto_Fertilization):
    N_Conc_That_Triggers_Fertilization = 0
    Scheduling_Window_Days = 0
    Next_Week_Scheduled_Fertilization = False
    Readily_Available_Soil_N_Mass = 0.
    Nitrate_N_Recommended = 0.
    pre_doy = DOY - 1
    if pre_doy == 0: pre_doy = 365
    
    #Dim Scheduled_Fertilization_Amount As Double
    #Dim Pertinent_Soil_Depth As Double
    #Dim Soil_Depth As Double
    #Dim Readily_Available_Soil_N_Mass As Double
    #Dim Layer As Integer
    #Dim NL As Integer
    #Dim i As Integer
    #Dim Days_Counter As Integer
    #Dim Begin_Senescence As Integer 'Mingliang 7/18/2025
    
    #'Mingliang 7/23/2025
    #'Calculation of recommended fertilization, based on a plant N conc threshold that triggers fertilization
    Begin_Senescence = pCropGrowth.Beging_Senescence_DOY
    
    SOC_For_Mineralization_Estimation = 0.
    Estimated_Mineralization = 0. 
    SOC = dict()   #(20) As Double   'MINGLIANG 11/18/2025
    KD = 0.00005   #'1/day    'MINGLIANG 11/18/2025
    CN_RATIO = 10. #'MINGLIANG 11/18/2025
    
    pCropState.Recommended_N_Fertilization = False
    pCropState.N_Fert_Recommended_Amount[DOY] = 0.
    
    if DOY > Begin_Senescence: 
        Scheduling_Window_Days = (365 - DOY) + Begin_Senescence
    else: 
        Scheduling_Window_Days = Begin_Senescence - DOY
    #global Auto_Fertilization
    if Auto_Fertilization and DOY < Begin_Senescence: #'Mingliang 7/18/2025 Added to enable or disable automatic fertilization.
        SOC_For_Mineralization_Estimation = 0.   #'MINGLIANG 11/18/2025
        for Layer in range(1, 7): #'Top six soil layers used to estimate mineralization    'MINGLIANG 11/18/2025
            SOC[Layer] = pSoilState.Soil_Organic_Carbon[DOY][Layer] # 'MINGLIANG 11/18/2025
            SOC_For_Mineralization_Estimation += SOC[Layer]  #'kg/m2    'MINGLIANG 11/18/2025
            
        Estimated_Mineralization = (SOC_For_Mineralization_Estimation * KD / CN_RATIO) * Scheduling_Window_Days #'kg/m2  'MINGLIANG 11/18/2025
        Next_Week_Scheduled_Fertilization = False
        Scheduled_Fertilization_Amount = 0
        Days_Counter = 0
        while Days_Counter <= Scheduling_Window_Days:
            tdoy = DOY + Days_Counter
            if tdoy > 365: tdoy -= 365
            Scheduled_Fertilization_Amount += pCS_Fertilization.Nitrate_Fertilization_Rate[tdoy] \
                        + pCS_Fertilization.Ammonium_Fertilization_Rate[tdoy]
            if Days_Counter == 7 and Scheduled_Fertilization_Amount > 0: 
                Next_Week_Scheduled_Fertilization = True
                pCropState.Recommended_N_Fertilization = False
            Days_Counter += 1

        N_Conc_That_Triggers_Fertilization = pCropState.Maximum_N_Concentration[DOY] * 0.5 + pCropState.Critical_N_Concentration[DOY] * 0.5 #COS 11122025 pCropState.Maximum_N_Concentration[DOY] * 0.2 + pCropState.Critical_N_Concentration[DOY] * 0.8
        if pCropState.Crop_N_Concentration[DOY] < N_Conc_That_Triggers_Fertilization and not Next_Week_Scheduled_Fertilization: 
            #'Calculate current soil N mass to a soil depth equal to half maximum root depth (Best estimate of N mass available for future N uptake)
            Pertinent_Soil_Depth = round(pCropParameter.Maximum_Root_Depth / 2., 1)
            Soil_Depth = 0
            Readily_Available_Soil_N_Mass = 0
            NL = pSoilModelLayer.Number_Model_Layers
            Soil_Depth = pSoilModelLayer.Layer_Thickness[1]
            for Layer in range(2, NL + 1):     #'Root nutrient absorsion begins at layer 2
                Soil_Depth += pSoilModelLayer.Layer_Thickness[Layer]
                if Soil_Depth <= Pertinent_Soil_Depth:
                    Readily_Available_Soil_N_Mass += pSoilState.Nitrate_N_Content[DOY][Layer] + pSoilState.Ammonium_N_Content[DOY][Layer]
                else:
                    break
            #global Potential_Biomass_At_Maturity
            Nitrate_N_Recommended = Potential_Biomass_At_Maturity * (pCropParameter.Maximum_N_Concentration_Maturity \
                     + pCropParameter.Critical_N_Concentration_Maturity) / 2. - pCropState.Crop_N_Mass[pre_doy] - Scheduled_Fertilization_Amount \
                     - Readily_Available_Soil_N_Mass - Estimated_Mineralization
            if Nitrate_N_Recommended < 0: Nitrate_N_Recommended = 0. #'Sources of N are sufficient to avoid N deficiency 'MINGLIANG 11/18/2025
            if Nitrate_N_Recommended > 0.0005: #'This is to ensure that N recommendation is at least 5 kg/ha
                pCropState.Recommended_N_Fertilization = True
                pCropState.N_Fert_Recommended_DOY[DOY]= DOY
                pCropState.N_Fert_Recommended_Amount[DOY] = Nitrate_N_Recommended
    #'Mingliang 7/23/2025 End of fertilization recommendation
    return pCropState.Recommended_N_Fertilization, pCropState.N_Fert_Recommended_Amount[DOY]

def InitializeCrop(DOY,pCropState,pSoilFlux,pCropParameter,pETState,Crop_Number):
    pCropState.Green_Canopy_Cover[DOY] = pCropParameter.Initial_Green_Canopy_Cover
    pCropState.Total_Canopy_Cover[DOY] = pCropParameter.Initial_Green_Canopy_Cover
    Depth_Of_Seed = pCropParameter.Seeding_Depth
    Root_Depth_At_Emergence = Depth_Of_Seed + pCropParameter.Initial_Root_Depth_From_Germinated_Seed
    pCropState.Root_Depth[DOY] = Root_Depth_At_Emergence
    pCropState.Cumulative_Crop_Biomass[DOY - 1] = 0.002 #'OJO IMPROVE ON THIS
    pCropState.Seasonal_Biomass = pCropState.Cumulative_Crop_Biomass[DOY - 1]
    pCropState.Cumulative_Potential_Crop_Biomass[DOY - 1] = pCropState.Cumulative_Crop_Biomass[DOY - 1]
    pCropState.Crop_N_Mass[DOY - 1] = pCropState.Cumulative_Crop_Biomass[DOY - 1] * pCropParameter.Maximum_N_Concentration_Emergence
    pCropState.Crop_N_Concentration[DOY - 1] = pCropParameter.Maximum_N_Concentration_Emergence #'Mingliang 8/13/2025
    pCropState.Cumulative_N_Uptake[DOY] = 0.
    pSoilFlux.Cumulative_Irrigation_Crop[Crop_Number] = 0.
    pSoilFlux.Cumulative_Fertilization_Crop[Crop_Number] = 0.
    pSoilFlux.Cumulative_Deep_Drainage_Crop[Crop_Number] = 0.
    pSoilFlux.Cumulative_N_Leaching_Crop[Crop_Number] = 0.
    pETState.Crop_Soil_Water_Evaporation = 0.
    pETState.Total_Transpiration = 0.
    pCropState.Seasonal_N_Uptake = 0.

def InitCropState(pCropState):
    pCropState.Recommended_N_Fertilization = 0.0
    pCropState.Recommended_N_Fertilization = False
    
    pCropState.Maximum_N_Concentration_At_Transition = 0
    pCropState.Daily_Change_Maximum_N_Concentration = 0
    pCropState.Maximum_Green_Canopy_Cover_Reached = False
    pCropState.Critical_N_Concentration_At_Transition = 0
    pCropState.Daily_Change_Critical_N_Concentration = 0
    pCropState.Minimum_N_Concentration_At_Transition = 0
    pCropState.Daily_Change_Minimum_N_Concentration = 0
    pCropState.DOY_Of_Transition = 0
    
    for i in range(1,367):
        pCropState.Potential_Green_Canopy_Cover[i] = 0.0
        pCropState.Green_Canopy_Cover[i] = 0.0
        pCropState.Total_Canopy_Cover[i] = 0.0
        pCropState.Potential_Total_Canopy_Cover[i] = 0.0
        pCropState.Root_Depth[i] = 0.0
        pCropState.Crop_Height[i] = 0.0
        pCropState.Root_Depth_At_Emergence[i] = 0.0
        pCropState.Today_Biomass_Gain[i] = 0.0
        pCropState.Cumulative_Potential_Crop_Biomass[i] = 0.0
        pCropState.Cumulative_Crop_Biomass[i] = 0.0
        pCropState.Potential_Crop_Biomass[i] = 0.0
        pCropState.Crop_N_Mass[i] = 0.0
        pCropState.N_Uptake[i] = 0.0
        pCropState.Nitrate_N_Uptake[i] = 0
        pCropState.Ammonium_N_Uptake[i] = 0
        pCropState.Cumulative_N_Uptake[i] = 0.0
        pCropState.Crop_N_Concentration[i] = 0.0
        pCropState.Maximum_N_Concentration[i] = 0.0
        pCropState.Critical_N_Concentration[i] = 0.0
        pCropState.Minimum_N_Concentration[i] = 0.0
        pCropState.Nitrogen_Stress_Index[i] = 0.0
        
        pCropState.N_Fert_Recommended_DOY[i] = 0
        pCropState.N_Fert_Recommended_Amount[i] = 0
        


def CC(B1, B2, Value_ini, Value_max, Asymthotic_Value_Decline, Value_end, 
       Current_Value, DAE, DAE_Begin_Season, DAE_At_Peak_Value, 
       DAE_At_Begin_Decline, DAE_At_End_Of_Season, Shape_Coef_Before_Peak, 
       Shape_Coef_During_Decline, Actual_Value_max2):
    Relative_TT_Increasing_Value = 0.
    Relative_TT_Declining_Value = 0.
    
    if DAE <= DAE_At_Peak_Value:
        Relative_TT_Increasing_Value = (DAE - DAE_Begin_Season) / (DAE_At_Peak_Value - DAE_Begin_Season)
        fCC = Value_ini + (Value_max - Value_ini) / (1. + B1 * math.exp(-Shape_Coef_Before_Peak * Relative_TT_Increasing_Value))
    else:
        if DAE <= DAE_At_End_Of_Season and DAE >= DAE_At_Begin_Decline:
            Relative_TT_Declining_Value = (DAE - DAE_At_Begin_Decline) / (DAE_At_End_Of_Season - DAE_At_Begin_Decline)
            fCC = Actual_Value_max2 - (Actual_Value_max2 - Asymthotic_Value_Decline) / (1. + B2 * math.exp(-Shape_Coef_During_Decline * Relative_TT_Declining_Value))
            if fCC < Value_end: fCC = Value_end
            if fCC > Actual_Value_max2: fCC = Actual_Value_max2
        else:
            fCC = Current_Value
    return fCC

def CanopyCover(DOY, DAE, Crop_Number, pCropState, pCropParameter, pCropGrowth, pETState):
    if DOY == pCropGrowth.Emergence_DOY:
        DOY_Begin_Decline = pCropGrowth.Beging_Senescence_DOY
        DOY_Emergence = pCropGrowth.Emergence_DOY
        if DOY_Emergence > DOY_Begin_Decline: 
            pCropState.DAE_Begin_Senescence = (365. - DOY_Emergence) + DOY_Begin_Decline
        else: 
            pCropState.DAE_Begin_Senescence = DOY_Begin_Decline - DOY_Emergence

    
    if DOY == 1: 
        Adj_DOY = 365
    else: 
        Adj_DOY = DOY - 1
    if DAE <= pCropState.DAE_Begin_Senescence: 
        WSF = 1. - pETState.Water_Stress_Index[Adj_DOY]
        NSF = (1. - pCropState.Nitrogen_Stress_Index[Adj_DOY]) #'^ 0.5
        Canopy_Expansion = (pCropState.Potential_Green_Canopy_Cover[DOY] - pCropState.Potential_Green_Canopy_Cover[Adj_DOY]) * min(WSF, NSF)
        pCropState.Green_Canopy_Cover[DOY] = pCropState.Green_Canopy_Cover[Adj_DOY] + Canopy_Expansion
        pCropState.Total_Canopy_Cover[DOY] = pCropState.Green_Canopy_Cover[DOY]
        pCropState.Total_CC_Transition = pCropState.Total_Canopy_Cover[DOY]
    else:   #'Senescence
        Canopy_Senescence = (pCropState.Potential_Green_Canopy_Cover[Adj_DOY] - pCropState.Potential_Green_Canopy_Cover[DOY])
        pCropState.Green_Canopy_Cover[DOY] = max(0, pCropState.Green_Canopy_Cover[Adj_DOY] - Canopy_Senescence)
        pCropState.Total_Canopy_Cover[DOY] = pCropState.Total_CC_Transition

def PotentialCanopyCover(Crop_Number, DAE, DOY, pCropParameter, pCropState, pCropGrowth):
    #'HARD-CODED PARAMETERS. DO NOT EXPOSE
    Shape_Coef_Before_Peak = 9
    Shape_Coef_During_Decline = 9
    Time_Fraction_At_Half_Peak_Value = 0.5
    Time_Fraction_At_Half_Decline = 0.5
    
    
    Initial_Value = pCropParameter.Initial_Green_Canopy_Cover
    Peak_Value = pCropParameter.Maximum_Green_Canopy_Cover
    End_Season_Value = pCropParameter.Maturity_Green_Canopy_Cover
    DOY_Begin_Season = pCropGrowth.Emergence_DOY
    DOY_Peak_Value = pCropGrowth.Full_Canopy_DOY
    DOY_Begin_Decline = pCropGrowth.Beging_Senescence_DOY
    DOY_End_Of_Season = pCropGrowth.Maturity_DOY
    DAE_Begin_Season = 0
    if DOY_Begin_Season > DOY_Peak_Value:
        DAE_At_Peak_Value = (365 - DOY_Begin_Season) + DOY_Peak_Value 
    else: 
        DAE_At_Peak_Value = DOY_Peak_Value - DOY_Begin_Season
    
    if DOY_Begin_Season > DOY_Begin_Decline:
        DAE_At_Begin_Decline = (365 - DOY_Begin_Season) + DOY_Begin_Decline 
    else: 
        DAE_At_Begin_Decline = DOY_Begin_Decline - DOY_Begin_Season
    
    if DOY_Begin_Season > DOY_End_Of_Season:
        DAE_At_End_Of_Season = (365 - DOY_Begin_Season) + DOY_End_Of_Season 
    else: 
        DAE_At_End_Of_Season = DOY_End_Of_Season - DOY_Begin_Season
    

    #'Derived parameters for the standard green canopy curve
    B1 = 1 / math.exp(-Shape_Coef_Before_Peak * Time_Fraction_At_Half_Peak_Value)
    B2 = 1 / math.exp(-Shape_Coef_During_Decline * Time_Fraction_At_Half_Decline)
    Asympthotic_Value_max = (Peak_Value - Initial_Value) * (1 + B1 * math.exp(-Shape_Coef_Before_Peak * 1)) + Initial_Value
    Actual_Value_max1 = Initial_Value + (Asympthotic_Value_max - Initial_Value) / (1 + B1 * math.exp(-Shape_Coef_Before_Peak))
    Actual_Value_max2 = (Actual_Value_max1 * (1 + B2) - End_Season_Value) / B2
    Asymthotic_Value_Decline = Actual_Value_max2 + (End_Season_Value - Actual_Value_max2) * (1 + B2 * math.exp(-Shape_Coef_During_Decline))
    if DAE <= DAE_At_End_Of_Season and DAE == DAE_At_Begin_Decline:
        #'This recalculate Value_max2 and Asymthotic_Value_Decline at the beginning of senescence
        Actual_Value_max2 = (Peak_Value * (1 + B2) - End_Season_Value) / B2
        Asymthotic_Value_Decline = Actual_Value_max2 + (End_Season_Value - Actual_Value_max2) * (1 + B2 * math.exp(-Shape_Coef_During_Decline))

    Today_GCC_Value = CC(B1, B2, Initial_Value, Asympthotic_Value_max, Asymthotic_Value_Decline, End_Season_Value, Peak_Value, DAE, 
                DAE_Begin_Season, DAE_At_Peak_Value, DAE_At_Begin_Decline, DAE_At_End_Of_Season, Shape_Coef_Before_Peak, Shape_Coef_During_Decline, Actual_Value_max2)
    pCropState.Potential_Green_Canopy_Cover[DOY] = Today_GCC_Value
    if DAE <= DAE_At_Begin_Decline: 
        pCropState.Potential_Total_Canopy_Cover[DOY] = pCropState.Potential_Green_Canopy_Cover[DOY] 
    else:
        pCropState.Potential_Total_Canopy_Cover[DOY] = pCropState.Potential_Total_Canopy_Cover[DOY - 1]