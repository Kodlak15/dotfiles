#!/bin/bash

EWW="$HOME/bin/eww"
CONFIG="$2"

toggle() {
	if [[ -z "$($EWW windows -c $CONFIG | grep '\*dashboard')" ]]; then
		$EWW open dashboard -c $CONFIG
	else
		$EWW close dashboard -c $CONFIG
	fi
}

case "$1" in
-t | --toggle) toggle ;;
*) echo "Invalid command" ;;
esac
