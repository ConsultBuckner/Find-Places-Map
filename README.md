# Find-Places-Map

[The Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview), part of the Google Maps Platform, allows searching for places by keyword via the Places API Text Search feature. While the service allows you to geo-fence your query, there is a strict limit of 60 results with each place result incurring the maximum fee from Google. This means it is nearly impossible to get a complete list of places from a Google Maps search. 

[MapQuest](https://developer.mapquest.com/) offers a similar [API](https://developer.mapquest.com/documentation/search-api/v4/swagger/) but with a 500 place result limit and a generous 15000 place API requests per month for free. This project utilizes the base Google Maps API for displaying the results from the MapQuest Place Search API with the visible map bounds acting as a geo-fence.

Additionally, to make sure all possible results are returned, the app will exponentially subdivide or tessellate the visible map bounds into smaller search areas of equal size as the total area of the map bounds increases by zooming further out. Each subdivision triggers an asynchronous Places API request. 

Finally the app offers the option to copy the results to the clipboard, or export a tab-delimited document with all the results. And for curious users, there is a Toggle Matrix button which will reveal the tessellated search matrix on the map with each rectangle showing how many requests were run and results returned from the MapQuest Places Search API. This last feature utilizes the [Google Maps Overlay View](https://developers.google.com/maps/documentation/javascript/customoverlays) object that is subclassed to allow drawing custom text labels directly onto the map Overlay Pane by further manipulation of the [MVCObject Class](https://developers.google.com/maps/documentation/javascript/reference/event#MVCObject). 


