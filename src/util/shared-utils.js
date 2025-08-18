export const merterToAcre = 4046.86;

export const globalUnits = {
  "English": {
    "length": "in",
    "area": "lb/acre",
    "temperature": "°F",
    "speed": "mph",
    "depth": "ft",
  },
  "Metric": {
    "length": "mm",
    "area": "kg/ha",
    "temperature": "°C",
    "speed": "kmph",
    "depth": "m",
  }
};
export const convertSqMeterAcre = (areaSqMtr) => {
  return areaSqMtr / merterToAcre;
};

// Convert inches to meters
export const convertInchesToMeters = (inches) => {
  const parsed = parseFloat(inches);
  if (isNaN(parsed)) return 0;
  return +(parsed * 0.0254).toFixed(5); // 5 decimal places
};


// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const toRadians = (degree) => (degree * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find the 10 nearest weather stations
export const findNearestStations = (selectedStation, allStations) => {
  const distances = allStations.map((station) => ({
    ...station,
    distance: calculateDistance(selectedStation[0], selectedStation[1], station.lat, station.lng),
  }));
  return distances.sort((a, b) => a.distance - b.distance).slice(0, 10);
};

// Get date in yyyy-mm-dd
export const getCustomDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
// Convert date yyyy-mm-dd to yyyy/mm/dd
export const getCustomDateForSimulation = (date) => {
  date = new Date(date.replace(/-/g, "/"));
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
// Convert date yyyy-mm-dd to yyyy/mm/dd
export const getCurrentDateForSimulation = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
   
export const getCustomDateForTasks = (date, baseYear = new Date().getFullYear()) => {
  if (typeof date === "number") {
    // Convert DOY to Date
    const baseDate = new Date(baseYear, 0); // Jan 1
    baseDate.setDate(date);
    return baseDate; // return actual Date object
  }

  // Handle ISO string input
  if (typeof date === "string") {
    const parsed = new Date(date);
    if (!isNaN(parsed)) return parsed;
  }

  return new Date("1970-01-01"); // fallback to avoid crashes
};


// Get day of the year fro dates

export const getDayOfYear = (date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay) + 1;
}
// Get frequency strat and end date
export const getFrequencyDates = (frequency) => {
  const today = new Date();
  const endDate = new Date(today);

  let startDate = new Date(today);
  switch ((frequency || "").toUpperCase().trim()) {
    case "7D":
      startDate.setDate(today.getDate() - 7);
      break;    
    case "1M":
      startDate.setMonth(today.getMonth() - 1);
      break;
    case "6M":
      startDate.setMonth(today.getMonth() - 6);
      break;
    case "1Y":
      startDate.setFullYear(today.getFullYear() - 1);
      break;
    default:
      throw new Error("invalid date");
  }
  return {
    startDate: getCustomDate(startDate),
    endDate: getCustomDate(endDate),
  };
}
// Get frequency strat and end date for simulation output
export const getFrequencyDatesForSimulation = (frequency, customStartDate) => {
  const today = new Date(customStartDate);
  const endDate = new Date(today);

  let startDate = new Date(today);
  switch ((frequency || "").toUpperCase().trim()) {
    case "7D":
      endDate.setDate(today.getDate() + 7);
      break;    
    default:
      throw new Error("invalid date");
  }
  return {
    startDate: getCustomDate(startDate),
    endDate: getCustomDate(endDate),
  };
}
//  Convert DOY (Day of Year) to mm/dd/yyyy format
export const convertDOYToDate = (year, doy) => {
  if (!doy) return "N/A"; // Handle missing values

  const date = new Date(year, 0); // Start of the year (January 1st)
  date.setDate(doy); // Add DOY days to it
  return date.toLocaleDateString("en-US", { timeZone: "UTC" }); // Convert to mm/dd/yyyy
};

export const dropDownOptions = [
  { value: "7D", label: "7 Days" },
  // { value: "+7D", label: "7 Days" },
  { value: "1M", label: "1 Month" },
  { value: "6M", label: "6 Months" },
  { value: "1Y", label: "1 Year" },
  { value: "Custom", label: "Custom Date" },
];
