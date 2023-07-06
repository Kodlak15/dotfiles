#!/bin/bash

# Automate the creation of symbolic links for each configuration

function setup () {
    echo "Setting up configurations..."
    ln -sf $HOME/dotfiles/alacritty $HOME/.config/
    ln -sf $HOME/dotfiles/nvim $HOME/.config/
    ln -sf $HOME/dotfiles/eww $HOME/.config/
    ln -sf $HOME/dotfiles/hypr $HOME/.config/
    ln -sf $HOME/dotfiles/rofi $HOME/.config/
    ln -sf $HOME/dotfiles/zsh/.zshrc $HOME/
    ln -sf $HOME/dotfiles/zsh/.zprofile $HOME/
    echo "Successfully set up configurations!"
}

function setup_no_replace () {
    echo "Setting up configurations..."
    ln -s $HOME/dotfiles/alacritty $HOME/.config/
    ln -s $HOME/dotfiles/nvim $HOME/.config/
    ln -s $HOME/dotfiles/eww $HOME/.config/
    ln -s $HOME/dotfiles/hypr $HOME/.config/
    ln -s $HOME/dotfiles/rofi $HOME/.config/
    ln -s $HOME/dotfiles/zsh/.zshrc $HOME/
    ln -s $HOME/dotfiles/zsh/.zprofile $HOME/
    echo "Successfully set up configurations!"
}

echo "0) Setup and replace current configurations"
echo "1) Setup and keep current configurations"
echo "*) Cancel"
read -p "-> " input

case $input in
    0) setup;;
    1) setup_no_replace;;
    *) echo "Leaving setup...";; 
esac

