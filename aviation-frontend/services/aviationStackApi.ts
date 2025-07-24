const API_BASE_URL = 'http://api.aviationstack.com/v1';
const API_KEY = process.env.EXPO_PUBLIC_AVIATIONSTACK_API_KEY;

export interface FlightData {
  flight_date: string;
  flight_status: string;
  departure: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    delay?: number;
    scheduled: string;
    estimated?: string;
    actual?: string;
    estimated_runway?: string;
    actual_runway?: string;
  };
  arrival: {
    airport: string;
    timezone: string;
    iata: string;
    icao: string;
    terminal?: string;
    gate?: string;
    baggage?: string;
    delay?: number;
    scheduled: string;
    estimated?: string;
    actual?: string;
    estimated_runway?: string;
    actual_runway?: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  flight: {
    number: string;
    iata: string;
    icao: string;
    codeshared?: any;
  };
  aircraft: {
    registration: string;
    iata: string;
    icao: string;
    icao24: string;
  };
  live?: {
    updated: string;
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
  };
}

export class AviationStackService {
  static async getFlightByNumber(flightNumber: string): Promise<FlightData | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/flights?access_key=${API_KEY}&flight_iata=${flightNumber}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        return data.data[0];
      }
      
      return null;
    } catch (error) {
      console.error('AviationStack API error:', error);
      return null;
    }
  }

  static async getFlightsByRoute(departure: string, arrival: string): Promise<FlightData[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/flights?access_key=${API_KEY}&dep_iata=${departure}&arr_iata=${arrival}&limit=10`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('AviationStack API error:', error);
      return [];
    }
  }

  static async getAirportInfo(airportCode: string) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/airports?access_key=${API_KEY}&iata_code=${airportCode}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data?.[0] || null;
    } catch (error) {
      console.error('AviationStack API error:', error);
      return null;
    }
  }

  static calculateFlightDuration(departure: string, arrival: string): number {
    try {
      const depTime = new Date(departure);
      const arrTime = new Date(arrival);
      const diffMs = arrTime.getTime() - depTime.getTime();
      return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // Hours with 1 decimal
    } catch (error) {
      return 0;
    }
  }
}