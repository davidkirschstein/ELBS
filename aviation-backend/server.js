// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const db = require('./db');
require('dotenv').config();

// Initialize express first
const app = express();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Then use middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors()); // Enable CORS

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Create pilots table for authentication
const createPilotsTable = `
CREATE TABLE IF NOT EXISTS pilots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  license_number VARCHAR(50),
  license_type ENUM('PPL', 'CPL', 'ATPL', 'Student') DEFAULT 'PPL',
  total_hours DECIMAL(10,2) DEFAULT 0.00,
  role ENUM('pilot', 'admin') DEFAULT 'pilot',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE
);
`;

// Add to table creation logic
const createDetailedFlightsTable = `
CREATE TABLE IF NOT EXISTS detailed_flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_date DATE,
  flight_status VARCHAR(50),
  departure_airport VARCHAR(100),
  departure_iata VARCHAR(10),
  departure_icao VARCHAR(10),
  departure_scheduled DATETIME,
  arrival_airport VARCHAR(100),
  arrival_iata VARCHAR(10),
  arrival_icao VARCHAR(10),
  arrival_scheduled DATETIME,
  airline_name VARCHAR(100),
  airline_iata VARCHAR(10),
  flight_number VARCHAR(10),
  flight_iata VARCHAR(10),
  flight_icao VARCHAR(10),
  duration_hours DECIMAL(5,2),
  pilot_id INT,
  created_by INT,
  FOREIGN KEY (pilot_id) REFERENCES pilots(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES pilots(id) ON DELETE SET NULL
);
`;

db.query(createDetailedFlightsTable, (err) => {
  if (err) {
    console.error('❌ Error creating detailed_flights table:', err);
  } else {
    console.log('✅ detailed_flights table created or exists');
  }
});

// Define createAuditTable here before using it
const createAuditTable = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) DEFAULT 'system',
  user_name VARCHAR(255) DEFAULT 'System',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  details JSON,
  flight_details JSON
);
`;

const createBackupsTable = `
CREATE TABLE IF NOT EXISTS backups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  data JSON
);
`;

// Add after the existing table creation logic
const createPilotSchedulesTable = `
CREATE TABLE IF NOT EXISTS pilot_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pilot_id INT NOT NULL,
  flight_date DATE NOT NULL,
  flight_time TIME NOT NULL,
  flight_number VARCHAR(20) NOT NULL,
  flight_name VARCHAR(100),
  standby_time DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pilot_id) REFERENCES pilots(id) ON DELETE CASCADE
);
`;

db.query(createPilotSchedulesTable, (err) => {
  if (err) {
    console.error('❌ Error creating pilot_schedules table:', err);
  } else {
    console.log('✅ pilot_schedules table created or exists');
  }
});

// Create tables at startup
db.query(createPilotsTable, (err) => {
  if (err) {
    console.error('❌ Error creating pilots table:', err);
  } else {
    console.log('✅ pilots table created or exists');
  }
});

db.query(createAuditTable, (err) => {
  if (err) {
    console.error('❌ Error creating audit_logs table:', err);
  } else {
    console.log('✅ audit_logs table created or exists');
  }
});

db.query(createBackupsTable, (err) => {
  if (err) {
    console.error('❌ Error creating backups table:', err);
  } else {
    console.log('✅ backups table created or exists');
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Helper function to record audit logs
function recordAuditLog(action, entity, entityId, user = 'system', details = {}, flightDetails = null) {
  const auditLog = {
    action,
    entity,
    entity_id: entityId,
    user_id: user,
    user_name: user === 'system' ? 'System' : 'Pilot User',
    details: JSON.stringify(details),
    flight_details: flightDetails ? JSON.stringify(flightDetails) : null
  };

  const sql = `INSERT INTO audit_logs SET ?`;
  db.query(sql, auditLog, (err) => {
    if (err) {
      console.error('❌ Audit Log Error:', err.message);
    }
  });
}

// Helper function to safely parse numbers
const safeParseFloat = (value) => {
  if (typeof value === 'number') return value;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Helper function to process flight data into analytics
function processFlightAnalytics(flights) {
  if (!flights || flights.length === 0) {
    return {
      totalFlights: 0,
      totalHours: 0,
      averageFlightTime: 0,
      mostFrequentRoute: 'N/A',
      mostUsedAircraft: 'N/A',
      onTimePercentage: 0,
      monthlyTrend: generateEmptyMonthlyTrend(),
      aircraftBreakdown: [],
      routeAnalysis: [],
      statusDistribution: { scheduled: 0, active: 0, completed: 0, cancelled: 0 },
      timeDistribution: { day: 0, night: 0, ifr: 0, crossCountry: 0 },
      airlineAnalysis: []
    };
  }

  const totalFlights = flights.length;
  const totalHours = flights.reduce((sum, flight) => sum + safeParseFloat(flight.duration_hours), 0);
  const averageFlightTime = totalFlights > 0 ? totalHours / totalFlights : 0;

  // Route analysis
  const routeMap = new Map();
  flights.forEach(flight => {
    const route = `${flight.departure_iata || 'N/A'}-${flight.arrival_iata || 'N/A'}`;
    const duration = safeParseFloat(flight.duration_hours);
    
    if (routeMap.has(route)) {
      const existing = routeMap.get(route);
      routeMap.set(route, {
        frequency: existing.frequency + 1,
        totalDuration: existing.totalDuration + duration
      });
    } else {
      routeMap.set(route, {
        frequency: 1,
        totalDuration: duration
      });
    }
  });

  const routeAnalysis = Array.from(routeMap.entries())
    .map(([route, data]) => ({
      route,
      frequency: data.frequency,
      avgDuration: data.frequency > 0 ? data.totalDuration / data.frequency : 0
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  const mostFrequentRoute = routeAnalysis[0]?.route || 'N/A';

  // Aircraft/Airline analysis (using airline_iata as aircraft type)
  const aircraftMap = new Map();
  flights.forEach(flight => {
    const aircraft = flight.airline_iata || 'Unknown';
    const duration = safeParseFloat(flight.duration_hours);
    
    if (aircraftMap.has(aircraft)) {
      const existing = aircraftMap.get(aircraft);
      aircraftMap.set(aircraft, {
        count: existing.count + 1,
        hours: existing.hours + duration
      });
    } else {
      aircraftMap.set(aircraft, {
        count: 1,
        hours: duration
      });
    }
  });

  const aircraftBreakdown = Array.from(aircraftMap.entries())
    .map(([type, data]) => ({
      type,
      count: data.count,
      hours: data.hours,
      percentage: totalFlights > 0 ? (data.count / totalFlights) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const mostUsedAircraft = aircraftBreakdown[0]?.type || 'N/A';

  // Monthly trend analysis
  const monthlyTrend = generateMonthlyTrend(flights);

  // Status distribution
  const statusDistribution = {
    scheduled: flights.filter(f => f.flight_status === 'scheduled').length,
    active: flights.filter(f => f.flight_status === 'active').length,
    completed: flights.filter(f => f.flight_status === 'completed').length,
    cancelled: flights.filter(f => f.flight_status === 'cancelled').length
  };

  const onTimePercentage = totalFlights > 0 
    ? ((statusDistribution.completed + statusDistribution.active) / totalFlights) * 100 
    : 0;

  // Time distribution (estimated based on typical patterns)
  const timeDistribution = {
    day: Math.floor(totalHours * 0.75),
    night: Math.floor(totalHours * 0.25),
    ifr: Math.floor(totalHours * 0.40),
    crossCountry: Math.floor(totalHours * 0.60)
  };

  // Airline analysis
  const airlineAnalysis = Array.from(aircraftMap.entries())
    .map(([airline, data]) => ({
      airline,
      flights: data.count,
      reliability: 85 + Math.random() * 15 // Mock reliability score
    }))
    .sort((a, b) => b.flights - a.flights)
    .slice(0, 5);

  return {
    totalFlights,
    totalHours: parseFloat(totalHours.toFixed(2)),
    averageFlightTime: parseFloat(averageFlightTime.toFixed(2)),
    mostFrequentRoute,
    mostUsedAircraft,
    onTimePercentage: parseFloat(onTimePercentage.toFixed(1)),
    monthlyTrend,
    aircraftBreakdown,
    routeAnalysis,
    statusDistribution,
    timeDistribution,
    airlineAnalysis
  };
}

// Helper function to generate monthly trend data
function generateMonthlyTrend(flights) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDate = new Date();
  const monthlyData = new Map();

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = monthNames[date.getMonth()];
    
    monthlyData.set(monthKey, {
      month: monthName,
      flights: 0,
      hours: 0
    });
  }

  // Process actual flight data
  flights.forEach(flight => {
    if (flight.flight_date) {
      const flightDate = new Date(flight.flight_date);
      const monthKey = `${flightDate.getFullYear()}-${String(flightDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData.has(monthKey)) {
        const existing = monthlyData.get(monthKey);
        existing.flights += 1;
        existing.hours += safeParseFloat(flight.duration_hours);
      }
    }
  });

  // Convert to array and round hours
  return Array.from(monthlyData.values()).map(data => ({
    ...data,
    hours: Math.round(data.hours * 10) / 10 // Round to 1 decimal place
  }));
}

// Helper function for empty monthly trend
function generateEmptyMonthlyTrend() {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return monthNames.map(month => ({
    month,
    flights: 0,
    hours: 0
  }));
}

// ANALYTICS ENDPOINT
app.get('/analytics', authenticateToken, (req, res) => {
  try {
    console.log(`📊 Fetching analytics for user: ${req.user.email}`);

    const isAdmin = req.user.role === 'admin';

    // Base SQL query
    let sql = `SELECT * FROM detailed_flights`;
    const params = [];

    // If not admin, filter by created_by = current user id (pilot)
    if (!isAdmin) {
      sql += ` WHERE created_by = ?`;
      params.push(req.user.id);
    }

    sql += ` ORDER BY flight_date DESC`;

    db.query(sql, params, (err, flights) => {
      if (err) {
        console.error('❌ Database Error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      console.log(`✅ Processing analytics for ${flights.length} flights`);

      const analytics = processFlightAnalytics(flights);

      recordAuditLog(
        'analytics_viewed',
        'system',
        'analytics',
        req.user.email,
        { message: 'Analytics data requested', flightCount: flights.length }
      );

      res.json(analytics);
    });
  } catch (err) {
    console.error('❌ Analytics Error:', err);
    res.status(500).json({ message: 'Server error generating analytics' });
  }
});

// AUTHENTICATION ENDPOINTS

// Register new pilot
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, username, firstName, lastName, licenseNumber, licenseType } = req.body;

    // Validation
    if (!email || !password || !username || !firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, username, first name, and last name are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // for admin
    const adminEmails = ['admin@company.com']; // Configure admin emails
    const role = adminEmails.includes(email) ? 'admin' : 'pilot';

    // Check if pilot already exists
    const checkSql = 'SELECT id FROM pilots WHERE email = ? OR username = ?';
    db.query(checkSql, [email, username], async (checkErr, checkResults) => {
      if (checkErr) {
        console.error('❌ Database Error:', checkErr);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (checkResults.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Pilot with this email or username already exists' 
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new pilot
      const insertSql = `INSERT INTO pilots (email, password, username, first_name, last_name, license_number, license_type, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const values = [email, hashedPassword, username, firstName, lastName, licenseNumber || null, licenseType || 'PPL', role];

      db.query(insertSql, values, (insertErr, result) => {
        if (insertErr) {
          console.error('❌ Insert Error:', insertErr);
          return res.status(500).json({ success: false, message: 'Failed to create pilot account' });
        }

        // Record audit log
        recordAuditLog(
          'registered',
          'pilot',
          result.insertId,
          email,
          { message: 'New pilot account created' }
        );

        // Generate JWT token
        const token = jwt.sign(
          {
            id: result.insertId,
            email,
            username,
            firstName,
            lastName,
            role
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.status(201).json({
          success: true,
          message: 'Pilot account created successfully',
          token,
          pilot: {
            id: result.insertId,
            email,
            username,
            firstName,
            lastName,
            licenseNumber,
            licenseType: licenseType || 'PPL',
            role
          }
        });
      });
    });
  } catch (err) {
    console.error('❌ Registration Error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Login pilot
app.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find pilot by email
    const sql = 'SELECT * FROM pilots WHERE email = ? AND is_active = TRUE';
    db.query(sql, [email], async (err, results) => {
      if (err) {
        console.error('❌ Database Error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      const pilot = results[0];
      console.log('Login attempt:', { email, foundPilot: pilot });

      // Verify password
      const isValidPassword = await bcrypt.compare(password, pilot.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      // Update last login
      const updateLoginSql = 'UPDATE pilots SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
      db.query(updateLoginSql, [pilot.id], (updateErr) => {
        if (updateErr) {
          console.error('❌ Update Login Error:', updateErr);
        }
      });

      // Record audit log
      recordAuditLog(
        'login',
        'pilot',
        pilot.id,
        pilot.email,
        { message: 'Pilot logged in successfully' }
      );

      // Generate JWT token
      const token = jwt.sign(
        {
          id: pilot.id,
          email: pilot.email,
          username: pilot.username,
          firstName: pilot.first_name,
          lastName: pilot.last_name,
          role: pilot.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        pilot: {
          id: pilot.id,
          email: pilot.email,
          username: pilot.username,
          firstName: pilot.first_name,
          lastName: pilot.last_name,
          licenseNumber: pilot.license_number,
          licenseType: pilot.license_type,
          totalHours: pilot.total_hours,
          lastLogin: pilot.last_login,
          role: pilot.role
        }
      });
    });
  } catch (err) {
    console.error('❌ Login Error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Verify token endpoint
app.get('/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    pilot: {
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role
    }
  });
});

// Get current pilot profile
app.get('/auth/profile', authenticateToken, (req, res) => {
  try {
    const sql = 'SELECT id, email, username, first_name, last_name, license_number, license_type, total_hours, created_at, last_login, role FROM pilots WHERE id = ?';
    db.query(sql, [req.user.id], (err, results) => {
      if (err) {
        console.error('❌ Database Error:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'Pilot not found' });
      }

      const pilot = results[0];
      res.json({
        success: true,
        pilot: {
          id: pilot.id,
          email: pilot.email,
          username: pilot.username,
          firstName: pilot.first_name,
          lastName: pilot.last_name,
          licenseNumber: pilot.license_number,
          licenseType: pilot.license_type,
          totalHours: pilot.total_hours,
          createdAt: pilot.created_at,
          lastLogin: pilot.last_login,
          role: pilot.role
        }
      });
    });
  } catch (err) {
    console.error('❌ Profile Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Logout (client-side token removal, but we can log it)
app.post('/auth/logout', authenticateToken, (req, res) => {
  try {
    // Record audit log
    recordAuditLog(
      'logout',
      'pilot',
      req.user.id,
      req.user.email,
      { message: 'Pilot logged out' }
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    console.error('❌ Logout Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to format date consistently
const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};

// Helper function to check if date is in the future
const isFutureDate = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  today.setHours(0, 0, 0, 0);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate > today;
};

// Helper function to process AviationStack flight data
function processAviationStackFlight(flight, date) {
  const durationHours = flight.departure?.scheduled && flight.arrival?.scheduled
    ? (new Date(flight.arrival.scheduled) - new Date(flight.departure.scheduled)) / (1000 * 60 * 60)
    : 0;

  return {
    id: Math.floor(Math.random() * 1000000), // Generate random ID for frontend
    flight_date: date,
    flight_status: flight.flight_status || 'scheduled',
    departure_airport: flight.departure?.airport || `${flight.departure?.iata} Airport`,
    departure_iata: flight.departure?.iata || '',
    departure_icao: flight.departure?.icao || '',
    departure_scheduled: flight.departure?.scheduled || '',
    arrival_airport: flight.arrival?.airport || `${flight.arrival?.iata} Airport`,
    arrival_iata: flight.arrival?.iata || '',
    arrival_icao: flight.arrival?.icao || '',
    arrival_scheduled: flight.arrival?.scheduled || '',
    airline_name: flight.airline?.name || '',
    airline_iata: flight.airline?.iata || '',
    flight_number: flight.flight?.number || '',
    flight_iata: flight.flight?.iata || '',
    flight_icao: flight.flight?.icao || '',
    duration_hours: Math.abs(durationHours) || 0
  };
}

// Helper function to generate mock flight data when APIs fail
function generateMockFlights(date, count = 5) {
  const airlines = [
    { iata: 'AA', name: 'American Airlines' },
    { iata: 'DL', name: 'Delta Air Lines' },
    { iata: 'UA', name: 'United Airlines' },
    { iata: 'SW', name: 'Southwest Airlines' },
    { iata: 'BA', name: 'British Airways' }
  ];
  
  const airports = [
    { iata: 'JFK', name: 'John F. Kennedy International Airport' },
    { iata: 'LAX', name: 'Los Angeles International Airport' },
    { iata: 'ORD', name: 'Chicago O\'Hare International Airport' },
    { iata: 'DFW', name: 'Dallas/Fort Worth International Airport' },
    { iata: 'LHR', name: 'London Heathrow Airport' }
  ];

  const statuses = ['scheduled', 'active', 'completed', 'cancelled'];
  
  return Array.from({ length: count }, (_, i) => {
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const depAirport = airports[Math.floor(Math.random() * airports.length)];
    const arrAirport = airports[Math.floor(Math.random() * airports.length)];
    const flightNum = Math.floor(Math.random() * 9999) + 1;
    const depTime = new Date(`${date}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`);
    const duration = 2 + Math.random() * 8; // 2-10 hours
    const arrTime = new Date(depTime.getTime() + duration * 60 * 60 * 1000);
    
    return {
      id: i + 1,
      flight_date: date,
      flight_status: statuses[Math.floor(Math.random() * statuses.length)],
      departure_airport: depAirport.name,
      departure_iata: depAirport.iata,
      departure_icao: '',
      departure_scheduled: depTime.toISOString(),
      arrival_airport: arrAirport.name,
      arrival_iata: arrAirport.iata,
      arrival_icao: '',
      arrival_scheduled: arrTime.toISOString(),
      airline_name: airline.name,
      airline_iata: airline.iata,
      flight_number: flightNum.toString(),
      flight_iata: `${airline.iata}${flightNum}`,
      flight_icao: '',
      duration_hours: parseFloat(duration.toFixed(2))
    };
  });
}

// PROTECTED FLIGHT ENDPOINTS (require authentication)

app.get('/flights-by-date', authenticateToken, async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    console.log(`📅 Fetching flights for date: ${date} (User: ${req.user.email})`);

    // First check database
    const dbSql = `SELECT * FROM detailed_flights WHERE flight_date = ? ORDER BY departure_scheduled ASC`;
    
    db.query(dbSql, [date], async (err, results) => {
      if (err) {
        console.error('❌ Database Error:', err);
        // If database fails, return mock data
        console.log('🔄 Database failed, returning mock data');
        return res.json(generateMockFlights(date));
      }
      
      if (results && results.length > 0) {
        console.log(`✅ Found ${results.length} flights in database`);
        return res.json(results);
      }
      
      console.log('🔍 No flights in database, trying API...');
      
      // If no results in database, try to fetch from API
      try {
        let apiFlights = [];
        
        // Only try API if we have the API key
        if (process.env.API_KEY) {
          console.log('🌐 Fetching from AviationStack API...');
          const response = await axios.get(
            `http://api.aviationstack.com/v1/flights`,
            {
              params: {
                access_key: process.env.API_KEY,
                flight_date: date,
                limit: 10
              },
              timeout: 10000 // 10 second timeout
            }
          );
          
          if (response.data && response.data.data && response.data.data.length > 0) {
            apiFlights = response.data.data.map(flight => 
              processAviationStackFlight(flight, date)
            );
            console.log(`✅ Fetched ${apiFlights.length} flights from API`);
            
            // Save to database for future use
            apiFlights.forEach(flight => {
              const insertSql = `INSERT INTO detailed_flights SET ?`;
              db.query(insertSql, flight, (insertErr) => {
                if (insertErr) console.error('❌ Insert Error:', insertErr.message);
              });
            });
          }
        }
        
        // If API didn't return data or we don't have API key, use mock data
        if (apiFlights.length === 0) {
          console.log('🎭 API returned no data, using mock flights');
          apiFlights = generateMockFlights(date);
        }
        
        res.json(apiFlights);
        
      } catch (apiError) {
        console.error('❌ API Error:', apiError.message);
        console.log('🎭 API failed, returning mock data');
        // If API fails, return mock data
        res.json(generateMockFlights(date));
      }
    });
  } catch (err) {
    console.error('❌ Server Error:', err.message);
    // Even if everything fails, return mock data instead of error
    res.json(generateMockFlights(req.query.date || formatDate(new Date())));
  }
});

app.get('/search-flight', authenticateToken, async (req, res) => {
  try {
    const flight_iata = req.query.flight_iata;
    const date = req.query.date;
    
    if (!flight_iata || !date) {
      return res.status(400).json({ message: 'Flight IATA code and date are required' });
    }

    console.log(`🔍 Searching for flight: ${flight_iata} on ${date} (User: ${req.user.email})`);

    // First, check the database
    const dbSql = `
      SELECT * FROM detailed_flights 
      WHERE flight_iata = ? 
        AND flight_date = ?
      ORDER BY departure_scheduled ASC
    `;
    
    db.query(dbSql, [flight_iata, date], async (err, results) => {
      if (err) {
        console.error('❌ Database Error:', err);
        return res.json([]); // Return empty array instead of error
      }
      
      if (results && results.length > 0) {
        console.log(`✅ Found flight in database`);
        return res.json(results);
      }
      
      console.log('🔍 Flight not in database, trying API...');
      
      // If not found in database, try API
      try {
        if (process.env.API_KEY) {
          const airlineCode = flight_iata.substring(0, 2);
          const flightNumber = flight_iata.substring(2);
          
          const apiResponse = await axios.get(
            `http://api.aviationstack.com/v1/flights`,
            {
              params: {
                access_key: process.env.API_KEY,
                airline_iata: airlineCode,
                flight_number: flightNumber,
                limit: 1
              },
              timeout: 10000
            }
          );
          
          if (apiResponse.data && apiResponse.data.data && apiResponse.data.data.length > 0) {
            const flight = apiResponse.data.data[0];
            const flightData = processAviationStackFlight(flight, date);
            
            // Save to database
            const insertSql = `INSERT INTO detailed_flights SET ?`;
            db.query(insertSql, flightData, (insertErr) => {
              if (insertErr) console.error('❌ Insert Error:', insertErr.message);
            });
            
            console.log(`✅ Found flight via API`);
            return res.json([flightData]);
          }
        }
        
        console.log('❌ Flight not found');
        res.json([]);
        
      } catch (apiError) {
        console.error('❌ API Error:', apiError.message);
        res.json([]);
      }
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.json([]);
  }
});

// Save Flight Route
app.post('/save-flight', authenticateToken, (req, res) => {
  try {
    const flightData = req.body;
    const duration = parseFloat(flightData.duration_hours) || 0;

    const sql = `
      INSERT INTO detailed_flights (
        flight_iata, flight_icao, flight_date, flight_status,
        departure_airport, departure_iata, departure_icao, departure_scheduled,
        arrival_airport, arrival_iata, arrival_icao, arrival_scheduled,
        airline_name, airline_iata, duration_hours, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      flightData.flight_iata,
      flightData.flight_icao,
      flightData.flight_date,
      flightData.flight_status,
      flightData.departure_airport,
      flightData.departure_iata,
      flightData.departure_icao,
      flightData.departure_scheduled,
      flightData.arrival_airport,
      flightData.arrival_iata,
      flightData.arrival_icao,
      flightData.arrival_scheduled,
      flightData.airline_name,
      flightData.airline_iata,
      duration,
      req.user.id  // Track which user created this flight
    ];

    console.log('Saving flight:', values);

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('❌ Save Error:', err);
        return res.status(500).json({
          success: false,
          message: err.sqlMessage || 'Database error'
        });
      }

      // Record audit log for flight creation (optional)
      recordAuditLog(
        'created',
        'flight',
        result.insertId,
        req.user.email,
        { message: 'Flight saved to logbook' },
        {
          flight_iata: flightData.flight_iata,
          departure_iata: flightData.departure_iata,
          arrival_iata: flightData.arrival_iata,
          flight_date: flightData.flight_date,
          duration_hours: duration
        }
      );

      res.json({
        success: true,
        message: 'Flight saved successfully',
        id: result.insertId
      });
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + err.message
    });
  }
});

// Get Logs Route
app.get('/logs', authenticateToken, (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let sql = `
      SELECT 
        id, flight_iata, flight_date, 
        departure_iata, arrival_iata, 
        departure_scheduled, arrival_scheduled,
        airline_iata, duration_hours
      FROM detailed_flights
    `;

    const params = [];

    if (!isAdmin) {
      sql += ` WHERE created_by = ? `;
      params.push(req.user.id);
    }

    sql += ` ORDER BY flight_date DESC, departure_scheduled DESC`;

    console.log('Fetching logs with SQL:', sql);
    console.log('With params:', params);

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error('❌ Database Error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      console.log('✅ Fetched logs:', results);
      res.json(results);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Other existing endpoints (keep them protected)
app.get('/fetch-detailed-flights', authenticateToken, async (req, res) => {
  try {
    if (!process.env.API_KEY) {
      return res.status(400).json({ message: 'API key not configured' });
    }

    const response = await axios.get(`http://api.aviationstack.com/v1/flights?access_key=${process.env.API_KEY}`);
    const flights = response.data.data.slice(0, 5);

    for (const flight of flights) {
      const {
        flight_date,
        flight_status,
        departure,
        arrival,
        airline,
        flight: flightInfo,
      } = flight;

      const durationHours = departure?.scheduled && arrival?.scheduled
        ? (new Date(arrival.scheduled) - new Date(departure.scheduled)) / (1000 * 60 * 60)
        : null;

      const sql = `INSERT INTO detailed_flights (
        flight_date, flight_status,
        departure_airport, departure_iata, departure_icao, departure_scheduled,
        arrival_airport, arrival_iata, arrival_icao, arrival_scheduled,
        airline_name, airline_iata,
        flight_number, flight_iata, flight_icao, duration_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const values = [
        flight_date, flight_status,
        departure?.airport, departure?.iata, departure?.icao, departure?.scheduled,
        arrival?.airport, arrival?.iata, arrival?.icao, arrival?.scheduled,
        airline?.name, airline?.iata,
        flightInfo?.number, flightInfo?.iata, flightInfo?.icao,
        durationHours?.toFixed(2) || null
      ];

      db.query(sql, values, (err) => {
        if (err) console.error('❌ Insert Error:', err.sqlMessage);
      });
    }

    res.json({ message: '✅ Flights stored successfully' });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch flights' });
  }
});

app.get('/flight/:flightNumber', authenticateToken, async (req, res) => {
  try {
    const flightNumber = req.params.flightNumber;
    const sql = `SELECT * FROM detailed_flights WHERE flight_iata = ?`;
    
    db.query(sql, [flightNumber], (err, results) => {
      if (err) {
        console.error('❌ Database Error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Flight not found' });
      }
      
      res.json(results[0]);
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

function safeParse(data) {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.warn('⚠️ Failed to parse JSON:', data);
    return data;
  }
}

app.get('/audit-logs', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 20, filter = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `SELECT * FROM audit_logs`;
    let countQuery = `SELECT COUNT(*) as total FROM audit_logs`;

    // Apply filter
    const queryParams = [];
    if (filter !== 'all') {
      baseQuery += ` WHERE entity = ?`;
      countQuery += ` WHERE entity = ?`;
      queryParams.push(filter);
    }

    // Add ordering and pagination
    baseQuery += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
    queryParams.push(parseInt(limit), parseInt(offset));

    // Get total count
    db.query(countQuery, queryParams.slice(0, filter !== 'all' ? 1 : 0), (countErr, countResult) => {
      if (countErr) {
        console.error('❌ Count Error:', countErr);
        return res.status(500).json({ message: 'Database error' });
      }

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // Get paginated results
      db.query(baseQuery, queryParams, (err, results) => {
        if (err) {
          console.error('❌ Query Error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        // Safely parse JSON fields
        const logs = results.map(log => ({
          ...log,
          details: safeParse(log.details),
          flight_details: safeParse(log.flight_details)
        }));

        res.json({
          logs,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        });
      });
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/perform-backup', authenticateToken, (req, res) => {
  try {
    // Get all flights
    const flightsSql = `SELECT * FROM detailed_flights`;
    
    db.query(flightsSql, (err, flights) => {
      if (err) {
        console.error('❌ Backup Error:', err);
        return res.status(500).json({ success: false, message: 'Backup failed' });
      }
      
      const backupData = {
        flights,
        timestamp: new Date().toISOString(),
        backupType: 'manual'
      };
      
      // Save to backups table or file system (simulated)
      const backupSql = `INSERT INTO backups SET ?`;
      db.query(backupSql, { data: JSON.stringify(backupData) }, (backupErr) => {
        if (backupErr) {
          console.error('❌ Backup Save Error:', backupErr);
          return res.status(500).json({ success: false, message: 'Backup failed' });
        }
        
        // Record audit log for backup
        recordAuditLog(
          'backup',
          'system',
          'backup',
          req.user.email,
          { message: 'Manual backup performed' }
        );
        
        res.json({ success: true, message: 'Backup completed successfully' });
      });
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper function to send notification
function sendScheduleNotification(pilot, schedule) {
  console.log(`📬 Sending notification to pilot ${pilot.email}`);
  console.log(`✈️ Flight ${schedule.flight_number} on ${schedule.flight_date} at ${schedule.flight_time}`);
  // In a real implementation, this would send email/push notification
  recordAuditLog(
    'notification_sent',
    'pilot',
    pilot.id,
    'system',
    { 
      message: 'Scheduling notification sent',
      flight: schedule.flight_number,
      date: schedule.flight_date,
      time: schedule.flight_time
    }
  );
}

// Upload and process schedule file
app.post('/upload-schedule', authenticateToken, upload.single('scheduleFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;
    const results = [];

    // Process CSV file
    if (fileType === 'text/csv') {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          fs.unlinkSync(filePath); // Remove temp file
          await processScheduleData(results, req.user);
          res.json({ success: true, message: `Processed ${results.length} schedules` });
        });
    } 
    // Process PDF file (stub implementation)
    else if (fileType === 'application/pdf') {
      // In real implementation, use a PDF parsing library
      console.log('PDF processing would be implemented here');
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'PDF processing would be implemented in production' });
    } 
    else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: 'Unsupported file type' });
    }
  } catch (err) {
    console.error('❌ Upload Error:', err);
    res.status(500).json({ success: false, message: 'File processing failed' });
  }
});

async function processScheduleData(data, user) {
  for (const row of data) {
    try {
      const { name, email, flightDate, flightTime, flightNumber, flightName, standbyTime } = row;
      
      // Find pilot by name or email
      const pilotSql = `SELECT id FROM pilots WHERE email = ? OR username = ?`;
      const [pilot] = await db.promise().query(pilotSql, [email, name]);
      
      if (pilot.length > 0) {
        const scheduleData = {
          pilot_id: pilot[0].id,
          flight_date: flightDate,
          flight_time: flightTime,
          flight_number: flightNumber,
          flight_name: flightName,
          standby_time: standbyTime || null
        };
        
        // Save to database
        const insertSql = `INSERT INTO pilot_schedules SET ?`;
        await db.promise().query(insertSql, scheduleData);
        
        // Send notification
        sendScheduleNotification(pilot[0], scheduleData);
        
        recordAuditLog(
          'schedule_created',
          'pilot_schedule',
          pilot[0].id,
          user.email,
          { 
            message: 'Schedule created from uploaded file',
            flight: flightNumber,
            date: flightDate
          }
        );
      }
    } catch (err) {
      console.error('❌ Schedule Processing Error:', err);
    }
  }
}

// New endpoint to get schedules
app.get('/pilot-schedules', authenticateToken, (req, res) => {
  const sql = `SELECT * FROM pilot_schedules WHERE pilot_id = ? ORDER BY flight_date, flight_time`;
  db.query(sql, [req.user.id], (err, results) => {
    if (err) {
      console.error('❌ Database Error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(results);
  });
});

// Schedule notification job (runs every hour)
setInterval(() => {
  console.log('⏰ Checking for upcoming flights...');
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  
  const sql = `
    SELECT ps.*, p.email, p.username 
    FROM pilot_schedules ps
    JOIN pilots p ON ps.pilot_id = p.id
    WHERE ps.standby_time BETWEEN ? AND ?
  `;
  
  db.query(sql, [now, oneHourLater], (err, results) => {
    if (err) {
      console.error('❌ Notification Error:', err);
      return;
    }
    
    results.forEach(schedule => {
      console.log(`🔔 Sending standby reminder for ${schedule.flight_number}`);
      sendScheduleNotification({
        id: schedule.pilot_id,
        email: schedule.email,
        username: schedule.username
      }, schedule);
    });
  });
}, 60 * 60 * 1000); // Run every hour

// Create uploads directory if it doesn't exist
const path = require('path');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Database connection: ${db ? '✅ Connected' : '❌ Not connected'}`);
  console.log(`🔑 API Key: ${process.env.API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📈 Analytics endpoint: ✅ Available at /analytics`);
  console.log(`📁 Uploads directory: ✅ ${uploadsDir}`);
});










// // server.js
// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const db = require('./db');
// require('dotenv').config();

// // Initialize express first
// const app = express();

// // Then use middleware
// app.use(express.json()); // Parse JSON bodies
// app.use(cors()); // Enable CORS

// const PORT = process.env.PORT || 5000;
// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// // Create pilots table for authentication
// const createPilotsTable = `
// CREATE TABLE IF NOT EXISTS pilots (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   email VARCHAR(255) UNIQUE NOT NULL,
//   password VARCHAR(255) NOT NULL,
//   username VARCHAR(100) UNIQUE NOT NULL,
//   first_name VARCHAR(100) NOT NULL,
//   last_name VARCHAR(100) NOT NULL,
//   license_number VARCHAR(50),
//   license_type ENUM('PPL', 'CPL', 'ATPL', 'Student') DEFAULT 'PPL',
//   total_hours DECIMAL(10,2) DEFAULT 0.00,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//   last_login TIMESTAMP NULL,
//   is_active BOOLEAN DEFAULT TRUE
// );
// `;

// // Define createAuditTable here before using it
// const createAuditTable = `
// CREATE TABLE IF NOT EXISTS audit_logs (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   action VARCHAR(50) NOT NULL,
//   entity VARCHAR(50) NOT NULL,
//   entity_id VARCHAR(255) NOT NULL,
//   user_id VARCHAR(255) DEFAULT 'system',
//   user_name VARCHAR(255) DEFAULT 'System',
//   timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
//   details JSON,
//   flight_details JSON
// );
// `;

// const createBackupsTable = `
// CREATE TABLE IF NOT EXISTS backups (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
//   data JSON
// );
// `;

// // Create tables at startup
// db.query(createPilotsTable, (err) => {
//   if (err) {
//     console.error('❌ Error creating pilots table:', err);
//   } else {
//     console.log('✅ pilots table created or exists');
//   }
// });

// db.query(createAuditTable, (err) => {
//   if (err) {
//     console.error('❌ Error creating audit_logs table:', err);
//   } else {
//     console.log('✅ audit_logs table created or exists');
//   }
// });

// db.query(createBackupsTable, (err) => {
//   if (err) {
//     console.error('❌ Error creating backups table:', err);
//   } else {
//     console.log('✅ backups table created or exists');
//   }
// });

// // Middleware to verify JWT token
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

//   if (!token) {
//     return res.status(401).json({ message: 'Access token required' });
//   }

//   jwt.verify(token, JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ message: 'Invalid or expired token' });
//     }
//     req.user = user;
//     next();
//   });
// };

// // Helper function to record audit logs
// function recordAuditLog(action, entity, entityId, user = 'system', details = {}, flightDetails = null) {
//   const auditLog = {
//     action,
//     entity,
//     entity_id: entityId,
//     user_id: user,
//     user_name: user === 'system' ? 'System' : 'Pilot User',
//     details: JSON.stringify(details),
//     flight_details: flightDetails ? JSON.stringify(flightDetails) : null
//   };

//   const sql = `INSERT INTO audit_logs SET ?`;
//   db.query(sql, auditLog, (err) => {
//     if (err) {
//       console.error('❌ Audit Log Error:', err.message);
//     }
//   });
// }

// // AUTHENTICATION ENDPOINTS

// // Register new pilot
// app.post('/auth/register', async (req, res) => {
//   try {
//     const { email, password, username, firstName, lastName, licenseNumber, licenseType } = req.body;

//     // Validation
//     if (!email || !password || !username || !firstName || !lastName) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Email, password, username, first name, and last name are required' 
//       });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Password must be at least 6 characters long' 
//       });
//     }

//     // Check if pilot already exists
//     const checkSql = 'SELECT id FROM pilots WHERE email = ? OR username = ?';
//     db.query(checkSql, [email, username], async (checkErr, checkResults) => {
//       if (checkErr) {
//         console.error('❌ Database Error:', checkErr);
//         return res.status(500).json({ success: false, message: 'Database error' });
//       }

//       if (checkResults.length > 0) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'Pilot with this email or username already exists' 
//         });
//       }

//       // Hash password
//       const saltRounds = 10;
//       const hashedPassword = await bcrypt.hash(password, saltRounds);

//       // Insert new pilot
//       const insertSql = `INSERT INTO pilots (email, password, username, first_name, last_name, license_number, license_type) VALUES (?, ?, ?, ?, ?, ?, ?)`;
//       const values = [email, hashedPassword, username, firstName, lastName, licenseNumber || null, licenseType || 'PPL'];

//       db.query(insertSql, values, (insertErr, result) => {
//         if (insertErr) {
//           console.error('❌ Insert Error:', insertErr);
//           return res.status(500).json({ success: false, message: 'Failed to create pilot account' });
//         }

//         // Record audit log
//         recordAuditLog(
//           'registered',
//           'pilot',
//           result.insertId,
//           email,
//           { message: 'New pilot account created' }
//         );

//         // Generate JWT token
//         const token = jwt.sign(
//           { 
//             id: result.insertId, 
//             email: email,
//             username: username,
//             firstName: firstName,
//             lastName: lastName 
//           },
//           JWT_SECRET,
//           { expiresIn: '7d' }
//         );

//         res.status(201).json({
//           success: true,
//           message: 'Pilot account created successfully',
//           token,
//           pilot: {
//             id: result.insertId,
//             email,
//             username,
//             firstName,
//             lastName,
//             licenseNumber,
//             licenseType: licenseType || 'PPL'
//           }
//         });
//       });
//     });
//   } catch (err) {
//     console.error('❌ Registration Error:', err);
//     res.status(500).json({ success: false, message: 'Server error during registration' });
//   }
// });

// // Login pilot
// app.post('/auth/login', (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Email and password are required' 
//       });
//     }

//     // Find pilot by email
//     const sql = 'SELECT * FROM pilots WHERE email = ? AND is_active = TRUE';
//     db.query(sql, [email], async (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         return res.status(500).json({ success: false, message: 'Database error' });
//       }

//       if (results.length === 0) {
//         return res.status(401).json({ 
//           success: false, 
//           message: 'Invalid email or password' 
//         });
//       }

//       const pilot = results[0];

//       // Verify password
//       const isValidPassword = await bcrypt.compare(password, pilot.password);
//       if (!isValidPassword) {
//         return res.status(401).json({ 
//           success: false, 
//           message: 'Invalid email or password' 
//         });
//       }

//       // Update last login
//       const updateLoginSql = 'UPDATE pilots SET last_login = CURRENT_TIMESTAMP WHERE id = ?';
//       db.query(updateLoginSql, [pilot.id], (updateErr) => {
//         if (updateErr) {
//           console.error('❌ Update Login Error:', updateErr);
//         }
//       });

//       // Record audit log
//       recordAuditLog(
//         'login',
//         'pilot',
//         pilot.id,
//         pilot.email,
//         { message: 'Pilot logged in successfully' }
//       );

//       // Generate JWT token
//       const token = jwt.sign(
//         { 
//           id: pilot.id, 
//           email: pilot.email,
//           username: pilot.username,
//           firstName: pilot.first_name,
//           lastName: pilot.last_name 
//         },
//         JWT_SECRET,
//         { expiresIn: '7d' }
//       );

//       res.json({
//         success: true,
//         message: 'Login successful',
//         token,
//         pilot: {
//           id: pilot.id,
//           email: pilot.email,
//           username: pilot.username,
//           firstName: pilot.first_name,
//           lastName: pilot.last_name,
//           licenseNumber: pilot.license_number,
//           licenseType: pilot.license_type,
//           totalHours: pilot.total_hours,
//           lastLogin: pilot.last_login
//         }
//       });
//     });
//   } catch (err) {
//     console.error('❌ Login Error:', err);
//     res.status(500).json({ success: false, message: 'Server error during login' });
//   }
// });

// // Verify token endpoint
// app.get('/auth/verify', authenticateToken, (req, res) => {
//   res.json({
//     success: true,
//     message: 'Token is valid',
//     pilot: {
//       id: req.user.id,
//       email: req.user.email,
//       username: req.user.username,
//       firstName: req.user.firstName,
//       lastName: req.user.lastName
//     }
//   });
// });

// // Get current pilot profile
// app.get('/auth/profile', authenticateToken, (req, res) => {
//   try {
//     const sql = 'SELECT id, email, username, first_name, last_name, license_number, license_type, total_hours, created_at, last_login FROM pilots WHERE id = ?';
//     db.query(sql, [req.user.id], (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         return res.status(500).json({ success: false, message: 'Database error' });
//       }

//       if (results.length === 0) {
//         return res.status(404).json({ success: false, message: 'Pilot not found' });
//       }

//       const pilot = results[0];
//       res.json({
//         success: true,
//         pilot: {
//           id: pilot.id,
//           email: pilot.email,
//           username: pilot.username,
//           firstName: pilot.first_name,
//           lastName: pilot.last_name,
//           licenseNumber: pilot.license_number,
//           licenseType: pilot.license_type,
//           totalHours: pilot.total_hours,
//           createdAt: pilot.created_at,
//           lastLogin: pilot.last_login
//         }
//       });
//     });
//   } catch (err) {
//     console.error('❌ Profile Error:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Logout (client-side token removal, but we can log it)
// app.post('/auth/logout', authenticateToken, (req, res) => {
//   try {
//     // Record audit log
//     recordAuditLog(
//       'logout',
//       'pilot',
//       req.user.id,
//       req.user.email,
//       { message: 'Pilot logged out' }
//     );

//     res.json({
//       success: true,
//       message: 'Logged out successfully'
//     });
//   } catch (err) {
//     console.error('❌ Logout Error:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// // Helper function to format date consistently
// const formatDate = (date) => {
//   const d = new Date(date);
//   return d.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
// };

// // Helper function to check if date is in the future
// const isFutureDate = (date) => {
//   const today = new Date();
//   const checkDate = new Date(date);
//   today.setHours(0, 0, 0, 0);
//   checkDate.setHours(0, 0, 0, 0);
//   return checkDate > today;
// };

// // Helper function to process AviationStack flight data
// function processAviationStackFlight(flight, date) {
//   const durationHours = flight.departure?.scheduled && flight.arrival?.scheduled
//     ? (new Date(flight.arrival.scheduled) - new Date(flight.departure.scheduled)) / (1000 * 60 * 60)
//     : 0;

//   return {
//     id: Math.floor(Math.random() * 1000000), // Generate random ID for frontend
//     flight_date: date,
//     flight_status: flight.flight_status || 'scheduled',
//     departure_airport: flight.departure?.airport || `${flight.departure?.iata} Airport`,
//     departure_iata: flight.departure?.iata || '',
//     departure_icao: flight.departure?.icao || '',
//     departure_scheduled: flight.departure?.scheduled || '',
//     arrival_airport: flight.arrival?.airport || `${flight.arrival?.iata} Airport`,
//     arrival_iata: flight.arrival?.iata || '',
//     arrival_icao: flight.arrival?.icao || '',
//     arrival_scheduled: flight.arrival?.scheduled || '',
//     airline_name: flight.airline?.name || '',
//     airline_iata: flight.airline?.iata || '',
//     flight_number: flight.flight?.number || '',
//     flight_iata: flight.flight?.iata || '',
//     flight_icao: flight.flight?.icao || '',
//     duration_hours: Math.abs(durationHours) || 0
//   };
// }

// // Helper function to generate mock flight data when APIs fail
// function generateMockFlights(date, count = 5) {
//   const airlines = [
//     { iata: 'AA', name: 'American Airlines' },
//     { iata: 'DL', name: 'Delta Air Lines' },
//     { iata: 'UA', name: 'United Airlines' },
//     { iata: 'SW', name: 'Southwest Airlines' },
//     { iata: 'BA', name: 'British Airways' }
//   ];
  
//   const airports = [
//     { iata: 'JFK', name: 'John F. Kennedy International Airport' },
//     { iata: 'LAX', name: 'Los Angeles International Airport' },
//     { iata: 'ORD', name: 'Chicago O\'Hare International Airport' },
//     { iata: 'DFW', name: 'Dallas/Fort Worth International Airport' },
//     { iata: 'LHR', name: 'London Heathrow Airport' }
//   ];

//   const statuses = ['scheduled', 'active', 'completed', 'cancelled'];
  
//   return Array.from({ length: count }, (_, i) => {
//     const airline = airlines[Math.floor(Math.random() * airlines.length)];
//     const depAirport = airports[Math.floor(Math.random() * airports.length)];
//     const arrAirport = airports[Math.floor(Math.random() * airports.length)];
//     const flightNum = Math.floor(Math.random() * 9999) + 1;
//     const depTime = new Date(`${date}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`);
//     const duration = 2 + Math.random() * 8; // 2-10 hours
//     const arrTime = new Date(depTime.getTime() + duration * 60 * 60 * 1000);
    
//     return {
//       id: i + 1,
//       flight_date: date,
//       flight_status: statuses[Math.floor(Math.random() * statuses.length)],
//       departure_airport: depAirport.name,
//       departure_iata: depAirport.iata,
//       departure_icao: '',
//       departure_scheduled: depTime.toISOString(),
//       arrival_airport: arrAirport.name,
//       arrival_iata: arrAirport.iata,
//       arrival_icao: '',
//       arrival_scheduled: arrTime.toISOString(),
//       airline_name: airline.name,
//       airline_iata: airline.iata,
//       flight_number: flightNum.toString(),
//       flight_iata: `${airline.iata}${flightNum}`,
//       flight_icao: '',
//       duration_hours: parseFloat(duration.toFixed(2))
//     };
//   });
// }

// // PROTECTED FLIGHT ENDPOINTS (require authentication)

// app.get('/flights-by-date', authenticateToken, async (req, res) => {
//   try {
//     const date = req.query.date;
//     if (!date) {
//       return res.status(400).json({ message: 'Date parameter is required' });
//     }

//     console.log(`📅 Fetching flights for date: ${date} (User: ${req.user.email})`);

//     // First check database
//     const dbSql = `SELECT * FROM detailed_flights WHERE flight_date = ? ORDER BY departure_scheduled ASC`;
    
//     db.query(dbSql, [date], async (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         // If database fails, return mock data
//         console.log('🔄 Database failed, returning mock data');
//         return res.json(generateMockFlights(date));
//       }
      
//       if (results && results.length > 0) {
//         console.log(`✅ Found ${results.length} flights in database`);
//         return res.json(results);
//       }
      
//       console.log('🔍 No flights in database, trying API...');
      
//       // If no results in database, try to fetch from API
//       try {
//         let apiFlights = [];
        
//         // Only try API if we have the API key
//         if (process.env.API_KEY) {
//           console.log('🌐 Fetching from AviationStack API...');
//           const response = await axios.get(
//             `http://api.aviationstack.com/v1/flights`,
//             {
//               params: {
//                 access_key: process.env.API_KEY,
//                 flight_date: date,
//                 limit: 10
//               },
//               timeout: 10000 // 10 second timeout
//             }
//           );
          
//           if (response.data && response.data.data && response.data.data.length > 0) {
//             apiFlights = response.data.data.map(flight => 
//               processAviationStackFlight(flight, date)
//             );
//             console.log(`✅ Fetched ${apiFlights.length} flights from API`);
            
//             // Save to database for future use
//             apiFlights.forEach(flight => {
//               const insertSql = `INSERT INTO detailed_flights SET ?`;
//               db.query(insertSql, flight, (insertErr) => {
//                 if (insertErr) console.error('❌ Insert Error:', insertErr.message);
//               });
//             });
//           }
//         }
        
//         // If API didn't return data or we don't have API key, use mock data
//         if (apiFlights.length === 0) {
//           console.log('🎭 API returned no data, using mock flights');
//           apiFlights = generateMockFlights(date);
//         }
        
//         res.json(apiFlights);
        
//       } catch (apiError) {
//         console.error('❌ API Error:', apiError.message);
//         console.log('🎭 API failed, returning mock data');
//         // If API fails, return mock data
//         res.json(generateMockFlights(date));
//       }
//     });
//   } catch (err) {
//     console.error('❌ Server Error:', err.message);
//     // Even if everything fails, return mock data instead of error
//     res.json(generateMockFlights(req.query.date || formatDate(new Date())));
//   }
// });

// app.get('/search-flight', authenticateToken, async (req, res) => {
//   try {
//     const flight_iata = req.query.flight_iata;
//     const date = req.query.date;
    
//     if (!flight_iata || !date) {
//       return res.status(400).json({ message: 'Flight IATA code and date are required' });
//     }

//     console.log(`🔍 Searching for flight: ${flight_iata} on ${date} (User: ${req.user.email})`);

//     // First, check the database
//     const dbSql = `
//       SELECT * FROM detailed_flights 
//       WHERE flight_iata = ? 
//         AND flight_date = ?
//       ORDER BY departure_scheduled ASC
//     `;
    
//     db.query(dbSql, [flight_iata, date], async (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         return res.json([]); // Return empty array instead of error
//       }
      
//       if (results && results.length > 0) {
//         console.log(`✅ Found flight in database`);
//         return res.json(results);
//       }
      
//       console.log('🔍 Flight not in database, trying API...');
      
//       // If not found in database, try API
//       try {
//         if (process.env.API_KEY) {
//           const airlineCode = flight_iata.substring(0, 2);
//           const flightNumber = flight_iata.substring(2);
          
//           const apiResponse = await axios.get(
//             `http://api.aviationstack.com/v1/flights`,
//             {
//               params: {
//                 access_key: process.env.API_KEY,
//                 airline_iata: airlineCode,
//                 flight_number: flightNumber,
//                 limit: 1
//               },
//               timeout: 10000
//             }
//           );
          
//           if (apiResponse.data && apiResponse.data.data && apiResponse.data.data.length > 0) {
//             const flight = apiResponse.data.data[0];
//             const flightData = processAviationStackFlight(flight, date);
            
//             // Save to database
//             const insertSql = `INSERT INTO detailed_flights SET ?`;
//             db.query(insertSql, flightData, (insertErr) => {
//               if (insertErr) console.error('❌ Insert Error:', insertErr.message);
//             });
            
//             console.log(`✅ Found flight via API`);
//             return res.json([flightData]);
//           }
//         }
        
//         console.log('❌ Flight not found');
//         res.json([]);
        
//       } catch (apiError) {
//         console.error('❌ API Error:', apiError.message);
//         res.json([]);
//       }
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.json([]);
//   }
// });

// app.post('/save-flight', authenticateToken, (req, res) => {
//   try {
//     const flightData = req.body;
    
//     const duration = parseFloat(flightData.duration_hours) || 0;
    
//     const sql = `INSERT INTO detailed_flights (
//       flight_iata, flight_icao, flight_date, flight_status,
//       departure_airport, departure_iata, departure_icao, departure_scheduled,
//       arrival_airport, arrival_iata, arrival_icao, arrival_scheduled,
//       airline_name, airline_iata, duration_hours
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
//     const values = [
//       flightData.flight_iata,
//       flightData.flight_icao,
//       flightData.flight_date,
//       flightData.flight_status,
//       flightData.departure_airport,
//       flightData.departure_iata,
//       flightData.departure_icao,
//       flightData.departure_scheduled,
//       flightData.arrival_airport,
//       flightData.arrival_iata,
//       flightData.arrival_icao,
//       flightData.arrival_scheduled,
//       flightData.airline_name,
//       flightData.airline_iata,
//       duration
//     ];
    
//     db.query(sql, values, (err, result) => {
//       if (err) {
//         console.error('❌ Save Error:', err);
//         return res.status(500).json({ 
//           success: false,
//           message: err.sqlMessage || 'Database error'
//         });
//       }
      
//       // Record audit log for flight creation
//       recordAuditLog(
//         'created',
//         'flight',
//         result.insertId,
//         req.user.email,
//         { message: 'Flight saved to logbook' },
//         {
//           flight_iata: flightData.flight_iata,
//           departure_iata: flightData.departure_iata,
//           arrival_iata: flightData.arrival_iata,
//           flight_date: flightData.flight_date,
//           duration_hours: duration
//         }
//       );
      
//       res.json({ 
//         success: true,
//         message: 'Flight saved successfully',
//         id: result.insertId
//       });
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error: ' + err.message
//     });
//   }
// });

// app.get('/logs', authenticateToken, (req, res) => {
//   try {
//     const sql = `SELECT 
//       id, flight_iata, flight_date, 
//       departure_iata, arrival_iata, 
//       departure_scheduled, arrival_scheduled,
//       airline_iata, duration_hours
//       FROM detailed_flights 
//       ORDER BY flight_date DESC, departure_scheduled DESC`;
    
//     db.query(sql, (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         return res.status(500).json({ message: 'Database error' });
//       }
//       res.json(results);
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Other existing endpoints (keep them protected)
// app.get('/fetch-detailed-flights', authenticateToken, async (req, res) => {
//   try {
//     if (!process.env.API_KEY) {
//       return res.status(400).json({ message: 'API key not configured' });
//     }

//     const response = await axios.get(`http://api.aviationstack.com/v1/flights?access_key=${process.env.API_KEY}`);
//     const flights = response.data.data.slice(0, 5);

//     for (const flight of flights) {
//       const {
//         flight_date,
//         flight_status,
//         departure,
//         arrival,
//         airline,
//         flight: flightInfo,
//       } = flight;

//       const durationHours = departure?.scheduled && arrival?.scheduled
//         ? (new Date(arrival.scheduled) - new Date(departure.scheduled)) / (1000 * 60 * 60)
//         : null;

//       const sql = `INSERT INTO detailed_flights (
//         flight_date, flight_status,
//         departure_airport, departure_iata, departure_icao, departure_scheduled,
//         arrival_airport, arrival_iata, arrival_icao, arrival_scheduled,
//         airline_name, airline_iata,
//         flight_number, flight_iata, flight_icao, duration_hours
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//       const values = [
//         flight_date, flight_status,
//         departure?.airport, departure?.iata, departure?.icao, departure?.scheduled,
//         arrival?.airport, arrival?.iata, arrival?.icao, arrival?.scheduled,
//         airline?.name, airline?.iata,
//         flightInfo?.number, flightInfo?.iata, flightInfo?.icao,
//         durationHours?.toFixed(2) || null
//       ];

//       db.query(sql, values, (err) => {
//         if (err) console.error('❌ Insert Error:', err.sqlMessage);
//       });
//     }

//     res.json({ message: '✅ Flights stored successfully' });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ message: 'Failed to fetch flights' });
//   }
// });

// app.get('/flight/:flightNumber', authenticateToken, async (req, res) => {
//   try {
//     const flightNumber = req.params.flightNumber;
//     const sql = `SELECT * FROM detailed_flights WHERE flight_iata = ?`;
    
//     db.query(sql, [flightNumber], (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         return res.status(500).json({ message: 'Database error' });
//       }
      
//       if (results.length === 0) {
//         return res.status(404).json({ message: 'Flight not found' });
//       }
      
//       res.json(results[0]);
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// app.get('/audit-logs', authenticateToken, (req, res) => {
//   try {
//     const { page = 1, limit = 20, filter = 'all' } = req.query;
//     const offset = (page - 1) * limit;
    
//     let baseQuery = `SELECT * FROM audit_logs`;
//     let countQuery = `SELECT COUNT(*) as total FROM audit_logs`;
    
//     // Apply filters
//     const queryParams = [];
//     if (filter !== 'all') {
//       baseQuery += ` WHERE entity = ?`;
//       countQuery += ` WHERE entity = ?`;
//       queryParams.push(filter);
//     }
    
//     // Add sorting and pagination
//     baseQuery += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
//     queryParams.push(parseInt(limit), parseInt(offset));
    
//     // First get total count
//     db.query(countQuery, queryParams.slice(0, filter !== 'all' ? 1 : 0), (countErr, countResult) => {
//       if (countErr) {
//         console.error('❌ Count Error:', countErr);
//         return res.status(500).json({ message: 'Database error' });
//       }
      
//       const total = countResult[0].total;
//       const totalPages = Math.ceil(total / limit);
      
//       // Now get the paginated results
//       db.query(baseQuery, queryParams, (err, results) => {
//         if (err) {
//           console.error('❌ Query Error:', err);
//           return res.status(500).json({ message: 'Database error' });
//         }
        
//         // Parse JSON fields
//         const logs = results.map(log => ({
//           ...log,
//           details: JSON.parse(log.details),
//           flight_details: log.flight_details ? JSON.parse(log.flight_details) : null
//         }));
        
//         res.json({
//           logs,
//           pagination: {
//             currentPage: parseInt(page),
//             totalPages,
//             totalItems: total,
//             itemsPerPage: parseInt(limit)
//           }
//         });
//       });
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// app.post('/perform-backup', authenticateToken, (req, res) => {
//   try {
//     // Get all flights
//     const flightsSql = `SELECT * FROM detailed_flights`;
    
//     db.query(flightsSql, (err, flights) => {
//       if (err) {
//         console.error('❌ Backup Error:', err);
//         return res.status(500).json({ success: false, message: 'Backup failed' });
//       }
      
//       const backupData = {
//         flights,
//         timestamp: new Date().toISOString(),
//         backupType: 'manual'
//       };
      
//       // Save to backups table or file system (simulated)
//       const backupSql = `INSERT INTO backups SET ?`;
//       db.query(backupSql, { data: JSON.stringify(backupData) }, (backupErr) => {
//         if (backupErr) {
//           console.error('❌ Backup Save Error:', backupErr);
//           return res.status(500).json({ success: false, message: 'Backup failed' });
//         }
        
//         // Record audit log for backup
//         recordAuditLog(
//           'backup',
//           'system',
//           'backup',
//           req.user.email,
//           { message: 'Manual backup performed' }
//         );
        
//         res.json({ success: true, message: 'Backup completed successfully' });
//       });
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
//   console.log(`📊 Database connection: ${db ? '✅ Connected' : '❌ Not connected'}`);
//   console.log(`🔑 API Key: ${process.env.API_KEY ? '✅ Configured' : '❌ Not configured'}`);
//   console.log(`🔐 JWT Secret: ${JWT_SECRET ? '✅ Configured' : '❌ Not configured'}`);
// });




// // server.js
// const express = require('express');
// const axios = require('axios');
// const cors = require('cors');
// const moment = require('moment-timezone');
// const db = require('./db');
// require('dotenv').config();

// // Initialize express first
// const app = express();

// // Then use middleware
// app.use(express.json()); // Parse JSON bodies
// app.use(cors()); // Enable CORS

// const PORT = process.env.PORT || 5000;

// app.get('/fetch-detailed-flights', async (req, res) => {
//   try {
//     const response = await axios.get(`http://api.aviationstack.com/v1/flights?access_key=${process.env.API_KEY}`);
//     const flights = response.data.data.slice(0, 5); // Fetch 5 flights for test

//     for (const flight of flights) {
//       const {
//         flight_date,
//         flight_status,
//         departure,
//         arrival,
//         airline,
//         flight: flightInfo,
//       } = flight;

//       const durationHours = departure?.scheduled && arrival?.scheduled
//         ? (new Date(arrival.scheduled) - new Date(departure.scheduled)) / (1000 * 60 * 60)
//         : null;

//       const sql = `INSERT INTO detailed_flights (
//         flight_date, flight_status,
//         departure_airport, departure_iata, departure_icao, departure_scheduled,
//         arrival_airport, arrival_iata, arrival_icao, arrival_scheduled,
//         airline_name, airline_iata,
//         flight_number, flight_iata, flight_icao, duration_hours
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//       const values = [
//         flight_date, flight_status,
//         departure?.airport, departure?.iata, departure?.icao, departure?.scheduled,
//         arrival?.airport, arrival?.iata, arrival?.icao, arrival?.scheduled,
//         airline?.name, airline?.iata,
//         flightInfo?.number, flightInfo?.iata, flightInfo?.icao,
//         durationHours?.toFixed(2) || null
//       ];

//       db.query(sql, values, (err) => {
//         if (err) console.error('❌ Insert Error:', err.sqlMessage);
//       });
//     }

//     res.json({ message: '✅ Flights stored successfully' });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ message: 'Failed to fetch flights' });
//   }
// });

// // Add this to server.js
// app.get('/flight/:flightNumber', async (req, res) => {
//   try {
//     const flightNumber = req.params.flightNumber;
//     const sql = `SELECT * FROM detailed_flights WHERE flight_iata = ?`;
    
//     db.query(sql, [flightNumber], (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         return res.status(500).json({ message: 'Database error' });
//       }
      
//       if (results.length === 0) {
//         return res.status(404).json({ message: 'Flight not found' });
//       }
      
//       res.json(results[0]);
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Save flight endpoint
// // server.js (update save-flight endpoint)
// app.post('/save-flight', (req, res) => {
//   try {
//     const flightData = req.body;
    
//     // Use duration_hours instead of duration
//     const duration = parseFloat(flightData.duration_hours) || 0;
    
//     const sql = `INSERT INTO detailed_flights (
//       flight_iata, flight_icao, flight_date, flight_status,
//       departure_airport, departure_iata, departure_icao, departure_scheduled,
//       arrival_airport, arrival_iata, arrival_icao, arrival_scheduled,
//       airline_name, airline_iata, duration_hours
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
//     const values = [
//       flightData.flight_iata,
//       flightData.flight_icao,
//       flightData.flight_date,
//       flightData.flight_status,
//       flightData.departure_airport,
//       flightData.departure_iata,
//       flightData.departure_icao,
//       flightData.departure_scheduled,
//       flightData.arrival_airport,
//       flightData.arrival_iata,
//       flightData.arrival_icao,
//       flightData.arrival_scheduled,
//       flightData.airline_name,
//       flightData.airline_iata,
//       duration  // Use the parsed number
//     ];
    
//     db.query(sql, values, (err, result) => {
//       if (err) {
//         console.error('❌ Save Error:', err);
//         return res.status(500).json({ 
//           success: false,
//           message: err.sqlMessage || 'Database error'
//         });
//       }
//       res.json({ 
//         success: true,
//         message: 'Flight saved successfully',
//         id: result.insertId
//       });
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ 
//       success: false,
//       message: 'Server error: ' + err.message
//     });
//   }
// });

// // Get logs endpoint
// app.get('/logs', (req, res) => {
//   try {
//     const sql = `SELECT 
//       id, flight_iata, flight_date, 
//       departure_iata, arrival_iata, 
//       departure_scheduled, arrival_scheduled,
//       airline_iata, duration_hours
//       FROM detailed_flights 
//       ORDER BY flight_date DESC, departure_scheduled DESC`;
    
//     db.query(sql, (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         return res.status(500).json({ message: 'Database error' });
//       }
//       res.json(results);
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Update your /search-flight endpoint to always return an array
// app.get('/search-flight', async (req, res) => {
//   try {
//     const flight_iata = req.query.flight_iata;
//     const date = req.query.date;
    
//     if (!flight_iata || !date) {
//       return res.status(400).json({ message: 'Flight IATA code and date are required' });
//     }

//     // First, check the database
//     const dbSql = `
//       SELECT * FROM detailed_flights 
//       WHERE flight_iata = ? 
//         AND flight_date = ?
//       ORDER BY departure_scheduled ASC
//     `;
    
//     db.query(dbSql, [flight_iata, date], async (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         return res.status(500).json({ message: 'Database error' });
//       }
      
//       if (results.length > 0) {
//         return res.json(results);
//       }
      
//       // If not found in the database, fetch from API
//       try {
//         const today = new Date();
//         const flightDate = new Date(date);
        
//         // Use Cirium for future dates, AviationStack for past/present
//         if (flightDate > today) {
//           // Call Cirium API for future flights
//           const response = await axios.get(
//             `https://api.cirium.com/v3/flights`,
//             {
//               headers: {
//                 'X-apiKey': process.env.CIRIUM_API_KEY
//               },
//               params: {
//                 flightNumber: flight_iata,
//                 date: date
//               }
//             }
//           );
          
//           if (!response.data || !response.data.flights || response.data.flights.length === 0) {
//             return res.json([]);
//           }
          
//           const flight = response.data.flights[0];
//           const flightData = processCiriumFlight(flight, date);
          
//           // Save to database
//           const insertSql = `INSERT INTO detailed_flights SET ?`;
//           db.query(insertSql, flightData, (insertErr) => {
//             if (insertErr) console.error('❌ Insert Error:', insertErr);
//           });
          
//           res.json([flightData]);
//         } else {
//           // Use AviationStack for past/present flights
//           const airlineCode = flight_iata.substring(0, 2);
//           const flightNumber = flight_iata.substring(2);
          
//           const apiResponse = await axios.get(
//             `http://api.aviationstack.com/v1/flights`,
//             {
//               params: {
//                 access_key: process.env.API_KEY,
//                 airline_iata: airlineCode,
//                 flight_number: flightNumber,
//                 limit: 1
//               }
//             }
//           );
          
//           if (!apiResponse.data.data || apiResponse.data.data.length === 0) {
//             return res.json([]);
//           }
          
//           const flight = apiResponse.data.data[0];
//           const flightData = processAviationStackFlight(flight, date);
          
//           // Save to database
//           const insertSql = `INSERT INTO detailed_flights SET ?`;
//           db.query(insertSql, flightData, (insertErr) => {
//             if (insertErr) console.error('❌ Insert Error:', insertErr);
//           });
          
//           res.json([flightData]);
//         }
//       } catch (apiError) {
//         console.error('❌ API Error:', apiError.message);
//         res.json([]);
//       }
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Helper function to process Cirium flight data
// function processCiriumFlight(flight, date) {
//   const departure = flight.departureAirport || {};
//   const arrival = flight.arrivalAirport || {};
//   const airline = flight.airline || {};
  
//   // Calculate duration if available
//   let durationHours = 0;
//   if (flight.departureDate && flight.arrivalDate) {
//     const depTime = new Date(flight.departureDate);
//     const arrTime = new Date(flight.arrivalDate);
//     durationHours = (arrTime - depTime) / (1000 * 60 * 60);
//   }
  
//   return {
//     flight_date: date, // Use the requested date
//     flight_status: flight.status || 'scheduled',
//     departure_airport: departure.name,
//     departure_iata: departure.fs,
//     departure_scheduled: flight.departureDate,
//     arrival_airport: arrival.name,
//     arrival_iata: arrival.fs,
//     arrival_scheduled: flight.arrivalDate,
//     airline_name: airline.name,
//     airline_iata: airline.fs,
//     flight_iata: flight.flightNumber,
//     duration_hours: durationHours,
//     // Add default values for other fields
//     departure_icao: '',
//     arrival_icao: '',
//     flight_number: flight.flightNumber,
//     flight_icao: ''
//   };
// }

// // Helper function to process AviationStack flight data
// function processAviationStackFlight(flight, date) {
//   const durationHours = flight.departure?.scheduled && flight.arrival?.scheduled
//     ? (new Date(flight.arrival.scheduled) - new Date(flight.departure.scheduled)) / (1000 * 60 * 60)
//     : null;

//   return {
//     flight_date: date, // Use the requested date
//     flight_status: flight.flight_status,
//     departure_airport: flight.departure?.airport,
//     departure_iata: flight.departure?.iata,
//     departure_icao: flight.departure?.icao,
//     departure_scheduled: flight.departure?.scheduled,
//     arrival_airport: flight.arrival?.airport,
//     arrival_iata: flight.arrival?.iata,
//     arrival_icao: flight.arrival?.icao,
//     arrival_scheduled: flight.arrival?.scheduled,
//     airline_name: flight.airline?.name,
//     airline_iata: flight.airline?.iata,
//     flight_number: flight.flight?.number,
//     flight_iata: flight.flight?.iata,
//     flight_icao: flight.flight?.icao,
//     duration_hours: durationHours ? durationHours.toFixed(2) : null
//   };
// }

// // app.get('/search-flight', async (req, res) => {
// //   try {
// //     const { flight_iata } = req.query;
// //     if (!flight_iata) {
// //       return res.status(400).json({ message: 'Flight IATA code is required' });
// //     }

// //     // First, check the database
// //     const dbSql = `SELECT * FROM detailed_flights WHERE flight_iata = ?`;
// //     db.query(dbSql, [flight_iata], async (err, results) => {
// //       if (err) {
// //         console.error('❌ Database Error:', err);
// //         return res.status(500).json({ message: 'Database error' });
// //       }
      
// //       if (results.length > 0) {
// //         return res.json(results[0]);
// //       }
      
// //       // If not found in the database, fetch from the API
// //       try {
// //         const apiResponse = await axios.get(
// //           `http://api.aviationstack.com/v1/flights`,
// //           {
// //             params: {
// //               access_key: process.env.API_KEY,
// //               flight_iata: flight_iata,
// //               limit: 1
// //             }
// //           }
// //         );
        
// //         // Check if API returned valid data
// //         if (!apiResponse.data || !apiResponse.data.data || apiResponse.data.data.length === 0) {
// //           // Try alternative search method
// //           const airlineCode = flight_iata.substring(0, 2);
// //           const flightNumber = flight_iata.substring(2);
          
// //           const altResponse = await axios.get(
// //             `http://api.aviationstack.com/v1/flights`,
// //             {
// //               params: {
// //                 access_key: process.env.API_KEY,
// //                 airline_iata: airlineCode,
// //                 flight_number: flightNumber,
// //                 limit: 1
// //               }
// //             }
// //           );
          
// //           if (!altResponse.data.data || altResponse.data.data.length === 0) {
// //             return res.status(404).json({ message: `Flight ${flight_iata} not found in API` });
// //           }
          
// //           return processFlightData(altResponse.data.data[0], res);
// //         }
        
// //         return processFlightData(apiResponse.data.data[0], res);
// //       } catch (apiError) {
// //         console.error('❌ API Error:', apiError.message);
// //         res.status(500).json({ message: 'Failed to fetch flight from API' });
// //       }
// //     });
// //   } catch (err) {
// //     console.error('❌ Error:', err.message);
// //     res.status(500).json({ message: 'Server error' });
// //   }
// // });

// // Add this endpoint for flight number search
// app.get('/search-flights', (req, res) => {
//   try {
//     let flightNumber = req.query.flightNumber;
//     const date = req.query.date;
    
//     if (!flightNumber || !date) {
//       return res.status(400).json({ message: 'Flight number and date are required' });
//     }

//     // Convert to uppercase for consistent matching
//     flightNumber = flightNumber.toUpperCase();

//     const sql = `
//       SELECT * FROM detailed_flights 
//       WHERE flight_iata = ? 
//         AND flight_date = ?
//       ORDER BY departure_scheduled ASC
//     `;
    
//     db.query(sql, [flightNumber, date], (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         return res.status(500).json({ message: 'Database error' });
//       }
//       res.json(results);
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// app.get('/flights-by-date', async (req, res) => {
//   try {
//     const date = req.query.date;
//     if (!date) {
//       return res.status(400).json({ message: 'Date parameter is required' });
//     }

//     // 1. First check database
//     const dbSql = `SELECT * FROM detailed_flights WHERE flight_date = ?`;
//     db.query(dbSql, [date], async (err, results) => {
//       if (err) {
//         console.error('❌ Database Error:', err);
//         return res.status(500).json({ message: 'Database error' });
//       }
      
//       if (results.length > 0) {
//         return res.json(results);
//       }
      
//       // 2. If no results, fetch from appropriate API
//       try {
//         const today = moment().format('YYYY-MM-DD');
//         const flightDate = moment(date);
        
//         let apiFlights = [];
        
//         if (flightDate.isBefore(today)) {
//           // Fetch historical flights
//           apiFlights = await fetchHistoricalFlights(date);
//         } else if (flightDate.isSame(today)) {
//           // Fetch current flights
//           apiFlights = await fetchCurrentFlights(date);
//         } else {
//           // Fetch future flights
//           apiFlights = await fetchFutureFlights(date);
//         }
        
//         // Save new flights to database
//         saveFlightsToDB(apiFlights);
        
//         res.json(apiFlights);
//       } catch (apiError) {
//         console.error('❌ API Error:', apiError);
//         res.status(500).json({ message: 'Failed to fetch flights from API' });
//       }
//     });
//   } catch (err) {
//     console.error('❌ Error:', err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Helper functions
// async function fetchHistoricalFlights(date) {
//   const response = await axios.get(
//     `http://api.aviationstack.com/v1/flights`,
//     {
//       params: {
//         access_key: process.env.API_KEY,
//         flight_date: date,
//         limit: 50
//       }
//     }
//   );
//   return response.data.data.map(flight => 
//     processAviationStackFlight(flight, date)
//   );
// }

// async function fetchFutureFlights(date) {
//   const response = await axios.get(
//     `https://api.cirium.com/v3/flights`,
//     {
//       headers: { 'X-apiKey': process.env.CIRIUM_API_KEY },
//       params: { date }
//     }
//   );
//   return response.data.flights.map(flight => 
//     processCiriumFlight(flight, date)
//   );
// }

// async function fetchCurrentFlights(date) {
//   // Try multiple sources
//   const [aviationStack, cirium] = await Promise.allSettled([
//     axios.get(`http://api.aviationstack.com/v1/flights`, {
//       params: { access_key: process.env.API_KEY, flight_date: date, limit: 50 }
//     }),
//     axios.get(`https://api.cirium.com/v3/flights`, {
//       headers: { 'X-apiKey': process.env.CIRIUM_API_KEY },
//       params: { date }
//     })
//   ]);

//   const flights = [];
//   if (aviationStack.status === 'fulfilled') {
//     flights.push(...aviationStack.value.data.data.map(f => 
//       processAviationStackFlight(f, date))
//     );
//   }
//   if (cirium.status === 'fulfilled') {
//     flights.push(...cirium.value.data.flights.map(f => 
//       processCiriumFlight(f, date))
//     );
//   }
  
//   return flights;
// }

// function saveFlightsToDB(flights) {
//   flights.forEach(flight => {
//     const sql = `INSERT INTO detailed_flights SET ?`;
//     db.query(sql, flight, (err) => {
//       if (err) console.error('❌ Save Error:', err);
//     });
//   });
// }

// // Helper function to process flight data
// function processFlightData(flight, res) {
//   const durationHours = flight.departure?.scheduled && flight.arrival?.scheduled
//     ? (new Date(flight.arrival.scheduled) - new Date(flight.departure.scheduled)) / (1000 * 60 * 60)
//     : null;

//   const flightData = {
//     flight_date: flight.flight_date,
//     flight_status: flight.flight_status,
//     departure_airport: flight.departure?.airport,
//     departure_iata: flight.departure?.iata,
//     departure_icao: flight.departure?.icao,
//     departure_scheduled: flight.departure?.scheduled,
//     arrival_airport: flight.arrival?.airport,
//     arrival_iata: flight.arrival?.iata,
//     arrival_icao: flight.arrival?.icao,
//     arrival_scheduled: flight.arrival?.scheduled,
//     airline_name: flight.airline?.name,
//     airline_iata: flight.airline?.iata,
//     flight_number: flight.flight?.number,
//     flight_iata: flight.flight?.iata,
//     flight_icao: flight.flight?.icao,
//     duration_hours: durationHours ? durationHours.toFixed(2) : null
//   };
  
//   res.json(flightData);
// }

// app.listen(PORT, () => {
//   console.log(`🚀 Server running at http://localhost:${PORT}`);
// });
