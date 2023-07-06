#!/bin/bash

set -e 

CONFIG="$HOME/.config/eww/bars/default"
WIDGETS="$HOME/.config/eww/widgets"

if [[ ! "pidof eww" ]]; then
    eww daemon
    sleep 1
fi

windows="bar powermenu"

run_eww() {
    eww open-many $windows --config $CONFIG
}

run_eww
