#!/bin/bash

function change_volume() {
	current_vol="$(wpctl get-volume @DEFAULT_AUDIO_SINK@ | awk -F ' ' '{print $2}')"
	new_vol="$1"
	delta="$(echo $new_vol-$current_vol | bc)"

	if [ "$(echo $delta | awk -F '.' '{print $1}')" == '-' ]; then
		sign="-"
		delta="$(echo $delta | awk -F '-' '{print $2}')"
	else
		sign="+"
	fi

	if [[ $sign == '+' ]]; then
		# echo $delta
		# echo "Lezzgo"
		wpctl set-volume @DEFAULT_AUDIO_SINK@ $delta+
	else
		# echo $delta
		# echo "Yezzir"
		wpctl set-volume @DEFAULT_AUDIO_SINK@ $delta-
	fi

}

change_volume $1
