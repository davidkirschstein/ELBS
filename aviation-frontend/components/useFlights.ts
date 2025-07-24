// components/useFlights.ts

import { useState, useEffect } from 'react';

interface Flight {
  id: number;
  flight_iata: string;
  flight_date: string;
  departure_iata: string;
  arrival_iata: string;
  departure_scheduled: string;
  arrival_scheduled: string;
  airline_iata: string;
  duration_hours: number;
  flight_status: string;
  departure_airport: string;
  arrival_airport: string;
  departure_terminal?: string;
  departure_gate?: string;
  arrival_terminal?: string;
  arrival_gate?: string;
}

interface UseFlightsReturn {
  flights: Flight[];
  loading: boolean;
  searchLoading: boolean;
  searchMode: boolean;
  fetchFlightsByDate: (date: Date) => Promise<void>;
  searchFlights: (flightNumber: string, date: Date) => Promise<void>;
  resetSearch: () => void;
}

export const useFlights = (initialDate: Date): UseFlightsReturn => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const processFlightData = (flightData: any) => {
    if (!flightData) {
      setFlights([]);
      return;
    }

    const dataArray = Array.isArray(flightData) ? flightData : [flightData];
    const terminals = ['1', '2', '3', '4', '5'];
    const gates = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
    
    const flightsWithDetails = dataArray.map((flight) => {
      let durationHours = flight.duration_hours;
      if (typeof durationHours === 'string') {
        durationHours = parseFloat(durationHours);
      }
      
      if (isNaN(durationHours)) {
        durationHours = 0;
      }
      
      return {
        ...flight,
        duration_hours: durationHours,
        departure_terminal: flight.departure_terminal || terminals[Math.floor(Math.random() * terminals.length)],
        departure_gate: flight.departure_gate || gates[Math.floor(Math.random() * gates.length)],
        arrival_terminal: flight.arrival_terminal || terminals[Math.floor(Math.random() * terminals.length)],
        arrival_gate: flight.arrival_gate || gates[Math.floor(Math.random() * gates.length)],
        departure_airport: flight.departure_airport || `${flight.departure_iata} Airport`,
        arrival_airport: flight.arrival_airport || `${flight.arrival_iata} Airport`,
      };
    });
    
    setFlights(flightsWithDetails);
  };

  const fetchFlightsByDate = async (date: Date) => {
    try {
      setLoading(true);
      const formattedDate = formatDate(date);
      const data = await FlightApi.getFlightsByDate(formattedDate);
      processFlightData(data);
    } catch (error) {
      console.error('Error fetching flights:', error);
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const searchFlights = async (flightNumber: string, date: Date) => {
    const validatedFlightNumber = flightNumber.trim().toUpperCase();
    
    if (!validatedFlightNumber) {
      throw new Error('Please enter a flight number');
    }
    
    if (!/^[A-Z]{2}\d+$/.test(validatedFlightNumber)) {
      throw new Error('Flight number must be in format AA1234');
    }

    try {
      setSearchLoading(true);
      const formattedDate = formatDate(date);
      const data = await FlightApi.searchFlight(validatedFlightNumber, formattedDate);
      processFlightData(data);
      setSearchMode(true);
    } catch (error) {
      console.error('Error searching flights:', error);
      throw error;
    } finally {
      setSearchLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchMode(false);
    fetchFlightsByDate(initialDate);
  };

  useEffect(() => {
    fetchFlightsByDate(initialDate);
  }, []);

  return {
    flights,
    loading,
    searchLoading,
    searchMode,
    fetchFlightsByDate,
    searchFlights,
    resetSearch
  };
};