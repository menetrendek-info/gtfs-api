import express from 'express';
const app = express();
import { readFileSync } from 'fs';
import { getRoutes, openDb, getTrips, getStops, updateGtfsRealtime, importGtfs } from 'gtfs';
import { config as dotenvConfig } from "dotenv"
import cors from 'cors'

const main = async () => {
    dotenvConfig()

    app.use(cors({
        origin: ["https://menetrendek.info", "http://localhost:8081"]
    }))

    const config = {
        "agencies": [
            {
                "url": "https://www.mavcsoport.hu/gtfs/gtfsMavMenetrend.zip",
                "headers": {
                    "Authorization": `Basic ${Buffer.from(process.env.MAV_USERNAME + ":" + process.env.MAV_PASSWORD).toString('base64')}`
                },
                "prefix": "MAV",
                "name": "MÁV-START Zrt."
            }
        ],
        "sqlitePath": "./data/db.sqlite"
    };

    let db
    try{
        await updateGtfsRealtime(config)
        db = openDb(config)
    }catch(e){
        await importGtfs(config)
        db = openDb(config)
    }

    app.get('/', function (req, res) {
        res.json({ body: req.body, query: req.query, params: req.params });
    })

    app.get('/stops', async function (req, res) {
        const stops = req.query.query ? db.prepare("SELECT * FROM stops WHERE stop_name LIKE ? LIMIT 50;").all(`%${req.query.query}%`) : []
        res.json(stops)
    })

    app.get('/stops/:stop_id', async function (req, res) {
        const stops = getStops(
            { stop_id: req.params.stop_id }, // No query filters
            ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'], // Only return these fields
            [['stop_name', 'ASC']], // Sort by this field and direction
            { db: db } // Options for the query. Can specify which database to use if more than one are open
        );
        res.json(stops)
    })

    // endpoint to get routes between two stops from gts, display departure and arrival times from the start and end stops
    app.get('/routes/:day/:start_stop_id/:end_stop_id', async function (req, res) {
        const routes = db.prepare(`
        SELECT 
            t.trip_headsign, 
            r.route_long_name, 
            r.route_id, 
            t.trip_id, 
            s1.stop_name AS departure_stop,
            s2.stop_name AS arrival_stop,
            MIN(st1.departure_time) AS start_departure, 
            MAX(st2.arrival_time) AS end_arrival, 
            ROUND((6371 * ACOS(COS(RADIANS(s1.stop_lat)) * COS(RADIANS(s2.stop_lat)) * COS(RADIANS(s2.stop_lon) - RADIANS(s1.stop_lon)) + SIN(RADIANS(s1.stop_lat)) * SIN(RADIANS(s2.stop_lat)))), 2) AS distance, 
            strftime('%H:%M', time(MAX(st2.arrival_time), '-'||MIN(st1.departure_time))) AS travel_time 
        FROM 
            stops s1 
            JOIN stop_times st1 ON s1.stop_id = st1.stop_id 
            JOIN trips t ON st1.trip_id = t.trip_id 
            JOIN routes r ON t.route_id = r.route_id 
            JOIN stop_times st2 ON t.trip_id = st2.trip_id 
            JOIN stops s2 ON st2.stop_id = s2.stop_id 
            JOIN calendar c ON t.service_id = c.service_id 
        WHERE 
            s1.stop_id = $start_stop_id 
            AND s2.stop_id = $end_stop_id 
            AND st1.stop_sequence < st2.stop_sequence 
            AND c.${req.params.day} = 1 
        GROUP BY 
            r.route_id, 
            t.trip_id 
        ORDER BY 
            start_departure;
    `).all({ start_stop_id: req.params.start_stop_id, end_stop_id: req.params.end_stop_id });
        res.json(routes)
    })

    app.get('/routes', async function (req, res) {
        const routes = getRoutes(
            {}, // No query filters
            ['route_id', 'route_short_name', 'route_color'], // Only return these fields
            [['route_short_name', 'ASC']], // Sort by this field and direction
            { db: db } // Options for the query. Can specify which database to use if more than one are open
        );
        res.json(routes)
    })

    app.get('/trips', async function (req, res) {
        const trips = getTrips(
            {}, // No query filters
            ['trip_id', 'route_id', 'trip_headsign'], // Only return these fields
            [['route_id', 'ASC']], // Sort by this field and direction
            { db: db } // Options for the query. Can specify which database to use if more than one are open
        );
        res.json(trips)
    })

    var server = app.listen(8081, function () {
        var port = server.address().port
        console.log("Listening at http://localhost:%s", port)
    })
}
main()