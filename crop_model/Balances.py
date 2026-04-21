#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Nov 11 23:50:08 2024

@author: liuming
"""


class Balances:
    def __init__(self):
        self.Initial_WD = 0.
        self.Initial_NO3_N = 0.
        self.Initial_NH4_N = 0.
        self.Initial_SOC = 0.
        self.Initial_SON = 0.
        self.Balance_Water = 0.
        self.Balance_NO3_N = 0.
        self.Balance_NH4_N = 0.
        self.Balance_SOC = 0.
        self.Balance_SON = 0.
    
def InitialSoilProfile(DOY,pBalance,pSoilState,pSoilModelLayer):
    Water_Density = 1000 #'kg/m3
    pBalance.Initial_WD = 0.
    pBalance.Initial_NO3_N = 0.
    pBalance.Initial_NH4_N = 0.
    pBalance.Initial_SOC = 0.
    pBalance.Initial_SON = 0.
    Number_Of_Layers = pSoilModelLayer.Number_Model_Layers
    for Layer in range(1, Number_Of_Layers + 1):
        pBalance.Initial_WD += pSoilState.Water_Content[DOY][Layer] * pSoilModelLayer.Layer_Thickness[Layer] * Water_Density #'kg/m2 or mm
        pBalance.Initial_NO3_N += pSoilState.Nitrate_N_Content[DOY][Layer]
        pBalance.Initial_NH4_N += pSoilState.Ammonium_N_Content[DOY][Layer]
        pBalance.Initial_SOC += pSoilState.Soil_Organic_Carbon[DOY][Layer]
        pBalance.Initial_SON += pSoilState.Soil_Organic_Nitrogen[DOY][Layer]

def BalancesAll(DOY,pBalance,pSoilState,pSoilFlux,pSoilModelLayer,pCS_Weather,pETState,
        pCS_Fertilization,pCropState):
    Water_Density = 1000 #'kg/m3
    
    Final_WD = 0.
    Final_NO3_N = 0.
    Final_NH4_N = 0.
    Final_SOC = 0.
    Final_SON = 0.
    Number_Of_Layers = pSoilModelLayer.Number_Model_Layers
    for Layer in range(1, Number_Of_Layers + 1):
        Final_WD += pSoilState.Water_Content[DOY][Layer] * pSoilModelLayer.Layer_Thickness[Layer] * Water_Density #'kg/m2 or mm
        Final_NO3_N += pSoilState.Nitrate_N_Content[DOY][Layer]
        Final_NH4_N += pSoilState.Ammonium_N_Content[DOY][Layer]
        Final_SOC += pSoilState.Soil_Organic_Carbon[DOY][Layer]
        Final_SON += pSoilState.Soil_Organic_Nitrogen[DOY][Layer]

    
    pBalance.Balance_Water = pBalance.Initial_WD + pSoilFlux.Net_Irrigation_Depth[DOY] + pCS_Weather.Precipitation[DOY] \
                    - pETState.Actual_Soil_Water_Evaporation[DOY] \
                    - pETState.Actual_Transpiration[DOY] \
                    - pSoilFlux.Deep_Drainage[DOY] \
                    - Final_WD
    pBalance.Balance_NO3_N = pBalance.Initial_NO3_N + pCS_Fertilization.Nitrate_Fertilization_Rate[DOY] + pSoilFlux.Daily_Nitrification[DOY] \
                    + pSoilState.Nitrate_N_In_Water[DOY] \
                    - pCropState.Nitrate_N_Uptake[DOY] \
                    - pSoilFlux.N_Leaching[DOY] \
                    - Final_NO3_N
    pBalance.Balance_NH4_N = pBalance.Initial_NH4_N + pCS_Fertilization.Ammonium_Fertilization_Rate[DOY] + pSoilFlux.Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool[DOY] \
                    - pSoilFlux.Daily_Nitrification[DOY] \
                    - pCropState.Ammonium_N_Uptake[DOY] \
                    - Final_NH4_N
    pBalance.Balance_SOC = pBalance.Initial_SOC - pSoilFlux.Daily_Profile_SOC_Pool_Oxidation[DOY] + pSoilFlux.Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM[DOY] - Final_SOC
    pBalance.Balance_SON = pBalance.Initial_SON - pSoilFlux.Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool[DOY] - Final_SON
    
    #print(f'Initial_SOC:{pBalance.Initial_SOC} Final_SOC:{Final_SOC} Daily_Profile_SOC_Pool_Oxidation:{pSoilFlux.Daily_Profile_SOC_Pool_Oxidation[DOY]} Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM:{pSoilFlux.Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM[DOY]}')

    #'Update state variables for next DOY
    for Layer in range(1, Number_Of_Layers + 1):
        if DOY != 365:
            pSoilState.Water_Content[DOY + 1][Layer] = pSoilState.Water_Content[DOY][Layer]
            pSoilState.Nitrate_N_Content[DOY + 1][Layer] = pSoilState.Nitrate_N_Content[DOY][Layer]
            pSoilState.Ammonium_N_Content[DOY + 1][Layer] = pSoilState.Ammonium_N_Content[DOY][Layer]
            pSoilState.Soil_Organic_Carbon[DOY + 1][Layer] = pSoilState.Soil_Organic_Carbon[DOY][Layer]
            pSoilState.Soil_Organic_Nitrogen[DOY + 1][Layer] = pSoilState.Soil_Organic_Nitrogen[DOY][Layer]
        else:
            pSoilState.Water_Content[1][Layer] = pSoilState.Water_Content[DOY][Layer]
            pSoilState.Nitrate_N_Content[1][Layer] = pSoilState.Nitrate_N_Content[DOY][Layer]
            pSoilState.Ammonium_N_Content[1][Layer] = pSoilState.Ammonium_N_Content[DOY][Layer]
            pSoilState.Soil_Organic_Carbon[1][Layer] = pSoilState.Soil_Organic_Carbon[DOY][Layer]
            pSoilState.Soil_Organic_Nitrogen[1][Layer] = pSoilState.Soil_Organic_Nitrogen[DOY][Layer]
    #06042025LML
    if abs(pBalance.Balance_Water) > 0.0000000001: return 'Balance_Water',pBalance.Balance_Water,False
    if abs(pBalance.Balance_NO3_N) > 0.0000000001: return 'Balance_NO3_N',pBalance.Balance_NO3_N,False
    if abs(pBalance.Balance_NH4_N) > 0.0000000001: return 'Balance_NH4_N',pBalance.Balance_NH4_N,False
    if abs(pBalance.Balance_SOC) > 0.0000000001: return 'Balance_SOC',pBalance.Balance_SOC,False
    if abs(pBalance.Balance_SON) > 0.0000000001: return 'Balance_SON',pBalance.Balance_SON,False

    return 'Balanceed',0,True