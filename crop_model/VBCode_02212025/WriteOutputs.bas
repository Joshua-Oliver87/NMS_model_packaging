Attribute VB_Name = "WriteOutputs"
Option Explicit

Sub ClearOutputs()
Worksheets("Crop One Output").Activate
Range(Cells(1, 1), Cells(400, 30)).Clear
Worksheets("Crop Two Output").Activate
Range(Cells(1, 1), Cells(400, 30)).Clear
Worksheets("Crop One Soil Output").Activate
Range(Cells(1, 1), Cells(400, 80)).Clear
Worksheets("Crop Two Soil Output").Activate
Range(Cells(1, 1), Cells(400, 80)).Clear
Worksheets("Summary Output").Activate
Range(Cells(1, 1), Cells(400, 70)).Clear
End Sub

Sub CropDailyOutput(Crop_Number As Integer)
Dim First As Integer
Dim Last As Integer
Dim Offset As Integer
Dim DAY As Integer 'This variable is used to avoid local use of DOY
Dim DAE As Integer

If Crop_Number = 1 Then
    Worksheets("Crop One Output").Activate
    First = 1
    Last = Minimum(ReadInputs.MaturityDAE1, ReadInputs.HarvestDAE1)
End If
If Crop_Number = 2 Then
    Worksheets("Crop Two Output").Activate
    First = 1
    Last = Minimum(ReadInputs.MaturityDAE2, ReadInputs.HarvestDAE2)
End If

'Write column labels
Cells(1, 1) = "DAE"
Cells(1, 2) = "DOY"
Cells(1, 3) = "Pot Green Canopy Cover"
Cells(1, 4) = "Pot crop Transpiration (mm/day)"
Cells(1, 5) = "Pot Biomass (kg/ha)"
Cells(1, 6) = "Green Canopy Cover"
Cells(1, 7) = "Biomass (kg/ha)"
Cells(1, 8) = "Transpiration (mm)"
Cells(1, 9) = "Soil Evap (mm)"
Cells(1, 10) = "Root Depth (m)"
Cells(1, 11) = "Height (m)"
Cells(1, 12) = "Max N Conc (kg/kg)"
Cells(1, 13) = "Crit N Conc (kg/kg)"
Cells(1, 14) = "Min N Conc (kg/kg)"
Cells(1, 15) = "Crop N Conc (kg/kg)"
Cells(1, 16) = "Crop N Mass (kg/ha)"
Cells(1, 17) = "N Uptake (kg/ha)"
Cells(1, 18) = "Crop WSI (0-1)"
Cells(1, 19) = "Crop NSI (0-1)"
Cells(1, 20) = "PAW Depletion Profile (0-1)"
Cells(1, 21) = "PAW Depletion Top 50 cm (0-1)"
Cells(1, 22) = "PAW Depletion Mid 50 cm (0-1)"
Cells(1, 23) = "PAW Depletion bottom 50 cm (0-1)"
Cells(1, 24) = "N Mass Top 50 cm (kg/ha)"
Cells(1, 25) = "N Mass Mid 50 cm (kg/ha)"
Cells(1, 26) = "N Mass bottom 50 cm (kg/ha)"
Cells(1, 27) = "N Leaching (kg/ha)"
Cells(1, 28) = "Soil N Mass down to 150 cm (kg/ha)"
Cells(1, 29) = "N Uptake Rate (kg/ha/day)"
'Write output data
For DAE = First To Last
    DAY = Main.DOYAtDAE(DAE)
    Cells(DAE + 1, 1) = DAE
    Cells(DAE + 1, 2) = DAY
    Cells(DAE + 1, 3) = Crop.PotentialGreenCanopyCover(DAY)
    Cells(DAE + 1, 4) = ET.PotentialCropTranspiration(DAY)
    Cells(DAE + 1, 5) = Crop.CumulativePotentialCropBiomass(DAY) * 10000 'Convert kg/m2 to kg/ha
    Cells(DAE + 1, 6) = Crop.GreenCanopyCover(DAY)
    Cells(DAE + 1, 7) = Crop.CumulativeCropBiomass(DAY) * 10000 'Convert kg/m2 to kg/ha
    Cells(DAE + 1, 8) = ET.ActualTransp(DAY)
    Cells(DAE + 1, 9) = ET.ActualSoilWaterEvaporation(DAY)
    Cells(DAE + 1, 10) = Crop.RootDepth(DAY)
    Cells(DAE + 1, 11) = Crop.CropHeight(DAY)
    Cells(DAE + 1, 12) = Crop.MaximumNConcentration(DAY)
    Cells(DAE + 1, 13) = Crop.CriticalNConcentration(DAY)
    Cells(DAE + 1, 14) = Crop.MinimumNConcentration(DAY)
    Cells(DAE + 1, 15) = Crop.CropNConcentration(DAY)
    Cells(DAE + 1, 16) = Crop.CropNMass(DAY) * 10000 'Convert kg/m2 to kg/ha
    Cells(DAE + 1, 17) = Crop.CumulativeNUptake(DAY) * 10000 'Convert kg/m2 to kg/ha
    Cells(DAE + 1, 18) = ET.WaterStressIndex(DAY)
    Cells(DAE + 1, 19) = Crop.NitrogenStressIndex(DAY)
    Cells(DAE + 1, 20) = Soil.PAWDepletion(DAY)
    Cells(DAE + 1, 21) = Soil.WaterContentTop50cm(DAY)
    Cells(DAE + 1, 22) = Soil.WaterContentMid50cm(DAY)
    Cells(DAE + 1, 23) = Soil.WaterContentBottom50cm(DAY)
    Cells(DAE + 1, 24) = Soil.NMassTop50cm(DAY)
    Cells(DAE + 1, 25) = Soil.NMassMid50cm(DAY)
    Cells(DAE + 1, 26) = Soil.NMassBottom50cm(DAY)
    Cells(DAE + 1, 27) = Soil.NLeaching(DAY)
    Cells(DAE + 1, 28) = Soil.NMassTop50cm(DAY) + Soil.NMassMid50cm(DAY) + Soil.NMassBottom50cm(DAY)
    Cells(DAE + 1, 29) = (Crop.CumulativeNUptake(DAY) - Crop.CumulativeNUptake(DAY - 1)) * 10000 'Convert kg/m2 to kg/ha
Next DAE
End Sub

Sub SoilDailyOutput(Crop_Number As Integer)
Dim First As Integer
Dim Last As Integer
Dim DAE As Integer
Dim NL As Integer
Dim Layer As Integer
Dim NSV As Integer
Dim New_NC As Integer
Dim Old_NC As Integer
Dim i As Integer
Dim DAY As Integer

If Crop_Number = 1 Then
    Worksheets("Crop One Soil Output").Activate
    First = 1
    Last = Minimum(ReadInputs.MaturityDAE1, ReadInputs.HarvestDAE1)
End If
If Crop_Number = 2 Then
    Worksheets("Crop Two Soil Output").Activate
    First = 1
    Last = Minimum(ReadInputs.MaturityDAE2, ReadInputs.HarvestDAE2)
End If
NL = Soil.NumberModelLayers
'Write output data
For DAE = First To Last
    DAY = Main.DOYAtDAE(DAE)
    For Layer = 1 To NL
        Cells(2, 1) = "DAE"
        Cells(2, 2) = "DAY"
        Cells(1, Layer + 2) = "Water (m/m)"
        Cells(2, Layer + 2) = Layer
        Cells(DAE + 2, 1) = DAE
        Cells(DAE + 2, 2) = DAY
        Cells(DAE + 2, Layer + 2) = Soil.WaterContent(DAY, Layer)
    Next Layer
    For Layer = 1 To NL
        Cells(1, Layer + 23) = "NO3-N (kg/ha)"
        Cells(2, Layer + 23) = Layer
        Cells(DAE + 2, Layer + 23) = Soil.NitrateNContent(DAY, Layer) * 10000 'Convert kg/m2 to kg/ha
    Next Layer
    For Layer = 1 To NL
        Cells(1, Layer + 44) = "NH4-N (kg/ha)"
        Cells(2, Layer + 44) = Layer
        Cells(DAE + 2, Layer + 44) = Soil.AmmoniumNContent(DAY, Layer) * 10000 'Convert kg/m2 to kg/ha
    Next Layer
    For Layer = 1 To 6 'Only top 6 layers considered for mineralization
        Cells(1, Layer + 65) = "Mineralized-N (kg/ha)"
        Cells(2, Layer + 65) = Layer
        Cells(DAE + 2, Layer + 65) = OrganicCandN.LayerMineralization(DAY, Layer) * 10000 'Convert kg/m2 to kg/ha
    Next Layer
Next DAE
End Sub

Sub WriteSummaryOutput(Crop_Number As Integer, DOY As Integer)
Dim First As Integer
Dim Last As Integer
Dim DAY As Integer
Dim DAE As Integer
Dim i As Integer
Dim DOY_Of_Maturity As Integer
Dim Profile_Nitrate_Content As Double
Dim Profile_Ammonium_Content As Double

Worksheets("Summary Output").Activate

If Crop_Number = 1 Then
    Range(Cells(3, 2), Cells(15, 2)).Interior.ColorIndex = 6
    Range("B3:H15").BorderAround LineStyle:=xlContinuous, Weight:=xlThick, Color:=vbBlack
    Range(Cells(16, 2), Cells(17, 3)).Interior.ColorIndex = 43
    Range(Cells(18, 2), Cells(37, 3)).Interior.ColorIndex = 8
    Range(Cells(16, 5), Cells(17, 6)).Interior.ColorIndex = 43
    Range(Cells(18, 5), Cells(37, 6)).Interior.ColorIndex = 8
    [B2] = "CROP 1 OUTPUT (From emergence to maturity)"
    [C3] = "  Cumulative Deep Drainage(mm)"
    [C4] = "  Cumulative N Leaching (kg/ha)"
    [C5] = "  Cumulative mineralization, 0.0 m - 0.3 m soil layer (kg/ha)"
    [C6] = "  Cumulative mineralization, 0.3 m - 0.6 m soil layer (kg/ha)"
    [C7] = "  Residual soil profile nitrate (kg/ha)"
    [C8] = "  Residual soil profile ammonium (kg/ha)"
    [C9] = "  Cumulative irrigation (mm)"
    [C10] = "  Cumulative N fertilization (kg/ha)"
    [C11] = "  Seasonal Transpiration (mm)"
    [C12] = "  Seasonal Soil Water Evaporation"  'Mingliang 4/17/2025
    [C13] = "  Seasonal N Uptake (kg/ha)"
    [C14] = "  Seasonal Potential Biomass (kg/ha)"
    [C15] = "  Seasonal Actual Biomass (kg/ha)"
    [B16] = "    DOY"
    [C16] = "Irrigation"
    [C16] = "     (mm)"
    [E16] = "DOY"
    [F16] = "Fertilizer"
    [F17] = "    (kg/ha)"
    [B3] = Soil.CumulativeDeepDrainage
    [B4] = Soil.CumulativeNLeaching
    [B5] = OrganicCandN.CumulativeMineralizationTopThreeLayersCrop1 * 10000# 'Convert kg/m2 to kg/ha
    [B6] = OrganicCandN.CumulativeMineralizationNextThreeLayersCrop1 * 10000# 'Convert kg/m2 to kg/ha
   
    DOY_Of_Maturity = ReadInputs.MaturityDOY1
    Profile_Nitrate_Content = 0
    Profile_Ammonium_Content = 0
    For i = 1 To Soil.NumberModelLayers
        Profile_Nitrate_Content = Profile_Nitrate_Content + Soil.NitrateNContent(DOY_Of_Maturity - 1, i)
        Profile_Ammonium_Content = Profile_Ammonium_Content + Soil.AmmoniumNContent(DOY_Of_Maturity - 1, i)
    Next i
    
    [B7] = Profile_Nitrate_Content * 10000# 'Convert kg/m2 to kg/ha
    [B8] = Profile_Ammonium_Content * 10000# 'Convert kg/m2 to kg/ha
    [B9] = Soil.CumulativeIrrigation
    [B10] = Soil.CumulativeFertilization * 10000 'Convert kg/m2 to kg/ha
    [B11] = ET.TotalTranspiration
    [B12] = ET.CumulativeSoilWaterEvaporation 'Mingliang 4/17/2025
    [B13] = Crop.SeasonalNUptake * 10000# 'Convert kg/m2 to kg/ha
    [B14] = Crop.CumulativePotentialCropBiomass(DOY) * 10000# 'Convert kg/m2 to kg/ha
    [B15] = Crop.SeasonalBiomass * 10000# 'Convert kg/m2 to kg/ha
    
    'Write Irrigation date and amount
    First = 1
    Last = Minimum(ReadInputs.MaturityDAE1, ReadInputs.HarvestDAE1)
    i = 0
    For DAE = First To Last
        DAY = Main.DOYAtDAE(DAE)
        If ReadInputs.NetIrrigationDepth(DAY) > 0 Then
            Cells(18 + i, 2) = DAY
            Cells(18 + i, 3) = ReadInputs.NetIrrigationDepth(DAY)
        i = i + 1
        End If
    Next DAE
    i = 0
    For DAE = First To Last
        DAY = Main.DOYAtDAE(DAE)
        If Soil.FertilizationRate(DAY) > 0 Then
            Cells(18 + i, 5) = DAY
            Cells(18 + i, 6) = Soil.FertilizationRate(DAY) * 10000# 'Convert kg/m2 to kg/ha
        i = i + 1
        End If
    Next DAE
End If

If Crop_Number = 2 Then
    Range(Cells(3, 10), Cells(15, 10)).Interior.ColorIndex = 6
    Range("J3:P15").BorderAround LineStyle:=xlContinuous, Weight:=xlThick, Color:=vbBlack
    Range(Cells(16, 10), Cells(17, 11)).Interior.ColorIndex = 43
    Range(Cells(18, 10), Cells(37, 11)).Interior.ColorIndex = 8
    Range(Cells(16, 13), Cells(17, 14)).Interior.ColorIndex = 43
    Range(Cells(18, 13), Cells(37, 14)).Interior.ColorIndex = 8
    [J2] = "CROP 2 OUTPUT (From emergence to maturity)"
    [K3] = "  Cumulative Deep Drainage(mm)"
    [K4] = "  Cumulative N Leaching (kg/ha)"
    [K5] = "  Cumulative mineralization, 0.0 m - 0.3 m soil layer (kg/ha)"
    [K6] = "  Cumulative mineralization, 0.3 m - 0.6 m soil layer (kg/ha)"
    [K7] = "  Residual soil profile nitrate (kg/ha)"
    [K8] = "  Residual soil profile ammonium (kg/ha)"
    [K9] = "  Cumulative irrigation (mm)"
    [K10] = "  Cumulative N fertilization (kg/ha)"
    [K11] = "  Seasonal Transpiration (mm)"
    [K12] = "  Seasonal Soil Water Evaporation"
    [K13] = "  Seasonal N Uptake (kg/ha)"
    [K14] = "  Seasonal Potential Biomass (kg/ha)"
    [K15] = "  Seasonal Actual Biomass (kg/ha)"

    [J16] = "    DOY"
    [K16] = "Irrigation"
    [K17] = "     (mm)"
    [M16] = "DOY"
    [N16] = "Fertilizer"
    [N17] = "    (kg/ha)"
    [J3] = Soil.CumulativeDeepDrainage
    [J4] = Soil.CumulativeNLeaching
    [J5] = OrganicCandN.CumulativeMineralizationTopThreeLayersCrop2 * 10000# 'Convert kg/m2 to kg/ha
    [J6] = OrganicCandN.CumulativeMineralizationNextThreeLayersCrop2 * 10000# 'Convert kg/m2 to kg/ha
        
    DOY_Of_Maturity = ReadInputs.MaturityDOY2
    Profile_Nitrate_Content = 0
    Profile_Ammonium_Content = 0
    For i = 1 To Soil.NumberModelLayers
        Profile_Nitrate_Content = Profile_Nitrate_Content + Soil.NitrateNContent(DOY_Of_Maturity - 1, i)
        Profile_Ammonium_Content = Profile_Ammonium_Content + Soil.AmmoniumNContent(DOY_Of_Maturity - 1, i)
    Next i
    
    [J7] = Profile_Nitrate_Content * 10000# 'Convert kg/m2 to kg/ha
    [J8] = Profile_Ammonium_Content * 10000# 'Convert kg/m2 to kg/ha
    [J9] = Soil.CumulativeIrrigation
    [J10] = Soil.CumulativeFertilization * 10000 'Convert kg/m2 to kg/ha
    [J11] = ET.TotalTranspiration
    [J12] = ET.CumulativeSoilWaterEvaporation 'Mingliang 4/17/2025
    [J12] = Crop.SeasonalNUptake * 10000# 'Convert kg/m2 to kg/ha
    [J13] = Crop.CumulativePotentialCropBiomass(DOY) * 10000# 'Convert kg/m2 to kg/ha
    [J14] = Crop.SeasonalBiomass * 10000# 'Convert kg/m2 to kg/ha

    'Write Irrigation date and amount
    First = 1
    Last = Minimum(ReadInputs.MaturityDAE2, ReadInputs.HarvestDAE2)
    i = 0
    For DAE = First To Last
        DAY = Main.DOYAtDAE(DAE)
        If ReadInputs.NetIrrigationDepth(DAY) > 0 Then
            Cells(18 + i, 10) = DAY
            Cells(18 + i, 11) = ReadInputs.NetIrrigationDepth(DAY)
            i = i + 1
        End If
    Next DAE
        i = 0
    For DAE = First To Last
        DAY = Main.DOYAtDAE(DAE)
        If Soil.FertilizationRate(DAY) > 0 Then
            Cells(18 + i, 13) = DAY
            Cells(18 + i, 14) = Soil.FertilizationRate(DAY) * 10000# 'Convert kg/m2 to kg/ha
        i = i + 1
        End If
    Next DAE
End If
End Sub

Sub FinalOutput()
Dim Last_Simulation_DOY As Integer
Dim Offset As Integer
Dim Profile_Nitrate_Content As Double
Dim Profile_Ammonium_Content As Double
Dim i As Integer
Dim j As Integer
Dim First As Integer
Dim Last As Integer
Dim DAY As Integer
Dim Time_Elapsed As Integer
Dim Counter As Integer

'Summary from beginning to end of the simulation period
Worksheets("Summary Output").Activate

    If ReadInputs.NumberOfCrops = 1 Then Offset = 10 Else Offset = 18
        Range(Cells(3, Offset), Cells(10, Offset)).Interior.ColorIndex = 6
        Range(Cells(3, Offset), Cells(10, Offset + 6)).BorderAround LineStyle:=xlContinuous, Weight:=xlThick, Color:=vbBlack
        Range(Cells(12, Offset), Cells(13, Offset + 1)).Interior.ColorIndex = 43
        Range(Cells(14, Offset), Cells(33, Offset + 1)).Interior.ColorIndex = 8
        Range(Cells(12, Offset + 3), Cells(13, Offset + 4)).Interior.ColorIndex = 43
        Range(Cells(14, Offset + 3), Cells(33, Offset + 4)).Interior.ColorIndex = 8
        Cells(2, Offset) = "TOTALS FOR SIMULATION PERIOD"
        Cells(3, Offset + 1) = "  Cumulative Deep Drainage(mm)"
        Cells(4, Offset + 1) = "  Cumulative N Leaching (kg/ha)"
        Cells(5, Offset + 1) = "  Cumulative mineralization, 0.0 m - 0.3 m soil layer (kg/ha)"
        Cells(6, Offset + 1) = "  Cumulative mineralization, 0.3 m - 0.6 m soil layer (kg/ha)"
        Cells(7, Offset + 1) = "  Residual soil profile nitrate (kg/ha)"
        Cells(8, Offset + 1) = "  Residual soil profile ammonium (kg/ha)"
        Cells(9, Offset + 1) = "  Cumulative irrigation (mm)"
        Cells(10, Offset + 1) = "  Cumulative N fertilization (kg/ha)"
        Cells(12, Offset) = "    DOY"
        Cells(12, Offset + 1) = "Irrigation"
        Cells(13, Offset + 1) = "     (mm)"
        Cells(12, Offset + 3) = "    DOY"
        Cells(12, Offset + 4) = "Fertilizer"
        Cells(13, Offset + 4) = "    (kg/ha)"
        Cells(3, Offset) = Soil.SimulationTotalDeepDrainage
        Cells(4, Offset) = Soil.SimulationTotalNLeaching
        Cells(5, Offset) = OrganicCandN.CumulativeMineralizationTopThreeLayersAllDays * 10000# 'Convert kg/m2 to kg/ha
        Cells(6, Offset) = OrganicCandN.CumulativeMineralizationNextThreeLayersAllDays * 10000# 'Convert kg/m2 to kg/ha
        Profile_Nitrate_Content = 0
        Profile_Ammonium_Content = 0
        Last_Simulation_DOY = Main.RunLastDOY - 1
        For i = 1 To Soil.NumberModelLayers
            Profile_Nitrate_Content = Profile_Nitrate_Content + Soil.NitrateNContent(Last_Simulation_DOY - 1, i)
            Profile_Ammonium_Content = Profile_Ammonium_Content + Soil.AmmoniumNContent(Last_Simulation_DOY - 1, i)
        Next i
        Cells(7, Offset) = Profile_Nitrate_Content * 10000#  'Convert kg/m2 to kg/ha
        Cells(8, Offset) = Profile_Ammonium_Content * 10000#  'Convert kg/m2 to kg/ha
        Cells(9, Offset) = Soil.SimulationTotalIrrigation
        Cells(10, Offset) = Soil.SimulationTotalFertilization * 10000  'Convert kg/m2 to kg/ha
First = Main.RunFirstDOY
Last = Main.RunLastDOY
If First > Last Then Time_Elapsed = (365 - First) + Last Else Time_Elapsed = Last - First
DAY = First
i = 0
j = 0
Counter = 0
Do
    If ReadInputs.NetIrrigationDepth(DAY) > 0 Then
        Cells(14 + i, Offset) = DAY
        Cells(14 + i, Offset + 1) = ReadInputs.NetIrrigationDepth(DAY)
        i = i + 1
    End If
    If Soil.FertilizationRate(DAY) > 0 Then
        Cells(14 + j, Offset + 3) = DAY
        Cells(14 + j, Offset + 4) = Soil.FertilizationRate(DAY) * 10000# 'Convert kg/m2 to kg/ha
        j = j + 1
    End If
    DAY = DAY + 1
    If DAY = 366 Then DAY = 1
    Counter = Counter + 1
Loop Until Counter = Time_Elapsed
End Sub
