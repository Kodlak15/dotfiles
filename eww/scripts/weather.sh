#!/bin/bash

OWCLI="$HOME/bin/openweathercli"

get_temp() {
	max_tries=10
	for i in "$(seq 1 $max_tries)"; do
		temp="$($OWCLI --print temp)"
		if [[ ! "$temp" == "" ]]; then
			echo "${temp%.*}F"
			exit 0
		else
			# Failed to get temperature
			echo "N/A"
		fi
		sleep 2
	done
}

get_icon() {
	max_tries=10
	for i in "$(seq 1 $max_tries)"; do
		icon="$($OWCLI --print icon)"
		if [[ ! "$icon" == "" ]]; then
			echo "$icon"
			exit 0
		fi
		sleep 2
	done
}

get_level() {
	temp=$(get_temp)
	temp="${temp%*}"

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
}

case "$1" in
-t | --temp) get_temp ;;
-i | --icon) get_icon ;;
-l | --level) get_level ;;
*) echo "Invalid command" ;;
esac
