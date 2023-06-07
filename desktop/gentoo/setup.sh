#!/bin/bash

# Automate the creation of symbolic links for each configuration

echo "Configuring desktop for Gentoo..."

# Creaing general configuration links
ln -sf /home/cody/dotfiles/alacritty /home/cody/.config/
ln -sf /home/cody/dotfiles/nvim /home/cody/.config/
ln -sf /home/cody/dotfiles/waybar /home/cody/.config/
ln -sf /home/cody/dotfiles/hypr /home/cody/.config/

# Creating OS specific configuration links
ln -sf /home/cody/dotfiles/gentoo/.zshrc /home/cody/

echo "Successfully configured desktop for Gentoo!"
