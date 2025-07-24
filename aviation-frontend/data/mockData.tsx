export interface FlightLog {
  id: string;
  date: string;
  flightNumber: string;
  aircraft: string;
  registration: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  flightTime: number;
  pic: number;
  sic: number;
  solo: number;
  dualReceived: number;
  dualGiven: number;
  crossCountry: number;
  night: number;
  instrument: number;
  dayLandings: number;
  nightLandings: number;
  remarks: string;
}

export interface ScheduledFlight {
  id: string;
  flightNumber: string;
  date: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  aircraft: string;
  crew: string[];
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  details: string;
  ipAddress: string;
}

export const mockFlightLogs: FlightLog[] = [
  {
    id: '1',
    date: '2024-01-15',
    flightNumber: 'AA1234',
    aircraft: 'Boeing 737-800',
    registration: 'N123AA',
    departure: 'JFK',
    arrival: 'LAX',
    departureTime: '08:30',
    arrivalTime: '11:45',
    flightTime: 5.25,
    pic: 5.25,
    sic: 0,
    solo: 0,
    dualReceived: 0,
    dualGiven: 0,
    crossCountry: 5.25,
    night: 0,
    instrument: 2.1,
    dayLandings: 1,
    nightLandings: 0,
    remarks: 'Normal flight, good weather'
  },
  {
    id: '2',
    date: '2024-01-16',
    flightNumber: 'AA5678',
    aircraft: 'Boeing 737-800',
    registration: 'N456AA',
    departure: 'LAX',
    arrival: 'ORD',
    departureTime: '14:20',
    arrivalTime: '20:15',
    flightTime: 3.92,
    pic: 3.92,
    sic: 0,
    solo: 0,
    dualReceived: 0,
    dualGiven: 0,
    crossCountry: 3.92,
    night: 1.5,
    instrument: 1.8,
    dayLandings: 0,
    nightLandings: 1,
    remarks: 'IFR flight, minor turbulence'
  },
  {
    id: '3',
    date: '2024-01-17',
    flightNumber: 'AA9012',
    aircraft: 'Airbus A320',
    registration: 'N789AA',
    departure: 'ORD',
    arrival: 'MIA',
    departureTime: '09:10',
    arrivalTime: '13:30',
    flightTime: 4.33,
    pic: 0,
    sic: 4.33,
    solo: 0,
    dualReceived: 0,
    dualGiven: 0,
    crossCountry: 4.33,
    night: 0,
    instrument: 3.2,
    dayLandings: 1,
    nightLandings: 0,
    remarks: 'Type rating check ride - passed'
  }
];

export const mockScheduledFlights: ScheduledFlight[] = [
  {
    id: '1',
    flightNumber: 'AA2468',
    date: '2024-01-20',
    departure: 'MIA',
    arrival: 'JFK',
    departureTime: '07:30',
    arrivalTime: '10:45',
    aircraft: 'Boeing 737-800',
    crew: ['John Smith', 'Sarah Johnson'],
    status: 'confirmed'
  },
  {
    id: '2',
    flightNumber: 'AA1357',
    date: '2024-01-21',
    departure: 'JFK',
    arrival: 'BOS',
    departureTime: '15:20',
    arrivalTime: '16:35',
    aircraft: 'Airbus A320',
    crew: ['John Smith', 'Mike Wilson'],
    status: 'scheduled'
  },
  {
    id: '3',
    flightNumber: 'AA8642',
    date: '2024-01-22',
    departure: 'BOS',
    arrival: 'DCA',
    departureTime: '11:15',
    arrivalTime: '12:50',
    aircraft: 'Boeing 737-800',
    crew: ['John Smith', 'Lisa Chen'],
    status: 'scheduled'
  }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-01-18 14:30:25',
    userId: '1',
    action: 'Flight Log Created',
    details: 'Added flight AA9012 from ORD to MIA',
    ipAddress: '192.168.1.100'
  },
  {
    id: '2',
    timestamp: '2024-01-18 10:15:42',
    userId: '1',
    action: 'Profile Updated',
    details: 'Updated contact information',
    ipAddress: '192.168.1.100'
  },
  {
    id: '3',
    timestamp: '2024-01-17 16:45:18',
    userId: '1',
    action: 'Flight Log Modified',
    details: 'Updated remarks for flight AA5678',
    ipAddress: '192.168.1.100'
  }
];

export const flightTrends = {
  monthlyHours: [
    { month: 'Sep', hours: 85 },
    { month: 'Oct', hours: 92 },
    { month: 'Nov', hours: 78 },
    { month: 'Dec', hours: 95 },
    { month: 'Jan', hours: 88 }
  ],
  aircraftTypes: [
    { type: 'Boeing 737', hours: 180, percentage: 45 },
    { type: 'Airbus A320', hours: 120, percentage: 30 },
    { type: 'Boeing 777', hours: 80, percentage: 20 },
    { type: 'Other', hours: 20, percentage: 5 }
  ],
  flightPhases: {
    day: 65,
    night: 25,
    instrument: 35,
    crossCountry: 90
  }
};