#!/bin/bash

set -e 

CONFIG="$HOME/.config/eww/bars/default"
WIDGETS="$HOME/.config/eww/widgets"
EWW="$(which eww)"

if [[ ! "$(pidof $EWW)" ]]; then
    eww daemon
    sleep 1
fi

windows="bar"

run_eww() {
    "$EWW" open $windows --config "$CONFIG"
}

run_eww
