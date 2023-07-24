[ "$(tty)" = "/dev/tty1" ] \
   && ! pidof -s Hyprland > /dev/null 2>&1 \
   && /home/cody/bin/hypr_init.sh \
   && /usr/bin/gentoo-pipewire-launcher
