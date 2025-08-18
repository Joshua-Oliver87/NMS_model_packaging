Attribute VB_Name = "ReadInputs"
Option Explicit
'Read Inputs
Dim First_DOY As Integer
Dim Farm_Name As String
Dim Field_Name As String
Dim Field_Number As Integer
Dim Area As Double
Dim Irrigation_Method As String
Dim Water_Source As Integer
Dim Water_N_Conc As Double
Dim Number_Of_Horizons As Integer
Dim Horizon_Thickness(5) As Double
Dim Percent_Clay(5) As Double
Dim Percent_Silt(5) As Double
Dim Percent_Sand(5) As Double
Dim Field_Capacity(5) As Double
Dim Permanent_Wilting_Point(5) As Double
Dim Soil_Organic_Matter(5) As Double
Dim Number_Of_Crops As Integer
Dim Crop_Name(2) As String
Dim Crop_1 As String
Dim Planting_DOY_1 As Integer
Dim Emergence_DOY_1 As Integer
Dim Full_Canopy_DOY_1 As Integer
Dim Beging_Senescence_DOY_1 As Integer
Dim Maturity_DOY_1 As Integer
Dim Harvest_DOY_1 As Integer
Dim Maturity_DAE_1 As Integer
Dim Maturity_DAE_2 As Integer
Dim Harvest_DAE_1 As Integer
Dim Harvest_DAE_2 As Integer
Dim Expected_Yield_1 As Double
Dim Crop_2 As String
Dim Planting_DOY_2 As Integer
Dim Emergence_DOY_2 As Integer
Dim Full_Canopy_DOY_2 As Integer
Dim Beging_Senescence_DOY_2 As Integer
Dim Maturity_DOY_2 As Integer
Dim Harvest_DOY_2 As Integer
Dim Expected_Yield_2 As Double
Dim Fertilization_DOY(10) As Integer
Dim Mineral_Fertilizer_Name(10) As String
Dim Mineral_Fertilization_Rate(10) As Double
Dim Nitrate_Fraction(10) As Double
Dim Ammonium_Fraction(10) As Double
Dim Ammonia_Fraction(10) As Double
Dim Organic_Fertilizer_Name(10) As String
Dim Organic_Fertilizer_Rate(10) As Double
Dim Organic_Fertilizer_C_Fraction(10) As Double
Dim Organic_Fertilizer_N_Fraction(10) As Double
Dim Application_Method_Number(10) As Integer
Dim Net_Irrigation_Depth(366) As Double
Dim Irrig_DOY(20) As Integer
Dim Current_DOY(366) As Integer
Dim Solar_Radiation(366) As Double
Dim Tmax(366) As Double
Dim Tmin(366) As Double
Dim RHmax(366) As Double
Dim RHmin(366) As Double
Dim Wind_Speed(366) As Double
Dim Precipitation(366) As Double
Dim FAO_ETo(366) As Double
Dim Nitrate_Fertilization_Rate(366) As Double
Dim Ammonium_Fertilization_Rate(366) As Double
'Read Crop Parameters
Dim Crop_Order(2) As Integer
Dim Midseason_Crop_Coefficient(2) As Double
Dim Maximum_Crop_Water_Uptake(2) As Double
Dim LWP_Onset_Stomatal_Closure(2) As Double
Dim LWP_Permanent_Wilting(2) As Double
Dim Seeding_Depth(2) As Double
Dim Initial_Root_Depth_From_Germinated_Seed(2) As Double
Dim Maximum_Root_Depth(2) As Double
Dim Maximum_Crop_Height(2) As Double
Dim Initial_Green_Canopy_Cover(2) As Double
Dim Maximum_Green_Canopy_Cover(2) As Double
Dim Maturity_Green_Canopy_Cover(2) As Double
Dim Transpiration_Use_Efficiency_1_kPa(2) As Double
Dim Slope_Daytime_VPD_Function(2) As Double
Dim Maximum_N_Concentration_Emergence(2) As Double
Dim Critical_N_Concentration_Emergence(2) As Double
Dim Minimum_N_Concentration_Emergence(2) As Double
Dim Biomass_Start_Dilution_Maximum_N_Concentration(2) As Double
Dim Biomass_Start_Dilution_Critical_N_Concentration(2) As Double
Dim Biomass_Start_Dilution_Minimum_N_Concentration(2) As Double
Dim N_Dilution_Slope(2) As Double
Dim Maximum_N_Concentration_Maturity(2) As Double
Dim Critical_N_Concentration_Maturity(2) As Double
Dim Minimum_N_Concentration_Maturity(2) As Double
Dim Maximum_Allowable_PAW_Depletion(10) As Double
Dim Maximum_Allowable_CWSI(10) As Double
Dim Event_Type As String
Dim DOY_To_Start_Auto_Irrigation(10) As Integer
Dim DOY_To_Stop_Auto_Irrigation(10) As Integer
Dim Scheduling_Method(10) As Integer
Dim DOY_For_Refill_Irrigation(10) As Integer
Dim Refill_Depth(10) As Double
Dim Number_Of_Auto_Entries As Integer
Dim DOY_Last_Scheduled_Irrigation As Integer
Dim Irrigated_Crop_Number As Integer
Dim Crop_Number_Last_Scheduled_Irrigation As Integer

Sub ReadInputs()
Dim i As Integer
Dim DOY As Integer

'Clear Net Irrigation and fertilization arrays
For i = 1 To 366
    Net_Irrigation_Depth(i) = 0
    Current_DOY(i) = 0
    Solar_Radiation(i) = 0
    Tmax(i) = 0
    Tmin(i) = 0
    RHmax(i) = 0
    RHmin(i) = 0
    Wind_Speed(i) = 0
    Precipitation(i) = 0
    FAO_ETo(i) = 0
    If i <= 5 Then
        Horizon_Thickness(i) = 0
        Percent_Clay(i) = 0
        Percent_Silt(i) = 0
        Percent_Sand(i) = 0
        Field_Capacity(i) = 0
        Permanent_Wilting_Point(i) = 0
        Soil_Organic_Matter(i) = 0
    End If
    If i <= 10 Then
        Mineral_Fertilization_Rate(i) = 0
        Fertilization_DOY(i) = 0
        Mineral_Fertilizer_Name(i) = 0
        Mineral_Fertilization_Rate(i) = 0
        Nitrate_Fraction(i) = 0
        Ammonium_Fraction(i) = 0
        Ammonia_Fraction(i) = 0
        Nitrate_Fertilization_Rate(DOY) = 0
        Ammonium_Fertilization_Rate(DOY) = 0
        Organic_Fertilizer_Name(i) = 0
        Organic_Fertilizer_Rate(i) = 0
        Organic_Fertilizer_C_Fraction(i) = 0
        Organic_Fertilizer_N_Fraction(i) = 0
        Application_Method_Number(i) = 0
        DOY_To_Start_Auto_Irrigation(i) = 0
        Scheduling_Method(i) = 0
        Maximum_Allowable_PAW_Depletion(i) = 0
        Maximum_Allowable_CWSI(i) = 0
        DOY_To_Stop_Auto_Irrigation(i) = 0
        DOY_For_Refill_Irrigation(i) = 0
        Refill_Depth(i) = 0
    End If
Next i

Worksheets("Field Input").Activate

'Farm and field description
Farm_Name = [A5]
Field_Number = [A6]
Field_Name = [A7]
Area = [A12]
Irrigation_Method = [B12]
Water_Source = [C12]
Water_N_Conc = [D12]
'First simulation run day of tghe year
First_DOY = [E5]
'Soil description
Number_Of_Horizons = [A17]
For i = 1 To Number_Of_Horizons
    Horizon_Thickness(i) = Cells(22 + i, 3) 'Thickness is rounded to one decimal
    Percent_Clay(i) = Cells(22 + i, 4)
    Percent_Silt(i) = Cells(22 + i, 5)
    Percent_Sand(i) = Cells(22 + i, 6)
    Field_Capacity(i) = Cells(22 + i, 7)
    Permanent_Wilting_Point(i) = Cells(22 + i, 8)
    Soil_Organic_Matter(i) = Cells(22 + i, 9)
Next i
'Crop description
Number_Of_Crops = [A31]
Crop_1 = [A38]
Expected_Yield_1 = [H38]
Planting_DOY_1 = [I38]
Emergence_DOY_1 = [J38]
Full_Canopy_DOY_1 = [K38]
Beging_Senescence_DOY_1 = [L38]
Maturity_DOY_1 = [M38]
Harvest_DOY_1 = [N38]
'Calculate days after emergence for maturity and harvest
If Emergence_DOY_1 > Maturity_DOY_1 Then Maturity_DAE_1 = (365 - Emergence_DOY_1) + Maturity_DOY_1 Else Maturity_DAE_1 = Maturity_DOY_1 - Emergence_DOY_1
If Emergence_DOY_1 > Harvest_DOY_1 Then Harvest_DAE_1 = (365 - Emergence_DOY_1) + Harvest_DOY_1 Else Harvest_DAE_1 = Harvest_DOY_1 - Emergence_DOY_1
Crop_2 = [A39]
Expected_Yield_2 = [H39]
Planting_DOY_2 = [I39]
Emergence_DOY_2 = [J39]
Full_Canopy_DOY_2 = [K39]
Beging_Senescence_DOY_2 = [L39]
Maturity_DOY_2 = [M39]
Harvest_DOY_2 = [N39]
'Calculate days after emergence for maturity and harvest
If Emergence_DOY_2 > Maturity_DOY_2 Then Maturity_DAE_2 = (365 - Emergence_DOY_2) + Maturity_DOY_2 Else Maturity_DAE_2 = Maturity_DOY_2 - Emergence_DOY_2
If Emergence_DOY_2 > Harvest_DOY_2 Then Harvest_DAE_2 = (365 - Emergence_DOY_2) + Harvest_DOY_2 Else Harvest_DAE_2 = Harvest_DOY_2 - Emergence_DOY_2
'N Application
i = 1
DOY = Cells(45 + i, 2)
If DOY > 0 Then
    Do
        Fertilization_DOY(i) = Cells(45 + i, 2)
        Mineral_Fertilizer_Name(i) = Cells(45 + i, 3)
        Mineral_Fertilization_Rate(i) = Cells(45 + i, 4)
        Nitrate_Fraction(i) = Cells(45 + i, 5)
        Ammonium_Fraction(i) = Cells(45 + i, 6)
        Ammonia_Fraction(i) = Cells(45 + i, 7)
        'Store fertilization rates in kg/m2
        Nitrate_Fertilization_Rate(DOY) = (Mineral_Fertilization_Rate(i) * Nitrate_Fraction(i) / 100) / 10000# 'Convert kg/ha to kg/m2
        Ammonium_Fertilization_Rate(DOY) = (Mineral_Fertilization_Rate(i) * (Ammonium_Fraction(i) + Ammonia_Fraction(i)) / 100) / 10000# 'Convert kg/ha to kg/m2
        Organic_Fertilizer_Name(i) = Cells(45 + i, 8)
        Organic_Fertilizer_Rate(i) = Cells(45 + i, 9)
        Organic_Fertilizer_C_Fraction(i) = Cells(45 + i, 10)
        Organic_Fertilizer_N_Fraction(i) = Cells(45 + i, 11)
        Application_Method_Number(i) = Cells(45 + i, 12)
        i = i + 1
        DOY = Cells(45 + i, 2)
    Loop Until DOY = 0
End If
'Net irrigation
i = 1
DOY = Cells(57 + i, 2)
If DOY > 0 Then
    Do
        DOY = Cells(57 + i, 2)
        Net_Irrigation_Depth(DOY) = Cells(57 + i, 3)
        If Net_Irrigation_Depth(DOY) > 0 Then
            DOY_Last_Scheduled_Irrigation = DOY
        End If
        i = i + 1
        DOY = Cells(57 + i, 2)
    Loop Until DOY = 0
End If
'Automatic irrigation
Number_Of_Auto_Entries = [F55]
If Number_Of_Auto_Entries > 0 Then
    For i = 1 To Number_Of_Auto_Entries
        Event_Type = Cells(56 + i, 7)
        If Event_Type = "START" Then
            DOY_To_Start_Auto_Irrigation(i) = Cells(56 + i, 6)
            Irrigated_Crop_Number = Cells(56 + i, 12)
            If Irrigated_Crop_Number = 1 Then
                If (DOY_Last_Scheduled_Irrigation > Emergence_DOY_1 Or DOY_Last_Scheduled_Irrigation > 1) And DOY_Last_Scheduled_Irrigation <= Maturity_DOY_1 Then
                    DOY_To_Start_Auto_Irrigation(i) = DOY_Last_Scheduled_Irrigation + 1
                End If
                Else 'Irrigated crop number is 2
                If DOY_Last_Scheduled_Irrigation > Emergence_DOY_2 And DOY_Last_Scheduled_Irrigation <= Maturity_DOY_2 Then
                    DOY_To_Start_Auto_Irrigation(i) = DOY_Last_Scheduled_Irrigation + 1
                End If
            End If
            Scheduling_Method(i) = Cells(56 + i, 8)
            If Scheduling_Method(i) = 1 Then
                Maximum_Allowable_PAW_Depletion(i) = Cells(56 + i, 9)
                Else
                Maximum_Allowable_CWSI(i) = Cells(56 + i, 10)
            End If
        End If
        If Event_Type = "STOP" Then
            DOY_To_Stop_Auto_Irrigation(i) = Cells(56 + i, 6)
        End If
        If Event_Type = "REFILL" Then
            DOY_For_Refill_Irrigation(i) = Cells(56 + i, 6)
            Refill_Depth(i) = Cells(56 + i, 11)
        End If
    Next i
End If
'Daily weather
i = 1
DOY = Cells(73 + i, 2)
If DOY > 0 Then
    Do
        Current_DOY(i) = DOY
        Solar_Radiation(i) = Cells(73 + i, 3)
        Tmax(i) = Cells(73 + i, 4)
        Tmin(i) = Cells(73 + i, 5)
        RHmax(i) = Cells(73 + i, 6)
        RHmin(i) = Cells(73 + i, 7)
        Wind_Speed(i) = Cells(73 + i, 8)
        Precipitation(i) = Cells(73 + i, 9)
        FAO_ETo(i) = Cells(73 + i, 10)
        i = i + 1
        DOY = Cells(73 + i, 2)
    Loop Until DOY = 0
End If
End Sub

Sub ReadCropParameters()
Dim i As Integer

Crop_Order(1) = 1
Crop_Order(2) = 2
For i = 1 To 2
    Crop_Name(i) = ""
    Midseason_Crop_Coefficient(i) = 0
    Maximum_Crop_Water_Uptake(i) = 0
    LWP_Onset_Stomatal_Closure(i) = 0
    LWP_Permanent_Wilting(i) = 0
    Seeding_Depth(i) = 0
    Initial_Root_Depth_From_Germinated_Seed(i) = 0
    Maximum_Root_Depth(i) = 0
    Maximum_Crop_Height(i) = 0
    Initial_Green_Canopy_Cover(i) = 0
    Maximum_Green_Canopy_Cover(i) = 0
    Maturity_Green_Canopy_Cover(i) = 0
    Transpiration_Use_Efficiency_1_kPa(i) = 0
    Slope_Daytime_VPD_Function(i) = 0
    Maximum_N_Concentration_Emergence(i) = 0
    Critical_N_Concentration_Emergence(i) = 0
    Minimum_N_Concentration_Emergence(i) = 0
    Biomass_Start_Dilution_Maximum_N_Concentration(i) = 0
    Biomass_Start_Dilution_Critical_N_Concentration(i) = 0
    Biomass_Start_Dilution_Minimum_N_Concentration(i) = 0
    N_Dilution_Slope(i) = 0
    Maximum_N_Concentration_Maturity(i) = 0
    Critical_N_Concentration_Maturity(i) = 0
    Minimum_N_Concentration_Maturity(i) = 0
Next i

Worksheets("Crop Parameters").Activate

For i = 1 To 2
    Select Case Crop_Order(i)
    Case 1
        Crop_Name(i) = Crop_1
        Midseason_Crop_Coefficient(i) = [J5]
        Maximum_Crop_Water_Uptake(i) = [J6]
        LWP_Onset_Stomatal_Closure(i) = [J7]
        LWP_Permanent_Wilting(i) = [J8]
        Seeding_Depth(i) = [J9]
        Initial_Root_Depth_From_Germinated_Seed(i) = [J10]
        Maximum_Root_Depth(i) = [J11]
        Maximum_Crop_Height(i) = [J12]
        Initial_Green_Canopy_Cover(i) = [J14]
        Maximum_Green_Canopy_Cover(i) = [J15]
        Maturity_Green_Canopy_Cover(i) = [J16]
        Transpiration_Use_Efficiency_1_kPa(i) = [J18]
        Slope_Daytime_VPD_Function(i) = [J19]
        Maximum_N_Concentration_Emergence(i) = [J21]
        Critical_N_Concentration_Emergence(i) = [J22]
        Minimum_N_Concentration_Emergence(i) = [J23]
        Biomass_Start_Dilution_Maximum_N_Concentration(i) = [J24]
        Biomass_Start_Dilution_Critical_N_Concentration(i) = [J25]
        Biomass_Start_Dilution_Minimum_N_Concentration(i) = [J26]
        N_Dilution_Slope(i) = [J27]
        Maximum_N_Concentration_Maturity(i) = [J28]
        Critical_N_Concentration_Maturity(i) = [J29]
        Minimum_N_Concentration_Maturity(i) = [J30]
    Case 2
        Crop_Name(i) = Crop_2
        Midseason_Crop_Coefficient(i) = [L5]
        Maximum_Crop_Water_Uptake(i) = [L6]
        LWP_Onset_Stomatal_Closure(i) = [L7]
        LWP_Permanent_Wilting(i) = [L8]
        Seeding_Depth(i) = [L9]
        Initial_Root_Depth_From_Germinated_Seed(i) = [L10]
        Maximum_Root_Depth(i) = [L11]
        Maximum_Crop_Height(i) = [L12]
        Initial_Green_Canopy_Cover(i) = [L14]
        Maximum_Green_Canopy_Cover(i) = [L15]
        Maturity_Green_Canopy_Cover(i) = [L16]
        Transpiration_Use_Efficiency_1_kPa(i) = [L18]
        Slope_Daytime_VPD_Function(i) = [L19]
        Maximum_N_Concentration_Emergence(i) = [L21]
        Critical_N_Concentration_Emergence(i) = [L22]
        Minimum_N_Concentration_Emergence(i) = [L23]
        Biomass_Start_Dilution_Maximum_N_Concentration(i) = [L24]
        Biomass_Start_Dilution_Critical_N_Concentration(i) = [L25]
        Biomass_Start_Dilution_Minimum_N_Concentration(i) = [L26]
        N_Dilution_Slope(i) = [L27]
        Maximum_N_Concentration_Maturity(i) = [L28]
        Critical_N_Concentration_Maturity(i) = [L29]
        Minimum_N_Concentration_Maturity(i) = [L30]
    End Select
Next i
End Sub

Property Get FirstDOY() As Integer
FirstDOY = First_DOY
End Property
Property Get FarmName() As String
FarmName = Farm_Name
End Property
Property Get FieldName() As String
FieldName = Field_Name
End Property
Property Get FieldNumber() As Integer
FieldNumber = Field_Number
End Property
Property Get FieldArea() As Double
FieldArea = Area
End Property
Property Get IrrigationMethod() As String
IrrigationMethod = Irrigation_Method
End Property
Property Get WaterSource() As Integer
WaterSource = Water_Source
End Property
Property Get WaterNConc() As Double
WaterNConc = Water_N_Conc
End Property
Property Get NumberOfHorizons() As Integer
NumberOfHorizons = Number_Of_Horizons
End Property
Property Get HorizonThickness(j As Integer) As Double
HorizonThickness = Horizon_Thickness(j)
End Property
Property Get PercentClay(j As Integer) As Double
PercentClay = Percent_Clay(j)
End Property
Property Get PercentSilt(j As Integer) As Double
PercentSilt = Percent_Silt(j)
End Property
Property Get PercentSand(j As Integer) As Double
PercentSand = Percent_Sand(j)
End Property
Property Get FieldCapacity(j As Integer) As Double
FieldCapacity = Field_Capacity(j)
End Property
Property Get PermanentWiltingPoint(j As Integer) As Double
PermanentWiltingPoint = Permanent_Wilting_Point(j)
End Property
Property Get SoilOrganicMatter(Layer As Integer) As Double
SoilOrganicMatter = Soil_Organic_Matter(Layer)
End Property
Property Get NumberOfCrops() As Integer
NumberOfCrops = Number_Of_Crops
End Property
Property Get Crop1() As String
Crop1 = Crop_1
End Property
Property Get PlantingDOY1() As Integer
PlantingDOY1 = Planting_DOY_1
End Property
Property Get EmergenceDOY1() As Integer
EmergenceDOY1 = Emergence_DOY_1
End Property
Property Get FullCanopyDOY1() As Integer
FullCanopyDOY1 = Full_Canopy_DOY_1
End Property
Property Get BegingSenescenceDOY1() As Integer
BegingSenescenceDOY1 = Beging_Senescence_DOY_1
End Property
Property Get MaturityDOY1() As Integer
MaturityDOY1 = Maturity_DOY_1
End Property
Property Get MaturityDAE1() As Integer
MaturityDAE1 = Maturity_DAE_1
End Property
Property Get HarvestDOY1() As Integer
HarvestDOY1 = Harvest_DOY_1
End Property
Property Get HarvestDAE1() As Integer
HarvestDAE1 = Harvest_DAE_1
End Property
Property Get ExpectedYield1() As Double
ExpectedYield1 = Expected_Yield_1
End Property
Property Get Crop2() As String
Crop2 = Crop_2
End Property
Property Get PlantingDOY2() As Integer
PlantingDOY2 = Planting_DOY_2
End Property
Property Get EmergenceDOY2() As Integer
EmergenceDOY2 = Emergence_DOY_2
End Property
Property Get FullCanopyDOY2() As Integer
FullCanopyDOY2 = Full_Canopy_DOY_2
End Property
Property Get BegingSenescenceDOY2() As Integer
BegingSenescenceDOY2 = Beging_Senescence_DOY_2
End Property
Property Get MaturityDOY2() As Integer
MaturityDOY2 = Maturity_DOY_2
End Property
Property Get MaturityDAE2() As Integer
MaturityDAE2 = Maturity_DAE_2
End Property
Property Get HarvestDOY2() As Integer
HarvestDOY2 = Harvest_DOY_2
End Property
Property Get HarvestDAE2() As Integer
HarvestDAE2 = Harvest_DAE_2
End Property
Property Get ExpectedYield2() As Double
ExpectedYield2 = Expected_Yield_2
End Property
Property Get FertilizationDOY(j As Integer) As Integer
FertilizationDOY = Fertilization_DOY(j)
End Property
Property Get MineralFertilizerName(j As Integer) As String
MineralFertilizerName = Mineral_Fertilizer_Name(j)
End Property
Property Get MineralFertilizationRate(j As Integer) As Double
MineralFertilizationRate = Mineral_Fertilization_Rate(j)
End Property
Property Get NitrateFraction(j As Integer) As Double
NitrateFraction = Nitrate_Fraction(j)
End Property
Property Get AmmoniumFraction(j As Integer) As Double
AmmoniumFraction = Ammonium_Fraction(j)
End Property
Property Get AmmoniaFraction(j As Integer) As Double
AmmoniaFraction = Ammonia_Fraction(j)
End Property
Property Get OrganicFertilizerName(j As Integer) As String
OrganicFertilizerName = Organic_Fertilizer_Name(j)
End Property
Property Get OrganicFertilizerRate(j As Integer) As Double
OrganicFertilizerRate = Organic_Fertilizer_Rate(j)
End Property
Property Get OrganicFertilizerCFraction(j As Integer) As Double
OrganicFertilizerCFraction = Organic_Fertilizer_C_Fraction(j)
End Property
Property Get OrganicFertilizerNFraction(j As Integer) As Double
OrganicFertilizerNFraction = Organic_Fertilizer_N_Fraction(j)
End Property
Property Get ApplicationMethodNumber(j As Integer) As Integer
ApplicationMethodNumber = Application_Method_Number(j)
End Property
Property Get NetIrrigationDepth(j As Integer) As Double
NetIrrigationDepth = Net_Irrigation_Depth(j)
End Property
Property Let NetIrrigationDepth(j As Integer, Value As Double)
Net_Irrigation_Depth(j) = Value
End Property
Property Get IrrigDOY(j As Integer) As Integer
IrrigDOY = Irrig_DOY(j)
End Property
Property Get NitrateFertilizationRate(DOY As Integer) As Double
NitrateFertilizationRate = Nitrate_Fertilization_Rate(DOY)
End Property
Property Get AmmoniumFertilizationRate(DOY As Integer) As Double
AmmoniumFertilizationRate = Ammonium_Fertilization_Rate(DOY)
End Property
Property Get CurrentDOY(j As Integer) As Integer
CurrentDOY = Current_DOY(j)
End Property
Property Get SolarRadiation(j As Integer) As Double
SolarRadiation = Solar_Radiation(j)
End Property
Property Get MaximumTemperature(j As Integer) As Double
MaximumTemperature = Tmax(j)
End Property
Property Get MinimumTemperature(j As Integer) As Double
MinimumTemperature = Tmin(j)
End Property
Property Get MaximumRH(j As Integer) As Double
MaximumRH = RHmax(j)
End Property
Property Get MinimumRH(j As Integer) As Double
MinimumRH = RHmin(j)
End Property
Property Get WindSpeed(j As Integer) As Double
WindSpeed = Wind_Speed(j)
End Property
Property Get Precip(j As Integer) As Double
Precip = Precipitation(j)
End Property
Property Get FAOETo(j As Integer) As Double
FAOETo = FAO_ETo(j)
End Property
Property Get CropOrder(j As Integer) As Integer
CropOrder = Crop_Order(j)
End Property
Property Get CropName(j As Integer) As Integer
CropName = Crop_Name(j)
End Property
Property Get MidseasonCropCoefficient(j As Integer) As Double
MidseasonCropCoefficient = Midseason_Crop_Coefficient(j)
End Property
Property Get MaximumCropWaterUptake(j As Integer) As Double
MaximumCropWaterUptake = Maximum_Crop_Water_Uptake(j)
End Property
Property Get LWPOnsetStomatalClosure(j As Integer) As Double
LWPOnsetStomatalClosure = LWP_Onset_Stomatal_Closure(j)
End Property
Property Get LWPPermanentWilting(j As Integer) As Double
LWPPermanentWilting = LWP_Permanent_Wilting(j)
End Property
Property Get SeedingDepth(j As Integer) As Double
SeedingDepth = Seeding_Depth(j)
End Property
Property Get InitialRootDepthFromGerminatedSeed(j As Integer) As Double
InitialRootDepthFromGerminatedSeed = Initial_Root_Depth_From_Germinated_Seed(j)
End Property
Property Get MaximumRootDepth(j As Integer) As Double
MaximumRootDepth = Maximum_Root_Depth(j)
End Property
Property Get MaximumCropHeight(j As Integer) As Double
MaximumCropHeight = Maximum_Crop_Height(j)
End Property
Property Get InitialGreenCanopyCover(j As Integer) As Double
InitialGreenCanopyCover = Initial_Green_Canopy_Cover(j)
End Property
Property Get MaximumGreenCanopyCover(j As Integer) As Double
MaximumGreenCanopyCover = Maximum_Green_Canopy_Cover(j)
End Property
Property Get MaturityGreenCanopyCover(j As Integer) As Double
MaturityGreenCanopyCover = Maturity_Green_Canopy_Cover(j)
End Property
Property Get TranspirationUseEfficiency_1_kPa(j As Integer) As Double
TranspirationUseEfficiency_1_kPa = Transpiration_Use_Efficiency_1_kPa(j)
End Property
Property Get SlopeDaytimeVPDFunction(j As Integer) As Double
SlopeDaytimeVPDFunction = Slope_Daytime_VPD_Function(j)
End Property
Property Get MaximumNConcentrationEmergence(j As Integer) As Double
MaximumNConcentrationEmergence = Maximum_N_Concentration_Emergence(j)
End Property
Property Get CriticalNConcentrationEmergence(j As Integer) As Double
CriticalNConcentrationEmergence = Critical_N_Concentration_Emergence(j)
End Property
Property Get MinimumNConcentrationEmergence(j As Integer) As Double
MinimumNConcentrationEmergence = Minimum_N_Concentration_Emergence(j)
End Property
Property Get BiomassStartDilutionMaximumNConcentration(j As Integer) As Double
BiomassStartDilutionMaximumNConcentration = Biomass_Start_Dilution_Maximum_N_Concentration(j)
End Property
Property Get BiomassStartDilutionCriticalNConcentration(j As Integer) As Double
BiomassStartDilutionCriticalNConcentration = Biomass_Start_Dilution_Critical_N_Concentration(j)
End Property
Property Get BiomassStartDilutionMinimumNConcentration(j As Integer) As Double
BiomassStartDilutionMinimumNConcentration = Biomass_Start_Dilution_Minimum_N_Concentration(j)
End Property
Property Get NDilutionSlope(j As Integer) As Double
NDilutionSlope = N_Dilution_Slope(j)
End Property
Property Get MaximumNConcentrationMaturity(j As Integer) As Double
MaximumNConcentrationMaturity = Maximum_N_Concentration_Maturity(j)
End Property
Property Get CriticalNConcentrationMaturity(j As Integer) As Double
CriticalNConcentrationMaturity = Critical_N_Concentration_Maturity(j)
End Property
Property Get MinimumNConcentrationMaturity(j As Integer) As Double
MinimumNConcentrationMaturity = Minimum_N_Concentration_Maturity(j)
End Property
Property Get NumberOfAutoEntries() As Integer
NumberOfAutoEntries = Number_Of_Auto_Entries
End Property
Property Get DOYToStartAutoIrrigation(i As Integer) As Integer
DOYToStartAutoIrrigation = DOY_To_Start_Auto_Irrigation(i)
End Property
Property Get SchedulingMethod(i As Integer) As Integer
SchedulingMethod = Scheduling_Method(i)
End Property
Property Get MaximumAllowablePAWDepletion(i As Integer) As Double
MaximumAllowablePAWDepletion = Maximum_Allowable_PAW_Depletion(i)
End Property
Property Get MaximumAllowableCWSI(i As Integer) As Double
MaximumAllowableCWSI = Maximum_Allowable_CWSI(i)
End Property
Property Get DOYToStopAutoIrrigation(i As Integer) As Integer
DOYToStopAutoIrrigation = DOY_To_Stop_Auto_Irrigation(i)
End Property
Property Get DOYForRefillIrrigation(i As Integer) As Integer
DOYForRefillIrrigation = DOY_For_Refill_Irrigation(i)
End Property
Property Get RefillDepth(i As Integer) As Double
RefillDepth = Refill_Depth(i)
End Property







