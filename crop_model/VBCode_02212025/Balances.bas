Attribute VB_Name = "Balances"
Option Explicit
Dim Initial_WD As Double
Dim Initial_NO3_N As Double
Dim Initial_NH4_N As Double
Dim Initial_SOC As Double
Dim Initial_SON As Double
Dim Balance_Water As Double
Dim Balance_NO3_N As Double
Dim Balance_NH4_N As Double
Dim Balance_SOC As Double
Dim Balance_SON As Double

Sub InitialSoilProfile(DOY As Integer)
Dim Number_Of_Layers As Integer
Dim Layer As Integer
Dim Water_Density As Double
Water_Density = 1000 'kg/m3
Initial_WD = 0
Initial_NO3_N = 0
Initial_NH4_N = 0
Initial_SOC = 0
Initial_SON = 0
Number_Of_Layers = Soil.NumberModelLayers
    For Layer = 1 To Number_Of_Layers
        Initial_WD = Initial_WD + Soil.WaterContent(DOY, Layer) * Soil.LayerThickness(Layer) * Water_Density 'kg/m2 or mm
        Initial_NO3_N = Initial_NO3_N + Soil.NitrateNContent(DOY, Layer)
        Initial_NH4_N = Initial_NH4_N + Soil.AmmoniumNContent(DOY, Layer)
        Initial_SOC = Initial_SOC + Soil.SoilOrganicCarbon(DOY, Layer)
        Initial_SON = Initial_SON + Soil.SoilOrganicNitrogen(DOY, Layer)
    Next Layer
End Sub

Sub All(DOY As Integer)
Dim Final_WD As Double
Dim Final_NO3_N As Double
Dim Final_NH4_N As Double
Dim Final_SOC As Double
Dim Final_SON As Double
Dim Number_Of_Layers As Integer
Dim Layer As Integer
Dim Water_Density As Double
Water_Density = 1000 'kg/m3

Final_WD = 0
Final_NO3_N = 0
Final_NH4_N = 0
Final_SOC = 0
Final_SON = 0
Number_Of_Layers = Soil.NumberModelLayers
For Layer = 1 To Number_Of_Layers
    Final_WD = Final_WD + Soil.WaterContent(DOY, Layer) * Soil.LayerThickness(Layer) * Water_Density 'kg/m2 or mm
    Final_NO3_N = Final_NO3_N + Soil.NitrateNContent(DOY, Layer)
    Final_NH4_N = Final_NH4_N + Soil.AmmoniumNContent(DOY, Layer)
    Final_SOC = Final_SOC + Soil.SoilOrganicCarbon(DOY, Layer)
    Final_SON = Final_SON + Soil.SoilOrganicNitrogen(DOY, Layer)
Next Layer

Balance_Water = Initial_WD + ReadInputs.NetIrrigationDepth(DOY) + ReadInputs.Precip(DOY) - ET.ActualSoilWaterEvaporation(DOY) - ET.ActualTransp(DOY) - Soil.DeepDrainage(DOY) - Final_WD
Balance_NO3_N = Initial_NO3_N + ReadInputs.NitrateFertilizationRate(DOY) + OrganicCandN.DailyNitrification(DOY) - Crop.NitrateNUptake(DOY) - Soil.NLeaching(DOY) - Final_NO3_N
Balance_NH4_N = Initial_NH4_N + ReadInputs.AmmoniumFertilizationRate(DOY) + OrganicCandN.DailyProfileOxidizedSOMNTransferToAmmoniumPool(DOY) - OrganicCandN.DailyNitrification(DOY) - Crop.AmmoniumNUptake(DOY) - Final_NH4_N
Balance_SOC = Initial_SOC - OrganicCandN.DailyProfileSOCPoolOxidation(DOY) + OrganicCandN.DailyProfileOxidizedSOMCTransferBackToSOM(DOY) - Final_SOC
Balance_SON = Initial_SON - OrganicCandN.DailyProfileOxidizedSOMNTransferToAmmoniumPool(DOY) - Final_SON
If Abs(Balance_Water) > 0.0000000001 Then Stop
If Abs(Balance_NO3_N) > 0.0000000001 Then Stop
If Abs(Balance_NH4_N) > 0.0000000001 Then Stop
If Abs(Balance_SOC) > 0.0000000001 Then Stop
If Abs(Balance_SON) > 0.0000000001 Then Stop
'Update state variables for next DOY
For Layer = 1 To Number_Of_Layers
If DOY <> 365 Then
    Soil.WaterContent(DOY + 1, Layer) = Soil.WaterContent(DOY, Layer)
    Soil.NitrateNContent(DOY + 1, Layer) = Soil.NitrateNContent(DOY, Layer)
    Soil.AmmoniumNContent(DOY + 1, Layer) = Soil.AmmoniumNContent(DOY, Layer)
    Soil.SoilOrganicCarbon(DOY + 1, Layer) = Soil.SoilOrganicCarbon(DOY, Layer)
    Soil.SoilOrganicNitrogen(DOY + 1, Layer) = Soil.SoilOrganicNitrogen(DOY, Layer)
    Else
    Soil.WaterContent(1, Layer) = Soil.WaterContent(DOY, Layer)
    Soil.NitrateNContent(1, Layer) = Soil.NitrateNContent(DOY, Layer)
    Soil.AmmoniumNContent(1, Layer) = Soil.AmmoniumNContent(DOY, Layer)
    Soil.SoilOrganicCarbon(1, Layer) = Soil.SoilOrganicCarbon(DOY, Layer)
    Soil.SoilOrganicNitrogen(1, Layer) = Soil.SoilOrganicNitrogen(DOY, Layer)
End If
Next Layer
End Sub
