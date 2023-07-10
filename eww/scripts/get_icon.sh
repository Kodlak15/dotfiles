#!/bin/bash

OWCLI="HOME/bin/openweathercli"

icon="$($OWCLI --print icon)"
echo "$icon"
