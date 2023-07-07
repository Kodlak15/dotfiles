#!/bin/bash

OWCLI=$(which openweathercli)

echo "$HOME/.config/owcli/icons/$($OWCLI --print icon).png"
