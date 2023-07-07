#!/bin/bash

set -e 

CONFIG="$HOME/.config/eww/bars/default"
WIDGETS="$HOME/.config/eww/widgets"
EWW=$(which eww)

if [[ ! $(pidof $EWW) ]]; then
    eww daemon
    sleep 1
fi

windows="bar powermenu"

run_eww() {
    $EWW open-many $windows --config $CONFIG
}

run_eww 2> $HOME/logs/eww_launch_default.log
