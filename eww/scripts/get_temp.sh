#!/bin/bash

OWCLI="$HOME/bin/openweathercli"

max_tries=5
for i in "$(seq 1 $max_tries)"
do
    temp="$($OWCLI --print temp)"
    if [[ ! "$temp" == "" ]]; then
        echo "${temp%.*}F"
        exit 0
    fi
    sleep 2
done

# Failed to get temperature
echo "N/A"
