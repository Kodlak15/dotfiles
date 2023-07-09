#!/bin/bash

OWCLI="$(which openweathercli)"

temp="$($OWCLI --print temp)"
echo "${temp%.*}F"
