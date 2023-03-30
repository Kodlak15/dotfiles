#!/bin/bash

# Automate the creation of symbolic links for each configuration

echo "Configuring desktop for Gentoo..."

# Creaing general configuration links
ln -sf /home/cody/dotfiles/i3 /home/cody/.config/
ln -sf /home/cody/dotfiles/alacritty /home/cody/.config/
ln -sf /home/cody/dotfiles/nvim /home/cody/.config/
ln -sf /home/cody/dotfiles/picom /home/cody/.config/
ln -sf /home/cody/dotfiles/polybar /home/cody/.config/
ln -sf /home/cody/dotfiles/hypr /home/cody/.config/
# ln -sf /home/cody/dotfiles/.zprofile /home/cody/

# Creating OS specific configuration links
ln -sf /home/cody/dotfiles/gentoo/.zshrc /home/cody/
# ln -sf /home/cody/dotfiles/gentoo/.zprofile /home/cody/

echo "Successfully configured desktop for Gentoo!"
