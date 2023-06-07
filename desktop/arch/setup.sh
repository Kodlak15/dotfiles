#!/bin/bash

# Automate the creation of symbolic links for each configuration

# Creaing general configuration links
ln -sf /home/cody/dotfiles/i3 /home/cody/.config/
ln -sf /home/cody/dotfiles/alacritty /home/cody/.config/
ln -sf /home/cody/dotfiles/nvim /home/cody/.config/
ln -sf /home/cody/dotfiles/picom /home/cody/.config/
ln -sf /home/cody/dotfiles/polybar /home/cody/.config/
ln -sf /home/cody/dotfiles/hypr /home/cody/.config/
# ln -sf /home/cody/dotfiles/.zprofile /home/cody/

# Creating OS specific configuration links
ln -sf /home/cody/dotfiles/arch/.zshrc /home/cody/
# ln -sf /home/cody/dotfiles/arch/.zprofile /home/cody/
