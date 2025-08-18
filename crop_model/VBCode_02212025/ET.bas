Attribute VB_Name = "ET"
Option Explicit
Dim Potential_Transpiration(366) As Double
Dim Potential_Crop_Transpiration(366)
Dim Potential_Soil_Water_Evaporation(366) As Double
Dim Potential_ET(366) As Double
Dim Actual_Transpiration(366) As Double
Dim Soil_Water_Uptake(366, 20) As Double
Dim Actual_Soil_Water_Evaporation(366) As Double
Dim Cumulative_Soil_Water_Evaporation As Double 'Mingliang 4/17/2025
Dim Water_Stress_Index(366) As Double
Dim Root_Fraction(20) As Double
Dim Adjusted_Root_Fraction(20) As Double
Dim Total_Transpiration As Double

Sub ClearArrays()
Dim i As Integer
Dim j As Integer
For i = 1 To 366
    Potential_Transpiration(i) = 0
    Potential_Crop_Transpiration(i) = 0
    Potential_Soil_Water_Evaporation(i) = 0
    Potential_ET(i) = 0
    Actual_Transpiration(i) = 0
    Actual_Soil_Water_Evaporation(i) = 0
    Cumulative_Soil_Water_Evaporation = 0 'Mingliang 4/17/2025
    Water_Stress_Index(i) = 0
Next i
End Sub
Sub PotET(Crop_Number As Integer, DOY As Integer, Potential_Crop As Boolean, Crop_Active As Boolean)
Dim ET_Coeff_At_Canopy_Cover_Of_One As Double
Dim Adjusted_ET_Coeff_At_Canopy_Cover_Of_One As Double
Dim Reference_crop_ET As Double
Dim Green_Canopy_Cover As Double
Dim Total_Canopy_Cover As Double
Dim Potential_Green_Canopy_Cover As Double
Dim Potential_Total_Canopy_Cover As Double
Dim Kcmax As Double
Dim Today_Kc_transp As Double
Dim Today_Kc_evap As Double
Dim Wind_Speed As Double
Dim Minimum_Relative_Humidity As Double
Dim Crop_Height As Double
Dim Midseason_ET_Crop_Coefficient As Double
Dim Maximum_Canopy_Cover As Double

Reference_crop_ET = ReadInputs.FAOETo(DOY)
If Reference_crop_ET = 0 Then Reference_crop_ET = 0.01
Wind_Speed = ReadInputs.WindSpeed(DOY)
Minimum_Relative_Humidity = ReadInputs.MinimumRH(DOY)

If Crop_Active Then
    If Potential_Crop Then
        Potential_Total_Canopy_Cover = Crop.PotentialTotalCanopyCover(DOY)
        Potential_Green_Canopy_Cover = Crop.PotentialGreenCanopyCover(DOY)
        Else
        Total_Canopy_Cover = Crop.TotalCanopyCover(DOY)
        Green_Canopy_Cover = Crop.GreenCanopyCover(DOY)
    End If
    Crop_Height = Crop.CropHeight(DOY)
    Midseason_ET_Crop_Coefficient = ReadInputs.MidseasonCropCoefficient(Crop_Number)
    Maximum_Canopy_Cover = ReadInputs.MaximumGreenCanopyCover(Crop_Number)

'If Main.GetTreeFruitCrop And (DAP >= Main.GetFruitHarvestDay) Then Today_Kc_transp = 0.2  THIS WILL BE ACTIVATED WHEN DEALING WITH TREE FRUITS AFTER HARVEST
    
    If Potential_Crop Then
        Today_Kc_transp = Midseason_ET_Crop_Coefficient * Potential_Green_Canopy_Cover / Maximum_Canopy_Cover
        Potential_Crop_Transpiration(DOY) = Reference_crop_ET * Today_Kc_transp
        Kcmax = Maximum(1.1 + (0.04 * (Wind_Speed - 2) - 0.004 * (Minimum_Relative_Humidity - 45)) * (Crop_Height / 3) ^ 0.3, 0.05 + Today_Kc_transp)
        Today_Kc_evap = Maximum(0.05, Kcmax - Midseason_ET_Crop_Coefficient * Total_Canopy_Cover / Maximum_Canopy_Cover) 'accounts for total shading from the canopy (green + senesced)
        Potential_Soil_Water_Evaporation(DOY) = Reference_crop_ET * Today_Kc_evap
        Potential_ET(DOY) = Potential_Crop_Transpiration(DOY) + Potential_Soil_Water_Evaporation(DOY)
        Else
        Today_Kc_transp = Midseason_ET_Crop_Coefficient * Green_Canopy_Cover / Maximum_Canopy_Cover
        Kcmax = Maximum(1.1 + (0.04 * (Wind_Speed - 2) - 0.004 * (Minimum_Relative_Humidity - 45)) * (Crop_Height / 3) ^ 0.3, 0.05 + Today_Kc_transp)
        Today_Kc_evap = Maximum(0.05, Kcmax - Midseason_ET_Crop_Coefficient * Total_Canopy_Cover / Maximum_Canopy_Cover) 'accounts for total shading from the canopy (green + senesced)
        Potential_Transpiration(DOY) = Reference_crop_ET * Today_Kc_transp
        Potential_Soil_Water_Evaporation(DOY) = Reference_crop_ET * Today_Kc_evap
        Potential_ET(DOY) = Potential_Transpiration(DOY) + Potential_Soil_Water_Evaporation(DOY)
    End If
    Else
    Today_Kc_transp = 0
    Crop_Height = 0
    Kcmax = Maximum(1.1 + (0.04 * (Wind_Speed - 2) - 0.004 * (Minimum_Relative_Humidity - 45)) * (Crop_Height / 3) ^ 0.3, 0.05 + Today_Kc_transp)
    Today_Kc_evap = Kcmax
    Potential_Soil_Water_Evaporation(DOY) = Reference_crop_ET * Today_Kc_evap
    Potential_ET(DOY) = Potential_Soil_Water_Evaporation(DOY)
End If
End Sub

Sub ActualTranspiration(DOY As Integer, Crop_Number As Integer)
'Calculate water uptake assumed equal to actual transpiration
Dim Today_Potential_Transpiration As Double
Dim Plant_Hydraulic_Conductance As Double
Dim Layer_Bottom_Depth As Double
Dim Root_Hydraulic_Conductance As Double
Dim Top_Hydraulic_Conductance As Double
Dim Layer_Thickness As Double
Dim Sum_Root_Fraction_Adjustment As Double
Dim i As Integer
Dim Root_Fraction_Sum As Double
Dim NewRoot_Fraction_Sum As Double
Dim Layer_Plant_Hydraulic_Conductance(20) As Double
Dim Layer_Root_Fraction_Adjustment(20) As Double
Dim Soil_WP(366, 20) As Double
Dim WP_At_FC(20) As Double
Dim WP_At_PWP(20) As Double
Dim Air_Entry_Potential(20) As Double
Dim Root_Activity_Factor(20) As Double
Dim Average_Soil_WP As Double
Dim Potential_Transpiration_Full_Canopy As Double
Dim Max_CropWater_Uptake_Full_Canopy As Double
Dim Current_green_Canopy_Cover As Double
Dim Green_Canopy_Cover_Max As Double
Dim Today_Crop_Max_Water_Uptake As Double
Dim Today_Expected_Crop_Water_Uptake As Double
Dim LeafWP_OnsetStress As Double
Dim LeafWP_Wilt As Double
Dim Leaf_Water_Pot As Double
Dim Crop_Water_Uptake As Double
Dim Number_Of_Soil_Layers As Integer
Dim Root_Depth As Double
Dim Effective_Root_Depth As Double
Dim Act_Transp As Double
Dim WC As Double
Dim Sat_WC As Double
Dim AEP As Double
Dim B_Val As Double
Dim WD As Double

WD = 1000 'Water density in kg/m3
'Read parameters
LeafWP_Wilt = ReadInputs.LWPPermanentWilting(Crop_Number)
Number_Of_Soil_Layers = Soil.NumberModelLayers
For i = 2 To Number_Of_Soil_Layers
    WP_At_FC(i) = Soil.WPAtFC(i)
    WP_At_PWP(i) = Soil.WPAtPWP(i)
    Air_Entry_Potential(i) = Soil.AirEntryPotential(i)
Next i
Today_Potential_Transpiration = Potential_Transpiration(DOY)
Current_green_Canopy_Cover = Crop.GreenCanopyCover(DOY) 'Use yesterday value. Today value not calculated et
Green_Canopy_Cover_Max = ReadInputs.MaximumGreenCanopyCover(Crop_Number)
LeafWP_OnsetStress = ReadInputs.LWPOnsetStomatalClosure(Crop_Number)
Root_Depth = Crop.RootDepth(DOY)
'Calculate today's crop maximun water uptake rate (kg/m2/d = mm/d)
Max_CropWater_Uptake_Full_Canopy = ReadInputs.MaximumCropWaterUptake(Crop_Number)
Today_Crop_Max_Water_Uptake = Max_CropWater_Uptake_Full_Canopy * Current_green_Canopy_Cover / Green_Canopy_Cover_Max
'Calculate today's expected crop transpiration rate (kg/m2/d = mm/d)
Today_Expected_Crop_Water_Uptake = Minimum(Today_Potential_Transpiration, Today_Crop_Max_Water_Uptake)
'Calculate plant hydraulic conductivity ((kg^2)/(m2-J-d), the capacity of the vascular system to conduct water, assumes that maximum crop uptake takes place at a soil water potential of zero
Plant_Hydraulic_Conductance = Today_Crop_Max_Water_Uptake / (-LeafWP_OnsetStress)
'Calculate root fraction per soil layer
Layer_Bottom_Depth = 0
Root_Fraction_Sum = 0
Effective_Root_Depth = Maximum(0, Root_Depth - Soil.LayerThickness(1))
For i = 2 To Number_Of_Soil_Layers
    Layer_Thickness = Soil.LayerThickness(i)
    If Layer_Thickness > 0 Then
      Layer_Bottom_Depth = Layer_Bottom_Depth + Layer_Thickness
      Root_Fraction(i) = CalculateRootFraction(Layer_Bottom_Depth, Layer_Thickness, Root_Depth)
      Root_Fraction_Sum = Root_Fraction_Sum + Root_Fraction(i)
    Else
      i = Number_Of_Soil_Layers
    End If
Next i
'Adjust root fraction for shallow soils to ensure that the sum of root fraction of all layers is equal to 1
If (Root_Depth > Layer_Bottom_Depth) And (Root_Fraction_Sum < 1) Then
    NewRoot_Fraction_Sum = 0
    For i = 2 To Number_Of_Soil_Layers
    Root_Fraction(i) = Root_Fraction(i) / Root_Fraction_Sum
    NewRoot_Fraction_Sum = NewRoot_Fraction_Sum + Root_Fraction(i)
    Next i
    Root_Fraction_Sum = NewRoot_Fraction_Sum
End If
'Adjust root fraction based on soil dryness or soil near saturation
Sum_Root_Fraction_Adjustment = 0

Dim SWP(20) As Double 'OJO
For i = 2 To Number_Of_Soil_Layers
    SWP(i) = Soil.SoilWaterPotential(DOY - 1, i)
Next i

For i = 2 To Number_Of_Soil_Layers
    Soil_WP(DOY, i) = Soil.SoilWaterPotential(DOY - 1, i) 'Mingliang Change soil water potential to two dimensional array. Also, get the value from previous day
    If Soil_WP(DOY, i) <= WP_At_FC(i) Then
        Root_Activity_Factor(i) = 1 - ((Soil_WP(DOY, i) - WP_At_FC(i)) / (WP_At_PWP(i) - WP_At_FC(i))) ^ 8 'Calculate dry end of root activity
        Else
        Root_Activity_Factor(i) = 1 - ((Soil_WP(DOY, i) - WP_At_FC(i)) / (Air_Entry_Potential(i) - WP_At_FC(i))) ^ 20 'Calculate wet end of root activity
    End If
    If Root_Activity_Factor(i) > 1 Then Root_Activity_Factor(i) = 1
    If Root_Activity_Factor(i) < 0 Then Root_Activity_Factor(i) = 0
    Layer_Root_Fraction_Adjustment(i) = Root_Fraction(i) * Root_Activity_Factor(i)
    Sum_Root_Fraction_Adjustment = Sum_Root_Fraction_Adjustment + Layer_Root_Fraction_Adjustment(i)
Next i
For i = 2 To Number_Of_Soil_Layers
    If Sum_Root_Fraction_Adjustment = 0 Then
        Adjusted_Root_Fraction(i) = 0
        Layer_Plant_Hydraulic_Conductance(i) = 0
        Else
        Adjusted_Root_Fraction(i) = Layer_Root_Fraction_Adjustment(i) / Sum_Root_Fraction_Adjustment
        Layer_Plant_Hydraulic_Conductance(i) = Plant_Hydraulic_Conductance * Adjusted_Root_Fraction(i)
    End If
Next i
'Calculate average soil water potential (J/kg)
Average_Soil_WP = 0
For i = 2 To Number_Of_Soil_Layers
    Average_Soil_WP = Average_Soil_WP + Soil_WP(DOY, i) * Adjusted_Root_Fraction(i)
Next i
'Calculate leaf water potential
If Plant_Hydraulic_Conductance = 0 Then
    Leaf_Water_Pot = LeafWP_Wilt
    Else
    Leaf_Water_Pot = Average_Soil_WP - Today_Expected_Crop_Water_Uptake / Plant_Hydraulic_Conductance
    If Leaf_Water_Pot < LeafWP_OnsetStress Then
        Leaf_Water_Pot = (Plant_Hydraulic_Conductance * Average_Soil_WP * (LeafWP_OnsetStress - _
            LeafWP_Wilt) + LeafWP_Wilt * Today_Expected_Crop_Water_Uptake) / (Plant_Hydraulic_Conductance * _
            (LeafWP_OnsetStress - LeafWP_Wilt) + Today_Expected_Crop_Water_Uptake)
    End If
    If Leaf_Water_Pot < LeafWP_Wilt Then Leaf_Water_Pot = LeafWP_Wilt
End If
'Calculate crop water uptake (kg/m2/d = mm/d)
Crop_Water_Uptake = 0
For i = 2 To Number_Of_Soil_Layers
    Soil_Water_Uptake(DOY, i) = Layer_Plant_Hydraulic_Conductance(i) * (Soil_WP(DOY, i) - Leaf_Water_Pot)
    Crop_Water_Uptake = Crop_Water_Uptake + Soil_Water_Uptake(DOY, i)
    'Update water content and potential
    Soil.WaterContent(DOY, i) = Soil.WaterContent(DOY, i) - Soil_Water_Uptake(DOY, i) / (Soil.LayerThickness(i) * WD)
    WC = Soil.WaterContent(DOY, i)
    Sat_WC = Soil.SaturationWaterContent(i)
    AEP = Soil.AirEntryPotential(i)
    B_Val = Soil.Bvalue(i)
    Soil.SoilWaterPotential(DOY, i) = WP(Sat_WC, WC, AEP, B_Val) 'Mingliang Change soil water potential to two dimensional array
    Soil.WaterFilledPorosity(DOY, i) = WC / Sat_WC
Next i
Act_Transp = Crop_Water_Uptake
If Crop_Water_Uptake > 0 Then
    Water_Stress_Index(DOY) = 1 - (Crop_Water_Uptake / Today_Expected_Crop_Water_Uptake)
    Actual_Transpiration(DOY) = Crop_Water_Uptake
    Else 'Crop water uptake is negative due to layer water redistribution by roots
    Actual_Transpiration(DOY) = 0
    Water_Stress_Index(DOY) = 0
End If
If Water_Stress_Index(DOY) < 0.00000001 Then Water_Stress_Index(DOY) = 0
Total_Transpiration = Total_Transpiration + Actual_Transpiration(DOY)

End Sub

Function CalculateRootFraction(z As Double, dz As Double, Rd As Double) As Double
Dim f As Double
 Select Case Rd
    Case Is > z: f = dz * (2 * (Rd - z) + dz) / (Rd * Rd)
    Case Is < (z - dz + 0.00001): f = 0
    Case Else: f = ((Rd - z + dz) / Rd) ^ 2
 End Select
CalculateRootFraction = f
End Function
Function Maximum(A As Double, B As Double) As Double
If A > B Then Maximum = A Else Maximum = B
End Function
Function Minimum(A As Double, B As Double) As Double
If A < B Then Minimum = A Else Minimum = B
End Function

Sub ActEvaporation(DOY As Integer)
Dim Residue_Fraction_Solar_Interception As Double
Dim Pot_Soil_Water_Evap As Double
Dim Percent_Sand_Top_Layer As Double
Dim Permanent_Wilting_Point As Double
Dim Air_Dry_Water_Content As Double
Dim Water_Content_Top_layer As Double
Dim WC As Double
Dim Sat_WC As Double
Dim AEP As Double
Dim B_Val As Double
Dim WD As Double

WD = 1000 'kg/m3
Residue_Fraction_Solar_Interception = 0 'Currently not implemented
Percent_Sand_Top_Layer = ReadInputs.PercentSand(1)
Water_Content_Top_layer = Soil.WaterContent(DOY, 1)
Permanent_Wilting_Point = Soil.PWPWaterContent(1)
Air_Dry_Water_Content = Permanent_Wilting_Point / 3
Pot_Soil_Water_Evap = Potential_Soil_Water_Evaporation(DOY) * (1 - Residue_Fraction_Solar_Interception)
If Water_Content_Top_layer > Permanent_Wilting_Point Then
  Actual_Soil_Water_Evaporation(DOY) = Pot_Soil_Water_Evap  'Soil evaporation in mm/day = kg/m2/day
  ElseIf Water_Content_Top_layer > Air_Dry_Water_Content Then
      Actual_Soil_Water_Evaporation(DOY) = Pot_Soil_Water_Evap * ((Water_Content_Top_layer - Air_Dry_Water_Content) _
             / (Permanent_Wilting_Point - Air_Dry_Water_Content)) ^ 2
      Else
      Actual_Soil_Water_Evaporation(DOY) = 0
End If
'Update water content and potential of top layer
Soil.WaterContent(DOY, 1) = Soil.WaterContent(DOY, 1) - Actual_Soil_Water_Evaporation(DOY) / (Soil.LayerThickness(1) * WD)
Cumulative_Soil_Water_Evaporation = Cumulative_Soil_Water_Evaporation + Actual_Soil_Water_Evaporation(DOY)   'Mingliang 4/17/2025
WC = Soil.WaterContent(DOY, 1)
Sat_WC = Soil.SaturationWaterContent(1)
AEP = Soil.AirEntryPotential(1)
B_Val = Soil.Bvalue(1)
Soil.SoilWaterPotential(DOY, 1) = WP(Sat_WC, WC, AEP, B_Val) 'Mingliang Change soil water potential to two dimensional array
Soil.WaterFilledPorosity(DOY, 1) = WC / Sat_WC
End Sub

Property Get PotentialTranspiration(DOY As Integer) As Double
PotentialTranspiration = Potential_Transpiration(DOY)
End Property
Property Get ActualTransp(DOY As Integer) As Double
ActualTransp = Actual_Transpiration(DOY)
End Property
Property Get SoilWaterUptake(DOY As Integer, Layer As Integer) As Double
SoilWaterUptake = Soil_Water_Uptake(DOY, Layer)
End Property
Property Get PotentialSoilWaterEvaporation(DOY As Integer) As Double
PotentialSoilWaterEvaporation = Potential_Soil_Water_Evaporation(DOY)
End Property
Property Get ActualSoilWaterEvaporation(DOY As Integer) As Double
ActualSoilWaterEvaporation = Actual_Soil_Water_Evaporation(DOY)
End Property
Property Get CumulativeSoilWaterEvaporation() As Double 'Mingliang 4/17/2025
CumulativeSoilWaterEvaporation = Cumulative_Soil_Water_Evaporation
End Property
Property Get PotentialET(DOY As Integer) As Double
PotentialET = Potential_ET(DOY)
End Property
Property Get PotentialCropTranspiration(DOY As Integer) As Double
PotentialCropTranspiration = Potential_Crop_Transpiration(DOY)
End Property
Property Get WaterStressIndex(DOY As Integer) As Double
WaterStressIndex = Water_Stress_Index(DOY)
End Property
Property Get RootFraction(j As Integer) As Double
RootFraction = Root_Fraction(j)
End Property
Property Get AdjustedRootFraction(j As Integer) As Double
AdjustedRootFraction = Adjusted_Root_Fraction(j)
End Property
Property Get TotalTranspiration() As Double
TotalTranspiration = Total_Transpiration
End Property
Property Let TotalTranspiration(Update As Double)
Total_Transpiration = Update
End Property
