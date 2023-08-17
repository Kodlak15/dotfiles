#!/bin/bash

set -e 

CONFIG="$HOME/.config/eww/bars/default"
WIDGETS="$HOME/.config/eww/widgets"
EWW="$HOME/bin/eww"

if [[ ! "$(pidof $EWW)" ]]; then
    $EWW daemon
    sleep 1
fi

windows="bar"

run_eww() {
    "$EWW" open $windows --config "$CONFIG"
}

run_eww
