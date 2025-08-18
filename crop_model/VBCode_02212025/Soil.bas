Attribute VB_Name = "Soil"
Option Explicit
Dim Layer_Thickness(20) As Double
Dim Water_Content(366, 20) As Double
Dim Water_Filled_Porosity(366, 20) As Double
Dim Soil_Water_Potential(366, 20) As Double
'Dim Soil_Water_Potential(20) As Double     'Mingliang This was changed to a two-dimensional array
Dim Nitrate_N_Content(366, 20) As Double
Dim Ammonium_N_Content(366, 20) As Double
Dim Profile_Nitrate_N_Content(366) As Double
Dim Profile_Ammonium_N_Content(366) As Double
Dim Fraction_Of_Clay(20) As Double
Dim Fraction_Of_Sand(20) As Double
Dim Fraction_Of_Silt(20) As Double
Dim Air_Entry_Potential(20) As Double
Dim B_value(20) As Double
Dim WP_At_FC(20) As Double
Dim WP_At_PWP(20) As Double
Dim FC_Water_Content(20) As Double
Dim PWP_Water_Content(20) As Double
Dim Soil_Mass(20) As Double
Dim Percent_Soil_Organic_Matter(20) As Double
Dim Soil_Organic_Carbon(366, 20) As Double
Dim Soil_Organic_Nitrogen(366, 20) As Double
Dim Carbon_Fraction_In_SOM As Double
Dim SOC_C_N_Ratio As Double
Dim Plant_Available_Water_Content(20) As Double
Dim Bulk_Density(20) As Double
Dim Saturation_Water_Content(20) As Double
Dim Thickness_Evaporative_Layer As Double
Dim Number_Model_Layers As Integer
Dim N_Leaching(366) As Double
Dim Deep_Drainage(366) As Double
Dim Chemical_Balance(366) As Double
Dim Water_Balance(366) As Double
Dim Cumulative_N_Leaching As Double
Dim Cumulative_Deep_Drainage As Double
Dim Simulation_Total_N_Leaching As Double
Dim Simulation_Total_Deep_Drainage As Double
Dim Cumulative_Irrigation As Double
Dim Cumulative_Fertilization As Double
Dim Simulation_Total_Irrigation As Double
Dim Simulation_Total_Fertilization As Double
Dim Fertilization_Rate(366) As Double
Dim Layer_Hourly_Soil_Temperature(20, 24) As Double
Dim Layer_Daily_Soil_Temperature(20) As Double
Dim Auto_Irrigation As Boolean
Dim Number_Of_Events As Integer
Dim Method As Integer
Dim PAW_Trigger As Boolean
Dim CWSI_Trigger As Boolean
Dim Max_Allowed_CWSI As Double
Dim MAD As Double
Dim Refill_Today As Boolean
Dim Soil_Depth_To_Refill As Double
Dim PAW_Depletion(366) As Double
'Dim PAW_Depletion_Top50cm(366) As Double  'Mingliang 4/17/2025
'Dim PAW_Depletion_Mid50cm(366) As Double  'Mingliang 4/17/2025
'Dim PAW_Depletion_Bottom50cm(366) As Double  'Mingliang 4/17/2025
Dim Water_Content_Top50cm(366) As Double 'Mingliang 4/17/2025
Dim Water_Content_Mid50cm(366) As Double 'Mingliang 4/17/2025
Dim Water_Content_Bottom50cm(366) As Double 'Mingliang 4/17/2025
Dim N_Mass_Top50cm(366) As Double
Dim N_Mass_Mid50cm(366) As Double
Dim N_Mass_Bottom50cm(366) As Double


Sub ClearArrays()
Dim i As Integer
Dim j As Integer
For i = 1 To 20
    Fraction_Of_Clay(i) = 0
    Fraction_Of_Sand(i) = 0
    Fraction_Of_Silt(i) = 0
    Air_Entry_Potential(i) = 0
    B_value(i) = 0
    WP_At_FC(i) = 0
    WP_At_PWP(i) = 0
    FC_Water_Content(i) = 0
    PWP_Water_Content(i) = 0
    Plant_Available_Water_Content(i) = 0
    Percent_Soil_Organic_Matter(i) = 0
    Bulk_Density(i) = 0
    Saturation_Water_Content(i) = 0
    Layer_Thickness(i) = 0
    Soil_Mass(i) = 0
'    Soil_Water_Potential(i) = 0  'Mingliang Moved below
    Layer_Daily_Soil_Temperature(i) = 0
Next i
For i = 1 To 366
    Profile_Nitrate_N_Content(i) = 0
    Profile_Ammonium_N_Content(i) = 0
    N_Leaching(i) = 0
    Deep_Drainage(i) = 0
    Chemical_Balance(i) = 0
    Water_Balance(i) = 0
    Fertilization_Rate(i) = 0
    PAW_Depletion(i) = 0
'    PAW_Depletion_Top50cm(i) = 0 'Mingliang 4/17/2025
'    PAW_Depletion_Mid50cm(i) = 0 'Mingliang 4/17/2025
'    PAW_Depletion_Bottom50cm(i) = 0 'Mingliang 4/17/2025
    Water_Content_Top50cm(366) = 0 'Mingliang 4/17/2025
    Water_Content_Mid50cm(366) = 0 'Mingliang 4/17/2025
    Water_Content_Bottom50cm(366) = 0 'Mingliang 4/17/2025
    N_Mass_Top50cm(i) = 0
    N_Mass_Mid50cm(i) = 0
    N_Mass_Bottom50cm(i) = 0
Next i
For i = 1 To 366
    For j = 1 To 20
        Water_Content(i, j) = 0
        Water_Filled_Porosity(i, j) = 0
        Soil_Water_Potential(i, j) = 0
        Nitrate_N_Content(i, j) = 0
        Ammonium_N_Content(i, j) = 0
        Soil_Organic_Carbon(i, j) = 0
        Soil_Organic_Nitrogen(i, j) = 0
    Next j
Next i
For i = 1 To 20
    For j = 1 To 24
        Layer_Hourly_Soil_Temperature(i, j) = 0
    Next j
Next i
End Sub
Sub CalculateHydraulicProperties()
Dim i As Integer
Dim j As Integer
Dim k As Integer
Dim L As Integer
Dim N_Horz As Integer
Dim Clay(6) As Double
Dim Sand(6) As Double
Dim Silt(6) As Double
Dim AE_Pot(6) As Double
Dim B_Val(6) As Double
Dim FC_WP(6) As Double
Dim PWP_WP(6) As Double
Dim FC_WC(6) As Double
Dim PWP_WC(6) As Double
Dim Percent_SOM(6) As Double
Dim Bulk_Dens(6) As Double
Dim Sat_WC(6) As Double
Dim Number_Of_Sublayers(10) As Double
Dim Thickness_Model_Layers As Double
Dim Cum_J As Integer
Dim NL As Integer

N_Horz = ReadInputs.NumberOfHorizons
Thickness_Model_Layers = 0.1
For i = 1 To N_Horz
    Clay(i) = ReadInputs.PercentClay(i)
    Sand(i) = ReadInputs.PercentSand(i)
    Silt(i) = ReadInputs.PercentSilt(i)
    AE_Pot(i) = AE(Sand(i), Clay(i))
    B_Val(i) = B(Sand(i), Clay(i))
    FC_WP(i) = WPFC(Clay(i), Silt(i))
    PWP_WP(i) = -1500
    Percent_SOM(i) = ReadInputs.SoilOrganicMatter(i)
    Bulk_Dens(i) = BD(Sand(i), Clay(i))
    Sat_WC(i) = WS(Sand(i), Clay(i))
    FC_WC(i) = ReadInputs.FieldCapacity(i)
    If FC_WC(i) = 0 Then FC_WC(i) = WC(Sat_WC(i), FC_WP(i), AE_Pot(i), B_Val(i))
    PWP_WC(i) = ReadInputs.PermanentWiltingPoint(i)
    If PWP_WC(i) = 0 Then PWP_WC(i) = WC(Sat_WC(i), PWP_WP(i), AE_Pot(i), B_Val(i))
    Number_Of_Sublayers(i) = ReadInputs.HorizonThickness(i) / Thickness_Model_Layers
Next i
'Distribute properties for each model layer of thickness 0.1 m
Cum_J = 1
For i = 1 To N_Horz
    NL = Number_Of_Sublayers(i)
    k = Cum_J
    L = (k + NL - 1)
    For j = k To L
        Fraction_Of_Clay(j) = Clay(i) / 100 'Convert percent to fraction
        Fraction_Of_Sand(j) = Sand(i) / 100 'Convert percent to fraction
        Fraction_Of_Silt(j) = Silt(i) / 100 'Convert percent to fraction
        Air_Entry_Potential(j) = AE_Pot(i)
        B_value(j) = B_Val(i)
        WP_At_FC(j) = FC_WP(i)
        WP_At_PWP(j) = PWP_WP(i)
        FC_Water_Content(j) = FC_WC(i)
        PWP_Water_Content(j) = PWP_WC(i)
        Plant_Available_Water_Content(j) = FC_Water_Content(j) - PWP_Water_Content(j)
        Percent_Soil_Organic_Matter(j) = Percent_SOM(i)
        Bulk_Density(j) = Bulk_Dens(i)
        Saturation_Water_Content(j) = Sat_WC(i)
    Next j
    Cum_J = L + 1
Next i
Number_Model_Layers = Cum_J - 1
End Sub
Sub InitialConditions(Run_First_Doy As Integer, Run_Last_Doy As Integer)
Dim Number_Initial_Conditions_Layers As Integer
Dim Number_Initialization_Layers As Integer
Dim Thickness_Model_Layers As Double
Dim i As Integer
Dim j As Integer
Dim k As Integer
Dim L As Integer
Dim Thickness(10) As Double
Dim Number_Of_Sublayers(10) As Integer
Dim Water(10) As Double
Dim Nitrate(10) As Double
Dim Ammonium(10) As Double
Dim NL As Integer
Dim Cum_J As Integer
Dim Percent_Sand As Double
Dim SOC As Double
Dim DOY As Integer
Carbon_Fraction_In_SOM = 0.58
SOC_C_N_Ratio = 12 'kg/kg

Worksheets("Initial Soil Conditions").Activate

DOY = Run_First_Doy

Number_Initial_Conditions_Layers = [B3]
Thickness_Model_Layers = 0.1
For i = 1 To Number_Initial_Conditions_Layers
    Thickness(i) = Cells(i + 6, 2)
    Number_Of_Sublayers(i) = Thickness(i) / Thickness_Model_Layers
    Water(i) = Cells(i + 6, 3)
    Nitrate(i) = Cells(i + 6, 4) / 10000 'Convert kg/ha to kg/m2
    Ammonium(i) = Cells(i + 6, 5) / 10000 'Convert kg/ha to kg/m2
Next i
'Distribute variables for each model layer of thickness 0.1 m
Cum_J = 1
For i = 1 To Number_Initial_Conditions_Layers
    NL = Number_Of_Sublayers(i)
    k = Cum_J
    L = (k + NL - 1)
    For j = k To L
        Layer_Thickness(j) = Thickness(i) / Number_Of_Sublayers(i)
        Water_Content(DOY, j) = Water(i)
        Water_Filled_Porosity(DOY, j) = Water(i) / Saturation_Water_Content(j)
'        Soil_Water_Potential(j) = WP(Saturation_Water_Content(j), Water(i), Air_Entry_Potential(j), B_value(j)) Mingliang Changed to two dimensions
        Soil_Water_Potential(DOY, j) = WP(Saturation_Water_Content(j), Water(i), Air_Entry_Potential(j), B_value(j))
        Nitrate_N_Content(DOY, j) = Nitrate(i) / Number_Of_Sublayers(i)
        Ammonium_N_Content(DOY, j) = Ammonium(i) / Number_Of_Sublayers(i)
        'Initialize soil organi carbon and nitrogen
        'Convert percent organic matter to soil organic carbon in kg C/m2 soil
        Soil_Mass(j) = Bulk_Density(j) * 1000# * Layer_Thickness(j) 'kg/m2 in each soil layer. Bulk density converted from Mg/m3 to kg/m3
        SOC = Soil_Mass(j) * (Percent_Soil_Organic_Matter(j) / 100) * Carbon_Fraction_In_SOM 'kg/m2
        Soil_Organic_Carbon(DOY, j) = SOC
        Soil_Organic_Nitrogen(DOY, j) = SOC / SOC_C_N_Ratio
    Next j
    Cum_J = L + 1
Next i

'Mingliang: Begin of new section added
Number_Initialization_Layers = Cum_J - 1 'Mingliang 4/15/2025
Dim NML As Integer 'This is the total number of simulation model layers 'Mingliang 4/15/2025
NML = Soil.NumberModelLayers 'Mingliang 4/15/2025
For i = Number_Initialization_Layers + 1 To NML
        Layer_Thickness(i) = Layer_Thickness(Number_Initialization_Layers)
        Water_Content(DOY, i) = Water_Content(DOY, Number_Initialization_Layers)
        Water_Filled_Porosity(DOY, i) = Water_Content(DOY, i) / Saturation_Water_Content(i)
        'Mingliang Soil water potential was changed to a two-dimensional array
'        Soil_Water_Potential(i) = WP(Saturation_Water_Content(i), Water_Content(DOY, i), Air_Entry_Potential(i), B_value(i))
        Soil_Water_Potential(DOY, i) = WP(Saturation_Water_Content(i), Water_Content(DOY, i), Air_Entry_Potential(i), B_value(i))
        Nitrate_N_Content(DOY, i) = Nitrate_N_Content(DOY, Number_Initialization_Layers)
        Ammonium_N_Content(DOY, j) = Ammonium_N_Content(DOY, Number_Initialization_Layers)
'        Initialize soil organi carbon and nitrogen
'        Convert percent organic matter to soil organic carbon in kg C/m2 soil
        Soil_Mass(i) = Bulk_Density(i) * 1000# * Layer_Thickness(i) 'kg/m2 in each soil layer. Bulk density converted from Mg/m3 to kg/m3
        SOC = Soil_Mass(j) * (Percent_Soil_Organic_Matter(j) / 100) * Carbon_Fraction_In_SOM 'kg/m2
        Soil_Organic_Carbon(DOY, i) = SOC
        Soil_Organic_Nitrogen(DOY, i) = SOC / SOC_C_N_Ratio
Next i
'Mingliang: End of new section added

'Set simulation period accumulators to zero
Simulation_Total_N_Leaching = 0
Simulation_Total_Deep_Drainage = 0
Simulation_Total_Irrigation = 0
Simulation_Total_Fertilization = 0
Auto_Irrigation = False
For i = Run_First_Doy To Run_Last_Doy
    ReadInputs.NetIrrigationDepth(DOY) = 0
Next i
End Sub

Sub WaterAndNTransport(DOY As Integer)
'This subroutine only transport nitrate N. Ammonium N only moves down the soil when transformed to nitrate
Dim Number_Of_Layers As Integer
Dim Chem_Mass(20) As Double
Dim WC(20) As Double
Dim FC(20) As Double
Dim dz(20) As Double
Dim BD(20) As Double
Dim Water_Flux_In As Double
Dim Number_Of_Pulses As Integer
Dim k As Double
Dim Q As Double
Dim Win As Double
Dim Wout As Double
Dim Mass_change As Double
Dim Initial_Profile_Chemical_Mass As Double
Dim Final_Profile_Chemical_Mass As Double
Dim Initial_Soil_Water_Profile As Double
Dim Final_Soil_Water_Profile As Double
Dim Conc_In As Double
Dim Conc_Out As Double
Dim Water_Depth_To_Reach_Field_Capacity As Double
Dim Original_Water_Depth As Double
Dim Water_Depth_Equivalent_Of_One_Pore_Volume As Double
Dim Irrig_Chemical_Conc As Double
Dim Precip_Chemical_Conc As Double
Dim Water_Chemical_Concentration As Double
Dim NID As Double
Dim Prec As Double
Dim Nitrate_N_Fertilization As Double
Dim Ammonium_N_Fertilization As Double
Dim CO(30) As Double
Dim Drainage As Double  'drainage flux in mm/day = kg/m2/day
Dim Chemical_Leaching As Double  'Leaching in kg Salt/m2
Dim Layer As Integer
Dim i As Integer
Dim j As Integer
Dim L As Integer
Dim C(30) As Double 'Chemical concentration in the soil solution (kg/kg)
Const WD = 1000  'water density in kg/m3

Drainage = 0 'Initialize drainage flux
Chemical_Leaching = 0
NID = 0
'Calculates initial soil water profile (kg/m2 or mm) and total chemical mass in the soil profile (kg/m2)
 Initial_Profile_Chemical_Mass = 0
 Initial_Soil_Water_Profile = 0
 Number_Of_Layers = Soil.NumberModelLayers
 For Layer = 1 To Number_Of_Layers
     Chem_Mass(Layer) = Soil.NitrateNContent(DOY, Layer) 'Only nitrate is considered for water transport
     WC(Layer) = Soil.WaterContent(DOY, Layer)
     FC(Layer) = Soil.FCWaterContent(Layer)
     dz(Layer) = Soil.LayerThickness(Layer)
     BD(Layer) = Soil.BulkDensity(Layer)
     Initial_Soil_Water_Profile = Initial_Soil_Water_Profile + WC(Layer) * dz(Layer) * WD
     Initial_Profile_Chemical_Mass = Initial_Profile_Chemical_Mass + Chem_Mass(Layer)
 Next Layer
  
Number_Of_Events = ReadInputs.NumberOfAutoEntries
For i = 1 To Number_Of_Events
    If ReadInputs.DOYToStartAutoIrrigation(i) = DOY Then
        Auto_Irrigation = True
        Method = ReadInputs.SchedulingMethod(i)
        If Method = 1 Then
            MAD = ReadInputs.MaximumAllowablePAWDepletion(i)
            PAW_Trigger = True
            CWSI_Trigger = False
            Else
            Max_Allowed_CWSI = ReadInputs.MaximumAllowableCWSI(i)
            PAW_Trigger = False
            CWSI_Trigger = True
        End If
    End If
    If ReadInputs.DOYToStopAutoIrrigation(i) = DOY Then
        Auto_Irrigation = False
    End If
    If ReadInputs.DOYForRefillIrrigation(i) = DOY Then
        Refill_Today = True
        Soil_Depth_To_Refill = ReadInputs.RefillDepth(i)
    End If
Next i
NID = ReadInputs.NetIrrigationDepth(DOY)
If Refill_Today Then
   NID = SetAutoIrrigation(DOY, PAW_Trigger, CWSI_Trigger, Number_Of_Layers, MAD, Max_Allowed_CWSI, Refill_Today, Soil_Depth_To_Refill)
   ReadInputs.NetIrrigationDepth(DOY) = NID
   Refill_Today = False
End If
If Auto_Irrigation And NID = 0 Then
   NID = SetAutoIrrigation(DOY, PAW_Trigger, CWSI_Trigger, Number_Of_Layers, MAD, Max_Allowed_CWSI, Refill_Today, Soil_Depth_To_Refill)
   ReadInputs.NetIrrigationDepth(DOY) = NID
End If
Prec = ReadInputs.Precip(DOY)
Nitrate_N_Fertilization = ReadInputs.NitrateFertilizationRate(DOY) 'kg/m2
Ammonium_N_Fertilization = ReadInputs.AmmoniumFertilizationRate(DOY) 'kg/m2
Fertilization_Rate(DOY) = Nitrate_N_Fertilization + Ammonium_N_Fertilization
Soil.NitrateNContent(DOY, 2) = Soil.NitrateNContent(DOY, 2) + Nitrate_N_Fertilization 'NO3-N fertilizer added to the second layer
Soil.AmmoniumNContent(DOY, 2) = Soil.AmmoniumNContent(DOY, 2) + Ammonium_N_Fertilization 'NH4-N fertilizer added to the second layer, BUT NOT transported by water
Chem_Mass(2) = Chem_Mass(2) + Nitrate_N_Fertilization 'Only nitrate is considered for water transport
Water_Flux_In = NID + Prec
Irrig_Chemical_Conc = ReadInputs.WaterNConc
Precip_Chemical_Conc = 0
If Water_Flux_In > 0 Then Water_Chemical_Concentration = (Irrig_Chemical_Conc * NID + Precip_Chemical_Conc * Prec) / Water_Flux_In
'Calculate pore volume equivalent of each water pulse
If Number_Of_Pulses = 0 Then
    Water_Depth_Equivalent_Of_One_Pore_Volume = WD * dz(2) * FC(2)
    Number_Of_Pulses = 1 + Int(Water_Flux_In / (0.2 * Water_Depth_Equivalent_Of_One_Pore_Volume))
End If
For i = 1 To Number_Of_Pulses
    Win = Water_Flux_In / Number_Of_Pulses
    Conc_In = Water_Chemical_Concentration
   'Equilibrate soil solution
    If (k > 0) And (Q > 0) Then
        For j = 1 To Number_Of_Layers
        C(j) = EquilibriumConcentration(Chem_Mass(j), WC(j), dz(j), BD(j), k, Q)
        Next j
    Else
        For j = 1 To Number_Of_Layers
        C(j) = Chem_Mass(j) / (dz(j) * WC(j) * WD)
        Next j
    End If
    j = 1
    While (j <= Number_Of_Layers) And (Win > 0) 'infiltration calculation
     Original_Water_Depth = dz(j) * WD * WC(j)
     Water_Depth_To_Reach_Field_Capacity = (FC(j) - WC(j)) * dz(j) * WD
     'Determine water and chemical transport
     If Win > Water_Depth_To_Reach_Field_Capacity Then
         Wout = Win - Water_Depth_To_Reach_Field_Capacity
         If Wout <= Original_Water_Depth Then
             Conc_Out = C(j)
             Else
             Conc_Out = (Original_Water_Depth * C(j) + (Wout - Original_Water_Depth) * Conc_In) / Wout
         End If
         WC(j) = FC(j)
         Else
         Wout = 0
         Conc_Out = 0
         WC(j) = WC(j) + Win / (WD * dz(j))
     End If
     Mass_change = Win * Conc_In - Wout * Conc_Out
     If Mass_change < 0 And Abs(Mass_change) > Chem_Mass(j) Then
         Mass_change = -Chem_Mass(j)
         Conc_Out = (Win * Conc_In - Mass_change) / Wout
         Chem_Mass(j) = 0
         Else
         Chem_Mass(j) = Chem_Mass(j) + Mass_change
     End If
     Win = Wout
     Conc_In = Conc_Out
     j = j + 1
   Wend
Drainage = Drainage + Wout     'in mm/day = kg/m2/day
Chemical_Leaching = Chemical_Leaching + Wout * Conc_Out
Next i 'Next pulse
'Calculates Final total chemical mass in the soil profile (kg/m2)
Final_Profile_Chemical_Mass = 0
For L = 1 To Number_Of_Layers
Final_Profile_Chemical_Mass = Final_Profile_Chemical_Mass + Chem_Mass(L)
Next L
Chemical_Balance(DOY) = (Initial_Profile_Chemical_Mass + Water_Flux_In * Water_Chemical_Concentration + Nitrate_N_Fertilization _
                - (Final_Profile_Chemical_Mass + Chemical_Leaching)) * 10000 'Convert kg/m2 to kg/ha
'Calculates final soil water profile (kg/m2 or mm)
Final_Soil_Water_Profile = 0
For L = 1 To Number_Of_Layers
Final_Soil_Water_Profile = Final_Soil_Water_Profile + WC(L) * dz(L) * WD
Next L
Water_Balance(DOY) = (Initial_Soil_Water_Profile + Water_Flux_In - (Final_Soil_Water_Profile + Drainage))

If Water_Balance(DOY) > 0.0000000001 Then Stop

'Update water and nitrogen content after transport
For Layer = 1 To Number_Of_Layers
     Soil.WaterContent(DOY, Layer) = WC(Layer)
     Soil_Water_Potential(DOY, Layer) = WP(Saturation_Water_Content(Layer), Water_Content(DOY, Layer), Air_Entry_Potential(Layer), B_value(Layer)) 'Mingliang 4/16/2025
     Soil.NitrateNContent(DOY, Layer) = Chem_Mass(Layer)
     N_Leaching(DOY) = Chemical_Leaching 'kg/m2
     Deep_Drainage(DOY) = Drainage  'mm
Next Layer

If Main.CropActive Then
   Cumulative_Deep_Drainage = Cumulative_Deep_Drainage + Drainage 'mm
   Cumulative_N_Leaching = Cumulative_N_Leaching + Chemical_Leaching * 10000 'Convert kg/m2 to kg/ha
   Cumulative_Irrigation = Cumulative_Irrigation + NID
   Cumulative_Fertilization = Cumulative_Fertilization + Nitrate_N_Fertilization + Ammonium_N_Fertilization
End If
Simulation_Total_Deep_Drainage = Simulation_Total_Deep_Drainage + Drainage 'mm
Simulation_Total_N_Leaching = Simulation_Total_N_Leaching + Chemical_Leaching * 10000 'Convert kg/m2 to kg/ha
Simulation_Total_Irrigation = Simulation_Total_Irrigation + NID
Simulation_Total_Fertilization = Simulation_Total_Fertilization + Nitrate_N_Fertilization + Ammonium_N_Fertilization


'Calculate daily N mass output for top, mid, and bottom layers. Also N mass leaching.
Dim Top50cm_N_Mass
Dim Mid50cm_N_Mass
Dim Bottom50cm_N_Mass

Top50cm_N_Mass = 0
Mid50cm_N_Mass = 0
Bottom50cm_N_Mass = 0
For Layer = 1 To Number_Of_Layers
    If Layer >= 1 And Layer <= 5 Then
        Top50cm_N_Mass = Top50cm_N_Mass + Soil.NitrateNContent(DOY, Layer) + Soil.AmmoniumNContent(DOY, Layer)
    End If
    If Layer >= 6 And Layer <= 10 Then
        Mid50cm_N_Mass = Mid50cm_N_Mass + Soil.NitrateNContent(DOY, Layer) + Soil.AmmoniumNContent(DOY, Layer)
    End If
    If Layer >= 11 And Layer <= 15 Then
        Bottom50cm_N_Mass = Bottom50cm_N_Mass + Soil.NitrateNContent(DOY, Layer) + Soil.AmmoniumNContent(DOY, Layer)
    End If
Next Layer
N_Mass_Top50cm(DOY) = Top50cm_N_Mass * 10000 'convert kg/m2 to kg/ha
N_Mass_Mid50cm(DOY) = Mid50cm_N_Mass * 10000 'convert kg/m2 to kg/ha
N_Mass_Bottom50cm(DOY) = Bottom50cm_N_Mass * 10000 'convert kg/m2 to kg/ha

End Sub

Function SetAutoIrrigation(DOY As Integer, PAW As Boolean, CWSI As Boolean, NL As Integer, MAD As Double, MA_CWSI As Double, Refill As Boolean, Refill_Depth As Double) As Double
Dim PAW_Depletion_Today As Double
'Dim Top50cm_PAW_Depletion As Double 'Mingliang 4/17/2025
'Dim Mid50cm_PAW_Depletion As Double 'Mingliang 4/17/2025
'Dim Bottom50cm_PAW_Depletion As Double 'Mingliang 4/17/2025

Dim Top50cm_WC As Double 'Mingliang 4/17/2025
Dim Mid50cm_WC As Double 'Mingliang 4/17/2025
Dim Bottom50cm_WC As Double 'Mingliang 4/17/2025
Dim Layer As Integer
Dim Layer_Root_Fraction As Double
Dim Water_Depth_To_Refill As Double

Dim Wetted_Depth As Double
Dim Irrigation_Today As Double
Dim Today_CWSI As Double
Dim Water_Density As Double
Dim j As Integer
Water_Density = 1000 'kg/m3

'If PAW Then 'Mingliang 4/17/2025 This was moved below
'Mingliang 4/17/2025 BEGIN CHANGED SECTION
    PAW_Depletion_Today = 0
'    Top50cm_PAW_Depletion = 0
'    Mid50cm_PAW_Depletion = 0
'    Bottom50cm_PAW_Depletion = 0
    Water_Depth_To_Refill = 0
    Top50cm_WC = 0
    Mid50cm_WC = 0
    Bottom50cm_WC = 0
    For Layer = 1 To NL
        Layer_Root_Fraction = ET.RootFraction(Layer)
        'PAW_Depletion_Today is profile depletion prorated by fraction of roots in each layer
        PAW_Depletion_Today = PAW_Depletion_Today + (1 - (Water_Content(DOY, Layer) - PWP_Water_Content(Layer)) / (FC_Water_Content(Layer) - PWP_Water_Content(Layer))) * Layer_Root_Fraction
'        PAW_Depletion(DOY) = PAW_Depletion_Today
'        If Layer >= 2 And Layer <= 6 Then
'            Top50cm_PAW_Depletion = Top50cm_PAW_Depletion + (1 - (Water_Content(DOY, Layer) - PWP_Water_Content(Layer)) / (FC_Water_Content(Layer) - PWP_Water_Content(Layer))) * Layer_Root_Fraction 'Mingliang 4/17/2025
'        End If
'        If Layer >= 7 And Layer <= 11 Then
'            Mid50cm_PAW_Depletion = Mid50cm_PAW_Depletion + (1 - (Water_Content(DOY, Layer) - PWP_Water_Content(Layer)) / (FC_Water_Content(Layer) - PWP_Water_Content(Layer))) * Layer_Root_Fraction 'Mingliang 4/17/2025
'        End If
'        If Layer >= 12 And Layer <= 16 Then
'            Bottom50cm_PAW_Depletion = Bottom50cm_PAW_Depletion + (1 - (Water_Content(DOY, Layer) - PWP_Water_Content(Layer)) / (FC_Water_Content(Layer) - PWP_Water_Content(Layer))) * Layer_Root_Fraction 'Mingliang 4/17/2025
'        End If
        Water_Depth_To_Refill = Water_Depth_To_Refill + (FC_Water_Content(Layer) - Water_Content(DOY, Layer)) * Water_Density * Layer_Thickness(Layer)
        If Layer > 1 And Layer_Root_Fraction = 0 Then Layer = NL 'All layers with roots plus one extra layer are refilled. Leave the loop
    Next Layer
    
    For Layer = 1 To NL
        If Layer >= 2 And Layer <= 6 Then
            Top50cm_WC = Top50cm_WC + Water_Content(DOY, Layer)
        End If
        If Layer >= 7 And Layer <= 11 Then
            Mid50cm_WC = Mid50cm_WC + Water_Content(DOY, Layer)
        End If
        If Layer >= 12 And Layer <= 16 Then
            Bottom50cm_WC = Bottom50cm_WC + Water_Content(DOY, Layer)
        End If
    Next Layer
    PAW_Depletion(DOY) = PAW_Depletion_Today
    Water_Content_Top50cm(DOY) = Top50cm_WC / 5 'Average of five soil layers
    Water_Content_Mid50cm(DOY) = Mid50cm_WC / 5 'Average of five soil layers
    Water_Content_Bottom50cm(DOY) = Bottom50cm_WC / 5 'Average of five soil layers
'Mingliang 4/17/2025 END CHANGED SECTION
If PAW Then 'Mingliang 4/17/2025
    If PAW_Depletion_Today > MAD Then
        Irrigation_Today = Water_Depth_To_Refill
        Else
        Irrigation_Today = 0
    End If
End If
If CWSI Then
    Today_CWSI = ET.WaterStressIndex(DOY)
    If Today_CWSI > MA_CWSI Then
        Water_Depth_To_Refill = 0
        For Layer = 1 To NL
            Layer_Root_Fraction = ET.RootFraction(Layer)
            Water_Depth_To_Refill = Water_Depth_To_Refill + (FC_Water_Content(Layer) - Water_Content(DOY, Layer)) * Water_Density * Layer_Thickness(Layer)
            If Layer > 1 And Layer_Root_Fraction = 0 Then Layer = NL 'All layers with roots plus one extra layers are refilled. Leave the loop
        Next Layer
        Irrigation_Today = Water_Depth_To_Refill
    End If
End If
If Refill Then
    Water_Depth_To_Refill = 0
    Wetted_Depth = 0
    For Layer = 1 To NL
        Water_Depth_To_Refill = Water_Depth_To_Refill + (FC_Water_Content(Layer) - Water_Content(DOY, Layer)) * Water_Density * Layer_Thickness(Layer)
        Wetted_Depth = Wetted_Depth + Layer_Thickness(Layer)
        If Wetted_Depth > Refill_Depth Then
            Irrigation_Today = Water_Depth_To_Refill
            Layer = NL
        End If
    Next Layer
End If
SetAutoIrrigation = Irrigation_Today
End Function
Sub SoilTemperature(DOY As Integer)
Dim Average_Daily_Temperature As Double
Dim Amplitude As Double
Dim Time_Phase As Double
Dim Thermal_Conductivity As Double
Dim Volumetric_Specific_Heat_Mineral As Double
Dim Volumetric_Specific_Heat_Water As Double
Dim Mineral_Volumetric_Fraction As Double
Dim Water_Volumetric_Fraction As Double
Dim Soil_Volumetric_Specific_Heat As Double
Dim Thermal_Diffusivity As Double
Dim Angular_Frequency_s As Double
Dim Angular_Frequency_h As Double
Dim Damping_Depth As Double
Dim Soil_Temperature As Double
Dim Mean_Soil_Temperature As Double
Dim Max_Air_Temperature As Double
Dim Min_Air_Temperature As Double
Dim Node_Depth As Double
Dim Constant_Pi As Double
Dim Layer As Integer
Dim Hour As Integer
Dim Number_Of_Soil_Layers As Integer
Constant_Pi = 3.141592654

Time_Phase = 8
Max_Air_Temperature = ReadInputs.MaximumTemperature(DOY)
Min_Air_Temperature = ReadInputs.MinimumTemperature(DOY)
Average_Daily_Temperature = (Max_Air_Temperature + Min_Air_Temperature) / 2
Amplitude = (Max_Air_Temperature - Min_Air_Temperature) / 2
Thermal_Conductivity = 1.4 'J/(s m K)
Volumetric_Specific_Heat_Mineral = 2390000#
Volumetric_Specific_Heat_Water = 4180000#
Mineral_Volumetric_Fraction = 0.5
Water_Volumetric_Fraction = 0.2
Soil_Volumetric_Specific_Heat = Mineral_Volumetric_Fraction * Volumetric_Specific_Heat_Mineral + Water_Volumetric_Fraction * Volumetric_Specific_Heat_Water
Thermal_Diffusivity = Thermal_Conductivity / Soil_Volumetric_Specific_Heat
Angular_Frequency_h = (2 * Constant_Pi) / 24   ' 1/h  Angular Frequency Of The Oscillation
Angular_Frequency_s = Angular_Frequency_h / 3600 '1/h Angular Frequency Of The Oscillation
Damping_Depth = Sqr(2 * Thermal_Diffusivity / Angular_Frequency_s) 'm
Node_Depth = -0.05
Number_Of_Soil_Layers = 20 'Currently only calculating the temperature of the top 5 layers (~0.5 m)
For Layer = 1 To Number_Of_Soil_Layers
    Node_Depth = Node_Depth + Layer_Thickness(Layer)
    Mean_Soil_Temperature = 0
    For Hour = 1 To 24
        Soil_Temperature = Average_Daily_Temperature + Amplitude * Exp(-Node_Depth / Damping_Depth) * Sin(Angular_Frequency_h * (Hour - Time_Phase) - Node_Depth / Damping_Depth)
        Layer_Hourly_Soil_Temperature(Layer, Hour) = Soil_Temperature
        Mean_Soil_Temperature = Mean_Soil_Temperature + Soil_Temperature / 24
    Next Hour
    Layer_Daily_Soil_Temperature(Layer) = Mean_Soil_Temperature
Next Layer
End Sub

Private Function EquilibriumConcentration(ByVal Chemical_Mass As Double, _
  WC As Double, dz As Double, BD As Double, k As Double, Q As Double) As Double
 Const WD = 1000 'Water density (kg/m3)
 Dim Gravimetric_WC As Double, A As Double, B As Double, C As Double

Gravimetric_WC = WC * WD / BD
Chemical_Mass = Chemical_Mass / (dz * BD)
A = k * Gravimetric_WC
B = k * Q + Gravimetric_WC - k * Chemical_Mass
C = -Chemical_Mass
EquilibriumConcentration = (-B + Sqr(B * B - 4 * A * C)) / (2 * A)
End Function
Function WS(Sand As Double, Clay As Double) As Double
Dim Factor As Double
'Calculate saturation water content (m3/m3) using Saxton's pedotransfer function
WS = 0.332 - 0.0007251 * Sand + (Log(Clay) / Log(10)) * 0.1276
End Function
Function BD(Sand As Double, Clay As Double) As Double
Dim Saturation_WC As Double
'Calculate bulk density (Mg/m3)
'Calculate saturation water content (m3/m3) using Saxton's pedotransfer function
Saturation_WC = 0.332 - 0.0007251 * Sand + (Log(Clay) / Log(10)) * 0.1276
BD = 2.65 * (1 - Saturation_WC)
End Function
Function B(Sand As Double, Clay As Double) As Double
Dim B_value As Double
'Calculate b value
B_value = -(-3.14 - 0.00222 * Clay ^ 2 - 0.00003484 * Sand ^ 2 * Clay)
B = B_value
End Function
Function AE(Sand As Double, Clay As Double) As Double
'Calculate air entry potential
Dim Saturation_WC As Double
Dim A_Value As Double
Dim B_value As Double
Dim Air_Entry_Potential As Double
'Calculate saturation water content (m3/m3)
Saturation_WC = 0.332 - 0.0007251 * Sand + (Log(Clay) / Log(10)) * 0.1276
'Calculate a value
A_Value = 100 * Exp(-4.396 - 0.0715 * Clay - 0.000488 * Sand ^ 2 - 0.00004285 * Sand ^ 2 * Clay)
'Calculate b value
B_value = -(-3.14 - 0.00222 * Clay ^ 2 - 0.00003484 * Sand ^ 2 * Clay)
'Calculate Air Entry Potential
Air_Entry_Potential = -A_Value * Saturation_WC ^ (-B_value)
AE = Air_Entry_Potential
End Function
Function KS(Sand As Double, Clay As Double) As Double
'Calculate saturated hydraulic conductivity
Dim Factor As Double
Dim Saturation_WC As Double
Dim Ksat As Double
Const G = 9.81  'gravitational acceleration (m/s2)
Const Water_Density = 1000  ' (kg/m3)
'Calculate saturation water content (m3/m3)
Saturation_WC = 0.332 - 0.0007251 * Sand + (Log(Clay) / Log(10)) * 0.1276
'Calculate saturated hydraulic conductivity (kg s/m3)
Factor = Water_Density / (G * 100 * 3600) 'converts cm/h to Kg s / m3
Ksat = Factor * Exp(12.012 - 0.0755 * Sand + (-3.895 + 0.03671 * Sand - 0.1103 * Clay + 0.00087546 * Clay ^ 2) * (1 / Saturation_WC))
KS = Ksat
End Function
Function WPFC(Clay As Double, Silt As Double) As Double
'Calculate water potential at field capacity
Dim WP_At_FC As Double
WP_At_FC = -13.833 * Log(Clay) + 10.356
If Silt > 70 Then WP_At_FC = -33
If WP_At_FC > -10 Then WP_At_FC = -10
WPFC = WP_At_FC
End Function
Function WC(WS As Double, WP As Double, AE As Double, B As Double) As Double
'Calculate water content from water potential
WC = WS * (WP / AE) ^ (-1 / B)
End Function
Function WP(WS As Double, WC As Double, AE As Double, B As Double) As Double
'Calculate water potential from water content
WP = AE * (WC / WS) ^ (-B)
End Function
Function KSAP(B As Double, WS As Double, FC As Double, HTFC As Double) As Double
Const Gr = 9.81  'gravitational acceleration (m/s2)
Const WD = 1000  'water density (kg/m3)
Const dz = 0.05 'soil thickness (m()
Dim m As Double
m = 2 * B + 3
KSAP = dz * WD * WS ^ m * (FC ^ (1 - m) - WS ^ (1 - m)) _
                    / (Gr * HTFC * 3600 * (m - 1))
End Function
Function k(KS As Double, AE As Double, B As Double, WP As Double) As Double
'Calculate hydraulic conductivity as a function of water potential
Dim n As Double
n = 2 + 3 / B
k = KS * (AE / WP) ^ n
End Function

Property Get LayerThickness(Layer As Integer) As Double
LayerThickness = Layer_Thickness(Layer)
End Property
Property Get WaterContent(DOY As Integer, Layer As Integer) As Double
WaterContent = Water_Content(DOY, Layer)
End Property
Property Let WaterContent(DOY As Integer, Layer As Integer, Update As Double)
Water_Content(DOY, Layer) = Update
End Property
Property Get WaterFilledPorosity(DOY As Integer, Layer As Integer) As Double
WaterFilledPorosity = Water_Filled_Porosity(DOY, Layer)
End Property
Property Let WaterFilledPorosity(DOY As Integer, Layer As Integer, Update As Double)
Water_Filled_Porosity(DOY, Layer) = Update
End Property
Property Get NitrateNContent(DOY As Integer, Layer As Integer) As Double
NitrateNContent = Nitrate_N_Content(DOY, Layer)
End Property
Property Let NitrateNContent(DOY As Integer, Layer As Integer, Update As Double)
Nitrate_N_Content(DOY, Layer) = Update
End Property
Property Get AmmoniumNContent(DOY As Integer, Layer As Integer) As Double
AmmoniumNContent = Ammonium_N_Content(DOY, Layer)
End Property
Property Let AmmoniumNContent(DOY As Integer, Layer As Integer, Update As Double)
Ammonium_N_Content(DOY, Layer) = Update
End Property
Property Get NumberModelLayers() As Integer
NumberModelLayers = Number_Model_Layers
End Property
Property Get FractionOfClay(Layer As Integer) As Double
FractionOfClay = Fraction_Of_Clay(Layer)
End Property
Property Get FractionOfSand(Layer As Integer) As Double
FractionOfSand = Fraction_Of_Sand(Layer)
End Property
Property Get FractionOfSilt(Layer As Integer) As Double
FractionOfSilt = Fraction_Of_Silt(Layer)
End Property
Property Get AirEntryPotential(Layer As Integer) As Double
AirEntryPotential = Air_Entry_Potential(Layer)
End Property
Property Get Bvalue(Layer As Integer) As Double
Bvalue = B_value(Layer)
End Property
Property Get WPAtFC(Layer As Integer) As Double
WPAtFC = WP_At_FC(Layer)
End Property
Property Get WPAtPWP(Layer As Integer) As Double
WPAtPWP = WP_At_PWP(Layer)
End Property
Property Get BulkDensity(Layer As Integer) As Double
BulkDensity = Bulk_Density(Layer)
End Property
Property Get SaturationWaterContent(Layer As Integer) As Double
SaturationWaterContent = Saturation_Water_Content(Layer)
End Property
'Property Get SoilWaterPotential(Layer As Integer) As Double
'SoilWaterPotential = Soil_Water_Potential(Layer)
'End Property
Property Get SoilWaterPotential(DOY As Integer, Layer As Integer) As Double
SoilWaterPotential = Soil_Water_Potential(DOY, Layer)
End Property
Property Let SoilWaterPotential(DOY As Integer, Layer As Integer, Update As Double)
Soil_Water_Potential(DOY, Layer) = Update
End Property

'
'Property Let SoilWaterPotential(Layer As Integer, Update As Double)
'Soil_Water_Potential(Layer) = Update
'End Property
Property Get FCWaterContent(Layer As Integer) As Double
FCWaterContent = FC_Water_Content(Layer)
End Property
Property Get PWPWaterContent(Layer As Integer) As Double
PWPWaterContent = PWP_Water_Content(Layer)
End Property
Property Get SoilOrganicCarbon(DOY As Integer, Layer As Integer) As Double
SoilOrganicCarbon = Soil_Organic_Carbon(DOY, Layer)
End Property
Property Let SoilOrganicCarbon(DOY As Integer, Layer As Integer, Update As Double)
Soil_Organic_Carbon(DOY, Layer) = Update
End Property
Property Get SoilOrganicNitrogen(DOY As Integer, Layer As Integer) As Double
SoilOrganicNitrogen = Soil_Organic_Nitrogen(DOY, Layer)
End Property
Property Let SoilOrganicNitrogen(DOY As Integer, Layer As Integer, Update As Double)
Soil_Organic_Nitrogen(DOY, Layer) = Update
End Property
Property Get NLeaching(DOY As Integer) As Double
NLeaching = N_Leaching(DOY)
End Property
Property Get CumulativeNLeaching() As Double
CumulativeNLeaching = Cumulative_N_Leaching
End Property
Property Let CumulativeNLeaching(Update As Double)
Cumulative_N_Leaching = Update
End Property
Property Get DeepDrainage(DOY As Integer) As Double
DeepDrainage = Deep_Drainage(DOY)
End Property
Property Get CumulativeDeepDrainage() As Double
CumulativeDeepDrainage = Cumulative_Deep_Drainage
End Property
Property Let CumulativeDeepDrainage(Update As Double)
Cumulative_Deep_Drainage = Update
End Property
Property Get SimulationTotalNLeaching() As Double
SimulationTotalNLeaching = Simulation_Total_N_Leaching
End Property
Property Let SimulationTotalNLeaching(Update As Double)
Simulation_Total_N_Leaching = Update
End Property
Property Get SimulationTotalDeepDrainage() As Double
SimulationTotalDeepDrainage = Simulation_Total_Deep_Drainage
End Property
Property Let SimulationTotalDeepDrainage(Update As Double)
Simulation_Total_Deep_Drainage = Update
End Property
Property Get CumulativeIrrigation() As Double
CumulativeIrrigation = Cumulative_Irrigation
End Property
Property Let CumulativeIrrigation(Update As Double)
Cumulative_Irrigation = Update
End Property
Property Get SimulationTotalIrrigation() As Double
SimulationTotalIrrigation = Simulation_Total_Irrigation
End Property
Property Let SimulationTotalIrrigation(Update As Double)
Simulation_Total_Irrigation = Update
End Property
Property Get CumulativeFertilization() As Double
CumulativeFertilization = Cumulative_Fertilization
End Property
Property Let CumulativeFertilization(Update As Double)
Cumulative_Fertilization = Update
End Property
Property Get SimulationTotalFertilization() As Double
SimulationTotalFertilization = Simulation_Total_Fertilization
End Property
Property Let SimulationTotalFertilization(Update As Double)
Simulation_Total_Fertilization = Update
End Property
Property Get FertilizationRate(DOY As Integer) As Double
FertilizationRate = Fertilization_Rate(DOY)
End Property
Property Get ProfileNitrateNContent(DOY As Integer) As Double
ProfileNitrateNContent = Profile_Nitrate_N_Content(DOY)
End Property
Property Get ProfileAmmoniumNContent(DOY As Integer) As Double
ProfileAmmoniumNContent = Profile_Ammonium_N_Content(DOY)
End Property
Property Get ChemicalBalance(DOY As Integer) As Double
ChemicalBalance = Chemical_Balance(DOY)
End Property
Property Get WaterBalance(DOY As Integer) As Double
WaterBalance = Water_Balance(DOY)
End Property
Property Get LayerDailySoilTemperature(Layer As Integer) As Double
LayerDailySoilTemperature = Layer_Daily_Soil_Temperature(Layer)
End Property
Property Get LayerHourlySoilTemperature(Layer As Integer, Hour As Integer) As Double
LayerHourlySoilTemperature = Layer_Hourly_Soil_Temperature(Layer, Hour)
End Property
Property Get AutoIrrigation() As Boolean
AutoIrrigation = Auto_Irrigation
End Property
Property Let AutoIrrigation(Update As Boolean)
Auto_Irrigation = Update
End Property
Property Get PAWDepletion(DOY As Integer) As Double
PAWDepletion = PAW_Depletion(DOY)
End Property
Property Get WaterContentTop50cm(DOY As Integer) As Double 'NEW Mingliang 4/17/2025
WaterContentTop50cm = Water_Content_Top50cm(DOY)
End Property
Property Get WaterContentMid50cm(DOY As Integer) As Double 'NEW Mingliang 4/17/2025
WaterContentMid50cm = Water_Content_Mid50cm(DOY)
End Property
Property Get WaterContentBottom50cm(DOY As Integer) As Double 'NEW Mingliang 4/17/2025
WaterContentBottom50cm = Water_Content_Bottom50cm(DOY)
End Property
Property Get NMassTop50cm(DOY As Integer) As Double 'NEW Mingliang
NMassTop50cm = N_Mass_Top50cm(DOY)
End Property
Property Get NMassMid50cm(DOY As Integer) As Double 'NEW Mingliang
NMassMid50cm = N_Mass_Mid50cm(DOY)
End Property
Property Get NMassBottom50cm(DOY As Integer) As Double 'NEW Mingliang
NMassBottom50cm = N_Mass_Bottom50cm(DOY)
End Property
