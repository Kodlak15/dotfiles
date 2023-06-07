# If Gentoo is the active OS: set up configurations, then start hyprland on login through tty
# If Arch is the active OS: set up configurations

if [[ ! -z $(uname -r | grep gentoo) ]]; then
    [ "$(tty)" = "/dev/tty1" ] \
       && ! pidof -s Hyprland > /dev/null 2>&1 \
       && /home/cody/dotfiles/gentoo/setup.sh \
       && /home/cody/.config/hypr/hypr-init.sh \
       && gentoo-pipewire-launcher \
    # Start the wallpaper daemon
    # /home/cody/bin/swww-bug-fix.sh 2> /home/cody/logs/swww-bug-fix.log
    # /home/cody/bin/swww-daemon 1> /home/cody/logs/swww-daemon.log 2> /home/cody/logs/swww-daemon.log
else
    /home/cody/dotfiles/arch/setup.sh
fi
