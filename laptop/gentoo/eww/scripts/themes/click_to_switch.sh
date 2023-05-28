#!/bin/bash

# Get the current theme
CURRENT_THEME=$(cat /home/cody/dotfiles/laptop/gentoo/eww/state)


# Log files
ERRORLOG=/home/cody/logs/swww/errors.log

# Switch to the next theme
(
    case $CURRENT_THEME in
        "mountains") /home/cody/bin/theme-select.sh -f;;
        "forest") /home/cody/bin/theme-select.sh -s;;
        "space") /home/cody/bin/theme-select.sh -o;;
        "ocean") /home/cody/bin/theme-select.sh -m;;
        *) break;;
    esac
) 2>$ERRORLOG
