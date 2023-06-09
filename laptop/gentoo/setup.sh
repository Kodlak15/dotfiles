#!/bin/bash

# Automate the creation of symbolic links for each configuration

USERNAME=$(whoami)

function setup () {
    echo "Configuring desktop for Gentoo..."
    ln -sf /home/$USERNAME/dotfiles/laptop/gentoo/alacritty /home/$USERNAME/.config/
    ln -sf /home/$USERNAME/dotfiles/laptop/gentoo/nvim /home/$USERNAME/.config/
    ln -sf /home/$USERNAME/dotfiles/laptop/gentoo/eww /home/$USERNAME/.config/
    ln -sf /home/$USERNAME/dotfiles/laptop/gentoo/hypr /home/$USERNAME/.config/
    ln -sf /home/$USERNAME/dotfiles/laptop/gentoo/.zshrc /home/$USERNAME/
    ln -sf /home/$USERNAME/dotfiles/laptop/gentoo/.zprofile /home/$USERNAME/
    echo "Successfully configured desktop for Gentoo!"
}

function setup_no_replace () {
    echo "Configuring desktop for Gentoo..."
    ln -s /home/$USERNAME/dotfiles/laptop/gentoo/alacritty /home/$USERNAME/.config/
    ln -s /home/$USERNAME/dotfiles/laptop/gentoo/nvim /home/$USERNAME/.config/
    ln -s /home/$USERNAME/dotfiles/laptop/gentoo/eww /home/$USERNAME/.config/
    ln -s /home/$USERNAME/dotfiles/laptop/gentoo/hypr /home/$USERNAME/.config/
    ln -s /home/$USERNAME/dotfiles/laptop/gentoo/.zshrc /home/$USERNAME/
    ln -s /home/$USERNAME/dotfiles/laptop/gentoo/.zprofile /home/$USERNAME/
    echo "Successfully configured desktop for Gentoo!"
}

echo "0) Setup and replace current configurations"
echo "1) Setup and keep current configurations"
echo "*) Cancel"
read -p "-> " input
echo $input

case $input in
    0) setup;;
    1) setup_no_replace;;
    *) echo "Leaving setup...";; 
esac

