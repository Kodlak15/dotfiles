#!/usr/bin/env bash

set -e

WORKDIR="$HOME/dotfiles/eww/scripts/bars"
STATE="$HOME/.local/state/eww/state"

get_bar() {
	cat $STATE | grep "bar = " | awk -F 'bar = ' '{print $2}'
}

run() {
	if [[ -z "$1" ]]; then
		help
	elif [[ -z "$2" ]]; then
		bar="$(get_bar)"
		cmd="$1"
	else
		bar="$1"
		cmd="$2"
	fi

	case $bar in
	default)
		"$WORKDIR/default.sh" "$cmd"
		;;
	freeze)
		"$WORKDIR/freeze.sh" "$cmd"
		;;
	night)
		"$WORKDIR/night.sh" "$cmd"
		;;
	*)
		echo "No bar named $bar supported!"
		help
		;;
	esac

	# Update the state
	echo "bar = $bar" >"$STATE"
}

help() {
	echo -ne "
------------------------------------------------------------
  Help
------------------------------------------------------------
  # Syntax
    > run.sh /path/to/eww.yuck/directory command   
  # Available bars
    default
    freeze
  # Commands
    -s | --launch
    -l | --logs
    -k | --kill
    -r | --reload
    -i | --inspect
    -w | --windows
  # Print the help menu
    -h | --help
"
}

case $1 in
*) run $1 $2 ;;
esac
