---
title: "Fuel station VOC monitoring explained"
description: "Why VOC monitoring at fuel stations matters, how PID sensors work, and what to check on intrinsic safety, outputs, calibration and placement before buying."
category: technical-articles
date: 2026-09-15
author: selorin-editorial
heroImage: /images/station.jpg
heroAlt: "Fixed monitoring station installed outdoors for continuous air measurements"
translationKey: fuel-station-voc-monitoring-explained
relatedServices: [fuel-station-voc-monitoring, air-quality-monitoring]
relatedIndustries: [oil-gas, energy, commercial-facilities, logistics-warehousing]
keyTakeaways:
  - "Volatile organic compounds (VOCs) are released at fuel stations during tanker unloading, vehicle refuelling, tank breathing and from leaks, and they affect air quality, worker health and fire safety."
  - "Fuel stations fall within the scope of environmental compliance monitoring overseen by NCEC, and vapour emissions are an area of growing regulatory attention."
  - "Photoionisation detectors (PIDs) are the most common technology for continuous VOC monitoring because they respond quickly and measure low concentrations."
  - "Monitors installed in hazardous areas must be certified for that classification, and outputs, alarms, logging and traceable calibration determine whether the data can be relied on."
  - "Confirm current monitoring and reporting requirements for your station with the competent authority before specifying equipment."
faqs:
  - q: "Is VOC monitoring mandatory for fuel stations in Saudi Arabia?"
    a: "Requirements depend on the station, its permit conditions and the current position of the competent authority. Fuel stations are subject to environmental compliance monitoring under the Environmental Law and its Implementing Regulations, and vapour emissions are receiving increasing attention. Check your permit conditions and confirm current requirements directly with NCEC before deciding on a monitoring approach."
  - q: "What is the difference between a PID and an LEL sensor?"
    a: "An LEL (lower explosive limit) sensor, usually catalytic or infrared, is designed for safety: it warns when flammable vapour approaches explosive concentrations. A PID measures much lower VOC concentrations, typically in parts per million or below, which makes it suitable for environmental and exposure monitoring. Some stations use both, for different purposes."
  - q: "How often does a PID need calibration?"
    a: "Calibration frequency depends on the manufacturer's recommendations, site conditions and any requirements in your permit or monitoring plan. Dusty, humid or hot conditions can increase drift and lamp contamination. Many operators combine periodic calibration with traceable reference gas and more frequent bump tests, and keep records of both."
---

Fuel station VOC monitoring is the continuous or periodic measurement of volatile organic compound vapours released during fuel delivery, storage and dispensing. It gives station owners evidence of how much vapour is escaping, where and when, and supports environmental compliance, worker protection and fire safety. In practice, most fixed systems use photoionisation detectors (PIDs) with alarm outputs and data logging.

This article explains why the topic is getting regulatory attention, how the technology works and what station owners should check before buying.

## Why VOC monitoring at fuel stations matters

Petrol contains volatile hydrocarbons, including benzene, that evaporate readily in Saudi Arabia's high temperatures. Vapour is released at several points:

- **Tanker unloading**, when vapour in the underground tank is displaced
- **Vehicle refuelling**, when vapour in the vehicle tank is displaced at the nozzle
- **Tank breathing**, through vent pipes as temperature and pressure change
- **Leaks and spills**, from fittings, dispensers, seals and hoses

VOCs contribute to ground-level ozone formation, some are harmful to health with prolonged exposure, and high concentrations create a fire and explosion risk. Fuel stations are often located close to homes, schools and busy roads, which makes their emissions visible to communities.

## The regulatory context

Fuel stations fall within the scope of environmental compliance monitoring carried out by the National Center for Environmental Compliance (NCEC) under the Environmental Law and its Implementing Regulations, and vapour emissions are an area of growing regulatory attention. Specific requirements for monitoring, vapour recovery and reporting depend on the station and its permit, and they may change. Station owners should review their permit conditions and confirm current requirements with NCEC before specifying a system, rather than relying on general guidance.

## How PID technology works

A photoionisation detector uses an ultraviolet lamp to ionise VOC molecules drawn into or diffusing into the sensor. The resulting current is proportional to the concentration. Key characteristics:

- **Fast response**, suitable for detecting short events such as tanker unloading
- **Low detection range**, measuring concentrations far below explosive levels
- **Broad-band response**, measuring total VOCs rather than individual compounds
- **Compound-specific sensitivity**, expressed through correction factors relative to the calibration gas

Because a PID reads total VOCs, results are usually reported as equivalent to the calibration gas. If speciation, for example of benzene, is needed, it requires additional sampling and laboratory analysis or a dedicated instrument.

## Intrinsic safety in hazardous areas

Areas around dispensers, tank vents and fill points are classified as hazardous because flammable vapour may be present. Any electrical equipment installed there must be certified for the relevant hazardous-area zone and gas group, typically under IECEx or ATEX schemes. Intrinsically safe or flameproof designs prevent the instrument from becoming an ignition source.

Check that certification covers the complete installation, including barriers, cable glands and enclosures, and that installation follows the certificate conditions. Hazardous-area classification of the station should be confirmed by a competent person before sensors are positioned.

## Outputs, alarms and data logging

| Feature | What it does | What to check |
|---|---|---|
| 4–20 mA output | Analogue signal to a controller or PLC | Scaling, loop powering and compatibility with existing systems |
| Modbus (RTU or TCP) | Digital data, including status and diagnostics | Register map, addressing, cable runs and network security |
| Alarm relays | Trigger alarms, shut-offs or ventilation at set points | Number of relays, configurable set points, latching and fail-safe behaviour |
| Data logging | Stores time-stamped readings | Storage interval, capacity, time synchronisation and tamper resistance |
| Remote reporting | Sends data to a dashboard or central system | Data format, export options and connectivity in the station |

Alarm set points should be based on the monitoring objective, the station's risk assessment and any applicable requirements, and each alarm level should be linked to a defined response. Logged data is only useful if it is reviewed: assign someone to check trends and investigate unusual readings.

## Calibration with traceable gas

Calibration establishes the link between sensor signal and concentration. For defensible data:

- Use calibration gas with a certificate of analysis traceable to recognised standards
- Calibrate zero and span according to the manufacturer's procedure
- Carry out bump tests between calibrations to confirm the sensor responds
- Record date, gas lot, before and after readings and the technician
- Clean or replace the UV lamp and filters as recommended

PID lamps can be affected by dust and humidity, both common in Saudi conditions, so maintenance intervals may need to be shorter than in temperate climates.

## Sensor placement

Placement determines whether the system detects what matters. General principles:

- Position sensors near the main emission points: dispenser islands, fill points and vent stacks
- Consider prevailing wind and site layout, so sensors are downwind of likely sources
- Place a reference sensor at the boundary or upwind to distinguish station emissions from background
- Mount at heights suited to the purpose: petrol vapour is heavier than air and accumulates low, while vent emissions disperse at height
- Protect sensors from direct vehicle impact, sun exposure and water ingress, while keeping access for maintenance

## Selection checklist for station owners

- [ ] Monitoring objective defined (compliance, exposure, leak detection or a combination)
- [ ] Current requirements confirmed with the competent authority
- [ ] Hazardous-area classification confirmed and equipment certified accordingly
- [ ] PID measurement range and resolution suited to the objective
- [ ] Outputs (4–20 mA, Modbus) compatible with existing control systems
- [ ] Alarm relays with configurable set points and defined responses
- [ ] Data logging with adequate interval, capacity and tamper resistance
- [ ] Calibration procedure with traceable gas, and local support for maintenance
- [ ] Operating temperature and ingress protection suited to site conditions
- [ ] Sensor layout justified in a short monitoring plan
- [ ] Responsibility assigned for data review and record keeping

## How Selorin can help

Selorin's fuel station VOC monitoring service covers monitoring plan design, sensor placement, data review and reporting, and draws on our wider air quality monitoring work. A short site review is a practical way to confirm the monitoring objective and layout before committing to equipment.
