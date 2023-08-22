#!/bin/bash

EWW="$HOME/bin/eww"
# CONFIG="$2"
CONFIG="$HOME/.config/eww/bars/default/"

battery() {
	if [[ -z "$($EWW windows -c $CONFIG | grep '\*batteryd')" ]]; then
		$EWW open batteryd -c $CONFIG
	else
		$EWW close batteryd -c $CONFIG
	fi
}

case $1 in
-b | --battery) battery ;;
*) echo "Invalid command" ;;
esac
