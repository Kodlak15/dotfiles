#!/bin/bash

EWW="$HOME/bin/eww"
# CONFIG="$2"
CONFIG="$HOME/.config/eww/bars/default/"

battery() {
	if [[ -z "$($EWW windows -c $CONFIG | grep '\*batteryd')" ]]; then
		# Close interfering windows before opening
		if [[ ! -z "$($EWW windows -c $CONFIG | grep '\*calendard')" ]]; then
			$EWW close calendard -c $CONFIG
		fi
		$EWW open batteryd -c $CONFIG
	else
		$EWW close batteryd -c $CONFIG
	fi
}

calendar() {
	if [[ -z "$($EWW windows -c $CONFIG | grep '\*calendard')" ]]; then
		# Close interfering windows before opening
		if [[ ! -z "$($EWW windows -c $CONFIG | grep '\*batteryd')" ]]; then
			$EWW close batteryd -c $CONFIG
		fi
		$EWW open calendard -c $CONFIG
	else
		$EWW close calendard -c $CONFIG
	fi
}

case $1 in
-b | --battery) battery ;;
-c | --calendar) calendar ;;
*) echo "Invalid command" ;;
esac
