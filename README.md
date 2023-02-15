# Flight Schedule Manager(FSM)

FSM is developed and maintained by the virtual airlines, virtualEgret, and virtual egret is an open source software that others virtual airlines could use to help with their own virtual airlines operations.

## Supported Virtual Airlines Management Software

Below are a list of supported VAM softwares

- phpVMS v7

Other VAMs are not yet planned, but will be considered after phpVMS v7 has been finished.

## Features That are Not Planned

- Subfleet support in flights/pairs
- ACARS functionality

## System Requirements

- Windows 10 or above
- 500mb of RAM
- Needs Network Connection for Functions of Many Features

## Installation

Installation is easy. Download the installer from the releases tab and launch it(no admin rights needed), and the software will be installed

## Features

- Airports
  - Import
    - Import a csv file
      - Currently only support phpVMS exported csv
  - Export
    - Export to a format that phpVMS could read
  - Add
    - Follow a wizard to create an airport
    - Basic airport information is autofilled
  - Clear
    - Remove all imported/stored airports, to start over.
  - Edit
    - Follow a wizard to edit the airports
  - Delete
    - Delete the respective airports
- Flights
  - Pairs Page
    - Innovative 'pairs' system
      - Categorized into departure and arrival ICAO
    - Contains a table of all the departure/arrival pairs
    - Each pair have an option to be edited(flight page)
    - Import
      - Import a phpVMS flight plan
      - Automatically converts into pairs system
    - Export
      - Export all flights to a csv that phpVMS flight page accepts
    - Create New Pair
      - Creates a new pair from a user given departure to a user given arrival
    - Clear
      - Removes all pairs and flights from the application
  - Flight Page
    - List of all flights that starts in the pair departure, and ends in pair arrival

## Support

Support could be found through the discussion option from this repository. More technical support, however, should be raised through the issues feature.

## Bugs

Since this software is maintained and developed by solely one person from the IT team of virtualEgret, bugs are expected. Please raise an issue for bug reports!
