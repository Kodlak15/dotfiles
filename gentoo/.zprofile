#!/bin/bash

echo "Attempting to execute login script"

# If Gentoo is the active OS start hyprland on login through tty
[ "$(tty)" = "/dev/tty1" ] && ! pidof -s Hyprland >/dev/null 2>&1 && /home/cody/dotfiles/gentoo/setup.sh && /home/cody/.config/hypr/hypr-init.sh

echo "Finished executing login script"
