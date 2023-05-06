# Menetrendek.info GTFS API

## 🇭🇺 Egy GTFS API a magyar tömegközlekedésre

### Az API állapota
Az API jelenleg fejlesztés alatt áll, és csak néhány végpont érhető el. Az API még nem stabil, ezért a végpontok később megváltozhatnak. Az API még nincs dokumentálva, de néhány információt a végpontokról lent találsz.
Az egyetlen elérhető ügynökség a MÁV-START. Az API csak a magyar vasúti rendszer adatait tartalmazza. A magyar buszrendszer adatai később lesznek hozzáadva.

### Mi az a GTFS?
GTFS a General Transit Feed Specification rövidítése. Ez egy szabványos formátum a tömegközlekedési menetrendekhez és a hozzájuk tartozó földrajzi információkhoz. A Google Térképek és más szolgáltatások használják a tömegközlekedési útvonalak megjelenítéséhez.

### Mi ez az API?
Ez az API szolgálja ki a magyar tömegközlekedési rendszer GTFS adatait. A [menetrendek.info](http://menetrendek.info) weboldalhoz készült, ami egy nagyszerű forrás a magyar tömegközlekedési menetrendekhez.

### Hogyan használd?
Az API elérhető a [api.menetrendek.info](http://api.menetrendek.info) címen. Ez egy RESTful API, tehát HTTP kérésekkel érhető el. Az API csak olvasható, tehát csak GET kéréseket lehet használni. Az API JSON adatokat ad vissza.

### Végpontok
#### /api/stops?query={query}
Visszaad egy megadott lekérdezésnek megfelelő megállók listáját. A query paraméter nem opcionális. Ha nincs megadva, akkor nem ad vissza megállókat. A query paraméter nem érzékeny a kis- és nagybetűkre. A query paraméter egy megálló neve lehet. Ezt a végpontot az autokomplettáló mezőkhez és a megálló azonosítók lekéréséhez használjuk.

#### /api/routes/:day_of_week/:start_stop_id/:end_stop_id

## 🇬🇧 A GTFS API for the Hungarian public transport system

### The state of the API
Currently the API is under development and only a few endpoints are available. The API is not stable yet, so the endpoints may change in the future. The API is not documented yet, but you can find some information about the endpoints below.
The only available agency is MÁV-START. The API only contains the data of the Hungarian railway system. The data of the Hungarian bus system will be added later.

### What is GTFS?
GTFS stands for General Transit Feed Specification. It is a standard format for public transportation schedules and associated geographic information. It is used by Google Maps and other services to provide public transportation directions.

### What is this API?
This API provides a simple way to access the GTFS data of the Hungarian public transportation system. It is made for the [menetrendek.info](http://menetrendek.info) website, which is a great resource for Hungarian public transportation schedules.

### How to use it?
The API is available at [api.menetrendek.info](http://api.menetrendek.info). It is a RESTful API, so you can access the data using HTTP requests. The API is read-only, so you can only use GET requests. The API returns JSON data.

### Endpoints
#### /api/stops?query={query}
Returns a list of stops that match the query. The query parameter is not optional. If it is not provided, no stops are returned. The query parameter is case-insensitive. The query parameter can be a stop name. This endpoint is used for autocomplete boxes and for getting the stop IDs to use them in other endpoints.

#### /api/routes/:day_of_week/:start_stop_id/:end_stop_id
Get routes between two stops. The day_of_week parameter is optional. If it is not provided, the current day of the week is used. The start_stop_id and end_stop_id parameters are required. They can be obtained from the /api/stops endpoint. The day_of_week parameter can be one of the following values: monday, tuesday, wednesday, thursday, friday, saturday, sunday. This endpoint is used for the route search feature.
Visszaad egy listát az adott két megálló közötti járatokról. A day_of_week paraméter opcionális. Ha nincs megadva, akkor az aktuális napot használja. A start_stop_id és end_stop_id paraméterek kötelezőek. Ezeket a /api/stops végpontból lehet lekérni. A day_of_week paraméter az alábbi értékek egyike lehet: monday, tuesday, wednesday, thursday, friday, saturday, sunday. Ezt a végpontot a járatkereső funkcióhoz használjuk.