#!/bin/bash

EWW="$HOME/bin/eww"
CONFIG="$1"

if [[ -z "$($EWW windows -c $CONFIG | grep '\*dashboard' )" ]]; then
    $EWW open dashboard -c $CONFIG
else
    $EWW close dashboard -c $CONFIG
fi
