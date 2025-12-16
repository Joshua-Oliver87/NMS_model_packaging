#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Sep  6 10:13:14 2024

@author: liuming
"""
import math
from AutoIrrigation import *
#Soil Hydrologics
Thickness_Model_Layers = 0.1
Carbon_Fraction_In_SOM = 0.58
SOC_C_N_Ratio = 12. #kg/kg
#MAX_Number_Model_Layers = 20                                                   #05192025LML hard coded maximum soil layers

class SoilHorizons:
    Number_Of_Horizons = 0
    Horizon_Thickness = dict() #m
    Clay = dict() #%
    Sand = dict() #%
    Silt = dict() #%
    AE_Pot = dict()
    B_Val = dict()
    FC_WP = dict() #kPa
    PWP_WP = dict() #kPa
    Bulk_Dens = dict()  #(Mg/m3)
    Sat_WC = dict() #fraction
    FC_WC = dict() #fraction
    PWP_WC = dict() #fraction
    Soil_Organic_Carbon = dict() #%
    Percent_Soil_Organic_Matter = dict()
    Number_Of_Sublayers = dict()

class SoilModelLayer:
    Number_Model_Layers = 0
    Air_Entry_Potential = dict()
    B_value = dict()
    WP_At_FC = dict()
    WP_At_PWP = dict()
    FC_Water_Content = dict()
    PWP_Water_Content = dict()
    Plant_Available_Water_Content = dict()
    Bulk_Density = dict()
    Layer_Thickness = dict()
    Saturation_Water_Content = dict()
    Clay_Fraction = dict()
    Fraction_Of_Sand = dict() #(20) As Double
    Fraction_Of_Silt = dict() #(20) As Double
    Soil_Mass = dict() #(20) As Double
    Percent_Soil_Organic_Matter = dict() #(20) As Double
    Thickness_Evaporative_Layer = 0

class SoilState:
    Water_Content = dict() #(365, 20) As Double
    
    Water_Filled_Porosity = dict() #(365, 20) As Double
    
    Nitrate_N_Content = dict() #(365, 20) As Double
    Ammonium_N_Content = dict() #(365, 20) As Double
    
    Soil_Organic_Carbon = dict() #(365, 20) As Double
    Soil_Organic_Nitrogen = dict() #(365, 20) As Double
    Nitrate_N_In_Water = dict() #(kg) (366) As Double  'Mingliang June 3
    
    SOM_C_Pool = dict() #(366, 20) As Double
    SOM_N_Pool = dict() #(366, 20) As Double
    Residue_C_Pool = dict() #(366, 20) As Double
    Residue_N_Pool = dict() #(366, 20) As Double
    Profile_Nitrate_N_Content = dict() #(366) As Double
    Profile_Ammonium_N_Content = dict() #(366) As Double
    
    PAW_Depletion = dict() #(366)
    #PAW_Depletion_Top50cm = dict() #(366) As Double 'NEW Mingliang
    #PAW_Depletion_Mid50cm = dict() #(366) As Double 'NEW Mingliang
    #PAW_Depletion_Bottom50cm = dict() #(366) As Double 'NEW Mingliang
    Water_Content_Top50cm = dict() #(366) As Double 'Mingliang 4/17/2025
    Water_Content_Mid50cm = dict() #(366) As Double 'Mingliang 4/17/2025
    Water_Content_Bottom50cm = dict() #(366) As Double 'Mingliang 4/17/2025
    N_Mass_Top50cm = dict() #(366) As Double 'NEW Mingliang
    N_Mass_Mid50cm = dict() #(366) As Double 'NEW Mingliang
    N_Mass_Bottom50cm = dict() #(366) As Double 'NEW Mingliang
    
    #N_Leaching = dict() #(365) As Double
    #Deep_Drainage = dict() #(365) As Double
    #Chemical_Balance = dict() #(365) As Double
    #Water_Balance = dict() #(365) As Double
    
    Soil_Water_Potential = dict() # = dict() (366,20)
    Layer_Daily_Soil_Temperature = dict()
    Layer_Hourly_Soil_Temperature = dict() #(20,24)?  (Layer, Hour)
    
    Oxidation_Water_Function = dict() #6
    Oxidation_Temperature_Function = dict() #6
    
    Saturation_Carbon_Conc_kg_Per_m2 = 0.
    SOC_Oxidation_Rate = 0.
    
    Auto_Irrigation = False
    Number_Of_Events = 0
    Method = 0
    PAW_Trigger = False
    CWSI_Trigger = False
    Max_Allowed_CWSI = 0.
    MAD = 0.
    Refill_Today = False
    Soil_Depth_To_Refill = 0.
    
class SoilFlux:
    Mineralization_Top_Three_Layers = dict() #(366) As Double
    Mineralization_Next_Three_Layers = dict() #(366) As Double
    Daily_Nitrification = dict() #(366) As Double
    Daily_Profile_SOC_Pool_Oxidation = dict() #(366) As Double
    Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM = dict() #(366) As Double
    Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool = dict() #(366) As Double
    
    Fertilization_Rate = dict() #(366) As Double
    N_Leaching = dict() #(366) As Double
    #N_Leaching_Accumulated = dict() #(366) As Double
    N_Leaching_Accumulated_Crop = dict() #(366) As Double
    Deep_Drainage = dict() #(366) As Double
    Chemical_Balance = dict() #(366) As Double
    Water_Balance = dict() #(366) As Double
    Net_Irrigation_Depth = dict() #(366) As Double

    Layer_Mineralization = dict() #((366, 20) As Double

    #Oxidation_Water_Function = dict() #((6) As Double
    #Oxidation_Temperature_Function = dict() #(6) As Double
    
    Layer_SOC_Pool_Oxidation = 0.
    Layer_Oxidized_SOM_C_Transfer_Back_To_SOM = 0.
    Layer_Oxidized_SOM_N_Transferred_To_Ammonium = 0.
    
    Cumulative_Mineralization_Top_Three_Layers_All_Days = 0.0
    Cumulative_Mineralization_Next_Three_Layers_All_Days = 0.0
    Cumulative_Mineralization_Top_Three_Layers_Crop = dict()
    Cumulative_Mineralization_Next_Three_Layers_Crop = dict()
    Cumulative_Mineralization_All_Layers = 0.0    #'Mingliang 6/21/2025
    
    #Cumulative_Deep_Drainage = 0.
    Cumulative_Deep_Drainage_Crop = dict()
    
    #Cumulative_N_Leaching = 0. #kg/m2
    Cumulative_N_Leaching_Crop = dict()
    
    Sum_N_Fertilization = 0.
    #Cumulative_Irrigation = 0.                                                 #only account when crop is active
    Cumulative_Irrigation_Crop = dict()
    #Cumulative_Fertilization = 0.
    Cumulative_Fertilization_Crop = dict()
    
    Simulation_Total_N_Leaching = 0.
    Simulation_Total_Deep_Drainage = 0.
    Simulation_Total_Irrigation = 0.
    Simulation_Total_Fertilization = 0.
    

class ETState:
    Potential_Transpiration = dict()
    Potential_Crop_Transpiration = dict()
    Potential_Soil_Water_Evaporation = dict()
    Potential_ET = dict()
    Actual_Transpiration = dict()
    Actual_Soil_Water_Evaporation = dict()
    Water_Stress_Index = dict()
    Root_Fraction = dict()
    Adjusted_Root_Fraction = dict() #(20) As Double
    Soil_Water_Uptake = dict() #(366,20)
    Total_Transpiration = 0.
    Cumulative_Soil_Water_Evaporation = 0 #'Mingliang 4/17/2025
    Crop_Soil_Water_Evaporation = 0


def InitSoilState(pSoilState):
    for i in range(1,367):
        pSoilState.Water_Content[i] = dict()
        pSoilState.Water_Filled_Porosity[i] = dict()
        pSoilState.Nitrate_N_Content[i] = dict()
        pSoilState.Ammonium_N_Content[i] = dict()
        pSoilState.Soil_Organic_Carbon[i] = dict()
        pSoilState.Soil_Organic_Nitrogen[i] = dict()
        pSoilState.SOM_C_Pool[i] = dict()
        pSoilState.SOM_N_Pool[i] = dict()
        pSoilState.Residue_C_Pool[i] = dict()
        pSoilState.Residue_N_Pool[i] = dict()
        pSoilState.Soil_Water_Potential[i] = dict()

        for j in range(1,21):
            pSoilState.Water_Content[i][j] = 0.
            pSoilState.Water_Filled_Porosity[i][j] = 0.
            pSoilState.Nitrate_N_Content[i][j] = 0.
            pSoilState.Ammonium_N_Content[i][j] = 0.
            pSoilState.Soil_Organic_Carbon[i][j] = 0.
            pSoilState.Soil_Organic_Nitrogen[i][j] = 0.
            pSoilState.SOM_C_Pool[i][j] = 0.
            pSoilState.SOM_N_Pool[i][j] = 0.
            pSoilState.Residue_C_Pool[i][j] = 0.
            pSoilState.Residue_N_Pool[i][j] = 0.
            pSoilState.Soil_Water_Potential[i][j] = 0.
            
        pSoilState.PAW_Depletion[i] = 0.
        #pSoilState.PAW_Depletion_Top50cm[i] = 0. #'NEW Mingliang
        #pSoilState.PAW_Depletion_Mid50cm[i] = 0. #'NEW Mingliang
        #pSoilState.PAW_Depletion_Bottom50cm[i] = 0. #'NEW Mingliang
        pSoilState.Water_Content_Top50cm[i] = 0. #' 'Mingliang 4/17/2025
        pSoilState.Water_Content_Mid50cm[i] = 0. #' 'Mingliang 4/17/2025
        pSoilState.Water_Content_Bottom50cm[i] = 0. # 'Mingliang 4/17/2025
        pSoilState.N_Mass_Top50cm[i] = 0. #'NEW Mingliang
        pSoilState.N_Mass_Mid50cm[i] = 0. #'NEW Mingliang
        pSoilState.N_Mass_Bottom50cm[i] = 0. #'NEW Mingliang
        
        pSoilState.Nitrate_N_In_Water[i] = 0.
        
        pSoilState.Profile_Nitrate_N_Content[i] = 0.
        pSoilState.Profile_Ammonium_N_Content[i] = 0.
        #pSoilState.N_Leaching[i] = 0.
        #pSoilState.Deep_Drainage[i] = 0.
        #pSoilState.Chemical_Balance[i] = 0.
        #pSoilState.Water_Balance[i] = 0.
        #pSoilState.Fertilization_Rate[i] = 0.
        pSoilState.Layer_Daily_Soil_Temperature[i] = 0.
    #for j in range(1,21):
    #    pSoilState.Soil_Water_Potential[j] = 0.
    for i in range(1, 21):
        pSoilState.Layer_Hourly_Soil_Temperature[i] = dict()
        for j in range(1,25):
            pSoilState.Layer_Hourly_Soil_Temperature[i][j] = 0.
    
    pSoilState.PAW_Trigger = False
    pSoilState.CWSI_Trigger = False
    pSoilState.Refill_Today = False
    pSoilState.Number_Of_Events = 0
    pSoilState.Method = 0
    
def InitSoilFlux(pSoilFlux):
    for i in range(1,367):
        pSoilFlux.Mineralization_Top_Three_Layers[i] = 0.
        pSoilFlux.Mineralization_Next_Three_Layers[i] = 0.
        pSoilFlux.Daily_Nitrification[i] = 0.
        pSoilFlux.Daily_Profile_SOC_Pool_Oxidation[i] = 0.
        pSoilFlux.Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM[i] = 0.
        pSoilFlux.Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool[i] = 0.
        
        pSoilFlux.Fertilization_Rate[i] = 0.
        pSoilFlux.N_Leaching[i] = 0.
        #pSoilFlux.N_Leaching_Accumulated[i] = 0.
        pSoilFlux.Deep_Drainage[i] = 0.
        pSoilFlux.Chemical_Balance[i] = 0.
        pSoilFlux.Water_Balance[i] = 0.
        pSoilFlux.Net_Irrigation_Depth[i] = 0.
        pSoilFlux.Layer_Mineralization[i] = dict()
        for j in range(1,21):
            pSoilFlux.Layer_Mineralization[i][j] = 0.
            
        pSoilFlux.N_Leaching_Accumulated_Crop[i] = dict()
        for k in range(1,3):
            pSoilFlux.N_Leaching_Accumulated_Crop[i][k] = 0.
            
    pSoilFlux.Layer_Oxidized_SOM_C_Transfer_Back_To_SOM = 0.
    pSoilFlux.Layer_Oxidized_SOM_N_Transferred_To_Ammonium = 0.
    
    pSoilFlux.Cumulative_Mineralization_Top_Three_Layers_All_Days = 0.0
    pSoilFlux.Cumulative_Mineralization_Next_Three_Layers_All_Days = 0.0
    pSoilFlux.Cumulative_Mineralization_All_Layers = 0.0
    
    for i in range(1,3):
        pSoilFlux.Cumulative_Mineralization_Top_Three_Layers_Crop[i] = 0.
        pSoilFlux.Cumulative_Mineralization_Next_Three_Layers_Crop[i] = 0.
        pSoilFlux.Cumulative_Deep_Drainage_Crop[i] = 0.
        pSoilFlux.Cumulative_N_Leaching_Crop[i] = 0.
        pSoilFlux.Cumulative_Irrigation_Crop[i] = 0.
        pSoilFlux.Cumulative_Fertilization_Crop[i] = 0.

    
    pSoilFlux.Cumulative_Deep_Drainage = 0.
    pSoilFlux.Cumulative_N_Leaching = 0.
    pSoilFlux.Cumulative_Irrigation = 0.
    pSoilFlux.Cumulative_Fertilization = 0.
    pSoilFlux.Sum_N_Fertilization = 0.
    
    pSoilFlux.Simulation_Total_N_Leaching = 0.
    pSoilFlux.Simulation_Total_Deep_Drainage = 0.
    pSoilFlux.Simulation_Total_Irrigation = 0.
    pSoilFlux.Simulation_Total_Fertilization = 0.


def WS(Sand, Clay):
    #'Calculate saturation water content (m3/m3) using Saxton's pedotransfer function
    WS = 0.332 - 0.0007251 * Sand + (math.log(Clay) / math.log(10)) * 0.1276
    return WS

def BD(Sand, Clay):
    #'Calculate bulk density (Mg/m3)
    #'Calculate saturation water content (m3/m3) using Saxton's pedotransfer function
    Saturation_WC = 0.332 - 0.0007251 * Sand + (math.log(Clay) / math.log(10)) * 0.1276
    BD = 2.65 * (1 - Saturation_WC)
    return BD
def B(Sand, Clay):
    #'Calculate b value
    B_value = -(-3.14 - 0.00222 * math.pow(Clay,2) - 0.00003484 * math.pow(Sand, 2) * Clay)
    return B_value
def AE(Sand, Clay):
    #'Calculate air entry potential
    #'Calculate saturation water content (m3/m3)
    Saturation_WC = 0.332 - 0.0007251 * Sand + (math.log(Clay) / math.log(10)) * 0.1276
    #'Calculate a value
    A_Value = 100 * math.exp(-4.396 - 0.0715 * Clay - 0.000488 * math.pow(Sand, 2) - 0.00004285 * math.pow(Sand, 2) * Clay)
    #'Calculate b value
    B_value = -(-3.14 - 0.00222 * math.pow(Clay, 2) - 0.00003484 * math.pow(Sand, 2) * Clay)
    #'Calculate Air Entry Potential
    Air_Entry_Potential = -A_Value * math.pow(Saturation_WC, (-B_value))
    return Air_Entry_Potential
def KS(Sand, Clay):
    #'Calculate saturated hydraulic conductivity
    G = 9.81  #'gravitational acceleration (m/s2)
    Water_Density = 1000  #' (kg/m3)
    #'Calculate saturation water content (m3/m3)
    Saturation_WC = 0.332 - 0.0007251 * Sand + (math.log(Clay) / math.log(10)) * 0.1276
    #'Calculate saturated hydraulic conductivity (kg s/m3)
    Factor = Water_Density / (G * 100 * 3600) #'converts cm/h to Kg s / m3
    Ksat = Factor * math.exp(12.012 - 0.0755 * Sand + (-3.895 + 0.03671 * Sand - 0.1103 * Clay + 0.00087546 * math.pow(Clay, 2)) * (1 / Saturation_WC))
    return Ksat
def WPFC(Clay, Silt):
    #'Calculate water potential at field capacity
    WP_At_FC = -13.833 * math.log(Clay) + 10.356
    if Silt > 70: WP_At_FC = -33
    if WP_At_FC > -10: WP_At_FC = -10
    return WP_At_FC
def WC(WS, WP, AE, B):
    #'Calculate water content from water potential
    WC = WS * (math.pow(WP / AE, (-1 / B)))
    return WC
def WP(WS, WC, AE, B):
    #'Calculate water potential from water content
    if WC >= 1e-12: #09182025 WC should be positive and not close to zero
        WP = AE * math.pow((WC / WS), (-B))
    else:
        WP = -1.e6  #06122025LML set a big negative number
    return WP
def KSAP(B, WS, FC, HTFC):
    Gr = 9.81  #'gravitational acceleration (m/s2)
    WD = 1000  #'water density (kg/m3)
    dz = 0.05  #'soil thickness (m()
    m = 2 * B + 3
    KSAP = dz * WD * math.pow(WS, m) * (math.pow(FC, (1 - m)) - math.pow(WS, (1 - m))) \
                        / (Gr * HTFC * 3600 * (m - 1))
    return KSAP
def k(KS, AE, B, WP):
    #'Calculate hydraulic conductivity as a function of water potential
    n = 2 + 3 / B
    k = KS * math.pow((AE / WP), n)
    return k

def CalculateHydraulicProperties(N_Horz,pSoilHorizons,pSoilModelLayer,bNotUseFC_PWP_Sat_WC):
    for i in range(1, N_Horz+1):
        Clay = pSoilHorizons.Clay[i]
        Sand = pSoilHorizons.Sand[i]
        Silt = pSoilHorizons.Silt[i]
        pSoilHorizons.AE_Pot[i] = AE(Sand, Clay)
        pSoilHorizons.B_Val[i] = B(Sand, Clay)
        if i not in pSoilHorizons.FC_WP or pd.isna(pSoilHorizons.FC_WP[i]) or pSoilHorizons.FC_WP[i] <= 0 or bNotUseFC_PWP_Sat_WC:
            pSoilHorizons.FC_WP[i] = WPFC(Clay, Silt)
        pSoilHorizons.PWP_WP[i] = -1500
        if i not in pSoilHorizons.Bulk_Dens or pd.isna(pSoilHorizons.Bulk_Dens[i]) or pSoilHorizons.Bulk_Dens[i] <= 0 or bNotUseFC_PWP_Sat_WC:
            pSoilHorizons.Bulk_Dens[i] = BD(Sand, Clay)
        if i not in pSoilHorizons.Sat_WC or pd.isna(pSoilHorizons.Sat_WC[i]) or pSoilHorizons.Sat_WC[i] <= 0 or bNotUseFC_PWP_Sat_WC:
            pSoilHorizons.Sat_WC[i] = WS(Sand, Clay)
        if i not in pSoilHorizons.FC_WC or pd.isna(pSoilHorizons.FC_WC[i]) or pSoilHorizons.FC_WC[i] <= 0 or bNotUseFC_PWP_Sat_WC: 
            pSoilHorizons.FC_WC[i] = WC(pSoilHorizons.Sat_WC[i], pSoilHorizons.FC_WP[i], pSoilHorizons.AE_Pot[i], pSoilHorizons.B_Val[i])
        if i not in pSoilHorizons.PWP_WC or pd.isna(pSoilHorizons.PWP_WC[i]) or pSoilHorizons.PWP_WC[i] <= 0 or bNotUseFC_PWP_Sat_WC: 
            pSoilHorizons.PWP_WC[i] = WC(pSoilHorizons.Sat_WC[i], pSoilHorizons.PWP_WP[i], pSoilHorizons.AE_Pot[i], pSoilHorizons.B_Val[i])
        pSoilHorizons.Number_Of_Sublayers[i] = round(pSoilHorizons.Horizon_Thickness[i] / Thickness_Model_Layers)
        
        #print(f'{i} FC_WP:{pSoilHorizons.FC_WP[i]} Bulk_Dens:{pSoilHorizons.Bulk_Dens[i]} FC_WC:{pSoilHorizons.FC_WC[i]} PWP_WC:{pSoilHorizons.PWP_WC[i]}')
    #'Distribute properties for each model layer of thickness 0.1 m
    Cum_J = 1
    for i in range(1, N_Horz+1):
        NL = pSoilHorizons.Number_Of_Sublayers[i]
        k = Cum_J
        L = (k + NL - 1)
        for j in range(k, L+1):
            pSoilModelLayer.Air_Entry_Potential[j] = pSoilHorizons.AE_Pot[i]
            pSoilModelLayer.B_value[j] = pSoilHorizons.B_Val[i]
            pSoilModelLayer.WP_At_FC[j] = pSoilHorizons.FC_WP[i]
            pSoilModelLayer.WP_At_PWP[j] = pSoilHorizons.PWP_WP[i]
            pSoilModelLayer.FC_Water_Content[j] = pSoilHorizons.FC_WC[i]
            pSoilModelLayer.PWP_Water_Content[j] = pSoilHorizons.PWP_WC[i]
            pSoilModelLayer.Plant_Available_Water_Content[j] = pSoilModelLayer.FC_Water_Content[j] - pSoilModelLayer.PWP_Water_Content[j]
            pSoilModelLayer.Bulk_Density[j] = pSoilHorizons.Bulk_Dens[i]
            pSoilModelLayer.Saturation_Water_Content[j] = pSoilHorizons.Sat_WC[i]
            #pSoilModelLayer.Layer_Thickness[j] = Thickness_Model_Layers
            
            pSoilModelLayer.Clay_Fraction[j] = pSoilHorizons.Clay[i] / 100.0   #11052024
            pSoilModelLayer.Fraction_Of_Sand[j] = pSoilHorizons.Sand[i] / 100 #'Convert percent to fraction
            pSoilModelLayer.Fraction_Of_Silt[j] = pSoilHorizons.Silt[i] / 100 #'Convert percent to fraction
            pSoilModelLayer.Percent_Soil_Organic_Matter[j] = pSoilHorizons.Percent_Soil_Organic_Matter[i]
        Cum_J = L + 1
    pSoilModelLayer.Number_Model_Layers = Cum_J - 1
    
    for i in range(1,pSoilModelLayer.Number_Model_Layers + 1):
        pSoilModelLayer.Layer_Thickness[i] = Thickness_Model_Layers #m  The thickness of all model layers is 0.1 m   'MINGLIANG 11/10/2025 
    
    #print(f'pSoilModelLayer.Number_Model_Layers:{pSoilModelLayer.Number_Model_Layers}')
    #pSoilModelLayer.Number_Model_Layers = min(MAX_Number_Model_Layers, Cum_J - 1) #05192025LML limit total soil layers to MAX_Number_Model_Layers

def EquilibriumConcentration(Chemical_Mass, WC, DZ, BD, K, Q):
    WD = 1000 #'Water density (kg/m3)
    Gravimetric_WC = WC * WD / BD
    Chemical_Mass /= (DZ * BD)
    A = K * Gravimetric_WC
    B = K * Q + Gravimetric_WC - K * Chemical_Mass
    C = -Chemical_Mass
    return (-B + math.sqrt(B * B - 4 * A * C)) / (2 * A)

def WaterAndNTransport(DOY, pSoilModelLayer, pSoilState, net_irrigations, WaterNConc, 
                       Prec, pCS_Fertilization, Nitrate_Fraction, 
                       AutoIrrigations, pSoilFlux, CropActive, pETState, 
                       Water_Depth_To_Refill_fc, Auto_Irrigation,
                       Recommended_N_Fertilization, Nitrate_N_Recommended, Crop_Number):
    #'This subroutine only transport nitrate N. Ammonium N only moves down the soil when transformed to nitrate
    Chem_Mass = dict()
    WC = dict()
    FC = dict()
    dz = dict()
    BD = dict()
    CO = dict()
    C = dict() #'Chemical concentration in the soil solution (kg/kg)
    WD = 1000  #'water density in kg/m3
    
    if DOY == 1: 
        Adj_DOY = 365
    else: 
        Adj_DOY = DOY - 1
    
    Drainage = 0 #'Initialize drainage flux
    Chemical_Leaching = 0
    #'Calculates initial soil water profile (kg/m2 or mm) and total chemical mass in the soil profile (kg/m2)
    Initial_Profile_Chemical_Mass = 0
    Initial_Soil_Water_Profile = 0
    Number_Of_Layers = pSoilModelLayer.Number_Model_Layers
    for Layer in range(1, Number_Of_Layers + 1):
        Chem_Mass[Layer] = pSoilState.Nitrate_N_Content[DOY][Layer]
        WC[Layer] = pSoilState.Water_Content[DOY][Layer]
        FC[Layer] = pSoilModelLayer.FC_Water_Content[Layer]
        dz[Layer] = pSoilModelLayer.Layer_Thickness[Layer]
        BD[Layer] = pSoilModelLayer.Bulk_Density[Layer]
        Initial_Soil_Water_Profile = Initial_Soil_Water_Profile + WC[Layer] * dz[Layer] * WD
        Initial_Profile_Chemical_Mass = Initial_Profile_Chemical_Mass + Chem_Mass[Layer]

    #Mingliang 7/20/2025
    NID = net_irrigations[DOY] #'Moved outside auto irrigation if statement
    if Auto_Irrigation:
        Number_Of_Events = AutoIrrigations.Number_Of_Auto_Entries
        for i in range(1, Number_Of_Events + 1):
            if AutoIrrigations.Events[i].DOY_To_Start_Auto_Irrigation == DOY:
                pSoilState.Auto_Irrigation = True
                Method = AutoIrrigations.Events[i].Scheduling_Method
                if Method == 1:
                    pSoilState.MAD = AutoIrrigations.Events[i].Maximum_Allowable_PAW_Depletion
                    pSoilState.PAW_Trigger = True
                    pSoilState.CWSI_Trigger = False
                else:
                    pSoilState.Max_Allowed_CWSI = AutoIrrigations.Events[i].Maximum_Allowable_CWSI
                    pSoilState.PAW_Trigger = False
                    pSoilState.CWSI_Trigger = True
                
            if AutoIrrigations.Events[i].DOY_To_Stop_Auto_Irrigation == DOY:
                pSoilState.Auto_Irrigation = False
            
            if AutoIrrigations.Events[i].DOY_For_Refill_Irrigation == DOY:
                pSoilState.Refill_Today = True
                pSoilState.Soil_Depth_To_Refill = AutoIrrigations.Events[i].Refill_Depth
    else: #'Mingliang 7/20/2025  Determine PAW depletion when auto irrigation is false
        PAW_Depletion_Today = 0
        for Layer in range(1, Number_Of_Layers + 1):
            Layer_Root_Fraction = pETState.Root_Fraction[Layer]
            #'PAW_Depletion_Today is profile depletion prorated by fraction of roots in each layer
            PAW_Depletion_Today += (1 - (WC[Layer] - pSoilModelLayer.PWP_Water_Content[Layer]) / (pSoilModelLayer.FC_Water_Content[Layer] - pSoilModelLayer.PWP_Water_Content[Layer])) * Layer_Root_Fraction
            if Layer > 1 and Layer_Root_Fraction < 1e-12:
                break #'All layers with roots plus one extra layer are refilled. Leave the loop
        pSoilState.PAW_Depletion[DOY] = PAW_Depletion_Today
        
    #'Find irrigation events
    
    
    if (pSoilState.Refill_Today or pSoilState.Auto_Irrigation) and NID <= 0.0:
       NID = SetAutoIrrigation(DOY, pSoilState.PAW_Trigger, pSoilState.CWSI_Trigger, Number_Of_Layers, 
                               pSoilState.MAD, pSoilState.Max_Allowed_CWSI, pSoilState.Refill_Today, 
                               pSoilState.Soil_Depth_To_Refill, pSoilState, pETState, 
                               pSoilModelLayer,Water_Depth_To_Refill_fc)
       net_irrigations[DOY] = NID
       if pSoilState.Refill_Today: 
           pSoilState.Refill_Today = False

    #Prec = ReadInputs.Precip(DOY)


    #'Begin Mingliang 7/12/2025
    Nitrate_N_Fertilization = 0.
    Ammonium_N_Fertilization = 0.
    if Recommended_N_Fertilization: #LML note: might overwrite existing fertilization
        #'Fertilizer recommendation is expressed only as the mass of N-nitrate to apply
        Nitrate_N_Fertilization = Nitrate_N_Recommended
        pCS_Fertilization.Nitrate_Fertilization_Rate[DOY] = Nitrate_N_Fertilization #'kg/m2
        #Crop.RecommendedNFertilization = False
    else:
        Nitrate_N_Fertilization = pCS_Fertilization.Nitrate_Fertilization_Rate[DOY] #'kg/m2
        Ammonium_N_Fertilization = pCS_Fertilization.Ammonium_Fertilization_Rate[DOY] #'kg/m2

    #Fertilization_Rate(DOY) = Nitrate_N_Fertilization + Ammonium_N_Fertilization
    #'END Mingliang 7/12/2025

    #'Find fertilization event. THIS WILL BE LATER IMPLEMENTED IN A FERTILIZATION SUB. NOTE: ONLY NITRATE N IS CONSIDERED HERE
    #Nitrate_N_Fertilization = Mineral_Fertilization_Rate * (Nitrate_Fraction / 100) / 10000.0 #'Convert kg/ha to kg/m2
    #Chem_Mass[1] += Nitrate_N_Fertilization #'Mineral fertilizer added to the top layer
    
    #Nitrate_N_Fertilization = ReadInputs.NitrateFertilizationRate(DOY) 'kg/m2
    #Ammonium_N_Fertilization = ReadInputs.AmmoniumFertilizationRate(DOY) 'kg/m2
    pSoilFlux.Fertilization_Rate[DOY] = Nitrate_N_Fertilization + Ammonium_N_Fertilization
    pSoilState.Nitrate_N_Content[DOY][2] += Nitrate_N_Fertilization #'NO3-N fertilizer added to the second layer
    pSoilState.Ammonium_N_Content[DOY][2] += Ammonium_N_Fertilization #'NH4-N fertilizer added to the second layer, BUT NOT transported by water
    Chem_Mass[2] += Nitrate_N_Fertilization #'Only nitrate is considered for water transport

    Water_Flux_In = NID + Prec
    Irrig_Chemical_Conc = WaterNConc
    Precip_Chemical_Conc = 0
    Water_Chemical_Concentration = 0
    if Water_Flux_In > 0: 
        #Water_Chemical_Concentration = (Irrig_Chemical_Conc * NID + Precip_Chemical_Conc * Prec) / Water_Flux_In
        if NID > 0:
            pSoilState.Nitrate_N_In_Water[DOY] = Irrig_Chemical_Conc * NID / 1000000. # 'kgN/m2 Mingliang 7/17/2025
        Water_Chemical_Concentration = (Irrig_Chemical_Conc * NID + Precip_Chemical_Conc * Prec) / Water_Flux_In #'mg/l 'Mingliang June 3
        Water_Chemical_Concentration = Water_Chemical_Concentration / 1000000. #  'Convert mg/l to kg/kg  'Mingliang June 3
    Number_Of_Pulses = 0  #CHECK!!!
    
    #'Calculate pore volume equivalent of each water pulse
    
    if Number_Of_Pulses == 0:
        Water_Depth_Equivalent_Of_One_Pore_Volume = WD * dz[2] * FC[2]
        #Number_Of_Pulses = 1 + int(Water_Flux_In / (0.2 * Water_Depth_Equivalent_Of_One_Pore_Volume))
        Number_Of_Pulses = 1 + int(Water_Flux_In / Water_Depth_Equivalent_Of_One_Pore_Volume)  #'Mingliang 4/23/2025
        if Number_Of_Pulses > 6: Number_Of_Pulses = 6   #'Mingliang 4/23/2025

    #k & Q !!!
    k = 0
    Q = 0
    #print(f'Number_Of_Pulses:{Number_Of_Pulses} Water_Flux_In:{Water_Flux_In} Water_Depth_Equivalent_Of_One_Pore_Volume:{Water_Depth_Equivalent_Of_One_Pore_Volume}')
    Cumulative_Pulse_Deep_Drainage = 0  #'Mingliang 4/23/2025
    Cumulative_Pulse_N_Leaching = 0 #'Mingliang 4/23/2025
    for i in range(1, Number_Of_Pulses + 1):
        Win = Water_Flux_In / Number_Of_Pulses
        Conc_In = Water_Chemical_Concentration
        #'Equilibrate soil solution
        if (k > 0) and (Q > 0):
            for j in range(1, Number_Of_Layers + 1):
                C[j] = EquilibriumConcentration(Chem_Mass[j], WC[j], dz[j], BD[j], k, Q)
        else:
            for j in range(1, Number_Of_Layers + 1):
                C[j] = Chem_Mass[j] / (dz[j] * WC[j] * WD)

        j = 1
        Wout = 0
        Conc_Out = 0
        while (j <= Number_Of_Layers) and (Win > 0): #'infiltration calculation
            Original_Water_Depth = dz[j] * WD * WC[j]
            Water_Depth_To_Reach_Field_Capacity = (FC[j] - WC[j]) * dz[j] * WD
            #'Determine water and chemical transport
            if Win > Water_Depth_To_Reach_Field_Capacity: 
                Wout = Win - Water_Depth_To_Reach_Field_Capacity
                if Wout <= Original_Water_Depth:
                    Conc_Out = C[j]
                else:
                    Conc_Out = (Original_Water_Depth * C[j] + (Wout - Original_Water_Depth) * Conc_In) / Wout
              
                WC[j] = FC[j]
            else:
                Wout = 0
                Conc_Out = 0
                WC[j] = WC[j] + Win / (WD * dz[j])
            Mass_change = Win * Conc_In - Wout * Conc_Out
            if Mass_change < 0 and abs(Mass_change) > Chem_Mass[j]: 
                Mass_change = -Chem_Mass[j]
                Conc_Out = (Win * Conc_In - Mass_change) / Wout
                Chem_Mass[j] = 0
            else:
                Chem_Mass[j] = Chem_Mass[j] + Mass_change
            
            Win = Wout
            Conc_In = Conc_Out
            j += 1
        Drainage = Wout     #'in mm/day = kg/m2/day
        Chemical_Leaching = Wout * Conc_Out
        
        Cumulative_Pulse_Deep_Drainage += Drainage #'mm   'Mingliang 4/23/2025
        Cumulative_Pulse_N_Leaching += Chemical_Leaching #'kg/m2 'Mingliang 4/23/2025
    #'Calculates Final total chemical mass in the soil profile (kg/m2)
    Final_Profile_Chemical_Mass = 0
    for L in range(1, Number_Of_Layers + 1):
        Final_Profile_Chemical_Mass += Chem_Mass[L]
    pSoilFlux.Chemical_Balance[DOY] = (Initial_Profile_Chemical_Mass + Water_Flux_In * Water_Chemical_Concentration + Nitrate_N_Fertilization \
               - (Final_Profile_Chemical_Mass + Cumulative_Pulse_N_Leaching)) * 10000 #'Convert kg/m2 to kg/ha
    
    if math.fabs(pSoilFlux.Chemical_Balance[DOY]) > 0.0000000001:
        print('Chemical Balance Error')
        exit()
        
    #'Calculates final soil water profile (kg/m2 or mm)
    Final_Soil_Water_Profile = 0
    for L in range(1, Number_Of_Layers + 1):
        Final_Soil_Water_Profile += WC[L] * dz[L] * WD
    pSoilFlux.Water_Balance[DOY] = (Initial_Soil_Water_Profile + Water_Flux_In - (Final_Soil_Water_Profile + Cumulative_Pulse_Deep_Drainage))
    
    if math.fabs(pSoilFlux.Water_Balance[DOY]) > 0.0000000001:
        print('Water Balance Error')
        exit()

    #'Update water and nitrogen content after transport
    for Layer in range(1, Number_Of_Layers + 1):
         pSoilState.Water_Content[DOY][Layer] = WC[Layer]
         pSoilState.Soil_Water_Potential[DOY][Layer] = WP(pSoilModelLayer.Saturation_Water_Content[Layer], pSoilState.Water_Content[DOY][Layer], pSoilModelLayer.Air_Entry_Potential[Layer], pSoilModelLayer.B_value[Layer]) #'Mingliang 4/16/2025
         pSoilState.Nitrate_N_Content[DOY][Layer] = Chem_Mass[Layer]
    pSoilFlux.N_Leaching[DOY] = Cumulative_Pulse_N_Leaching #'kg/m2
    pSoilFlux.Deep_Drainage[DOY] = Cumulative_Pulse_Deep_Drainage  #'mm
    
    if CropActive:
       pSoilFlux.Cumulative_Deep_Drainage_Crop[Crop_Number] += Cumulative_Pulse_Deep_Drainage #'mm
       pSoilFlux.Cumulative_N_Leaching_Crop[Crop_Number] += Cumulative_Pulse_N_Leaching 
       pSoilFlux.Cumulative_Irrigation_Crop[Crop_Number] += NID
       pSoilFlux.Cumulative_Fertilization_Crop[Crop_Number] += Nitrate_N_Fertilization + Ammonium_N_Fertilization
       pSoilFlux.N_Leaching_Accumulated_Crop[DOY][Crop_Number] = pSoilFlux.N_Leaching_Accumulated_Crop[Adj_DOY][Crop_Number] + Cumulative_Pulse_N_Leaching
    
    #print(f'N_Leaching_Accumulated(kg/ha):{pSoilFlux.N_Leaching_Accumulated[DOY]}')
    
    pSoilFlux.Simulation_Total_Deep_Drainage += Cumulative_Pulse_Deep_Drainage #'mm 06112025LML updated
    pSoilFlux.Simulation_Total_N_Leaching += Cumulative_Pulse_N_Leaching
    pSoilFlux.Simulation_Total_Irrigation += NID
    pSoilFlux.Simulation_Total_Fertilization += Nitrate_N_Fertilization + Ammonium_N_Fertilization
    
    #'Calculate daily soil water content output for top, mid, and bottom layers. Mingliang 4/23/2025: I moved this code here from SetAutoIrrigation
    #'Begin Moved Code
    Top50cm_WC = 0
    Mid50cm_WC = 0
    Bottom50cm_WC = 0
    for Layer in range(1, Number_Of_Layers + 1): #'Mingliang 4/23/2025 I DECIDED TO CHANGE THE LAYERS INVOLVED. I WAS NOT INCLUDING THE TOP EVAPORATION LAYER 1
        if Layer >= 1 and Layer <= 5: #Then   'Mingliang 4/23/2025 It was layer 2 to 6
            Top50cm_WC += pSoilState.Water_Content[DOY][Layer]
        elif Layer >= 6 and Layer <= 10: #Then  'Mingliang 4/23/2025 It was layer 7 to 11
            Mid50cm_WC += pSoilState.Water_Content[DOY][Layer]
        elif Layer >= 11 and Layer <= 15: #Then 'Mingliang 4/23/2025 It was layer 12 to 16
            Bottom50cm_WC += pSoilState.Water_Content[DOY][Layer]
    #Next Layer
    pSoilState.Water_Content_Top50cm[DOY] = Top50cm_WC / 5. #'Average of five soil layers
    pSoilState.Water_Content_Mid50cm[DOY] = Mid50cm_WC / 5. #'Average of five soil layers
    pSoilState.Water_Content_Bottom50cm[DOY] = Bottom50cm_WC / 5. #'Average of five soil layers
    #'End Moved Code
    
    #'Begin NEW Mingliang
    #'Calculate daily N mass output for top, mid, and bottom layers. Also N mass leaching.
    Top50cm_N_Mass = 0
    Mid50cm_N_Mass = 0
    Bottom50cm_N_Mass = 0
    for Layer in range(1, Number_Of_Layers + 1):
        if Layer >= 1 and Layer <= 5:
            Top50cm_N_Mass += pSoilState.Nitrate_N_Content[DOY][Layer] + pSoilState.Ammonium_N_Content[DOY][Layer]
        elif Layer >= 6 and Layer <= 10:
            Mid50cm_N_Mass += pSoilState.Nitrate_N_Content[DOY][Layer] + pSoilState.Ammonium_N_Content[DOY][Layer]
        elif Layer >= 11 and Layer <= 15:
            Bottom50cm_N_Mass += pSoilState.Nitrate_N_Content[DOY][Layer] + pSoilState.Ammonium_N_Content[DOY][Layer]

    pSoilState.N_Mass_Top50cm[DOY] = Top50cm_N_Mass * 10000. #05192025COS_LML TOTAL / 5. #'Average of five soil layers. Convert kg/m2 to kg/ha       'Mingliang 4/23/2025
    pSoilState.N_Mass_Mid50cm[DOY] = Mid50cm_N_Mass * 10000. #05192025COS_LML TOTAL / 5. #'Average of five soil layers. Convert kg/m2 to kg/ha       'Mingliang 4/23/2025
    pSoilState.N_Mass_Bottom50cm[DOY] = Bottom50cm_N_Mass * 10000. #05192025COS_LML TOTAL / 5. #'Average of five soil layers. Convert kg/m2 to kg/ha       'Mingliang 4/23/2025
    #'END NEW Mingliang
    
    return NID,(Nitrate_N_Fertilization + Ammonium_N_Fertilization)

def SoilTemperature(DOY,Max_Air_Temperature,Min_Air_Temperature,pSoilModelLayer,pSoilState):
    Constant_Pi = 3.141592654
    Time_Phase = 8
    #Max_Air_Temperature = ReadInputs.MaximumTemperature(DOY)
    #Min_Air_Temperature = ReadInputs.MinimumTemperature(DOY)
    Average_Daily_Temperature = (Max_Air_Temperature + Min_Air_Temperature) / 2.
    Amplitude = (Max_Air_Temperature - Min_Air_Temperature) / 2.
    Thermal_Conductivity = 1.4 #'J/(s m K)
    Volumetric_Specific_Heat_Mineral = 2390000. #
    Volumetric_Specific_Heat_Water = 4180000. #
    Mineral_Volumetric_Fraction = 0.5
    Water_Volumetric_Fraction = 0.2
    Soil_Volumetric_Specific_Heat = Mineral_Volumetric_Fraction * Volumetric_Specific_Heat_Mineral + Water_Volumetric_Fraction * Volumetric_Specific_Heat_Water
    Thermal_Diffusivity = Thermal_Conductivity / Soil_Volumetric_Specific_Heat
    Angular_Frequency_h = (2. * Constant_Pi) / 24.   #' 1/h  Angular Frequency Of The Oscillation
    Angular_Frequency_s = Angular_Frequency_h / 3600. #'1/h Angular Frequency Of The Oscillation
    Damping_Depth = math.sqrt(2. * Thermal_Diffusivity / Angular_Frequency_s) #'m
    Node_Depth = -0.05
    Number_Of_Soil_Layers = pSoilModelLayer.Number_Model_Layers #20 #'Currently only calculating the temperature of the top 5 layers (~0.5 m)
    for Layer in range(1, Number_Of_Soil_Layers + 1):
        Node_Depth = Node_Depth + pSoilModelLayer.Layer_Thickness[Layer]
        Mean_Soil_Temperature = 0
        for Hour in range(1, 25):
            Soil_Temperature = Average_Daily_Temperature + Amplitude * math.exp(-Node_Depth / Damping_Depth) * math.sin(Angular_Frequency_h * (Hour - Time_Phase) - Node_Depth / Damping_Depth)
            pSoilState.Layer_Hourly_Soil_Temperature[Layer][Hour] = Soil_Temperature
            Mean_Soil_Temperature = Mean_Soil_Temperature + Soil_Temperature / 24.
        pSoilState.Layer_Daily_Soil_Temperature[Layer] = Mean_Soil_Temperature

def PotET(DOY, Potential_Crop, Crop_Active, pCropState, pCropParameter, pCS_Weather, pETState):
    Reference_crop_ET = pCS_Weather.FAO_ETo[DOY]
    if Reference_crop_ET < 0.01: Reference_crop_ET = 0.01
    Wind_Speed = pCS_Weather.Wind_Speed[DOY]
    Minimum_Relative_Humidity = pCS_Weather.RHmin[DOY]
    if Crop_Active:
        if Potential_Crop:
            Potential_Total_Canopy_Cover = pCropState.Potential_Total_Canopy_Cover[DOY]
            Potential_Green_Canopy_Cover = pCropState.Potential_Green_Canopy_Cover[DOY]
        else:
            Total_Canopy_Cover = pCropState.Total_Canopy_Cover[DOY]
            Green_Canopy_Cover = pCropState.Green_Canopy_Cover[DOY]
    
        Crop_Height = pCropState.Crop_Height[DOY]

        Midseason_ET_Crop_Coefficient = pCropParameter.Midseason_Crop_Coefficient
        Maximum_Canopy_Cover = pCropParameter.Maximum_Green_Canopy_Cover
        
        #'If Main.GetTreeFruitCrop And (DAP >= Main.GetFruitHarvestDay) Then Today_Kc_transp = 0.2  THIS WILL BE ACTIVATED IF DEALING WITH TREE FRUITS AFTER HARVEST
        #'    Else
        
        #'End If
        if Potential_Crop:
            Today_Kc_transp = Midseason_ET_Crop_Coefficient * Potential_Green_Canopy_Cover / Maximum_Canopy_Cover
            pETState.Potential_Crop_Transpiration[DOY] = Reference_crop_ET * Today_Kc_transp
            Kcmax = max(1.1 + (0.04 * (Wind_Speed - 2) - 0.004 * (Minimum_Relative_Humidity - 45)) * math.pow(Crop_Height / 3, 0.3), 0.05 + Today_Kc_transp)
            #Today_Kc_evap = max(0.05, Kcmax - Midseason_ET_Crop_Coefficient * Total_Canopy_Cover / Maximum_Canopy_Cover) #'accounts for total shading from the canopy (green + senesced)
            Today_Kc_evap = max(0.05, Kcmax - Midseason_ET_Crop_Coefficient * Potential_Total_Canopy_Cover / Maximum_Canopy_Cover) #'accounts for total shading from the canopy (green + senesced)
            pETState.Potential_Soil_Water_Evaporation[DOY] = Reference_crop_ET * Today_Kc_evap
            pETState.Potential_ET[DOY] = pETState.Potential_Crop_Transpiration[DOY] + pETState.Potential_Soil_Water_Evaporation[DOY]
        else:
            Today_Kc_transp = Midseason_ET_Crop_Coefficient * Green_Canopy_Cover / Maximum_Canopy_Cover
            Kcmax = max(1.1 + (0.04 * (Wind_Speed - 2) - 0.004 * (Minimum_Relative_Humidity - 45)) * math.pow((Crop_Height / 3), 0.3), 0.05 + Today_Kc_transp)
            Today_Kc_evap = max(0.05, Kcmax - Midseason_ET_Crop_Coefficient * Total_Canopy_Cover / Maximum_Canopy_Cover) #'accounts for total shading from the canopy (green + senesced)
            pETState.Potential_Transpiration[DOY] = Reference_crop_ET * Today_Kc_transp
            pETState.Potential_Soil_Water_Evaporation[DOY] = Reference_crop_ET * Today_Kc_evap
            pETState.Potential_ET[DOY] = pETState.Potential_Transpiration[DOY] + pETState.Potential_Soil_Water_Evaporation[DOY]
    else:
        Today_Kc_transp = 0
        Crop_Height = 0
        Kcmax = max(1.1 + (0.04 * (Wind_Speed - 2.) - 0.004 * (Minimum_Relative_Humidity - 45.)) * math.pow(Crop_Height / 3., 0.3), 0.05 + Today_Kc_transp)
        Today_Kc_evap = Kcmax
        pETState.Potential_Soil_Water_Evaporation[DOY] = Reference_crop_ET * Today_Kc_evap
        pETState.Potential_ET[DOY] = pETState.Potential_Soil_Water_Evaporation[DOY]


def ActualTranspiration(DOY, pCropParameter, pSoilModelLayer, pCropState, pETState, pSoilState):
    #'Calculate water uptake assumed equal to actual transpiration
    
    Layer_Plant_Hydraulic_Conductance = dict()
    Layer_Root_Fraction_Adjustment = dict()
    #Adjusted_Root_Fraction = dict()
    Soil_WP = dict() #(366,20)
    for i in range(1,367):
        Soil_WP[i] = dict()
    WP_At_FC = dict()
    WP_At_PWP = dict()
    Air_Entry_Potential = dict()
    Root_Activity_Factor = dict()
    Soil_Water_Uptake = dict()
    
    
    WD = 1000 #'Water density in kg/m3
    #'Read parameters
    LeafWP_Wilt = pCropParameter.LWP_Permanent_Wilting
    Number_Of_Soil_Layers = pSoilModelLayer.Number_Model_Layers
    for i in range(2, Number_Of_Soil_Layers + 1):
        WP_At_FC[i] = pSoilModelLayer.WP_At_FC[i]
        WP_At_PWP[i] = pSoilModelLayer.WP_At_PWP[i]
        Air_Entry_Potential[i] = pSoilModelLayer.Air_Entry_Potential[i]
    
    Today_Potential_Transpiration = pETState.Potential_Transpiration[DOY]
    Current_green_Canopy_Cover = pCropState.Green_Canopy_Cover[DOY] #'Use yesterday value. Today value not calculated et
    Green_Canopy_Cover_Max = pCropParameter.Maximum_Green_Canopy_Cover
    LeafWP_OnsetStress = pCropParameter.LWP_Onset_Stomatal_Closure
    Root_Depth = pCropState.Root_Depth[DOY]
    
    #'Calculate today's crop maximun water uptake rate (kg/m2/d = mm/d)
    Max_CropWater_Uptake_Full_Canopy = pCropParameter.Maximum_Crop_Water_Uptake
    Today_Crop_Max_Water_Uptake = Max_CropWater_Uptake_Full_Canopy * Current_green_Canopy_Cover / Green_Canopy_Cover_Max
    
    #'Calculate today's expected crop transpiration rate (kg/m2/d = mm/d)
    #'Today_Expected_Crop_Water_Uptake = Minimum(Potential_Transpiration_Full_Canopy, Max_CropWater_Uptake_Full_Canopy) * Current_green_Canopy_Cover / Green_Canopy_Cover_Max
    
    Today_Expected_Crop_Water_Uptake = min(Today_Potential_Transpiration, Today_Crop_Max_Water_Uptake)
    
    #'Calculate plant hydraulic conductivity ((kg^2)/(m2-J-d), the capacity of the vascular system to conduct water, assumes that maximum crop uptake takes place at a soil water potential of zero
    Plant_Hydraulic_Conductance = Today_Crop_Max_Water_Uptake / (-LeafWP_OnsetStress)
                                       
    #'Calculate root fraction per soil layer
    Layer_Bottom_Depth = 0
    Root_Fraction_Sum = 0
    Effective_Root_Depth = max(0, Root_Depth - pSoilModelLayer.Layer_Thickness[i])
    for i in range(2, Number_Of_Soil_Layers + 1):
        Layer_Thickness = pSoilModelLayer.Layer_Thickness[i]
        if Layer_Thickness > 0: 
          Layer_Bottom_Depth += Layer_Thickness
          pETState.Root_Fraction[i] = CalculateRootFraction(Layer_Bottom_Depth, Layer_Thickness, Root_Depth)
          Root_Fraction_Sum = Root_Fraction_Sum + pETState.Root_Fraction[i]
        else:
          i = Number_Of_Soil_Layers
        
    #print(f'DOY:{DOY} Root_Fraction_Sum:{Root_Fraction_Sum}')
    #'Adjust root fraction for shallow soils to ensure that the sum of root fraction of all layers is equal to 1
    if (Root_Depth > Layer_Bottom_Depth) and (Root_Fraction_Sum < 1):
        NewRoot_Fraction_Sum = 0
        for i in range(2, Number_Of_Soil_Layers + 1):
            pETState.Root_Fraction[i] /= Root_Fraction_Sum
            NewRoot_Fraction_Sum += pETState.Root_Fraction[i]
        Root_Fraction_Sum = NewRoot_Fraction_Sum

    
    #'Adjust root fraction based on soil dryness or soil near saturation
    Sum_Root_Fraction_Adjustment = 0
    
    SWP = dict() #(20) As Double 'OJO
    
    for i in range(2, Number_Of_Soil_Layers + 1):
        
        #in some cases Soil_Water_Potential not being updated
        #WC = pSoilState.Water_Content[DOY][i]
        #Sat_WC = pSoilModelLayer.Saturation_Water_Content[i]
        #AEP = pSoilModelLayer.Air_Entry_Potential[i]
        #B_Val = pSoilModelLayer.B_value[i]
        #pSoilState.Soil_Water_Potential[i] = WP(Sat_WC, WC, AEP, B_Val)
        if DOY == 1:
            pre_DOY = 365
        else:
            pre_DOY = DOY - 1
        SWP[i] = pSoilState.Soil_Water_Potential[pre_DOY][i]
        
        Soil_WP[DOY][i] = SWP[i]
        if Soil_WP[DOY][i] <= WP_At_FC[i]:
            Root_Activity_Factor[i] = 1 - math.pow(((SWP[i] - WP_At_FC[i]) / (WP_At_PWP[i] - WP_At_FC[i])), 8) #'Calculate dry end of root activity
        else:
            Root_Activity_Factor[i] = 1 - math.pow(((SWP[i] - WP_At_FC[i]) / (Air_Entry_Potential[i] - WP_At_FC[i])), 20) #'Calculate wet end of root activity
        
        if Root_Activity_Factor[i] > 1: Root_Activity_Factor[i] = 1
        if Root_Activity_Factor[i] < 0: Root_Activity_Factor[i] = 0
        Layer_Root_Fraction_Adjustment[i] = pETState.Root_Fraction[i] * Root_Activity_Factor[i]
        Sum_Root_Fraction_Adjustment += Layer_Root_Fraction_Adjustment[i]
    
    for i in range(2, Number_Of_Soil_Layers + 1):
        if Sum_Root_Fraction_Adjustment <= 1e-12:
            pETState.Adjusted_Root_Fraction[i] = 0
            Layer_Plant_Hydraulic_Conductance[i] = 0
        else:
            pETState.Adjusted_Root_Fraction[i] = Layer_Root_Fraction_Adjustment[i] / Sum_Root_Fraction_Adjustment
            Layer_Plant_Hydraulic_Conductance[i] = Plant_Hydraulic_Conductance * pETState.Adjusted_Root_Fraction[i]
    
    #'Calculate average soil water potential (J/kg)
    Average_Soil_WP = 0
    for i in range(2, Number_Of_Soil_Layers + 1):
        Average_Soil_WP += Soil_WP[DOY][i] * pETState.Adjusted_Root_Fraction[i]
    
    #'Calculate leaf water potential
    if Plant_Hydraulic_Conductance <= 1e-12: 
        Leaf_Water_Pot = LeafWP_Wilt
    else:
        Leaf_Water_Pot = Average_Soil_WP - Today_Expected_Crop_Water_Uptake / Plant_Hydraulic_Conductance
        if Leaf_Water_Pot < LeafWP_OnsetStress:
            Leaf_Water_Pot = (Plant_Hydraulic_Conductance * Average_Soil_WP * (LeafWP_OnsetStress - \
                LeafWP_Wilt) + LeafWP_Wilt * Today_Expected_Crop_Water_Uptake) / (Plant_Hydraulic_Conductance * \
                (LeafWP_OnsetStress - LeafWP_Wilt) + Today_Expected_Crop_Water_Uptake)
        if Leaf_Water_Pot < LeafWP_Wilt: Leaf_Water_Pot = LeafWP_Wilt

        
    #'Calculate crop water uptake (kg/m2/d = mm/d)
    Crop_Water_Uptake = 0
    for i in range(2, Number_Of_Soil_Layers + 1):
        pETState.Soil_Water_Uptake[DOY][i] = Layer_Plant_Hydraulic_Conductance[i] * (Soil_WP[DOY][i] - Leaf_Water_Pot)
        Crop_Water_Uptake = Crop_Water_Uptake + pETState.Soil_Water_Uptake[DOY][i]
        #'Update water content and potential
        pSoilState.Water_Content[DOY][i] -= pETState.Soil_Water_Uptake[DOY][i] / (pSoilModelLayer.Layer_Thickness[i] * WD)
        WC = pSoilState.Water_Content[DOY][i]
        Sat_WC = pSoilModelLayer.Saturation_Water_Content[i]
        AEP = pSoilModelLayer.Air_Entry_Potential[i]
        B_Val = pSoilModelLayer.B_value[i]
        pSoilState.Soil_Water_Potential[DOY][i] = WP(Sat_WC, WC, AEP, B_Val)
        pSoilState.Water_Filled_Porosity[DOY][i] = WC / Sat_WC

    Act_Transp = Crop_Water_Uptake
    #print(f'DOY:{DOY} Act_Transp:{Act_Transp} Today_Potential_Transpiration:{Today_Potential_Transpiration}')
    #'This limits in the case that intercepted precipitation is sufficient to meet the evaporative demand
    #if Act_Transp > Today_Potential_Transpiration: Act_Transp = Today_Potential_Transpiration
    if Crop_Water_Uptake > 0:
        pETState.Water_Stress_Index[DOY] = 1 - (Crop_Water_Uptake / Today_Expected_Crop_Water_Uptake)
        pETState.Actual_Transpiration[DOY] = Crop_Water_Uptake
    else: #'Crop water uptake is negative due to layer water redistribution by roots
        pETState.Actual_Transpiration[DOY] = 0
        pETState.Water_Stress_Index[DOY] = 0

    if pETState.Water_Stress_Index[DOY] < 0.00000001: pETState.Water_Stress_Index[DOY] = 0
    pETState.Total_Transpiration += pETState.Actual_Transpiration[DOY]
    
def CalculateRootFraction(z, dz, Rd):
    if Rd > z: 
        f = dz * (2 * (Rd - z) + dz) / (Rd * Rd)
    elif Rd < (z - dz + 0.00001): 
        f = 0
    else: 
        f = math.pow(((Rd - z + dz) / Rd), 2)
    return f


def ActEvaporation(DOY,pSoilModelLayer,pSoilState,pETState, Crop_Active):
    WD = 1000 #'kg/m3
    Residue_Fraction_Solar_Interception = 0 #'Currently not implemented
    #Percent_Sand_Top_Layer = pSoilModelLayer.Percent_Sand[1]
    Water_Content_Top_layer = pSoilState.Water_Content[DOY][1]
    Permanent_Wilting_Point = pSoilModelLayer.PWP_Water_Content[1]
    Air_Dry_Water_Content = Permanent_Wilting_Point / 3
    #'Evaporation_Soil_Depth = Round(0.169 - 0.001 * Percent_Sand_Top_Layer, 2)
    Pot_Soil_Water_Evap = pETState.Potential_Soil_Water_Evaporation[DOY] * (1 - Residue_Fraction_Solar_Interception)
    
    #09182025LML add min() in cases overly estimated evap
    if Water_Content_Top_layer > Permanent_Wilting_Point: 
        pETState.Actual_Soil_Water_Evaporation[DOY] = min(Pot_Soil_Water_Evap,pSoilModelLayer.Layer_Thickness[1] * WD * (Water_Content_Top_layer - Air_Dry_Water_Content))  #'Soil evaporation in mm/day = kg/m2/day
    elif Water_Content_Top_layer > Air_Dry_Water_Content:
          pETState.Actual_Soil_Water_Evaporation[DOY] = min(Pot_Soil_Water_Evap * math.pow(((Water_Content_Top_layer - Air_Dry_Water_Content) \
                 / (Permanent_Wilting_Point - Air_Dry_Water_Content)), 2),pSoilModelLayer.Layer_Thickness[1] * WD * (Water_Content_Top_layer - Air_Dry_Water_Content))
    else:
          pETState.Actual_Soil_Water_Evaporation[DOY] = 0
          
    #'Update water content and potential of top layer
    pSoilState.Water_Content[DOY][1] -= pETState.Actual_Soil_Water_Evaporation[DOY] / (pSoilModelLayer.Layer_Thickness[1] * WD)
    pETState.Cumulative_Soil_Water_Evaporation += pETState.Actual_Soil_Water_Evaporation[DOY]   #'Mingliang 4/17/2025
    
    #Testing?
    if Crop_Active:
        pETState.Crop_Soil_Water_Evaporation += pETState.Actual_Soil_Water_Evaporation[DOY] #'Mingliang 4/26/2025
    WC = pSoilState.Water_Content[DOY][1]
    Sat_WC = pSoilModelLayer.Saturation_Water_Content[1]
    AEP = pSoilModelLayer.Air_Entry_Potential[1]
    B_Val = pSoilModelLayer.B_value[1]
    
    #if WC < 1.e-12: WC = 1.e-12  #06032025 LML
    
    pSoilState.Soil_Water_Potential[DOY][1] = WP(Sat_WC, WC, AEP, B_Val)
    pSoilState.Water_Filled_Porosity[DOY][1] = WC / Sat_WC
    
def InitETState(pETState):
    for i in range(1,367):
        pETState.Potential_Transpiration[i] = 0.0
        pETState.Potential_Crop_Transpiration[i] = 0.0
        pETState.Potential_Soil_Water_Evaporation[i] = 0.0
        pETState.Potential_ET[i] = 0.0
        pETState.Actual_Transpiration[i] = 0.0
        pETState.Actual_Soil_Water_Evaporation[i] = 0.0
        pETState.Water_Stress_Index[i] = 0.0
        pETState.Soil_Water_Uptake[i] = dict()
        for j in range(1,21):
            pETState.Soil_Water_Uptake[i][j] = 0.0
    for i in range(1,31):
        pETState.Root_Fraction[i] = 0.0
        pETState.Adjusted_Root_Fraction[i] = 0.
    pETState.Total_Transpiration = 0.
    pETState.Cumulative_Soil_Water_Evaporation = 0.0

def ClearETState(pETState):
    for i in range(1,367):
        pETState.Potential_Transpiration[i] = 0.0
        pETState.Potential_Crop_Transpiration[i] = 0.0
        pETState.Potential_Soil_Water_Evaporation[i] = 0.0
        pETState.Potential_ET[i] = 0.0
        pETState.Actual_Transpiration[i] = 0.0
        pETState.Actual_Soil_Water_Evaporation[i] = 0.0
        pETState.Water_Stress_Index[i] = 0.0
    pETState.Total_Transpiration = 0