Attribute VB_Name = "Crop"
Option Explicit
Dim Potential_Green_Canopy_Cover(366) As Double
Dim Green_Canopy_Cover(366) As Double
Dim Total_CC_Transition As Double
Dim Total_Canopy_Cover(366) As Double
Dim Potential_Total_Canopy_Cover(366) As Double
Dim Root_Depth(366) As Double
Dim Crop_Height(366) As Double
Dim Root_Depth_At_Emergence(2) As Double
Dim Today_Biomass_Gain(366) As Double
Dim Cumulative_Crop_Biomass(366) As Double
Dim Cumulative_Potential_Crop_Biomass(366) As Double
Dim Seasonal_Biomass As Double
Dim Crop_N_Mass(366) As Double
Dim N_Uptake(366) As Double
Dim Seasonal_N_Uptake As Double
Dim Nitrate_N_Uptake(366) As Double
Dim Ammonium_N_Uptake(366) As Double
Dim Cumulative_N_Uptake(366) As Double
Dim Crop_N_Concentration(366) As Double
Dim Maximum_N_Concentration(366) As Double
Dim Maximum_N_Concentration_At_Transition As Double
Dim Daily_Change_Maximum_N_Concentration As Double
Dim Critical_N_Concentration(366) As Double
Dim Critical_N_Concentration_At_Transition As Double
Dim Daily_Change_Critical_N_Concentration As Double
Dim Minimum_N_Concentration(366) As Double
Dim Minimum_N_Concentration_At_Transition As Double
Dim Daily_Change_Minimum_N_Concentration As Double
Dim DOY_Of_Transition As Integer
Dim Nitrogen_Stress_Index(366) As Double
Dim DAE_Begin_Senescence As Integer

Sub ClearArrays()
Dim i As Integer
For i = 1 To 2
    Root_Depth_At_Emergence(i) = 0
Next i
For i = 1 To 366
    Potential_Green_Canopy_Cover(i) = 0
    Green_Canopy_Cover(i) = 0
    Total_Canopy_Cover(i) = 0
    Potential_Total_Canopy_Cover(i) = 0
    Root_Depth(i) = 0
    Crop_Height(i) = 0
    Today_Biomass_Gain(i) = 0
    Cumulative_Crop_Biomass(i) = 0
    Cumulative_Potential_Crop_Biomass(i) = 0
    Crop_N_Mass(i) = 0
    N_Uptake(i) = 0
    Nitrate_N_Uptake(i) = 0
    Ammonium_N_Uptake(i) = 0
    Cumulative_N_Uptake(i) = 0
    Crop_N_Concentration(i) = 0
    Maximum_N_Concentration(i) = 0
    Critical_N_Concentration(i) = 0
    Minimum_N_Concentration(i) = 0
    Nitrogen_Stress_Index(i) = 0
Next i
End Sub
Sub InitializeFirstCrop(DOY As Integer)
Dim Depth_Of_Seed As Double

Green_Canopy_Cover(DOY) = ReadInputs.InitialGreenCanopyCover(1)
Total_Canopy_Cover(DOY) = ReadInputs.InitialGreenCanopyCover(1)
Depth_Of_Seed = ReadInputs.SeedingDepth(1)
Root_Depth_At_Emergence(1) = Depth_Of_Seed + ReadInputs.InitialRootDepthFromGerminatedSeed(1)
Root_Depth(DOY) = Root_Depth_At_Emergence(1)
Cumulative_Crop_Biomass(DOY - 1) = 0.002
Seasonal_Biomass = Cumulative_Crop_Biomass(DOY - 1)
Cumulative_Potential_Crop_Biomass(DOY - 1) = Cumulative_Crop_Biomass(DOY - 1)
Crop_N_Mass(DOY - 1) = Cumulative_Crop_Biomass(DOY - 1) * ReadInputs.MaximumNConcentrationEmergence(1)
Cumulative_N_Uptake(DOY) = 0
Soil.CumulativeIrrigation = 0
Soil.CumulativeFertilization = 0
Soil.CumulativeDeepDrainage = 0
Soil.CumulativeNLeaching = 0
ET.TotalTranspiration = 0
Seasonal_N_Uptake = 0
End Sub
Sub InitializeSecondCrop(DOY As Integer)
Dim Depth_Of_Seed As Double

Green_Canopy_Cover(DOY) = ReadInputs.InitialGreenCanopyCover(2)
Total_Canopy_Cover(DOY) = Green_Canopy_Cover(DOY)
Depth_Of_Seed = ReadInputs.SeedingDepth(2)
Root_Depth_At_Emergence(2) = Depth_Of_Seed + ReadInputs.InitialRootDepthFromGerminatedSeed(2)
Root_Depth(DOY) = Root_Depth_At_Emergence(2)
Cumulative_Crop_Biomass(DOY - 1) = 0.002
Seasonal_Biomass = Cumulative_Crop_Biomass(DOY - 1)
Cumulative_Potential_Crop_Biomass(DOY - 1) = Cumulative_Crop_Biomass(DOY - 1)
Crop_N_Mass(DOY - 1) = Cumulative_Crop_Biomass(DOY - 1) * ReadInputs.MaximumNConcentrationEmergence(2)
Cumulative_N_Uptake(DOY) = 0
Soil.CumulativeIrrigation = 0
Soil.CumulativeFertilization = 0
Soil.CumulativeDeepDrainage = 0
Soil.CumulativeNLeaching = 0
ET.TotalTranspiration = 0
Seasonal_N_Uptake = 0
End Sub
Sub PotentialCanopyCover(Crop_Number As Integer, DAE As Integer, DOY As Integer)
Dim Initial_Value As Double
Dim Peak_Value As Double
Dim End_Season_Value As Double
Dim Time_Fraction_At_Half_Peak_Value As Double
Dim Time_Fraction_At_Half_Decline As Double
Dim DOY_Begin_Season As Integer
Dim DOY_Peak_Value As Integer
Dim DOY_Begin_Decline As Integer
Dim DOY_End_Of_Season As Integer
Dim DAE_Begin_Season As Integer
Dim DAE_At_Peak_Value As Integer
Dim DAE_At_Begin_Decline As Integer
Dim DAE_At_End_Of_Season As Integer
Dim Shape_Coef_Before_Peak As Double
Dim Shape_Coef_During_Decline As Double
Dim B1 As Double, B2 As Double
Dim Asympthotic_Value_max As Double
Dim Actual_Value_max1 As Double
Dim Actual_Value_max2 As Double
Dim Asymthotic_Value_Decline As Double
Dim Today_GCC_Value As Double
Dim Row_Counter As Integer

'HARD-CODED PARAMETERS. DO NOT EXPOSE
Shape_Coef_Before_Peak = 9
Shape_Coef_During_Decline = 9
Time_Fraction_At_Half_Peak_Value = 0.5
Time_Fraction_At_Half_Decline = 0.5

Select Case Crop_Number
    Case 1
        Initial_Value = ReadInputs.InitialGreenCanopyCover(Crop_Number)
        Peak_Value = ReadInputs.MaximumGreenCanopyCover(Crop_Number)
        End_Season_Value = ReadInputs.MaturityGreenCanopyCover(Crop_Number)
        DOY_Begin_Season = ReadInputs.EmergenceDOY1
        DOY_Peak_Value = ReadInputs.FullCanopyDOY1
        DOY_Begin_Decline = ReadInputs.BegingSenescenceDOY1
        DOY_End_Of_Season = ReadInputs.MaturityDOY1
        DAE_Begin_Season = 0
        If DOY_Begin_Season > DOY_Peak_Value Then DAE_At_Peak_Value = (365 - DOY_Begin_Season) + DOY_Peak_Value Else DAE_At_Peak_Value = DOY_Peak_Value - DOY_Begin_Season
        If DOY_Begin_Season > DOY_Begin_Decline Then DAE_At_Begin_Decline = (365 - DOY_Begin_Season) + DOY_Begin_Decline Else DAE_At_Begin_Decline = DOY_Begin_Decline - DOY_Begin_Season
        If DOY_Begin_Season > DOY_End_Of_Season Then DAE_At_End_Of_Season = (365 - DOY_Begin_Season) + DOY_End_Of_Season Else DAE_At_End_Of_Season = DOY_End_Of_Season - DOY_Begin_Season
    Case 2
        Initial_Value = ReadInputs.InitialGreenCanopyCover(Crop_Number)
        Peak_Value = ReadInputs.MaximumGreenCanopyCover(Crop_Number)
        End_Season_Value = ReadInputs.MaturityGreenCanopyCover(Crop_Number)
        DOY_Begin_Season = ReadInputs.EmergenceDOY2
        DOY_Peak_Value = ReadInputs.FullCanopyDOY2
        DOY_Begin_Decline = ReadInputs.BegingSenescenceDOY2
        DOY_End_Of_Season = ReadInputs.MaturityDOY2
        DAE_Begin_Season = 0
        If DOY_Begin_Season > DOY_Peak_Value Then DAE_At_Peak_Value = (365 - DOY_Begin_Season) + DOY_Peak_Value Else DAE_At_Peak_Value = DOY_Peak_Value - DOY_Begin_Season
        If DOY_Begin_Season > DOY_Begin_Decline Then DAE_At_Begin_Decline = (365 - DOY_Begin_Season) + DOY_Begin_Decline Else DAE_At_Begin_Decline = DOY_Begin_Decline - DOY_Begin_Season
        If DOY_Begin_Season > DOY_End_Of_Season Then DAE_At_End_Of_Season = (365 - DOY_Begin_Season) + DOY_End_Of_Season Else DAE_At_End_Of_Season = DOY_End_Of_Season - DOY_Begin_Season
End Select
'Derived parameters for the standard green canopy curve
B1 = 1 / Exp(-Shape_Coef_Before_Peak * Time_Fraction_At_Half_Peak_Value)
B2 = 1 / Exp(-Shape_Coef_During_Decline * Time_Fraction_At_Half_Decline)
Asympthotic_Value_max = (Peak_Value - Initial_Value) * (1 + B1 * Exp(-Shape_Coef_Before_Peak * 1)) + Initial_Value
Actual_Value_max1 = Initial_Value + (Asympthotic_Value_max - Initial_Value) / (1 + B1 * Exp(-Shape_Coef_Before_Peak))
Actual_Value_max2 = (Actual_Value_max1 * (1 + B2) - End_Season_Value) / B2
Asymthotic_Value_Decline = Actual_Value_max2 + (End_Season_Value - Actual_Value_max2) * (1 + B2 * Exp(-Shape_Coef_During_Decline))
If DAE <= DAE_At_End_Of_Season And DAE = DAE_At_Begin_Decline Then
    'This recalculate Value_max2 and Asymthotic_Value_Decline at the beginning of senescence
    Actual_Value_max2 = (Peak_Value * (1 + B2) - End_Season_Value) / B2
    Asymthotic_Value_Decline = Actual_Value_max2 + (End_Season_Value - Actual_Value_max2) * (1 + B2 * Exp(-Shape_Coef_During_Decline))
End If
    Today_GCC_Value = CC(B1, B2, Initial_Value, Asympthotic_Value_max, Asymthotic_Value_Decline, End_Season_Value, Peak_Value, DAE, _
            DAE_Begin_Season, DAE_At_Peak_Value, DAE_At_Begin_Decline, DAE_At_End_Of_Season, Shape_Coef_Before_Peak, Shape_Coef_During_Decline, Actual_Value_max2)
Potential_Green_Canopy_Cover(DOY) = Today_GCC_Value
If DAE <= DAE_At_Begin_Decline Then Potential_Total_Canopy_Cover(DOY) = Potential_Green_Canopy_Cover(DOY) Else Potential_Total_Canopy_Cover(DOY) = Potential_Total_Canopy_Cover(DOY - 1)
End Sub

Function CC(B1 As Double, B2 As Double, Value_ini As Double, Value_max As Double, Asymthotic_Value_Decline As Double, Value_end As Double, Current_Value As Double, DAE As Integer, _
DAE_Begin_Season As Integer, DAE_At_Peak_Value As Integer, DAE_At_Begin_Decline As Integer, DAE_At_End_Of_Season As Integer, Shape_Coef_Before_Peak As Double, Shape_Coef_During_Decline As Double, _
Actual_Value_max2 As Double) As Double
Dim Relative_TT_Increasing_Value As Double
Dim Relative_TT_Declining_Value As Double

If DAE <= DAE_At_Peak_Value Then
    Relative_TT_Increasing_Value = (DAE - DAE_Begin_Season) / (DAE_At_Peak_Value - DAE_Begin_Season)
    CC = Value_ini + (Value_max - Value_ini) / (1 + B1 * Exp(-Shape_Coef_Before_Peak * Relative_TT_Increasing_Value))
    Else
    If DAE <= DAE_At_End_Of_Season And DAE >= DAE_At_Begin_Decline Then
        Relative_TT_Declining_Value = (DAE - DAE_At_Begin_Decline) / (DAE_At_End_Of_Season - DAE_At_Begin_Decline)
        CC = Actual_Value_max2 - (Actual_Value_max2 - Asymthotic_Value_Decline) / (1 + B2 * Exp(-Shape_Coef_During_Decline * Relative_TT_Declining_Value))
        If CC < Value_end Then CC = Value_end
        If CC > Actual_Value_max2 Then CC = Actual_Value_max2
        Else
        CC = Current_Value
    End If
End If
End Function

Sub CanopyCover(DOY As Integer, DAE As Integer, Crop_Number As Integer)
Dim Canopy_Expansion As Double
Dim WSF As Double
Dim NSF As Double
Dim DOY_Emergence As Integer
Dim DOY_Begin_Decline As Integer
Dim Canopy_Senescence As Double
Dim Adj_DOY As Integer

If Crop_Number = 1 And DOY = ReadInputs.EmergenceDOY1 Then
    DOY_Begin_Decline = ReadInputs.BegingSenescenceDOY1
    DOY_Emergence = ReadInputs.EmergenceDOY1
    If DOY_Emergence > DOY_Begin_Decline Then DAE_Begin_Senescence = (365 - DOY_Emergence) + DOY_Begin_Decline Else DAE_Begin_Senescence = DOY_Begin_Decline - DOY_Emergence
End If
If Crop_Number = 2 And DOY = ReadInputs.EmergenceDOY2 Then
    DOY_Begin_Decline = ReadInputs.BegingSenescenceDOY2
    DOY_Emergence = ReadInputs.EmergenceDOY2
    If DOY_Emergence > DOY_Begin_Decline Then DAE_Begin_Senescence = (365 - DOY_Emergence) + DOY_Begin_Decline Else DAE_Begin_Senescence = DOY_Begin_Decline - DOY_Emergence
End If
If DOY = 1 Then Adj_DOY = 365 Else Adj_DOY = DOY - 1
If DAE <= DAE_Begin_Senescence Then
    WSF = 1 - ET.WaterStressIndex(DOY - 1)
    NSF = (1 - Crop.NitrogenStressIndex(DOY - 1)) '^ 0.5
    Canopy_Expansion = (Crop.PotentialGreenCanopyCover(DOY) - Crop.PotentialGreenCanopyCover(Adj_DOY)) * Minimum(WSF, NSF)
    Green_Canopy_Cover(DOY) = Green_Canopy_Cover(Adj_DOY) + Canopy_Expansion
    Total_Canopy_Cover(DOY) = Green_Canopy_Cover(DOY)
    Total_CC_Transition = Total_Canopy_Cover(DOY)
    Else   'Senescence
    Canopy_Senescence = (Crop.PotentialGreenCanopyCover(Adj_DOY) - Crop.PotentialGreenCanopyCover(DOY))
    Green_Canopy_Cover(DOY) = Maximum(0, Green_Canopy_Cover(Adj_DOY) - Canopy_Senescence)
    Total_Canopy_Cover(DOY) = Total_CC_Transition
End If
End Sub
Sub GrowRoot(Crop_Number As Integer, DOY As Integer) 'OJO OJO Calculate root fraction here
Dim RD_Max As Double
Dim GCC_Ini As Double
Dim GCC_Max As Double
Dim Rd As Double
Dim Total_Cover As Double

RD_Max = ReadInputs.MaximumRootDepth(Crop_Number)
GCC_Max = ReadInputs.MaximumGreenCanopyCover(Crop_Number)
GCC_Ini = ReadInputs.InitialGreenCanopyCover(Crop_Number)
If Total_Canopy_Cover(DOY) < GCC_Ini Then Total_Cover = GCC_Ini Else Total_Cover = Total_Canopy_Cover(DOY)
Rd = Root_Depth_At_Emergence(Crop_Number) + (RD_Max - Root_Depth_At_Emergence(Crop_Number)) * (Total_Cover - GCC_Ini) / (GCC_Max - GCC_Ini)
If Rd > RD_Max Then Rd = RD_Max
Root_Depth(DOY) = Rd
End Sub

Sub GrowHeight(Crop_Number As Integer, DOY As Integer)
Dim CH_Max As Double
Dim GCC_Ini As Double
Dim GCC_Max As Double
Dim Total_CC As Double
Dim CH As Double

CH_Max = ReadInputs.MaximumCropHeight(Crop_Number)
GCC_Max = ReadInputs.MaximumGreenCanopyCover(Crop_Number)
GCC_Ini = ReadInputs.InitialGreenCanopyCover(Crop_Number)
Total_CC = Crop.TotalCanopyCover(DOY)
If Total_CC < GCC_Ini Then Total_CC = GCC_Ini
CH = CH_Max * (Total_CC - GCC_Ini) / (GCC_Max - GCC_Ini)
Crop_Height(DOY) = CH
End Sub

Sub Biomass(Crop_Number As Integer, DOY As Integer, Potential_Crop As Boolean)

Dim Transpiration_Use_Efficiency_At_1kpa As Double
Dim TUE_Slope As Double
Dim Maximum_Temperature As Double
Dim Minimum_Relative_Humidity As Double
Dim Potential_Crop_Transpiration As Double
Dim Actual_Crop_Transpiration As Double
Dim Daytime_VPD As Double
Dim Daily_Transpiration_Use_Efficiency As Double
Dim Potential_Crop_Biomass_Gain As Double
Dim Actual_Crop_Biomass_Gain As Double
Dim NSF As Double
Dim WSF As Double

Transpiration_Use_Efficiency_At_1kpa = ReadInputs.TranspirationUseEfficiency_1_kPa(Crop_Number)
TUE_Slope = ReadInputs.SlopeDaytimeVPDFunction(Crop_Number)
Maximum_Temperature = ReadInputs.MaximumTemperature(DOY)
Minimum_Relative_Humidity = ReadInputs.MinimumRH(DOY)
Daytime_VPD = Maximum(0.5, 0.66 * 0.611 * Exp(17.502 * Maximum_Temperature / (Maximum_Temperature + 240.97)) * (1 - Minimum_Relative_Humidity / 100))
Daily_Transpiration_Use_Efficiency = Transpiration_Use_Efficiency_At_1kpa / (Daytime_VPD ^ TUE_Slope)

If Potential_Crop Then
    Potential_Crop_Transpiration = ET.PotentialCropTranspiration(DOY)
    Potential_Crop_Biomass_Gain = Potential_Crop_Transpiration * Daily_Transpiration_Use_Efficiency 'kg biomass per m2 ground area
    If DOY = 1 Then
        Cumulative_Potential_Crop_Biomass(DOY) = Cumulative_Potential_Crop_Biomass(365) + Potential_Crop_Biomass_Gain
        Else
        Cumulative_Potential_Crop_Biomass(DOY) = Cumulative_Potential_Crop_Biomass(DOY - 1) + Potential_Crop_Biomass_Gain
    End If
    Else
    Actual_Crop_Transpiration = ET.ActualTransp(DOY)
    Dim Pot_Transp As Double
    Dim Water_SI As Double
    Pot_Transp = ET.PotentialCropTranspiration(DOY)
    WSF = Actual_Crop_Transpiration / Pot_Transp 'Water Stress Factor
    NSF = 1 - Crop.NitrogenStressIndex(DOY - 1) 'Nitrogen Stress Factor
    Actual_Crop_Biomass_Gain = Pot_Transp * Daily_Transpiration_Use_Efficiency * Minimum(NSF, WSF) 'kg biomass per m2 ground area
    If DOY = 1 Then
    Cumulative_Crop_Biomass(DOY) = Cumulative_Crop_Biomass(365) + Actual_Crop_Biomass_Gain
    Seasonal_Biomass = Seasonal_Biomass + Actual_Crop_Biomass_Gain
    Else
    Cumulative_Crop_Biomass(DOY) = Cumulative_Crop_Biomass(DOY - 1) + Actual_Crop_Biomass_Gain
    Seasonal_Biomass = Seasonal_Biomass + Actual_Crop_Biomass_Gain
    End If
End If
End Sub

Sub ReferencePlantNConcentration(DOY As Integer, Crop_Number As Integer)
Dim Biomass_To_Start_Dilution_Maximum_N_Concentration As Double
Dim Biomass_To_Start_Dilution_Critical_N_Concentration As Double
Dim Biomass_To_Start_Dilution_Minimum_N_Concentration As Double
Dim Scaling_Factor_Critical_N_Concentration As Double
Dim Scaling_Factor_Minimum_N_Concentration As Double
Dim Slope As Double
Dim Amax As Double
Dim Acrit As Double
Dim Amin As Double
Dim N_Maximum_Concentration_At_Emergence As Double
Dim N_Critical_Concentration_At_Emergence As Double
Dim N_Minimum_Concentration_At_Emergence As Double
Dim Daily_Top_Biomass As Double
Dim Cumulative_Top_Biomass As Double
Dim Maximum_N_Concentration_At_Maturity As Double
Dim Critical_N_Concentration_At_Maturity As Double
Dim Minimum_N_Concentration_At_Maturity As Double
Dim DOY_Season_End As Integer
Dim DOY_Begin_Decline As Double
Dim Begin_Crop_Senescence As Boolean

'Read input parameters
N_Critical_Concentration_At_Emergence = ReadInputs.CriticalNConcentrationEmergence(Crop_Number)
N_Maximum_Concentration_At_Emergence = ReadInputs.MaximumNConcentrationEmergence(Crop_Number)
N_Minimum_Concentration_At_Emergence = ReadInputs.MinimumNConcentrationEmergence(Crop_Number)
Biomass_To_Start_Dilution_Maximum_N_Concentration = ReadInputs.BiomassStartDilutionMaximumNConcentration(Crop_Number)
Biomass_To_Start_Dilution_Critical_N_Concentration = ReadInputs.BiomassStartDilutionCriticalNConcentration(Crop_Number)
Biomass_To_Start_Dilution_Minimum_N_Concentration = ReadInputs.BiomassStartDilutionMinimumNConcentration(Crop_Number)
Slope = ReadInputs.NDilutionSlope(Crop_Number)
Maximum_N_Concentration_At_Maturity = ReadInputs.MaximumNConcentrationMaturity(Crop_Number)
Critical_N_Concentration_At_Maturity = ReadInputs.CriticalNConcentrationMaturity(Crop_Number)
Minimum_N_Concentration_At_Maturity = ReadInputs.MinimumNConcentrationMaturity(Crop_Number)
DOY_Begin_Decline = ReadInputs.BegingSenescenceDOY1
'Start processing
 Amax = N_Maximum_Concentration_At_Emergence / (Biomass_To_Start_Dilution_Maximum_N_Concentration ^ Slope)
 Acrit = N_Critical_Concentration_At_Emergence / (Biomass_To_Start_Dilution_Critical_N_Concentration ^ Slope)
 Amin = N_Minimum_Concentration_At_Emergence / (Biomass_To_Start_Dilution_Minimum_N_Concentration ^ Slope)

If Crop_Number = 1 Then DOY_Season_End = ReadInputs.MaturityDOY1 Else DOY_Season_End = ReadInputs.MaturityDOY2
Cumulative_Top_Biomass = Cumulative_Potential_Crop_Biomass(DOY) * 10  'Convert kg/m2 to Mg/ha
If Not Begin_Crop_Senescence Then
    Maximum_N_Concentration(DOY) = Minimum(N_Maximum_Concentration_At_Emergence, Amax * (Cumulative_Top_Biomass ^ Slope))
    Critical_N_Concentration(DOY) = Minimum(N_Critical_Concentration_At_Emergence, Acrit * (Cumulative_Top_Biomass ^ Slope))
    Minimum_N_Concentration(DOY) = Minimum(N_Minimum_Concentration_At_Emergence, Amin * (Cumulative_Top_Biomass ^ Slope))
    If DOY = DOY_Begin_Decline Then
        Begin_Crop_Senescence = True
        DOY_Of_Transition = DOY
        Maximum_N_Concentration(DOY) = Minimum(N_Maximum_Concentration_At_Emergence, Amax * (Cumulative_Top_Biomass ^ Slope))
        Critical_N_Concentration(DOY) = Minimum(N_Critical_Concentration_At_Emergence, Acrit * (Cumulative_Top_Biomass ^ Slope))
        Minimum_N_Concentration(DOY) = Minimum(N_Minimum_Concentration_At_Emergence, Amin * (Cumulative_Top_Biomass ^ Slope))
    
        Maximum_N_Concentration_At_Transition = Maximum_N_Concentration(DOY)
        Critical_N_Concentration_At_Transition = Critical_N_Concentration(DOY)
        Minimum_N_Concentration_At_Transition = Minimum_N_Concentration(DOY)
        
        Dim Days_Elapsed As Integer
        If DOY > DOY_Season_End Then Days_Elapsed = (365 - DOY) + DOY_Season_End Else Days_Elapsed = DOY_Season_End - DOY
        
        Daily_Change_Maximum_N_Concentration = (Maximum_N_Concentration_At_Transition - Maximum_N_Concentration_At_Maturity) / Days_Elapsed
        Daily_Change_Critical_N_Concentration = (Critical_N_Concentration_At_Transition - Critical_N_Concentration_At_Maturity) / Days_Elapsed
        Daily_Change_Minimum_N_Concentration = (Minimum_N_Concentration_At_Transition - Minimum_N_Concentration_At_Maturity) / Days_Elapsed
    End If
    Else
    Maximum_N_Concentration(DOY) = Maximum_N_Concentration_At_Transition - Daily_Change_Maximum_N_Concentration * (DOY - DOY_Of_Transition)
    Critical_N_Concentration(DOY) = Critical_N_Concentration_At_Transition - Daily_Change_Critical_N_Concentration * (DOY - DOY_Of_Transition)
    Minimum_N_Concentration(DOY) = Minimum_N_Concentration_At_Transition - Daily_Change_Minimum_N_Concentration * (DOY - DOY_Of_Transition)
End If
End Sub

Sub NitrogenUptake(DOY As Integer, Crop_Number As Integer)
Dim Cumulative_Top_Biomass As Double
Dim Today_Crop_N_Demand As Double
Dim Today_Expected_N_Uptake As Double
'Dim Surplus As Double
Dim Today_Potential_N_Uptake As Double
Dim Soil_N_Mass(20) As Double
Dim Soil_NO3_Mass(20) As Double
Dim Soil_NH4_Mass(20) As Double
Dim Nitrate_Mass_Fraction(20) As Double
Dim Ammonium_Mass_Fraction(20) As Double
Dim N_Conc_ppm As Double
Dim Soil_N_Conc_ppm_Where_N_Uptake_Decreases As Double
Dim Residual_N_Conc_ppm As Double
Dim N_Availability_Coefficient As Double
Dim N_Availability_Adjustment As Double
Dim Water_Availability_Coefficient As Double
Dim Water_Availability_Adjustment As Double
Dim Plant_Available_Water As Double
Dim PAW_Where_N_Uptake_Rate_Decreases As Double
Dim Crop_N_Conc As Double
Dim Layer_Thickness As Double
Dim Bulk_Density As Double
Dim Layer As Integer
Dim Number_Of_Layers As Integer
Dim Layer_N_Uptake As Double
Dim Today_N_Uptake As Double
Dim Today_Plant_N_Max As Double
Dim Crop_N As Double
Dim Water_Density As Double
Dim Water_Uptake(20) As Double
Dim Water_Content As Double
Dim Soil_Solution_N_Conc(20) As Double
Dim Maximum_Active_N_Uptake As Double
Dim Total_Passive_N_Uptake As Double
Dim Potential_Passive_N_Uptake(20) As Double
Dim Potential_Active_N_Uptake(20) As Double
Dim Actual_Passive_N_Uptake(20) As Double
Dim Active_N_Uptake(20) As Double
Dim Layer_Active_NH4_N_Uptake(20) As Double
Dim Layer_Active_NO3_N_Uptake(20) As Double
Dim Min_Conc_For_Active_Uptake As Double
Dim Km As Double
Dim Layer_NH4_N_Uptake As Double
Dim Today_NH4_N_Uptake As Double
Dim Layer_NO3_N_Uptake As Double
Dim Today_NO3_N_Uptake As Double
Dim Total_Potential_Passive_N_Uptake As Double
Dim Today_Expected_Passive_N_Uptake As Double
Dim Total_Actual_Passive_N_Upt As Double
Dim Passive_Uptake_Deficit As Double
Dim Relative_Active_Uptake As Double
Dim Available_For_Active_Uptake As Double
Dim Total_Water_Uptake As Double

Water_Density = 1000 'kg/m3
If DOY = 1 Then Crop_N = Crop_N_Mass(365) Else Crop_N = Crop_N_Mass(DOY - 1)
Cumulative_Top_Biomass = Cumulative_Crop_Biomass(DOY) 'kg/m2
Today_Plant_N_Max = Crop.MaximumNConcentration(DOY)
Today_Crop_N_Demand = Maximum(0, Cumulative_Top_Biomass * Today_Plant_N_Max - Crop_N) 'Convert biomass from Mg/ha to kg/m2
'Calculate daily potential PASSIVE crop N uptake
Total_Potential_Passive_N_Uptake = 0
Total_Water_Uptake = 0
Number_Of_Layers = Soil.NumberModelLayers
For Layer = 2 To Number_Of_Layers
    Water_Uptake(Layer) = ET.SoilWaterUptake(DOY, Layer)
    If Water_Uptake(Layer) > 0 Then Total_Water_Uptake = Total_Water_Uptake + Water_Uptake(Layer)
    Soil_NO3_Mass(Layer) = Soil.NitrateNContent(DOY, Layer)
    Soil_NH4_Mass(Layer) = Soil.AmmoniumNContent(DOY, Layer)
    Water_Content = Soil.WaterContent(DOY, Layer)
    Layer_Thickness = Soil.LayerThickness(Layer)
    Soil_Solution_N_Conc(Layer) = Soil_NO3_Mass(Layer) / (Water_Content * Water_Density * Layer_Thickness) 'kg/kg   Only nitrate considered for passive uptake
    If Water_Uptake(Layer) > 0 Then
        Potential_Passive_N_Uptake(Layer) = Water_Uptake(Layer) * Soil_Solution_N_Conc(Layer)  'kg/m2
        Else
        Potential_Passive_N_Uptake(Layer) = 0
    End If
    If Potential_Passive_N_Uptake(Layer) > Soil_NO3_Mass(Layer) Then Potential_Passive_N_Uptake(Layer) = Soil_NO3_Mass(Layer)
    Total_Potential_Passive_N_Uptake = Total_Potential_Passive_N_Uptake + Potential_Passive_N_Uptake(Layer)
Next Layer
Today_Expected_Passive_N_Uptake = Minimum(Today_Crop_N_Demand, Total_Potential_Passive_N_Uptake)
'Determine the actual passive NO3-N uptake and update soil nitrate mass
Total_Actual_Passive_N_Upt = 0
For Layer = 2 To Number_Of_Layers
    If Total_Potential_Passive_N_Uptake > 0 Then
        Actual_Passive_N_Uptake(Layer) = Potential_Passive_N_Uptake(Layer) * Today_Expected_Passive_N_Uptake / Total_Potential_Passive_N_Uptake
    End If
        Total_Actual_Passive_N_Upt = Total_Actual_Passive_N_Upt + Actual_Passive_N_Uptake(Layer)
        Soil_NO3_Mass(Layer) = Soil_NO3_Mass(Layer) - Actual_Passive_N_Uptake(Layer)
Next Layer
Passive_Uptake_Deficit = Maximum(0, Today_Crop_N_Demand - Total_Actual_Passive_N_Upt)
For Layer = 2 To Number_Of_Layers
    If Passive_Uptake_Deficit > 0 And Total_Actual_Passive_N_Upt > 0 Then 'Calculate daily potential ACTIVE uptake by layer
            Maximum_Active_N_Uptake = Passive_Uptake_Deficit * Actual_Passive_N_Uptake(Layer) / Total_Actual_Passive_N_Upt
            Else
            If Water_Uptake(Layer) > 0 Then
                Maximum_Active_N_Uptake = Passive_Uptake_Deficit * Water_Uptake(Layer) / Total_Water_Uptake
                Else
                Maximum_Active_N_Uptake = 0
            End If
    End If
    Soil_Solution_N_Conc(Layer) = (Soil_NO3_Mass(Layer) + Soil_NH4_Mass(Layer)) / (Water_Content * Water_Density * Layer_Thickness) 'kg/kg   [NO3] + [NH4] added for active uptake
    
    'Hard-Coded Parameters for Michaelis-Menten for relative active uptake (0 to 1) based on the soil solution N concentration
    Min_Conc_For_Active_Uptake = 0.00005
    Km = 0.00005
    If Soil_Solution_N_Conc(Layer) < Min_Conc_For_Active_Uptake Then
        Relative_Active_Uptake = 0
        Else
        Relative_Active_Uptake = Maximum(0, (Soil_Solution_N_Conc(Layer) - Min_Conc_For_Active_Uptake) / (Km + Soil_Solution_N_Conc(Layer) - Min_Conc_For_Active_Uptake))
    End If
    Active_N_Uptake(Layer) = Maximum_Active_N_Uptake * Relative_Active_Uptake
    Available_For_Active_Uptake = Soil_NO3_Mass(Layer) + Soil_NH4_Mass(Layer)
    If Active_N_Uptake(Layer) > Available_For_Active_Uptake Then Active_N_Uptake(Layer) = Available_For_Active_Uptake
    'Update Soil N
    Layer_Active_NH4_N_Uptake(Layer) = Minimum(Active_N_Uptake(Layer), Soil_NH4_Mass(Layer))
    Layer_Active_NO3_N_Uptake(Layer) = Maximum(0, Active_N_Uptake(Layer) - Layer_Active_NH4_N_Uptake(Layer))
Next Layer
Today_N_Uptake = 0
Today_NO3_N_Uptake = 0
Today_NH4_N_Uptake = 0
For Layer = 2 To Number_Of_Layers
    Soil.AmmoniumNContent(DOY, Layer) = Soil.AmmoniumNContent(DOY, Layer) - Layer_Active_NH4_N_Uptake(Layer)
    Soil.NitrateNContent(DOY, Layer) = Soil.NitrateNContent(DOY, Layer) - Layer_Active_NO3_N_Uptake(Layer) - Actual_Passive_N_Uptake(Layer)
    Today_NO3_N_Uptake = Today_NO3_N_Uptake + Layer_Active_NO3_N_Uptake(Layer) + Actual_Passive_N_Uptake(Layer)
    Today_NH4_N_Uptake = Today_NH4_N_Uptake + Layer_Active_NH4_N_Uptake(Layer)
    Today_N_Uptake = Today_N_Uptake + Actual_Passive_N_Uptake(Layer) + Layer_Active_NH4_N_Uptake(Layer) + Layer_Active_NO3_N_Uptake(Layer)
Next Layer
If DOY = 1 Then Seasonal_N_Uptake = Cumulative_N_Uptake(365) + Today_N_Uptake Else Seasonal_N_Uptake = Cumulative_N_Uptake(DOY - 1) + Today_N_Uptake
Crop_N = Crop_N + Today_N_Uptake 'Crop N mass different to cumulative N uptake only if Crop N mass set at emergence or foliar applications considered
Crop_N_Conc = Crop_N / Cumulative_Top_Biomass
'Update variables
Crop_N_Mass(DOY) = Crop_N
N_Uptake(DOY) = Today_N_Uptake
Nitrate_N_Uptake(DOY) = Today_NO3_N_Uptake
Ammonium_N_Uptake(DOY) = Today_NH4_N_Uptake
Cumulative_N_Uptake(DOY) = Seasonal_N_Uptake
Crop_N_Concentration(DOY) = Crop_N_Conc
If Crop_N_Concentration(DOY) >= Critical_N_Concentration(DOY) Then
    Nitrogen_Stress_Index(DOY) = 0
    Else
    Nitrogen_Stress_Index(DOY) = Minimum(1, 1 - (Crop_N_Concentration(DOY) - Minimum_N_Concentration(DOY)) / (Critical_N_Concentration(DOY) - Minimum_N_Concentration(DOY)))
End If
End Sub
Private Function Minimum(A As Double, B As Double) As Double
If A > B Then
    Minimum = B
    Else
    Minimum = A
End If
End Function
Private Function Maximum(A As Double, B As Double) As Double
If A < B Then
    Maximum = B
    Else
    Maximum = A
End If
End Function

Property Get PotentialGreenCanopyCover(DOY As Integer) As Double
PotentialGreenCanopyCover = Potential_Green_Canopy_Cover(DOY)
End Property
Property Get GreenCanopyCover(DOY As Integer) As Double
GreenCanopyCover = Green_Canopy_Cover(DOY)
End Property
Property Get TotalCanopyCover(DOY As Integer) As Double
TotalCanopyCover = Total_Canopy_Cover(DOY)
End Property
Property Get PotentialTotalCanopyCover(DOY As Integer) As Double
PotentialTotalCanopyCover = Potential_Total_Canopy_Cover(DOY)
End Property
Property Get RootDepth(DOY As Integer) As Double
RootDepth = Root_Depth(DOY)
End Property
Property Get CropHeight(DOY As Integer) As Double
CropHeight = Crop_Height(DOY)
End Property
Property Get TodayBiomassGain(DOY As Integer) As Double
TodayBiomassGain = Today_Biomass_Gain(DOY)
End Property
Property Get CumulativeCropBiomass(DOY As Integer) As Double
CumulativeCropBiomass = Cumulative_Crop_Biomass(DOY)
End Property
Property Get CumulativePotentialCropBiomass(DOY As Integer) As Double
CumulativePotentialCropBiomass = Cumulative_Potential_Crop_Biomass(DOY)
End Property
Property Get SeasonalBiomass() As Double
SeasonalBiomass = Seasonal_Biomass
End Property
Property Let SeasonalBiomass(Update As Double)
Seasonal_Biomass = Update
End Property
Property Get RootDepthAtEmergence(DOY As Integer) As Double
RootDepthAtEmergence = Root_Depth_At_Emergence(DOY)
End Property
Property Get CropNMass(DOY As Integer) As Double
CropNMass = Crop_N_Mass(DOY)
End Property
Property Get NUptake(DOY As Integer) As Double
NUptake = N_Uptake(DOY)
End Property
Property Get NitrateNUptake(DOY As Integer) As Double
NitrateNUptake = Nitrate_N_Uptake(DOY)
End Property
Property Get AmmoniumNUptake(DOY As Integer) As Double
AmmoniumNUptake = Ammonium_N_Uptake(DOY)
End Property
Property Get CumulativeNUptake(DOY As Integer) As Double
CumulativeNUptake = Cumulative_N_Uptake(DOY)
End Property
Property Let CumulativeNUptake(DOY As Integer, Update As Double)
Cumulative_N_Uptake(DOY) = Update
End Property
Property Get SeasonalNUptake() As Double
SeasonalNUptake = Seasonal_N_Uptake
End Property
Property Let SeasonalNUptake(Update As Double)
Seasonal_N_Uptake = Update
End Property
Property Get CropNConcentration(DOY As Integer) As Double
CropNConcentration = Crop_N_Concentration(DOY)
End Property
Property Get NitrogenStressIndex(DOY As Integer) As Double
NitrogenStressIndex = Nitrogen_Stress_Index(DOY)
End Property
Property Get MaximumNConcentration(DOY As Integer) As Double
MaximumNConcentration = Maximum_N_Concentration(DOY)
End Property
Property Get CriticalNConcentration(DOY As Integer) As Double
CriticalNConcentration = Critical_N_Concentration(DOY)
End Property
Property Get MinimumNConcentration(DOY As Integer) As Double
MinimumNConcentration = Minimum_N_Concentration(DOY)
End Property
