# pto3-web
This project implements a web front end for visualizing data of the [PTO 3](https://github.com/mami-project/pto3-go).

## Feature List
The file [features.json](json/features.json) contains a list of features. For each feature a separate tab is shown on the navigation bar.
### Key
The key of a property of the root object is the id of the feature. It is expected that for each property with the key "[feature]" there is a JSON file "[feature].json" which contains the configuration of the page for that feature. Usually this corresponds to a feature in the [PTO](https://github.com/mami-project/pto3-go).
### linktitle
The property linktitle of a feature is used as the text of the link to display in the navigation bar.

## Feature Configuration
Each feature of [features.json](json/features.json) is configured in a separate JSON file.
### query
The url of the cached query in the [PTO](https://github.com/mami-project/pto3-go) which provides the data for this feature.
### title
The title to be shown in the header of the feature page.
### description
The description displayed underneath the title on the feature page.
### charts
An array of chart configurations.

## Chart Configuration
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
