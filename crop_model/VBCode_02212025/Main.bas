Attribute VB_Name = "Main"
Option Explicit
Dim Run_First_Doy As Integer
Dim Run_Last_Doy As Integer
Dim Number_Of_Days_To_Simulate As Integer
Dim Year_Number As Integer
Dim DAE As Integer
Dim DOY_At_DAE(366) As Integer
Dim Crop_Active As Boolean


Sub RunTool()
Debug.Print "Starting simulation at " & Now
Debug.Print "First DOY: " & Run_First_Doy
Debug.Print "Last DOY: " & Run_Last_Doy
Debug.Print "Number of Crops: " & Number_Of_Crops
'Dimension variables
Dim Number_Of_Crops As Integer
Dim Crop_Number As Integer
Dim DOY_Planting_Second_Crop As Integer
Dim i As Integer
Dim DOY As Integer
Dim Days_Elapsed As Integer
Dim DAE_At_Maturity As Integer
Dim Day_Of_The_Year As Integer
Dim Days_After_Emergence As Integer

Application.ScreenUpdating = False
'Set all arrays to zero
Call Crop.ClearArrays
Call ET.ClearArrays
Call Soil.ClearArrays
Call OrganicCandN.ClearArrays
'Clear Output Tabs
Call WriteOutputs.ClearOutputs
'Set up inputs
Call ReadInputs.ReadInputs
Call ReadInputs.ReadCropParameters
Call Soil.CalculateHydraulicProperties
Run_First_Doy = ReadInputs.FirstDOY
Number_Of_Crops = ReadInputs.NumberOfCrops
If Number_Of_Crops = 2 Then DOY_Planting_Second_Crop = ReadInputs.PlantingDOY2
If Number_Of_Crops = 1 Then Run_Last_Doy = ReadInputs.HarvestDOY1 Else Run_Last_Doy = ReadInputs.HarvestDOY2
Crop_Active = False
Call Soil.InitialConditions(Run_First_Doy, Run_Last_Doy)
'Preparing for time loop
'Begin time loop
If Run_First_Doy > Run_Last_Doy Then Number_Of_Days_To_Simulate = (365 - Run_First_Doy) + Run_Last_Doy Else Number_Of_Days_To_Simulate = Run_Last_Doy - Run_First_Doy
Days_Elapsed = 0
DOY = Run_First_Doy
Year_Number = 1
'Begin time loop
Do
    Call Balances.InitialSoilProfile(DOY)
    'Set up Crop Number 1
    If DOY = ReadInputs.EmergenceDOY1 Then
        Crop_Active = True
	Debug.Print "Initializing Crop 1 on DOY " & DOY
        Crop_Number = ReadInputs.CropOrder(1)
        DAE = 1
        Call Crop.InitializeFirstCrop(DOY)
        'Convert days of the year to days after emergence
        If ReadInputs.EmergenceDOY1 > ReadInputs.MaturityDOY1 Then
            DAE_At_Maturity = (365 - ReadInputs.EmergenceDOY1) + ReadInputs.MaturityDOY1
            Else
            DAE_At_Maturity = ReadInputs.MaturityDOY1 - ReadInputs.EmergenceDOY1
        End If
         'Set state variables for the potential crop for the entire season. The potential crop grows without water and N stress
       Day_Of_The_Year = ReadInputs.EmergenceDOY1
        For Days_After_Emergence = 0 To DAE_At_Maturity
            Call Crop.PotentialCanopyCover(Crop_Number, Days_After_Emergence, Day_Of_The_Year) 'Calculate potential green canopy cover for the entire season
            Call ET.PotET(Crop_Number, Day_Of_The_Year, True, True) 'Calculations are for the potential crop and the crop is active
            Call Crop.Biomass(Crop_Number, Day_Of_The_Year, True) 'Calculate potential biomass for the entire season
            Call Crop.ReferencePlantNConcentration(Day_Of_The_Year, Crop_Number)
            Day_Of_The_Year = Day_Of_The_Year + 1
            If Day_Of_The_Year > 365 Then Day_Of_The_Year = 1
        Next Days_After_Emergence
    End If
    'Set up Crop Number 2
    If DOY = ReadInputs.EmergenceDOY2 Then
        Crop_Active = True
        Crop_Number = ReadInputs.CropOrder(2)
        DAE = 1
        Call Crop.InitializeSecondCrop(DOY)
        'Convert days of the year to days after emergence
        If ReadInputs.EmergenceDOY2 > ReadInputs.MaturityDOY2 Then
            DAE_At_Maturity = (365 - ReadInputs.EmergenceDOY2) + ReadInputs.MaturityDOY2
            Else
            DAE_At_Maturity = ReadInputs.MaturityDOY2 - ReadInputs.EmergenceDOY2
        End If
        'Set state variables for the potential crop for the entire season. The potential crop grows without water and N stress
        Day_Of_The_Year = ReadInputs.EmergenceDOY2
        For Days_After_Emergence = 0 To DAE_At_Maturity
            Call Crop.PotentialCanopyCover(Crop_Number, Days_After_Emergence, Day_Of_The_Year) 'Calculate potential green canopy cover for the entire season
            Call ET.PotET(Crop_Number, Day_Of_The_Year, True, True) 'Calculations are for the potential crop and the crop is active
            Call Crop.Biomass(Crop_Number, Day_Of_The_Year, True) 'Calculate potential biomass for the entire season
            Call Crop.ReferencePlantNConcentration(Day_Of_The_Year, Crop_Number)
            Day_Of_The_Year = Day_Of_The_Year + 1
            If Day_Of_The_Year > 365 Then Day_Of_The_Year = 1
        Next Days_After_Emergence
    End If
    If Crop_Number = 1 And (DOY = ReadInputs.MaturityDOY1 Or DOY = ReadInputs.HarvestDOY1) Then
        Crop_Active = False
        Soil.AutoIrrigation = False
    End If
    If Crop_Number = 2 And DOY = ReadInputs.MaturityDOY2 Then
        Crop_Active = False
        Soil.AutoIrrigation = False
    End If
    If Crop_Active Then
        Call Crop.CanopyCover(DOY, DAE, Crop_Number)
        Call Crop.GrowRoot(Crop_Number, DOY)
        Call Crop.GrowHeight(Crop_Number, DOY)
        Call ET.PotET(Crop_Number, DOY, False, True) 'Calculations are for the actual crop and the crop is active
        Call ET.ActualTranspiration(DOY, Crop_Number)
        Call ET.ActEvaporation(DOY)
        Call Crop.Biomass(Crop_Number, DOY, False)
        Call Crop.NitrogenUptake(DOY, Crop_Number)
        'synchronize days after emergence (DAE) and day of the year (DOY)
        DOY_At_DAE(DAE) = DOY
        DAE = DAE + 1
        Else
        Call ET.PotET(Crop_Number, DOY, False, False) 'Crop is not active and only potential evaporation is calculated
        Call ET.ActEvaporation(DOY)
    End If
    Call Soil.SoilTemperature(DOY)
    Call OrganicCandN.Mineralization(DOY, Crop_Number)
    Call OrganicCandN.Nitrification(DOY)
    Call Soil.WaterAndNTransport(DOY)
    Call Balances.All(DOY)
    'Write Daily and summary Outputs by crop number at harvest time
    If Crop_Number = 1 And (DOY = ReadInputs.MaturityDOY1 Or DOY = ReadInputs.HarvestDOY1) Then
        Call WriteOutputs.CropDailyOutput(Crop_Number)
        Call WriteOutputs.SoilDailyOutput(Crop_Number)
        Call WriteOutputs.WriteSummaryOutput(Crop_Number, DOY)
    End If
    If Crop_Number = 2 And DOY = ReadInputs.MaturityDOY2 Then
        Call WriteOutputs.CropDailyOutput(Crop_Number)
        Call WriteOutputs.SoilDailyOutput(Crop_Number)
        Call WriteOutputs.WriteSummaryOutput(Crop_Number, DOY)
    End If
    DOY = DOY + 1
    If DOY > 365 Then
        DOY = 1
        Year_Number = Year_Number + 1
    End If
    Days_Elapsed = Days_Elapsed + 1
Loop Until Days_Elapsed = Number_Of_Days_To_Simulate
    Call WriteOutputs.FinalOutput
    'Select crop output as the screen shown at the end of the run
'    If Crop_Number = 1 Then Worksheets("Crop One Output").Activate
    If Crop_Number = 2 Then Worksheets("Crop Two Output").Activate
End Sub

Property Get RunFirstDOY() As Integer
RunFirstDOY = Run_First_Doy
End Property
Property Get RunLastDOY() As Integer
RunLastDOY = Run_Last_Doy
End Property
Property Get DOYAtDAE(DAE As Integer) As Integer
DOYAtDAE = DOY_At_DAE(DAE)
End Property
Property Get CropActive() As Boolean
CropActive = Crop_Active
End Property



