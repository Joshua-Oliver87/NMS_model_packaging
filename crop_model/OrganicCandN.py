#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Nov  5 10:55:46 2024

@author: liuming
"""
import math
from .SoilHydrolics import *

Empirical_Constant_m = 0.5
Empirical_Constant_n = 6.
#Microbial_Biomass_Synthesis_Efficiency = 0.0 #0.5
SOC_C_N_Ratio = 20.0 #12222025COS changed 12 #'kg/kg

def OxidationTemperatureFunction(Layer,pSoilstate):
    #'Hard-Coded Parameters
    #'The parameters for this function are for microbially-mediated N transformations and carbon decomposition
    T_Min = -5.0
    T_Opt = 35.0
    T_Max = 50.0
    
    Temperature_Function = 0
    for Hour in range(1, 25):
        Air_Temperature = pSoilstate.Layer_Hourly_Soil_Temperature[Layer][Hour]
        if Air_Temperature < T_Min or Air_Temperature > T_Max:
            Hourly_TF = 0
        else:
            Q = (T_Min - T_Opt) / (T_Opt - T_Max)
            Hourly_TF = (math.pow(Air_Temperature - T_Min, Q) * (T_Max - Air_Temperature)) / (math.pow(T_Opt - T_Min, Q) * (T_Max - T_Opt))
            if Hourly_TF > 1: Hourly_TF = 1.0
            if Hourly_TF < 0.0000001: Hourly_TF = 0.0000001
        Temperature_Function += Hourly_TF / 24.0
    return Temperature_Function

def OxidationMoistureFunction(Function_Value_At_Saturation, WFP):
    #'WFP is water-filled porosity
    #Dim WFP_min As Double  'Low end WFP value for zero response
    #Dim WFP_low As Double  'Lower value for maximum response
    #Dim WFP_high As Double 'Higher value for maximum response
    Moisture_Function = 0.0 #As Double 'Moisture response function (0-1)
    
    #'Hard-Coded Parameters
    WFP_min = 0.1
    WFP_low = 0.5
    WFP_high = 0.7
    
    if WFP >= WFP_min and WFP < WFP_low:
        Moisture_Function = ((WFP - WFP_min) / (WFP_low - WFP_min))
    elif WFP >= WFP_low and WFP <= WFP_high:
        Moisture_Function = 1
    elif WFP > WFP_high and WFP <= 1:
        Moisture_Function = Function_Value_At_Saturation + (1 - Function_Value_At_Saturation) \
                            * math.pow((1 - WFP) / (1 - WFP_high), 2)
    
    if Moisture_Function < 0: Moisture_Function = 0
    return Moisture_Function

def pHFunction(pH):
    #'Hard-Coded Parameters
    pH_Min = 3.5
    pH_Max = 6.5
    
    pH_F = (pH - pH_Min) / (pH_Max - pH_Min)
    if pH_F < 0: pH_F = 0.
    if pH_F > 1: pH_F = 1.
    return pH_F


def ClearArrays(pSoilstate,pSoilFlux):
    for i in range(1,367):
        pSoilFlux.Mineralization_Top_Three_Layers[i] = 0
        pSoilFlux.Mineralization_Next_Three_Layers[i] = 0
        pSoilFlux.Daily_Nitrification[i] = 0
        pSoilFlux.Daily_Profile_SOC_Pool_Oxidation[i] = 0
        pSoilFlux.Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM[i] = 0
        pSoilFlux.Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool[i] = 0

    for i in range(1,7):
        pSoilstate.Oxidation_Water_Function[i] = 0
        pSoilstate.Oxidation_Temperature_Function[i] = 0
        pSoilFlux.Clay_Fraction[i] = 0

    for i in range(1,367):
        pSoilstate.SOM_C_Pool[i] = dict()
        pSoilstate.SOM_N_Pool[i] = dict()
        pSoilstate.Residue_C_Pool[i] = dict()
        pSoilstate.Residue_N_Pool[i] = dict()
        
        pSoilFlux.Layer_Mineralization[i] = dict()
        
        for j in range(1,21):
            pSoilstate.SOM_C_Pool[i][j] = 0
            pSoilstate.SOM_N_Pool[i][j] = 0
            pSoilstate.Residue_C_Pool[i][j] = 0
            pSoilstate.Residue_N_Pool[i][j] = 0
            
            pSoilFlux.Layer_Mineralization[i][j] = 0

    #'Clear accumulators
    #pSoilFlux.Cumulative_Mineralization_Top_Three_Layers_Crop1 = 0
    #pSoilFlux.Cumulative_Mineralization_Next_Three_Layers_Crop1 = 0
    #pSoilFlux.Cumulative_Mineralization_Top_Three_Layers_Crop2 = 0
    #pSoilFlux.Cumulative_Mineralization_Next_Three_Layers_Crop2 = 0
    pSoilFlux.Cumulative_Mineralization_Top_Three_Layers_All_Days = 0
    pSoilFlux.Cumulative_Mineralization_Next_Three_Layers_All_Days = 0

def Mineralization(DOY, Crop_Number, pSoilModelLayer, pSoilState, pSoilFlux, Crop_Active):
    #Residue_Mass = dict() #(6) As Double
    #Residue_N_Concentration = dict() #(6) As Double
    #Percent_SOM = dict() #(6) As Double
    Soil_Mass = dict() #(6) As Double
    volumetric_Water_Content = dict() #(6) As Double
    Layer_Thickness = dict() #(6) As Double
    Bulk_Density = dict() #(6) As Double
    Clay_Fraction = dict() #(6) As Double
    
    #'Initialize state variables
    #'If DOY = Main.RunFirstDOY Then Call Initialize
    
    #'Hardcoded parameters
    #Carbon_Fraction_In_Residues = 0.4
    #SOC_C_N_Ratio = 12 #'kg/kg
    #Microbial_Biomass_Synthesis_Efficiency = 0.5 #'Dimensionless
    #Empirical_Constant_n = 6
    #Empirical_Constant_m = 0.5
    #'Residue_Oxidation_Rate = 0.035 #'(1/day) #'Residue mineralization not implemented yet
    
    #pSoilState.SOC_Oxidation_Rate = 0.0005 #'(1/day)  #'0.008 for long-term amd 0.1 for short-term mineralization C-Farm: 0.00015
    
    #12222025 COS
    SOM_C_Fraction = 0.58
    POM_Maximum_Decomposition_Rate = 1.7 #0.8  #'1/year Rate at very low POM fraction
    POM_Minimum_Decomposition_Rate = 0.008  #'1/year Rate at very high POM fraction
    Par_a = 6.5
    Par_b = 0.6
    Alpha = 3
    
    Number_Of_Soil_Layers = 6 #'Only the 6 top layers are considered for mineralization
    pSoilFlux.Daily_Profile_SOC_Pool_Oxidation[DOY] = 0
    pSoilFlux.Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM[DOY] = 0
    pSoilFlux.Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool[DOY] = 0
    for Layer in range (1, Number_Of_Soil_Layers + 1):
        Layer_Thickness[Layer] = pSoilModelLayer.Layer_Thickness[Layer] #'m
        #'Organic residues, including plants, manure, and others to be implemented later
    #'    Residue_Mass(Layer) = 0 #'kg/ha
    #'    Residue_N_Concentration(Layer) = 0 #'kg/kg
        Bulk_Density[Layer] = pSoilModelLayer.Bulk_Density[Layer] #'Mg/m3
        #Clay_Fraction[Layer] = pSoilModelLayer.Clay_Fraction[Layer]
        volumetric_Water_Content[Layer] = pSoilState.Water_Content[DOY][Layer]
        Soil_Mass[Layer] = Bulk_Density[Layer] * 1000. * pSoilModelLayer.Layer_Thickness[Layer] #'kg/m2 in the soil layer thickness. Bulk density converted from Mg/m3 to kg/m3
        #'Initialization of pools
        pSoilState.SOM_C_Pool[DOY][Layer] = pSoilState.Soil_Organic_Carbon[DOY][Layer]
        pSoilState.SOM_N_Pool[DOY][Layer] = pSoilState.Soil_Organic_Nitrogen[DOY][Layer]
    #'    If Residue_Mass(Layer) > 0 Then
    #'        Residue_C_Pool(DOY, Layer) = Residue_Mass(Layer) * Carbon_Fraction_In_Residues
    #'        Residue_N_Pool(DOY, Layer) = Residue_N_Concentration(Layer) * Residue_Mass(Layer)
    #'    End If
        #'Miscellaneous values by soil layer
    #'    Residue_CN_Ratio(Layer) = Residue_C_Pool(Layer) / Residue_N_Pool(Layer) #'***** To be implemented later
        #Saturation_Carbon_Conc_g_Per_kg = (21.1 + 37.5 * Clay_Fraction[Layer]) #'g/kg
        #pSoilState.Saturation_Carbon_Conc_kg_Per_m2 = Saturation_Carbon_Conc_g_Per_kg * Soil_Mass[Layer] / 1000. #  #'kg/ha
    #'    Maximum_Humification_Rate(Layer) = 0.09 + 0.11 * (1 - Exp(-5.5 * Clay_Fraction(Layer))) #'(1/day) ***** To be implemented later
    
        SOM_Percent = ((pSoilState.SOM_C_Pool[DOY][Layer] / SOM_C_Fraction) / Soil_Mass[Layer]) * 100.
        Fraction_Silt_Plus_Clay = pSoilModelLayer.Fraction_Of_Silt[Layer] + pSoilModelLayer.Clay_Fraction[Layer]
        MAOM_Saturation_Capacity = Par_a * pow(Fraction_Silt_Plus_Clay, Par_b) #'percent
        MAOM_Fraction_Of_SOC = MAOM_Saturation_Capacity / (MAOM_Saturation_Capacity + SOM_Percent)
        POM_Fraction_Of_SOC = 1. - MAOM_Fraction_Of_SOC
        Oxidation_Rate_Of_POM_SOC_Under_Optimal_Temp_And_Water = POM_Minimum_Decomposition_Rate + (POM_Maximum_Decomposition_Rate - POM_Minimum_Decomposition_Rate) \
            * math.exp(-Alpha * POM_Fraction_Of_SOC) #'1/year
        Oxidation_Rate_Of_POM_SOC_Under_Optimal_Temp_And_Water /= 365.0 #'1/day

    
        Water_Filled_Porosity = volumetric_Water_Content[Layer] / (1. - Bulk_Density[Layer] / 2.65)
        pSoilState.Oxidation_Water_Function[Layer] = OxidationMoistureFunction(0.6, Water_Filled_Porosity)
        pSoilState.Oxidation_Temperature_Function[Layer] = OxidationTemperatureFunction(Layer,pSoilState)
        #print(f'fw:{pSoilState.Oxidation_Water_Function[Layer]} ft:{pSoilState.Oxidation_Temperature_Function[Layer]}')
        pSoilFlux.Layer_SOC_Pool_Oxidation[Layer]  = pSoilState.SOM_C_Pool[DOY][Layer] * POM_Fraction_Of_SOC * Oxidation_Rate_Of_POM_SOC_Under_Optimal_Temp_And_Water \
            * min(pSoilState.Oxidation_Temperature_Function[Layer], pSoilState.Oxidation_Water_Function[Layer])
        CarbonNitrogenChanges(DOY, Layer,pSoilModelLayer,pSoilState,pSoilFlux)
        pSoilFlux.Daily_Profile_SOC_Pool_Oxidation[DOY] += pSoilFlux.Layer_SOC_Pool_Oxidation[Layer]
        pSoilFlux.Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM[DOY] += pSoilFlux.Layer_Oxidized_SOM_C_Transfer_Back_To_SOM[Layer]
        pSoilFlux.Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool[DOY] += pSoilFlux.Layer_Oxidized_SOM_N_Transferred_To_Ammonium[Layer]
        pSoilFlux.Layer_Mineralization[DOY][Layer] = pSoilFlux.Layer_Oxidized_SOM_N_Transferred_To_Ammonium[Layer]
        pSoilFlux.Cumulative_Mineralization_All_Layers += pSoilFlux.Layer_Mineralization[DOY][Layer]

    
    #'Prepare Mineralization Outputs
    pSoilFlux.Mineralization_Top_Three_Layers[DOY] = pSoilFlux.Layer_Mineralization[DOY][1] + pSoilFlux.Layer_Mineralization[DOY][2] + pSoilFlux.Layer_Mineralization[DOY][3]
    pSoilFlux.Mineralization_Next_Three_Layers[DOY] = pSoilFlux.Layer_Mineralization[DOY][4] + pSoilFlux.Layer_Mineralization[DOY][5] + pSoilFlux.Layer_Mineralization[DOY][6]
    #'Cumulative mineralization from emergence to maturity of crop number one
    if Crop_Number > 0 and Crop_Active:
        pSoilFlux.Cumulative_Mineralization_Top_Three_Layers_Crop[Crop_Number] += pSoilFlux.Mineralization_Top_Three_Layers[DOY]
        pSoilFlux.Cumulative_Mineralization_Next_Three_Layers_Crop[Crop_Number] += pSoilFlux.Mineralization_Next_Three_Layers[DOY]


    #'Cumulative mineralization for the entire simulation run
    pSoilFlux.Cumulative_Mineralization_Top_Three_Layers_All_Days += pSoilFlux.Mineralization_Top_Three_Layers[DOY]
    pSoilFlux.Cumulative_Mineralization_Next_Three_Layers_All_Days += pSoilFlux.Mineralization_Next_Three_Layers[DOY]
    #'IMPLEMENT READING OF TILLAGE OPERATIONS. THIS WILL NOT BE DEVELOPED YET
    #'NTO = [A15] #'Number of tillage operations
    #'For i = 1 To NTO
    #'    Tillage_Date(i) = Cells(17 + i, 2) #'Days after planting
    #'    Disturbance_Rate(i) = Cells(17 + i, 3) #'Based on RUSLE table
    #'Next i

def CarbonNitrogenChanges(DOY, Layer,pSoilModelLayer,pSoilState,pSoilFlux):
    #Layer_Tillage_Effect = dict() #(6) As Double
    #'Adjust oxidation rate in response to tillage
    #'TILLAGE EFFECTS ARE NOT IMPLEMENTED YET. Tillage function set to 1.0
    #'    For Layer = 1 To Number_Of_Soil_Layers
    #'        Maximum_Tillage_Effect = 1 + 4 * Exp(-5.5 * Clay_Fraction(Layer)) #'Dimensionless
    #'        Tillage_Effect = Maximum(1, Maximum_Tillage_Effect * Disturbance_Rate(Layer) / (Disturbance_Rate(Layer) + Exp(5.5 - 0.05 * Disturbance_Rate(Layer)))) #'Dimensionless
    #'        Layer_Tillage_Effect(Layer) = 1
    #'    Next Layer
    Microbial_Biomass_Synthesis_Efficiency = 0.5   #'Dimensionless
    Tillage_Effect = 1.0
    #'Residue contribution to N mineralization not implemented yet
    #'N_Mineralization_From_Oxidized_Residue_Pool = 0
    #'        Residue_Daily_Oxidation = Residue_C_Pool(Layer) * Residue_Oxidation_Rate * Minimum(Temperature_Function(Layer), Oxidation_Water_Function(Layer)) * Tillage_Effect
    #'        Humification_Fraction = Maximum_Humification_Rate(Layer) * (1 - (SOM_C_Pool(Layer) / Saturation_Carbon_Concentration(Layer)) ^ Empirical_Constant_n)
    #'        Residue_C_Transfer_To_SOC = Residue_Daily_Oxidation * Humification_Fraction
    #'        Residue_C_Transfer_To_CO2 = Residue_Daily_Oxidation - Residue_C_Transfer_To_SOC
    #'        N_Available_From_Oxidized_Residue = Residue_Daily_Oxidation / Residue_CN_Ratio(Layer)
    #'        Residue_N_Transfer_To_SOM_Pool = Residue_C_Transfer_To_SOC / SOC_C_N_Ratio
    #'        N_Immobilization_To_Oxidize_Residue_Pool = Maximum(0, -(N_Available_From_Oxidized_Residue - Residue_N_Transfer_To_SOM_Pool))
    #'        N_Mineralization_From_Oxidized_Residue_Pool = Maximum(0, (N_Available_From_Oxidized_Residue - Residue_N_Transfer_To_SOM_Pool))
    #Layer_SOC_Pool_Oxidation = pSoilState.SOM_C_Pool[DOY][Layer] * pSoilState.SOC_Oxidation_Rate * \
    #                                     math.pow(pSoilState.SOM_C_Pool[DOY][Layer] / pSoilState.Saturation_Carbon_Conc_kg_Per_m2,
    #                                     Empirical_Constant_m) * \
    #                                     min(pSoilState.Oxidation_Temperature_Function[Layer], pSoilState.Oxidation_Water_Function[Layer]) * Tillage_Effect
                                        
    #pSoilFlux.Layer_SOC_Pool_Oxidation = Layer_SOC_Pool_Oxidation              #06042025 LML
    Layer_SOC_Pool_Oxidation = pSoilFlux.Layer_SOC_Pool_Oxidation[Layer]
                                         
    #print(f'Layer_SOC_Pool_Oxidation:{Layer_SOC_Pool_Oxidation} SOM:{pSoilState.SOM_C_Pool[DOY][Layer]} Saturation_Carbon_Conc_kg_Per_m2:{pSoilState.Saturation_Carbon_Conc_kg_Per_m2} Empirical_Constant_m:{Empirical_Constant_m}')
    #Layer_Oxidized_SOM_C_Transfer_To_CO2 = pSoilFlux.Layer_SOC_Pool_Oxidation * (1 - Microbial_Biomass_Synthesis_Efficiency)
    Layer_Oxidized_SOM_C_Transfer_To_CO2 = Layer_SOC_Pool_Oxidation * (1 - Microbial_Biomass_Synthesis_Efficiency)
    pSoilFlux.Layer_Oxidized_SOM_C_Transfer_Back_To_SOM[Layer] = Layer_SOC_Pool_Oxidation * Microbial_Biomass_Synthesis_Efficiency
    
    #print(f'SOM_C_Pool: {pSoilState.SOM_C_Pool[DOY][Layer]} SOC_Oxidation_Rate: {pSoilState.SOC_Oxidation_Rate} SOC_C_N_Ratio:{SOC_C_N_Ratio}')
    
    pSoilFlux.Layer_N_Released_From_SOM_Oxidation[Layer] = Layer_SOC_Pool_Oxidation / SOC_C_N_Ratio
    pSoilFlux.Layer_Oxidized_SOM_N_Transfer_Back_To_SOM[Layer] = pSoilFlux.Layer_Oxidized_SOM_C_Transfer_Back_To_SOM[Layer] / SOC_C_N_Ratio
    pSoilFlux.Layer_Oxidized_SOM_N_Transferred_To_Ammonium[Layer] = pSoilFlux.Layer_N_Released_From_SOM_Oxidation[Layer] - pSoilFlux.Layer_Oxidized_SOM_N_Transfer_Back_To_SOM[Layer]
    #Total_C_Emission_As_CO2 = Layer_Oxidized_SOM_C_Transfer_To_CO2
    #'Residues not implemented yet
    #'        Total_C_Emission_As_CO2 = Residue_C_Transfer_To_CO2 + Oxidized_SOM_C_Transfer_To_CO2
    #'Total_C_Emission_As_CO2 = Layer_Oxidized_SOM_C_Transfer_To_CO2
    #'Start C and N balance
    #'        Carbon_Balance_In = Residue_C_Pool(Layer) + SOM_C_Pool(Layer)
    #'        Nitrogen_Balance_In = Residue_C_Pool(Layer) / Residue_CN_Ratio(Layer) + SOM_C_Pool(Layer) / SOC_C_N_Ratio + Mineral_N_Mass(Layer)
    #Carbon_Balance_In = pSoilState.SOM_C_Pool[DOY][Layer]
    #Nitrogen_Balance_In = pSoilState.SOM_N_Pool[DOY][Layer] #'+ Mineral_N_Mass(DOY, Layer)
    #'Update Pools
    #'        Residue_C_Pool(Layer) = Residue_C_Pool(Layer) - Residue_Daily_Oxidation #' + ResidueMicrobial_C_Transfer_Back + Oxidized_SOC_C_Transfer_To_ResidueMicrobial_Pool
    #'        Residue_N_Pool(Layer) = Residue_N_Pool(Layer) - N_Available_From_Oxidized_Residue
    pSoilState.SOM_C_Pool[DOY][Layer] = pSoilState.SOM_C_Pool[DOY][Layer] - Layer_SOC_Pool_Oxidation + pSoilFlux.Layer_Oxidized_SOM_C_Transfer_Back_To_SOM[Layer] #'+ Residue_C_Transfer_To_SOM
    pSoilState.SOM_N_Pool[DOY][Layer] = pSoilState.SOM_N_Pool[DOY][Layer] - pSoilFlux.Layer_Oxidized_SOM_N_Transferred_To_Ammonium[Layer] #'+ Residue_N_Transfer_To_SOM_Pool
    pSoilState.Soil_Organic_Carbon[DOY][Layer] = pSoilState.Soil_Organic_Carbon[DOY][Layer] - Layer_SOC_Pool_Oxidation + pSoilFlux.Layer_Oxidized_SOM_C_Transfer_Back_To_SOM[Layer] #'+ Residue_C_Transfer_To_SOM
    pSoilState.Soil_Organic_Nitrogen[DOY][Layer] = pSoilState.Soil_Organic_Nitrogen[DOY][Layer] - pSoilFlux.Layer_Oxidized_SOM_N_Transferred_To_Ammonium[Layer] #'+ Residue_N_Transfer_To_SOM_Pool
    
    pSoilState.Ammonium_N_Content[DOY][Layer] += pSoilFlux.Layer_Oxidized_SOM_N_Transferred_To_Ammonium[Layer]
    
    #'Soil.NitrateNContent(DOY + 1, Layer) = Soil.NitrateNContent(DOY, Layer) + Layer_Oxidized_SOM_N_Transfer_To_Mineral_Pool  #'Assume rapid conversion from NH4 to NO3
    #'Mineral_N_Mass(DOY + 1, Layer) = Mineral_N_Mass(DOY, Layer) + Oxidized_SOM_N_Transfer_To_Mineral_Pool
    #'Calculate C and N balance. Residues not included at this time
    #'        Carbon_Balance_Out = Residue_C_Pool(Layer) + SOM_C_Pool(Layer) + Total_C_Emission_As_CO2
    #'        Nitrogen_Balance_Out = Residue_C_Pool(Layer) / Residue_CN_Ratio(Layer) + SOM_C_Pool(Layer) / SOC_C_N_Ratio + Mineral_N_Mass(Layer)
    #'Carbon_Balance_Out = SOM_C_Pool(DOY + 1, Layer) + Total_C_Emission_As_CO2
    #'Nitrogen_Balance_Out = SOM_C_Pool(DOY + 1, Layer) / SOC_C_N_Ratio #'+ Mineral_N_Mass(DOY + 1, Layer)
    #'Carbon_Balance = Carbon_Balance_In - Carbon_Balance_Out
    #'Nitrogen_Balance = Nitrogen_Balance_In - Nitrogen_Balance_Out


def Nitrification(DOY,pSoilModelLayer,pSoilState,pSoilFlux):
    Total_Nitrification = 0
    Number_Of_Layers = pSoilModelLayer.Number_Model_Layers
    for Layer in range(1, Number_Of_Layers + 1):
        Layer_N_Nitrified = 0
        Layer_Ammonium_N_Mass = pSoilState.Ammonium_N_Content[DOY][Layer]
        Layer_Nitrate_N_Mass = pSoilState.Nitrate_N_Content[DOY][Layer]
        Nitrification_NO3_NH4_Ratio = 8
        Nitrification_Constant = 0.3 #'1/day
        WFP = pSoilState.Water_Filled_Porosity[DOY][Layer]
        #Temperature = pSoilState.Layer_Daily_Soil_Temperature[Layer]
        pH = 7.0
        Moisture_Function = OxidationMoistureFunction(0, WFP)
        Temperature_Function = OxidationTemperatureFunction(Layer,pSoilState)
        pH_Function = pHFunction(pH)
        if Layer_Ammonium_N_Mass > 0:
            if (Layer_Nitrate_N_Mass / Layer_Ammonium_N_Mass) < Nitrification_NO3_NH4_Ratio:
                Layer_N_Nitrified = (Layer_Ammonium_N_Mass - Layer_Nitrate_N_Mass / Nitrification_NO3_NH4_Ratio) * \
                    (1 - math.exp(-Nitrification_Constant * pH_Function * Temperature_Function)) * Moisture_Function
            else:
                Layer_N_Nitrified = 0
            #'Check that nitrification is limited to existing ammonium N mass and update local ammonium N mass
            if Layer_N_Nitrified > Layer_Ammonium_N_Mass:
                Layer_N_Nitrified = Layer_Ammonium_N_Mass
        #'Update ammonium and nitrate content
        pSoilState.Ammonium_N_Content[DOY][Layer] -= Layer_N_Nitrified
        pSoilState.Nitrate_N_Content[DOY][Layer] += Layer_N_Nitrified
        Total_Nitrification += Layer_N_Nitrified
    pSoilFlux.Daily_Nitrification[DOY] = Total_Nitrification