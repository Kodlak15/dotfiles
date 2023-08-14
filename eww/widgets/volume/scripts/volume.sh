#!/bin/bash

if command -v pactl &>/dev/null; then
	pactl get-sink-volume $(pactl get-default-sink) | awk -F '[^0-9]+' '/left:/{print $3}'
else
	amixer -D pulse sget Master | awk -F '[^0-9]+' '/Left:/{print $3}'
fi
