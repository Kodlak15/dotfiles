#!/bin/bash

set -e

# Automate the creation of symbolic links for each configuration

if [[ ! -d "$HOME/.config/hypr/" ]]; then
	mkdir $HOME/.config/hypr
fi

function setup() {
	echo "Setting up configurations..."
	ln -snf $HOME/dotfiles/alacritty $HOME/.config/
	# ln -snf $HOME/dotfiles/nvim/mynvim $HOME/.config/nvim     # Use my nvim config
	ln -snf $HOME/dotfiles/nvim/lazyvim $HOME/.config/nvim # Use lazyvim config
	ln -snf $HOME/dotfiles/eww/ $HOME/.config/
	ln -snf $HOME/dotfiles/hypr/$1/hyprland.conf $HOME/.config/hypr/
	ln -snf $HOME/dotfiles/rofi/$1 $HOME/.config/rofi/
	ln -snf $HOME/dotfiles/zsh/$1/.zshrc $HOME/
	ln -snf $HOME/dotfiles/zsh/$1/.zprofile $HOME/
	echo "Successfully set up configurations!"
}

function setup_no_replace() {
	echo "Setting up configurations..."
	ln -s $HOME/dotfiles/alacritty $HOME/.config/
	# ln -s $HOME/dotfiles/nvim/mynvim $HOME/.config/nvim       # Use my nvim config
	ln -s $HOME/dotfiles/nvim/lazyvim $HOME/.config/nvim # Use lazyvim config
	ln -s $HOME/dotfiles/eww/ $HOME/.config/
	ln -s $HOME/dotfiles/hypr/$1/hyprland.conf $HOME/.config/hypr/
	ln -s $HOME/dotfiles/rofi/$1 $HOME/.config/rofi/
	ln -s $HOME/dotfiles/zsh/$1/.zshrc $HOME/
	ln -s $HOME/dotfiles/zsh/$1/.zprofile $HOME/
	echo "Successfully set up configurations!"
}

if [[ ! -z $(ls /sys/class/power_supply) ]]; then
	mode="laptop"
	echo "Detected laptop..."
else
	mode="desktop"
	echo "Detected desktop..."
fi

echo "0) Setup and replace current configurations"
echo "1) Setup and keep current configurations"
echo "*) Cancel"
read -p "-> " input

case $input in
0) setup $mode ;;
1) setup_no_replace $mode ;;
*) echo "Leaving setup..." ;;
esac
