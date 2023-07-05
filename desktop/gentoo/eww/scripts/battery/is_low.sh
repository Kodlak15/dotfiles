#!/bin/bash

battery_remaining() {
    rem=$(acpi -b | awk -F ', ' '{print $2}')
    rem=${rem:0:2}
    echo $rem
}

if [[ $(battery_remaining) -le 20 ]]; then
    echo true
else
    echo false
fi
