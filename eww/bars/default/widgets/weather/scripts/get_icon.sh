#!/bin/bash

OWCLI="$(which openweathercli)"

icon="$($OWCLI --print icon)"
echo "$icon"
