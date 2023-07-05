#!/bin/bash

icon=$($HOME/bin/openweathercli --key $(pass openweather) --print icon)
echo "$HOME/.config/owcli/icons/$icon.png"
