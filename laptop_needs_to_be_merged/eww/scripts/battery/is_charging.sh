#!/bin/bash

if [[ -z $(acpi -b | grep Discharging ) ]]; then
    echo true
else
    echo false
fi
