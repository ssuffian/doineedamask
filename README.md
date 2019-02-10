## To Run

    npm install
    npm run build

## To Run Webserver

    npm install -g local-web-server
    ws
    
## To Update Data
In data/scripts there is a bash script that I have in a cron job that caches purple air for this site and stores it in a file called purpleair.json, then pushes that to this repo. I run it every 30 minutes to avoid hitting purpleair.com's servers too much.

## URL Parameters
You can directly input latitude and longitude: `?lat=37.8716&lon=-122.2727`

## To do

- Make background color associate with the PM level.
- get AQI conversion
- reverse geocode to get nearest city using GeoNames?

## Thanks to

- https://github.com/openlayers/ol-browserify
- https://openlayers.org/en/latest/examples/overlay.html
- https://www.purpleair.com
