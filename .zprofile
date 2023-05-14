# If Gentoo is the active OS: set up configurations, then start hyprland on login through tty
# If Arch is the active OS: set up configurations

if [[ ! -z $(uname -r | grep gentoo) ]]; then
   [ "$(tty)" = "/dev/tty1" ] && ! pidof -s Hyprland > /dev/null 2>&1 && /home/cody/dotfiles/gentoo/setup.sh && /home/cody/.config/hypr/hypr-init.sh 
    swww init
else
    /home/cody/dotfiles/arch/setup.sh
fi
