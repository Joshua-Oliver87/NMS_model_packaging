Attribute VB_Name = "OrganicCandN"
Option Explicit
Dim SOM_C_Pool(366, 20) As Double
Dim SOM_N_Pool(366, 20) As Double
Dim Residue_C_Pool(366, 20) As Double
Dim Residue_N_Pool(366, 20) As Double
Dim SOC_Oxidation_Rate As Double
Dim Saturation_Carbon_Conc_kg_Per_m2 As Double
Dim Empirical_Constant_m As Double
Dim Microbial_Biomass_Synthesis_Efficiency As Double
Dim SOC_C_N_Ratio As Double
Dim Oxidation_Water_Function(6) As Double
Dim Oxidation_Temperature_Function(6) As Double
Dim Clay_Fraction(6) As Double
Dim Layer_Mineralization(366, 20) As Double
Dim Mineralization_Top_Three_Layers(366) As Double
Dim Mineralization_Next_Three_Layers(366) As Double
Dim Cumulative_Mineralization_Top_Three_Layers_All_Days As Double
Dim Cumulative_Mineralization_Next_Three_Layers_All_Days As Double
Dim Cumulative_Mineralization_Top_Three_Layers_Crop1 As Double
Dim Cumulative_Mineralization_Next_Three_Layers_Crop1 As Double
Dim Cumulative_Mineralization_Top_Three_Layers_Crop2 As Double
Dim Cumulative_Mineralization_Next_Three_Layers_Crop2 As Double
Dim Daily_Nitrification(366) As Double
Dim Layer_SOC_Pool_Oxidation As Double
Dim Layer_Oxidized_SOM_C_Transfer_Back_To_SOM As Double
Dim Layer_Oxidized_SOM_N_Transferred_To_Ammonium As Double
Dim Daily_Profile_SOC_Pool_Oxidation(366) As Double
Dim Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM(366) As Double
Dim Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool(366) As Double

Sub ClearArrays()
Dim i As Integer
Dim j As Integer
For i = 1 To 366
    Mineralization_Top_Three_Layers(i) = 0
    Mineralization_Next_Three_Layers(i) = 0
    Daily_Nitrification(i) = 0
    Daily_Profile_SOC_Pool_Oxidation(i) = 0
    Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM(i) = 0
    Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool(i) = 0
Next i
For i = 1 To 6
    Oxidation_Water_Function(i) = 0
    Oxidation_Temperature_Function(i) = 0
    Clay_Fraction(i) = 0
Next i
For i = 1 To 366
    For j = 1 To 20
        SOM_C_Pool(i, j) = 0
        SOM_N_Pool(i, j) = 0
        Residue_C_Pool(i, j) = 0
        Residue_N_Pool(i, j) = 0
        Layer_Mineralization(i, j) = 0
    Next j
Next i
'Clear accumulators
Cumulative_Mineralization_Top_Three_Layers_Crop1 = 0
Cumulative_Mineralization_Next_Three_Layers_Crop1 = 0
Cumulative_Mineralization_Top_Three_Layers_Crop2 = 0
Cumulative_Mineralization_Next_Three_Layers_Crop2 = 0
Cumulative_Mineralization_Top_Three_Layers_All_Days = 0
Cumulative_Mineralization_Next_Three_Layers_All_Days = 0
End Sub
Sub Mineralization(DOY As Integer, Crop_Number As Integer)
Dim Carbon_Fraction_In_Residues As Double
Dim Layer As Integer
Dim NTO As Integer
Dim i As Integer
Dim Residue_Mass(6) As Double
Dim Residue_N_Concentration(6) As Double
Dim Percent_SOM(6) As Double
Dim Soil_Mass(6) As Double
Dim volumetric_Water_Content(6) As Double
Dim Layer_Thickness(6) As Double
Dim Bulk_Density(6) As Double
'Dim Tillage_Date(4) As Double
Dim Saturation_Carbon_Conc_g_Per_kg As Double
Dim Empirical_Constant_n As Double
Dim Residue_Oxidation_Rate As Double
Dim Number_Of_Soil_Layers As Integer
Dim Water_Filled_Porosity As Double

'Initialize state variables
'If DOY = Main.RunFirstDOY Then Call Initialize

'Hardcoded parameters
Carbon_Fraction_In_Residues = 0.4
SOC_C_N_Ratio = 12 'kg/kg
Microbial_Biomass_Synthesis_Efficiency = 0.5 'Dimensionless
Empirical_Constant_n = 6
Empirical_Constant_m = 0.5
'Residue_Oxidation_Rate = 0.035 '(1/day) 'Residue mineralization not implemented yet
SOC_Oxidation_Rate = 0.0005 '(1/day)  '0.008 for long-term amd 0.1 for short-term mineralization C-Farm: 0.00015
'Read soil input parameters
Number_Of_Soil_Layers = 6 'Only the 6 top layers are considered for mineralization
Daily_Profile_SOC_Pool_Oxidation(DOY) = 0
Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM(DOY) = 0
Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool(DOY) = 0
For Layer = 1 To Number_Of_Soil_Layers
    Layer_Thickness(Layer) = Soil.LayerThickness(Layer) 'm
    'Organic residues, including plants, manure, and others to be implemented later
'    Residue_Mass(Layer) = 0 'kg/ha
'    Residue_N_Concentration(Layer) = 0 'kg/kg
    Bulk_Density(Layer) = Soil.BulkDensity(Layer) 'Mg/m3
    Clay_Fraction(Layer) = Soil.FractionOfClay(Layer)
    volumetric_Water_Content(Layer) = Soil.WaterContent(DOY, Layer)
    Soil_Mass(Layer) = Bulk_Density(Layer) * 1000# * Layer_Thickness(Layer) 'kg/m2 in the soil layer thickness. Bulk density converted from Mg/m3 to kg/m3
    'Initialization of pools
    SOM_C_Pool(DOY, Layer) = Soil.SoilOrganicCarbon(DOY, Layer)
    SOM_N_Pool(DOY, Layer) = Soil.SoilOrganicNitrogen(DOY, Layer)
'    If Residue_Mass(Layer) > 0 Then
'        Residue_C_Pool(DOY, Layer) = Residue_Mass(Layer) * Carbon_Fraction_In_Residues
'        Residue_N_Pool(DOY, Layer) = Residue_N_Concentration(Layer) * Residue_Mass(Layer)
'    End If
    'Miscellaneous values by soil layer
'    Residue_CN_Ratio(Layer) = Residue_C_Pool(Layer) / Residue_N_Pool(Layer) '***** To be implemented later
    Saturation_Carbon_Conc_g_Per_kg = (21.1 + 37.5 * Clay_Fraction(Layer)) 'g/kg
    Saturation_Carbon_Conc_kg_Per_m2 = Saturation_Carbon_Conc_g_Per_kg * Soil_Mass(Layer) / 1000#  'kg/ha
'    Maximum_Humification_Rate(Layer) = 0.09 + 0.11 * (1 - Exp(-5.5 * Clay_Fraction(Layer))) '(1/day) ***** To be implemented later
    Water_Filled_Porosity = volumetric_Water_Content(Layer) / (1 - Bulk_Density(Layer) / 2.65)
    Oxidation_Water_Function(Layer) = OxidationMoistureFunction(0.6, Water_Filled_Porosity)
    Oxidation_Temperature_Function(Layer) = OxidationTemperatureFunction(Layer)
    Call CarbonNitrogenChanges(DOY, Layer)
    Daily_Profile_SOC_Pool_Oxidation(DOY) = Daily_Profile_SOC_Pool_Oxidation(DOY) + Layer_SOC_Pool_Oxidation
    Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM(DOY) = Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM(DOY) + Layer_Oxidized_SOM_C_Transfer_Back_To_SOM
    Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool(DOY) = Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool(DOY) + Layer_Oxidized_SOM_N_Transferred_To_Ammonium
    Layer_Mineralization(DOY, Layer) = Layer_Oxidized_SOM_N_Transferred_To_Ammonium
Next Layer

'Prepare Mineralization Outputs
Mineralization_Top_Three_Layers(DOY) = Layer_Mineralization(DOY, 1) + Layer_Mineralization(DOY, 2) + Layer_Mineralization(DOY, 3)
Mineralization_Next_Three_Layers(DOY) = Layer_Mineralization(DOY, 4) + Layer_Mineralization(DOY, 5) + Layer_Mineralization(DOY, 6)
'Cumulative mineralization from emergence to maturity of crop number one
If Crop_Number = 1 Then
    Cumulative_Mineralization_Top_Three_Layers_Crop1 = Cumulative_Mineralization_Top_Three_Layers_Crop1 + Mineralization_Top_Three_Layers(DOY)
    Cumulative_Mineralization_Next_Three_Layers_Crop1 = Cumulative_Mineralization_Next_Three_Layers_Crop1 + Mineralization_Next_Three_Layers(DOY)
End If
'Cumulative mineralization from emergence to maturity of crop number two
If Crop_Number = 2 Then
    Cumulative_Mineralization_Top_Three_Layers_Crop2 = Cumulative_Mineralization_Top_Three_Layers_Crop2 + Mineralization_Top_Three_Layers(DOY)
    Cumulative_Mineralization_Next_Three_Layers_Crop2 = Cumulative_Mineralization_Next_Three_Layers_Crop2 + Mineralization_Next_Three_Layers(DOY)
End If
'Cumulative mineralization for the entire simulation run
Cumulative_Mineralization_Top_Three_Layers_All_Days = Cumulative_Mineralization_Top_Three_Layers_All_Days + Mineralization_Top_Three_Layers(DOY)
Cumulative_Mineralization_Next_Three_Layers_All_Days = Cumulative_Mineralization_Next_Three_Layers_All_Days + Mineralization_Next_Three_Layers(DOY)
'IMPLEMENT READING OF TILLAGE OPERATIONS. THIS WILL NOT BE DEVELOPED YET
'NTO = [A15] 'Number of tillage operations
'For i = 1 To NTO
'    Tillage_Date(i) = Cells(17 + i, 2) 'Days after planting
'    Disturbance_Rate(i) = Cells(17 + i, 3) 'Based on RUSLE table
'Next i
End Sub

Sub CarbonNitrogenChanges(DOY As Integer, Layer As Integer)
Dim Residue_Daily_Oxidation As Double
Dim N_Immobilization_To_Oxidize_Residue_Pool As Double
Dim N_Mineralization_From_Oxidized_Residue_Pool As Double
Dim Layer_Oxidized_SOM_C_Transfer_To_CO2 As Double
Dim Layer_N_Released_From_SOM_Oxidation As Double
Dim Humification_Fraction As Double
Dim Residue_C_Transfer_To_SOC As Double
Dim Residue_C_Transfer_To_CO2 As Double
Dim N_Available_From_Oxidized_Residue As Double
Dim Residue_N_Transfer_To_SOM_Pool As Double
Dim Layer_Oxidized_SOM_N_Transfer_Back_To_SOM As Double
Dim Total_C_Emission_As_CO2 As Double
Dim Carbon_Balance As Double
Dim Carbon_Balance_In As Double
Dim Carbon_Balance_Out As Double
Dim Nitrogen_Balance As Double
Dim Nitrogen_Balance_In As Double
Dim Nitrogen_Balance_Out As Double
Dim Maximum_Tillage_Effect As Double
Dim Tillage_Effect As Double
Dim Layer_Tillage_Effect(6) As Double
Dim Hour_SOC_Ox As Double
Dim Daily_SOC_Ox As Double

'Adjust oxidation rate in response to tillage
'TILLAGE EFFECTS ARE NOT IMPLEMENTED YET. Tillage function set to 1.0
'    For Layer = 1 To Number_Of_Soil_Layers
'        Maximum_Tillage_Effect = 1 + 4 * Exp(-5.5 * Clay_Fraction(Layer)) 'Dimensionless
'        Tillage_Effect = Maximum(1, Maximum_Tillage_Effect * Disturbance_Rate(Layer) / (Disturbance_Rate(Layer) + Exp(5.5 - 0.05 * Disturbance_Rate(Layer)))) 'Dimensionless
'        Layer_Tillage_Effect(Layer) = 1
'    Next Layer
Tillage_Effect = 1
'Residue contribution to N mineralization not implemented yet
'N_Mineralization_From_Oxidized_Residue_Pool = 0
'        Residue_Daily_Oxidation = Residue_C_Pool(Layer) * Residue_Oxidation_Rate * Minimum(Temperature_Function(Layer), Oxidation_Water_Function(Layer)) * Tillage_Effect
'        Humification_Fraction = Maximum_Humification_Rate(Layer) * (1 - (SOM_C_Pool(Layer) / Saturation_Carbon_Concentration(Layer)) ^ Empirical_Constant_n)
'        Residue_C_Transfer_To_SOC = Residue_Daily_Oxidation * Humification_Fraction
'        Residue_C_Transfer_To_CO2 = Residue_Daily_Oxidation - Residue_C_Transfer_To_SOC
'        N_Available_From_Oxidized_Residue = Residue_Daily_Oxidation / Residue_CN_Ratio(Layer)
'        Residue_N_Transfer_To_SOM_Pool = Residue_C_Transfer_To_SOC / SOC_C_N_Ratio
'        N_Immobilization_To_Oxidize_Residue_Pool = Maximum(0, -(N_Available_From_Oxidized_Residue - Residue_N_Transfer_To_SOM_Pool))
'        N_Mineralization_From_Oxidized_Residue_Pool = Maximum(0, (N_Available_From_Oxidized_Residue - Residue_N_Transfer_To_SOM_Pool))
Layer_SOC_Pool_Oxidation = SOM_C_Pool(DOY, Layer) * SOC_Oxidation_Rate * (SOM_C_Pool(DOY, Layer) / Saturation_Carbon_Conc_kg_Per_m2) ^ Empirical_Constant_m _
        * Minimum(Oxidation_Temperature_Function(Layer), Oxidation_Water_Function(Layer)) * Tillage_Effect
Layer_Oxidized_SOM_C_Transfer_To_CO2 = Layer_SOC_Pool_Oxidation * (1 - Microbial_Biomass_Synthesis_Efficiency)
Layer_Oxidized_SOM_C_Transfer_Back_To_SOM = Layer_SOC_Pool_Oxidation * Microbial_Biomass_Synthesis_Efficiency
Layer_N_Released_From_SOM_Oxidation = Layer_SOC_Pool_Oxidation / SOC_C_N_Ratio
Layer_Oxidized_SOM_N_Transfer_Back_To_SOM = Layer_Oxidized_SOM_C_Transfer_Back_To_SOM / SOC_C_N_Ratio
Layer_Oxidized_SOM_N_Transferred_To_Ammonium = Layer_N_Released_From_SOM_Oxidation - Layer_Oxidized_SOM_N_Transfer_Back_To_SOM
Total_C_Emission_As_CO2 = Layer_Oxidized_SOM_C_Transfer_To_CO2
'Residues not implemented yet
'        Total_C_Emission_As_CO2 = Residue_C_Transfer_To_CO2 + Oxidized_SOM_C_Transfer_To_CO2
'Total_C_Emission_As_CO2 = Layer_Oxidized_SOM_C_Transfer_To_CO2
'Start C and N balance
'        Carbon_Balance_In = Residue_C_Pool(Layer) + SOM_C_Pool(Layer)
'        Nitrogen_Balance_In = Residue_C_Pool(Layer) / Residue_CN_Ratio(Layer) + SOM_C_Pool(Layer) / SOC_C_N_Ratio + Mineral_N_Mass(Layer)
Carbon_Balance_In = SOM_C_Pool(DOY, Layer)
Nitrogen_Balance_In = SOM_N_Pool(DOY, Layer) '+ Mineral_N_Mass(DOY, Layer)
'Update Pools
'        Residue_C_Pool(Layer) = Residue_C_Pool(Layer) - Residue_Daily_Oxidation ' + ResidueMicrobial_C_Transfer_Back + Oxidized_SOC_C_Transfer_To_ResidueMicrobial_Pool
'        Residue_N_Pool(Layer) = Residue_N_Pool(Layer) - N_Available_From_Oxidized_Residue
SOM_C_Pool(DOY, Layer) = SOM_C_Pool(DOY, Layer) - Layer_SOC_Pool_Oxidation + Layer_Oxidized_SOM_C_Transfer_Back_To_SOM '+ Residue_C_Transfer_To_SOM
SOM_N_Pool(DOY, Layer) = SOM_N_Pool(DOY, Layer) - Layer_Oxidized_SOM_N_Transferred_To_Ammonium '+ Residue_N_Transfer_To_SOM_Pool
Soil.SoilOrganicCarbon(DOY, Layer) = Soil.SoilOrganicCarbon(DOY, Layer) - Layer_SOC_Pool_Oxidation + Layer_Oxidized_SOM_C_Transfer_Back_To_SOM '+ Residue_C_Transfer_To_SOM
Soil.SoilOrganicNitrogen(DOY, Layer) = Soil.SoilOrganicNitrogen(DOY, Layer) - Layer_Oxidized_SOM_N_Transferred_To_Ammonium '+ Residue_N_Transfer_To_SOM_Pool

Soil.AmmoniumNContent(DOY, Layer) = Soil.AmmoniumNContent(DOY, Layer) + Layer_Oxidized_SOM_N_Transferred_To_Ammonium

'Soil.NitrateNContent(DOY + 1, Layer) = Soil.NitrateNContent(DOY, Layer) + Layer_Oxidized_SOM_N_Transfer_To_Mineral_Pool  'Assume rapid conversion from NH4 to NO3
'Mineral_N_Mass(DOY + 1, Layer) = Mineral_N_Mass(DOY, Layer) + Oxidized_SOM_N_Transfer_To_Mineral_Pool
'Calculate C and N balance. Residues not included at this time
'        Carbon_Balance_Out = Residue_C_Pool(Layer) + SOM_C_Pool(Layer) + Total_C_Emission_As_CO2
'        Nitrogen_Balance_Out = Residue_C_Pool(Layer) / Residue_CN_Ratio(Layer) + SOM_C_Pool(Layer) / SOC_C_N_Ratio + Mineral_N_Mass(Layer)
'Carbon_Balance_Out = SOM_C_Pool(DOY + 1, Layer) + Total_C_Emission_As_CO2
'Nitrogen_Balance_Out = SOM_C_Pool(DOY + 1, Layer) / SOC_C_N_Ratio '+ Mineral_N_Mass(DOY + 1, Layer)
'Carbon_Balance = Carbon_Balance_In - Carbon_Balance_Out
'Nitrogen_Balance = Nitrogen_Balance_In - Nitrogen_Balance_Out
End Sub

Sub Nitrification(DOY As Integer)
Dim Layer_Ammonium_N_Mass As Double
Dim Layer_Nitrate_N_Mass As Double
Dim Layer_N_Nitrified As Double
Dim Nitrification_NO3_NH4_Ratio As Double
Dim Nitrification_Constant As Double
Dim WFP As Double
Dim Temperature As Double
Dim pH As Double
Dim Moisture_Function As Double
Dim Temperature_Function As Double
Dim pH_Function As Double
Dim Number_Of_Layers As Integer
Dim Layer As Integer
Dim Total_Nitrification As Double

Total_Nitrification = 0
Number_Of_Layers = Soil.NumberModelLayers
For Layer = 1 To Number_Of_Layers
    Layer_N_Nitrified = 0
    Layer_Ammonium_N_Mass = Soil.AmmoniumNContent(DOY, Layer)
    Layer_Nitrate_N_Mass = Soil.NitrateNContent(DOY, Layer)
    Nitrification_NO3_NH4_Ratio = 8
    Nitrification_Constant = 0.3 '1/day
    WFP = Soil.WaterFilledPorosity(DOY, Layer)
    Temperature = Soil.LayerDailySoilTemperature(Layer)
    pH = 7
    Moisture_Function = OxidationMoistureFunction(0, WFP)
    Temperature_Function = OxidationTemperatureFunction(Layer)
    pH_Function = pHFunction(pH)
    If Layer_Ammonium_N_Mass > 0 Then
        If (Layer_Nitrate_N_Mass / Layer_Ammonium_N_Mass) < Nitrification_NO3_NH4_Ratio Then
            Layer_N_Nitrified = (Layer_Ammonium_N_Mass - Layer_Nitrate_N_Mass / Nitrification_NO3_NH4_Ratio) * _
                (1 - Exp(-Nitrification_Constant * pH_Function * Temperature_Function)) * Moisture_Function
            Else
            Layer_N_Nitrified = 0
        End If
        'Check that nitrification is limited to existing ammonium N mass and update local ammonium N mass
        If Layer_N_Nitrified > Layer_Ammonium_N_Mass Then
            Layer_N_Nitrified = Layer_Ammonium_N_Mass
        End If
    End If
    'Update ammonium and nitrate content
    Soil.AmmoniumNContent(DOY, Layer) = Soil.AmmoniumNContent(DOY, Layer) - Layer_N_Nitrified
    Soil.NitrateNContent(DOY, Layer) = Soil.NitrateNContent(DOY, Layer) + Layer_N_Nitrified
    Total_Nitrification = Total_Nitrification + Layer_N_Nitrified
Next Layer
Daily_Nitrification(DOY) = Total_Nitrification
End Sub
Function OxidationTemperatureFunction(Layer As Integer) As Double
Dim Hourly_TF As Double
Dim Q As Double
Dim Temperature_Function As Double
Dim Hour As Integer
Dim Air_Temperature As Double
'Hard-Coded Parameters
'The parameters for this function are for microbially-mediated N transformations and carbon decomposition
Const T_Min = -5#
Const T_Opt = 35#
Const T_Max = 50#

Temperature_Function = 0
For Hour = 1 To 24
    Air_Temperature = Soil.LayerHourlySoilTemperature(Layer, Hour)
    If Air_Temperature < T_Min Or Air_Temperature > T_Max Then
        Hourly_TF = 0
        Else
        Q = (T_Min - T_Opt) / (T_Opt - T_Max)
        Hourly_TF = ((Air_Temperature - T_Min) ^ (Q) * (T_Max - Air_Temperature)) / ((T_Opt - T_Min) ^ (Q) * (T_Max - T_Opt))
        If Hourly_TF > 1 Then Hourly_TF = 1#
        If Hourly_TF < 0.0000001 Then Hourly_TF = 0.0000001
    End If
    Temperature_Function = Temperature_Function + Hourly_TF / 24
Next Hour
OxidationTemperatureFunction = Temperature_Function
End Function

Function OxidationMoistureFunction(Function_Value_At_Saturation As Double, WFP As Double) As Double

'WFP is water-filled porosity
Dim WFP_min As Double  'Low end WFP value for zero response
Dim WFP_low As Double  'Lower value for maximum response
Dim WFP_high As Double 'Higher value for maximum response
Dim Moisture_Function As Double 'Moisture response function (0-1)

'Hard-Coded Parameters
WFP_min = 0.1
WFP_low = 0.5
WFP_high = 0.7

If WFP >= WFP_min And WFP < WFP_low Then
    Moisture_Function = ((WFP - WFP_min) / (WFP_low - WFP_min))
ElseIf WFP >= WFP_low And WFP <= WFP_high Then
    Moisture_Function = 1
ElseIf WFP > WFP_high And WFP <= 1 Then
    Moisture_Function = Function_Value_At_Saturation + (1 - Function_Value_At_Saturation) _
        * ((1 - WFP) / (1 - WFP_high)) ^ 2
End If
If Moisture_Function < 0 Then Moisture_Function = 0
OxidationMoistureFunction = Moisture_Function
End Function

Function pHFunction(pH As Double) As Double
Dim pH_Min As Single
Dim pH_Max As Single
Dim pH_Function

'Hard-Coded Parameters
pH_Min = 3.5
pH_Max = 6.5

pH_Function = (pH - pH_Min) / (pH_Max - pH_Min)
If pH_Function < 0 Then pH_Function = 0#
If pH_Function > 1 Then pH_Function = 1#
pHFunction = pH_Function
End Function

Property Get SOMCPool(DOY As Integer, Layer As Integer) As Double
SOMCPool = SOM_C_Pool(DOY, Layer)
End Property
Property Let SOMCPool(DOY As Integer, Layer As Integer, Update As Double)
SOM_C_Pool(DOY, Layer) = Update
End Property
Property Get SOMNPool(DOY As Integer, Layer As Integer) As Double
SOMNPool = SOM_N_Pool(DOY, Layer)
End Property
Property Let SOMNPool(DOY As Integer, Layer As Integer, Update As Double)
SOM_N_Pool(DOY, Layer) = Update
End Property
Property Get ResidueCPool(DOY As Integer, Layer As Integer) As Double
ResidueCPool = Residue_C_Pool(DOY, Layer)
End Property
Property Let ResidueCPool(DOY As Integer, Layer As Integer, Update As Double)
Residue_C_Pool(DOY, Layer) = Update
End Property
Property Get ResidueNPool(DOY As Integer, Layer As Integer) As Double
ResidueNPool = Residue_N_Pool(DOY, Layer)
End Property
Property Let ResidueNPool(DOY As Integer, Layer As Integer, Update As Double)
Residue_N_Pool(DOY, Layer) = Update
End Property
Property Get DailyNitrification(DOY As Integer) As Double
DailyNitrification = Daily_Nitrification(DOY)
End Property
Property Get DailyProfileSOCPoolOxidation(DOY As Integer) As Double
DailyProfileSOCPoolOxidation = Daily_Profile_SOC_Pool_Oxidation(DOY)
End Property
Property Get DailyProfileOxidizedSOMCTransferBackToSOM(DOY As Integer) As Double
DailyProfileOxidizedSOMCTransferBackToSOM = Daily_Profile_Oxidized_SOM_C_Transfer_Back_To_SOM(DOY)
End Property
Property Get DailyProfileOxidizedSOMNTransferToAmmoniumPool(DOY As Integer) As Double
DailyProfileOxidizedSOMNTransferToAmmoniumPool = Daily_Profile_Oxidized_SOM_N_Transfer_To_Ammonium_Pool(DOY)
End Property
Property Get MineralizationTopThreeLayers(DOY As Integer) As Double
MineralizationTopThreeLayers = Mineralization_Top_Three_Layers(DOY)
End Property
Property Let MineralizationTopThreeLayers(DOY As Integer, Update As Double)
Mineralization_Top_Three_Layers(DOY) = Update
End Property
Property Get MineralizationNextThreeLayers(DOY As Integer) As Double
MineralizationNextThreeLayers = Mineralization_Next_Three_Layers(DOY)
End Property
Property Let MineralizationNextThreeLayers(DOY As Integer, Update As Double)
Mineralization_Next_Three_Layers(DOY) = Update
End Property
Property Get LayerMineralization(DOY As Integer, Layer As Integer) As Double
LayerMineralization = Layer_Mineralization(DOY, Layer)
End Property
Property Let LayerMineralization(DOY As Integer, Layer As Integer, Update As Double)
Layer_Mineralization(DOY, Layer) = Update
End Property
Property Get CumulativeMineralizationTopThreeLayersCrop1() As Double
CumulativeMineralizationTopThreeLayersCrop1 = Cumulative_Mineralization_Top_Three_Layers_Crop1
End Property
Property Let CumulativeMineralizationTopThreeLayersCrop1(Update As Double)
Cumulative_Mineralization_Top_Three_Layers_Crop1 = Update
End Property
Property Get CumulativeMineralizationTopThreeLayersCrop2() As Double
CumulativeMineralizationTopThreeLayersCrop2 = Cumulative_Mineralization_Top_Three_Layers_Crop2
End Property
Property Let CumulativeMineralizationTopThreeLayersCrop2(Update As Double)
Cumulative_Mineralization_Top_Three_Layers_Crop2 = Update
End Property
Property Get CumulativeMineralizationNextThreeLayersCrop1() As Double
CumulativeMineralizationNextThreeLayersCrop1 = Cumulative_Mineralization_Next_Three_Layers_Crop1
End Property
Property Let CumulativeMineralizationNextThreeLayersCrop1(Update As Double)
Cumulative_Mineralization_Next_Three_Layers_Crop1 = Update
End Property
Property Get CumulativeMineralizationNextThreeLayersCrop2() As Double
CumulativeMineralizationNextThreeLayersCrop2 = Cumulative_Mineralization_Next_Three_Layers_Crop2
End Property
Property Let CumulativeMineralizationNextThreeLayersCrop2(Update As Double)
Cumulative_Mineralization_Next_Three_Layers_Crop2 = Update
End Property
Property Get CumulativeMineralizationTopThreeLayersAllDays() As Double
CumulativeMineralizationTopThreeLayersAllDays = Cumulative_Mineralization_Top_Three_Layers_All_Days
End Property
Property Let CumulativeMineralizationTopThreeLayersAllDays(Update As Double)
Cumulative_Mineralization_Top_Three_Layers_All_Days = Update
End Property
Property Get CumulativeMineralizationNextThreeLayersAllDays() As Double
CumulativeMineralizationNextThreeLayersAllDays = Cumulative_Mineralization_Next_Three_Layers_All_Days
End Property
Property Let CumulativeMineralizationNextThreeLayersAllDays(Update As Double)
Cumulative_Mineralization_Next_Three_Layers_All_Days = Update
End Property

