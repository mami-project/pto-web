# pto3-web
This project implements a web front end for visualizing data of the [PTO 3](https://github.com/mami-project/pto3-go).

## Configuration
The file [config.json](json/config.json) is the main configuration file for the pto3-web.
### directoryQuery
The URL of the query to be used for the directory matrix.
### pages
Holds all chart pages that will be available on the website. Each property defines a page.
#### Key
If the page corresponds to a feature, it's key should be the id of the feature.
#### linktitle
The text of the link to be displayed in the navigation bar.
#### pageConfig
The file name of the page configuration file

## Page Configuration
Each page defined in [config.json](json/config.json) is configured in a separate JSON file.
### title
The title to be shown in the header of the feature page.
### description
The description displayed underneath the title on the feature page.
### charts
An array of chart configurations.

## Chart Configuration
### query
The encoded query of which provides the data for the chart.
### title
The title of the chart to be shown in the above the chart.
### description
The description of the chart to be shown in the above the chart.
### conditions
The conditions which will be shown in this chart. Usually these are all conditions of one aspect in the [PTO](https://github.com/mami-project/pto3-go).
### colors
The color for each condition. The key must match a name of a condition.
### descriptions
The descriptions for each condition. The key must match a name of a condition.

## Dependencies
+ [C3js](https://github.com/c3js/c3) v0.6.7
+ [D3](https://github.com/d3/d3) v5.x
+ [Font-Awesome](https://github.com/FortAwesome/Font-Awesome)
+ [W3.css](https://www.w3schools.com/w3css/4/w3.css) 4.10
+ [w3-theme-black.css](https://www.w3schools.com/lib/w3-theme-black.css)

## License
MIT
