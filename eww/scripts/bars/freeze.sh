#!/bin/bash

set -e

CONFIG="$HOME/.config/eww/bars/freeze"
WIDGETS="$HOME/.config/eww/widgets"
EWW="$HOME/bin/eww"

launch() {
	if [[ ! "$(pidof $EWW)" ]]; then
		$EWW daemon
		sleep 1
	fi

	windows="bar"
	"$EWW" open $windows --config "$CONFIG"
}

logs() {
	"$EWW" logs -c "$CONFIG"
}

kill_() {
	"$EWW" kill -c "$CONFIG"
}

reload() {
	"$EWW" reload -c "$CONFIG"
}

inspect() {
	"$EWW" inspector -c "$CONFIG"
}

windows() {
	"$EWW" windows -c "$CONFIG"
}

case $1 in
-s | --launch) launch ;;
-l | --logs) logs ;;
-k | --kill) kill_ ;;
-r | --reload) reload ;;
-i | --inspect) inspect ;;
-w | --windows) windows ;;
*) echo "Invalid command" ;;
esac
