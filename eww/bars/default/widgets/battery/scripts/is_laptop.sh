#!/bin/bash

if [[ ! -z $(ls /sys/class/power_supply/) ]]; then
    echo true
else
    echo false
fi
