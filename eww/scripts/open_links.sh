#!/bin/bash

cmd="/usr/bin/librewolf --new-window"

case $1 in
--gh) $cmd "https://github.com" ;;
--rd) $cmd "https://reddit.com" ;;
*) "Invalid command" ;;
esac
