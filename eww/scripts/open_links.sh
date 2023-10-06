#!/bin/bash

cmd="/usr/bin/librewolf --new-tab"

close_dashboard() {
	"$HOME/dotfiles/eww/scripts/dashboard.sh" -t "$HOME/dotfiles/eww/bars/default"
}

case $1 in
--gh) $cmd "https://github.com" && close_dashboard ;;
--rd) $cmd "https://reddit.com" && close_dashboard ;;
--gt) $cmd "https://gentoo.org" && close_dashboard ;;
*) $cmd && close_dashboard ;;
esac
