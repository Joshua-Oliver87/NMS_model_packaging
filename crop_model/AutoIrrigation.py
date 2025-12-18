#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Nov  8 12:52:17 2024

@author: liuming
"""
from .SoilHydrolics import *
#from CS_ET import *
import pandas as pd
import sys
import json

class AutoIrrigationEvent:
    DOY_Event = None
    Event_Type = None
    Scheduling_Method = None #1:PAW 2:CWSI
    Maximum_Allowable_PAW_Depletion = None
    Maximum_Allowable_CWSI = None
    Refill_Depth = None #meter
    Irrigated_Crop_Number = None
    
    DOY_To_Start_Auto_Irrigation = None
    DOY_To_Stop_Auto_Irrigation = None
    DOY_For_Refill_Irrigation = None
    
class AutoIrrigationEvents:
    Number_Of_Auto_Entries = 0
    Events = dict()


def ReadAutoIrrigation(data_entry, AutoIrrigation, DOY_Last_Scheduled_Irrigation,
                       Emergence_DOY_1, Maturity_DOY_1, Emergence_DOY_2, Maturity_DOY_2):
    # Extract auto irrigation data from the JSON entry
    auto_irrigation_data = data_entry.get("auto_irrigation", [])
    AutoIrrigation.Number_Of_Auto_Entries = len(auto_irrigation_data)


    if AutoIrrigation.Number_Of_Auto_Entries > 0:
        for i, entry in enumerate(auto_irrigation_data, start=1):
            irrigation = AutoIrrigationEvent()
            irrigation.DOY_Event = int(entry.get("doy", 0))
            irrigation.Event_Type = entry.get("auto_irrigation", "")
            irrigation.Scheduling_Method = int(entry.get("method", 0))
            raw_mad = float(entry.get("Max_PAW_depletion", 0.0))

            # If user passed percent (Excel-style), convert
            if raw_mad > 1.0:
                raw_mad /= 100.0

            irrigation.Maximum_Allowable_PAW_Depletion = raw_mad
            irrigation.Maximum_Allowable_CWSI = float(entry.get("CWSI", 0.0))
            irrigation.Refill_Depth = float(entry.get("refill_depth", 0.0))
            #irrigation.Irrigated_Crop_Number = int(entry.get("crop_number", 0))

            if irrigation.Event_Type == "START" and irrigation.DOY_Event == 0:
                continue #ignore malformed event

            if irrigation.Event_Type == "START":
                irrigation.DOY_To_Start_Auto_Irrigation = irrigation.DOY_Event
                #04252025COS-LML if irrigation.Irrigated_Crop_Number == 1:
                #04252025COS-LML     if (DOY_Last_Scheduled_Irrigation > Emergence_DOY_1 or DOY_Last_Scheduled_Irrigation > 1) and (DOY_Last_Scheduled_Irrigation <= Maturity_DOY_1):
                #04252025COS-LML         irrigation.DOY_To_Start_Auto_Irrigation = DOY_Last_Scheduled_Irrigation + 1
                #04252025COS-LML else:
                #04252025COS-LML     if (DOY_Last_Scheduled_Irrigation > Emergence_DOY_2) and (DOY_Last_Scheduled_Irrigation <= Maturity_DOY_2):
                #04252025COS-LML         irrigation.DOY_To_Start_Auto_Irrigation = DOY_Last_Scheduled_Irrigation + 1
            elif irrigation.Event_Type == "STOP":
                irrigation.DOY_To_Stop_Auto_Irrigation = irrigation.DOY_Event 
            elif irrigation.Event_Type == "REFILL":
                irrigation.DOY_For_Refill_Irrigation = irrigation.DOY_Event 

            AutoIrrigation.Events[i] = irrigation

def calc_PAW_depletion(DOY, NL, pSoilState, pETState, pSoilModelLayer):
    PAW_Depletion_Today = 0.
    #Top50cm_PAW_Depletion = 0.
    #Mid50cm_PAW_Depletion = 0.
    #Bottom50cm_PAW_Depletion = 0.

    Water_Density = 1000 #'kg/m3
    Water_Depth_To_Refill_fc = 0.
    
    Top50cm_WC = 0
    Mid50cm_WC = 0
    Bottom50cm_WC = 0
    #Always calculate PAW depletion
    #PAW_Depletion_Today = 0.
    for Layer in range(1, NL + 1):
        FC = pSoilModelLayer.FC_Water_Content[Layer]
        PWP = pSoilModelLayer.PWP_Water_Content[Layer]
        WC = pSoilState.Water_Content[DOY][Layer]
        
        Layer_Root_Fraction = pETState.Root_Fraction[Layer]
        #'PAW_Depletion_Today is profile depletion prorated by fraction of roots in each layer
        lyr_depletion = 1. - (WC - PWP) / (FC - PWP)
        PAW_Depletion_Today += lyr_depletion * Layer_Root_Fraction
        Water_Depth_To_Refill_fc += (FC - WC) * Water_Density * pSoilModelLayer.Layer_Thickness[Layer]
        
        #if Layer >= 2 and Layer <= 6:
        #    Top50cm_PAW_Depletion += lyr_depletion
        #elif Layer >= 7 and Layer <= 11:
        #    Mid50cm_PAW_Depletion += lyr_depletion
        #elif Layer >= 12 and Layer <= 16:
        #    Bottom50cm_PAW_Depletion += lyr_depletion
        if Layer > 1 and Layer_Root_Fraction <= 1e-12: break #'All layers with roots plus one extra layers are refilled. Leave the loop
        
    for Layer in range(1, NL + 1):
        if Layer >= 2 and Layer <= 6:
            Top50cm_WC += pSoilState.Water_Content[DOY][Layer]
        elif Layer >= 7 and Layer <= 11:
            Mid50cm_WC += pSoilState.Water_Content[DOY][Layer]
        elif Layer >= 12 and Layer <= 16:
            Bottom50cm_WC += pSoilState.Water_Content[DOY][Layer]

    
    pSoilState.PAW_Depletion[DOY] = PAW_Depletion_Today
    #pSoilState.PAW_Depletion_Top50cm[DOY] = Top50cm_PAW_Depletion / 5. #'Average of five soil layers
    #pSoilState.PAW_Depletion_Mid50cm[DOY] = Mid50cm_PAW_Depletion / 5. #'Average of five soil layers
    #pSoilState.PAW_Depletion_Bottom50cm[DOY] = Bottom50cm_PAW_Depletion / 5. #'Average of five soil layers
    pSoilState.Water_Content_Top50cm[DOY] = Top50cm_WC / 5. #'Average of five soil layers
    pSoilState.Water_Content_Mid50cm[DOY] = Mid50cm_WC / 5. #'Average of five soil layers
    pSoilState.Water_Content_Bottom50cm[DOY] = Bottom50cm_WC / 5. #'Average of five soil layers
    
    return PAW_Depletion_Today,Water_Depth_To_Refill_fc

def SetAutoIrrigation(DOY, PAW, CWSI, NL, MAD, MA_CWSI, Refill, Refill_Depth, 
                      pSoilState, pETState, pSoilModelLayer, Water_Depth_To_Refill_fc):
    Water_Depth_To_Refill = 0.

    Water_Density = 1000 #'kg/m3
    #Always calculate PAW depletion
    #PAW_Depletion_Today = 0.
    if PAW: 
        if pSoilState.PAW_Depletion[DOY] > MAD:
            Irrigation_Today = Water_Depth_To_Refill_fc
        else:
            Irrigation_Today = 0
    elif CWSI:
        Today_CWSI = pETState.Water_Stress_Index[DOY]
        if Today_CWSI > MA_CWSI: 
            Water_Depth_To_Refill = 0.
            for Layer in range(1, NL + 1):
                Layer_Root_Fraction = pETState.Root_Fraction[Layer]
                FC = pSoilModelLayer.FC_Water_Content[Layer]
                WC = pSoilState.Water_Content[DOY][Layer]
                
                Water_Depth_To_Refill += (FC - WC) * Water_Density * pSoilModelLayer.Layer_Thickness[Layer]
                if Layer > 1 and Layer_Root_Fraction <= 1e-12: break #'All layers with roots plus one extra layers are refilled. Leave the loop
            Irrigation_Today = Water_Depth_To_Refill
    elif Refill:
        Water_Depth_To_Refill = 0.
        Wetted_Depth = 0.
        for Layer in range(1, NL + 1):
            FC = pSoilModelLayer.FC_Water_Content[Layer]
            WC = pSoilState.Water_Content[DOY][Layer]
            
            Water_Depth_To_Refill += (FC - WC) * Water_Density * pSoilModelLayer.Layer_Thickness[Layer]
            Wetted_Depth += pSoilModelLayer.Layer_Thickness[Layer]
            if Wetted_Depth > Refill_Depth:
                Irrigation_Today = Water_Depth_To_Refill
                break
            
    return Irrigation_Today

#testing...

'''
input_file = '/home/liuming/mnt/hydronas3/Projects/CropManagement/VBCode_11022024/Field_Input.csv'
InputCells = pd.read_csv(input_file,header=None)


DOY_Last_Scheduled_Irrigation = 135
Emergence_DOY_1 = 284
Maturity_DOY_1 = 105
Emergence_DOY_2 = 135
Maturity_DOY_2 = 258

AutoIrrigation = AutoIrrigationEvents()

ReadAutoIrrigation(InputCells,AutoIrrigation,DOY_Last_Scheduled_Irrigation,
                   Emergence_DOY_1,Maturity_DOY_1,Emergence_DOY_2,Maturity_DOY_2)
'''