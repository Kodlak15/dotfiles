#!/bin/bash

temp="$($HOME/.config/eww/bars/default/widgets/weather/scripts/get_temp.sh)"

if [[ "$temp" -lt "20" ]]; then 
    echo "0"
elif [[ "$temp" -lt "40" ]]; then
    echo "1"
elif [[ "$temp" -lt "60" ]]; then
    echo "2"
elif [[ "$temp" -lt "80" ]]; then
    echo "3"
else 
    echo "4"
fi
