import express from 'express';
const app = express();
import { getRoutes, openDb, getStops, updateGtfsRealtime, importGtfs } from 'gtfs';
import { config as dotenvConfig } from "dotenv"
import cors from 'cors'

const trip_route_select = `t.trip_headsign, 
r.route_long_name, 
r.route_short_name,
r.route_color,
r.route_text_color,
SUBSTR(r.route_id, 1, LENGTH(r.route_id) - (SUBSTR(r.route_id, -1) = '.')) as route_id,
SUBSTR(t.trip_id, 1, LENGTH(t.trip_id) - (SUBSTR(t.trip_id, -1) = '.')) as trip_id,
s1.stop_name AS departure_stop,
s2.stop_name AS arrival_stop,
MIN(st1.departure_time) AS start_departure, 
MAX(st2.arrival_time) AS end_arrival, 
strftime('%H:%M', st1.departure_time, 'localtime') AS start_departure, 
strftime('%H:%M', st2.arrival_time, 'localtime') AS end_arrival, 
ROUND((6371 * ACOS(COS(RADIANS(s1.stop_lat)) * COS(RADIANS(s2.stop_lat)) * COS(RADIANS(s2.stop_lon) - RADIANS(s1.stop_lon)) + SIN(RADIANS(s1.stop_lat)) * SIN(RADIANS(s2.stop_lat)))), 2) AS distance, 
strftime('%H:%M', time(MAX(st2.arrival_time), '-'||MIN(st1.departure_time))) AS travel_time `

const trip_route_from = `stops s1 
JOIN stop_times st1 ON s1.stop_id = st1.stop_id 
JOIN trips t ON st1.trip_id = t.trip_id 
JOIN routes r ON t.route_id = r.route_id 
JOIN stop_times st2 ON t.trip_id = st2.trip_id 
JOIN stops s2 ON st2.stop_id = s2.stop_id 
JOIN calendar c ON t.service_id = c.service_id`

const main = async () => {
    dotenvConfig()

    app.use(cors({
        origin: ["https://menetrendek.info", /http:\/\/localhost:\d+/]
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
    try {
        await updateGtfsRealtime(config)
        db = openDb(config)
    } catch (e) {
        await importGtfs(config)
        await updateGtfsRealtime(config)
        db = openDb(config)
    }

    app.get('/', function (req, res) {
        //redirect with header
        res.redirect(301, 'https://github.com/menetrendek-info/gtfs-api')
    })

    app.get('/stops', async function (req, res) {
        const stops = req.query.query ? db.prepare("SELECT * FROM stops WHERE stop_name LIKE ? LIMIT 50;").all(`${req.query.query}%`) : []
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
    app.get('/trips/:day/:start_stop_id/:end_stop_id', async function (req, res) {
        const routes = db.prepare(`
        SELECT 
            ${trip_route_select}
        FROM 
            ${trip_route_from}
        WHERE 
            s1.stop_id = $start_stop_id 
            AND s2.stop_id = $end_stop_id 
            AND st1.stop_sequence < st2.stop_sequence 
            AND c.${req.params.day} = 1 
        GROUP BY 
            r.route_id
        ORDER BY 
            start_departure;
    `).all({ start_stop_id: req.params.start_stop_id, end_stop_id: req.params.end_stop_id });
        routes.sort((a, b) => {
            try {
                if (!a.start_departure || !b.start_departure) return 0
                if (a.start_departure.indexOf(':') === -1 || b.start_departure.indexOf(':') === -1) return 0
                const aTime = a.start_departure.split(':')
                const bTime = b.start_departure.split(':')
                return aTime[0] * 60 + aTime[1] - bTime[0] * 60 - bTime[1]
            } catch { return 0 }
        })
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

    app.get('/trips/:trip_id', async function (req, res) {
        const trip = db.prepare(`
        SELECT
            ${trip_route_select}
        FROM
            ${trip_route_from}
        WHERE
            SUBSTR(t.trip_id, 1, LENGTH(t.trip_id) - (SUBSTR(t.trip_id, -1) = '.')) = $trip_id
        GROUP BY
            t.trip_id
        ORDER BY
            strftime('%s', strftime('%H:%M', MIN(st1.departure_time), 'localtime'));
    `).all({ trip_id: req.params.trip_id })[0];
        res.json(trip)
    })

    app.get('/agencies', async function (req, res) {
        const agencies = db.prepare("SELECT * FROM agency;").all()
        res.json(agencies)
    })

    var server = app.listen(8081, function () {
        var port = server.address().port
        console.log("Listening at http://localhost:%s", process.env.PORT || port)
    })
}
main()