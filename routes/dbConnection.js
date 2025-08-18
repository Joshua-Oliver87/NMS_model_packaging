import mariadb from "mariadb";
import 'dotenv/config';

// Database connection pool
const dbPool = mariadb.createPool({
  host: process.env.REACT_APP_DB_HOST || "172.31.27.36",
  user: process.env.REACT_APP_DB_USER || "awn_nms",
  password: process.env.REACT_APP_DB_PASSWORD || "w$u@wn2024NMS",
  database: process.env.REACT_APP_DB_NAME || "awn",
  connectionLimit: 10,
});
// LORAWAN Database connection pool
const lorawanDbPool = mariadb.createPool({
  host: process.env.REACT_APP_LORAWAN_DB_HOST,
  user: process.env.REACT_APP_LORAWAN_DB_USER,
  password: process.env.REACT_APP_LORAWAN_DB_PASSWORD,
  database: process.env.REACT_APP_LORAWAN_DB_NAME,
  connectionLimit: 10,
});
// Forecast schema Database connection pool
const forecastDbPool = mariadb.createPool({
  host: process.env.REACT_APP_FORECAST_DB_HOST || "172.31.5.122",
  user: process.env.REACT_APP_FORECAST_DB_USER || "awn_nms",
  password: process.env.REACT_APP_FORECAST_DB_PASSWORD || "w$u@wn2024NMS",
  database: process.env.REACT_APP_FORECAST_DB_NAME || "awnfc",
  connectionLimit: 10,
});

//  Function to execute general queries (SELECT, INSERT, UPDATE, DELETE)
export async function executeQuery(query, params = []) {
  let connection;
  try {
    connection = await dbPool.getConnection();
    const results = await connection.query(query, params);

    //  If the query is an INSERT, DELETE, or UPDATE, return affectedRows
    if (
      query.trim().toLowerCase().startsWith("update") ||
      query.trim().toLowerCase().startsWith("delete") ||
      query.trim().toLowerCase().startsWith("insert")
    ) {
      return { affectedRows: results.affectedRows || 0, objid: Number(results.insertId) };
    }

    return results; //  Return query results for SELECT statements
  } catch (err) {
    console.error("Database error:", err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

//  Function to fetch data (for SELECT queries)
export async function fetchDataFromDb(query, params) {
  let connection;
  try {
    connection = await dbPool.getConnection();
    const results = await connection.query(query, params);
    return results;
  } catch (err) {
    console.error("Database error - ", err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

// Query executor for LORAWAN database
export async function executeLorawanQuery(query, params = []) {
  let connection;
  try {
    connection = await lorawanDbPool.getConnection(); 
    const results = await connection.query(query, params);

    if (
      query.trim().toLowerCase().startsWith("update") ||
      query.trim().toLowerCase().startsWith("delete") ||
      query.trim().toLowerCase().startsWith("insert")
    ) {
      return { affectedRows: results.affectedRows || 0, objid: Number(results.insertId) };
    }

    return results;
  } catch (err) {
    console.error("LORAWAN Database error:", err);
    throw err;
  } finally {
    if (connection) connection.release();  
  }
}


// Data fetcher for LORAWAN database
export async function fetchDataFromLorawanDb(query, params = []) {
  let conn;
  try {
 
    conn = await lorawanDbPool.getConnection();
    const results = await conn.query(query, params);

    return results;
  } catch (err) {
    console.error(" LORAWAN DB error during query execution:", err);
    throw err;
  } finally {
    if (conn) {
      try {
        await conn.release(); //  Add the release here
        console.log("Connection released back to LORAWAN pool.");
      } catch (releaseErr) {
        console.error(" Error while releasing LORAWAN connection:", releaseErr);
      }
    }
  }
}
// Data fetcher for FORECAST DB (awnfc)
export async function fetchDataFromForecastDb(query, params = []) {
  let connection;
  try {
    connection = await forecastDbPool.getConnection();
    const results = await connection.query(query, params);
    return results;
  } catch (err) {
    console.error("Forecast DB error during query execution:", err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.release();
        console.log("Connection released back to FORECAST DB pool.");
      } catch (releaseErr) {
        console.error("Error while releasing FORECAST connection:", releaseErr);
      }
    }
  }
}

//  Function for bulk inserts (multi-row INSERT)
export async function bulkInsertToDb(query, params) {
  let connection;
  try {
    connection = await dbPool.getConnection();
    const results = await connection.batch(query, params);
    return results;
  } catch (err) {
    console.log("Database error - ", err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}
