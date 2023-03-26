#!/bin/bash

# Automate the creation of symbolic links for each configuration

# i3
echo "Checking for i3 config directory"
if [[ -d ~/.config/i3 ]]; then
	echo "Overwrite exiting directory? (y/n):"
	read input
	if [ $input == 'y' ]; then
		echo "Overwriting existing directory"
		# Remove existing link/directory
		rm -rf ~/.config/i3
		# Create new symbolic link from dotfiles directory
		ln -s ~/dotfiles/i3 ~/.config
	else
		echo "Skipping"
	fi
else
	echo "Creating new config directory"
	# Create new symbolic link from dotfiles directory
	ln -s ~/dotfiles/i3 ~/.config
fi
echo "--------------------"

# alacritty
echo "Checking for alacritty config directory"
if [[ -d ~/.config/alacritty ]]; then
	echo "Overwrite exiting directory? (y/n):"
	read input
	if [ $input == 'y' ]; then
		echo "Overwriting existing directory"
		# Remove existing link/directory
		rm -rf ~/.config/alacritty
		# Create new symbolic link from dotfiles directory
		ln -s ~/dotfiles/alacritty ~/.config
	else
		echo "Skipping"
	fi
else
	echo "Creating new config directory"
	# Create new symbolic link from dotfiles directory
	ln -s ~/dotfiles/alacritty ~/.config
fi
echo "--------------------"

# neovim
echo "Checking for neovim config directory"
if [[ -d ~/.config/nvim ]]; then
	echo "Overwrite exiting directory? (y/n):"
	read input
	if [ $input == 'y' ]; then
		echo "Overwriting existing directory"
		# Remove existing link/directory
		rm -rf ~/.config/nvim
		# Create new symbolic link from dotfiles directory
		ln -s ~/dotfiles/nvim ~/.config
	else
		echo "Skipping"
	fi
else
	echo "Creating new config directory"
	# Create new symbolic link from dotfiles directory
	ln -s ~/dotfiles/nvim ~/.config
fi
echo "--------------------"

# picom
echo "Checking for picom config directory"
if [[ -d ~/.config/picom ]]; then
	echo "Overwrite exiting directory? (y/n):"
	read input
	if [ $input == 'y' ]; then
		echo "Overwriting existing directory"
		# Remove existing link/directory
		rm -rf ~/.config/picom
		# Create new symbolic link from dotfiles directory
		ln -s ~/dotfiles/picom ~/.config
	else
		echo "Skipping"
	fi
else
	echo "Creating new config directory"
	# Create new symbolic link from dotfiles directory
	ln -s ~/dotfiles/picom ~/.config
fi
echo "--------------------"

# polybar
echo "Checking for polybar config directory"
if [[ -d ~/.config/polybar ]]; then
	echo "Overwrite exiting directory? (y/n):"
	read input
	if [ $input == 'y' ]; then
		echo "Overwriting existing directory"
		# Remove existing link/directory
		rm -rf ~/.config/polybar
		# Create new symbolic link from dotfiles directory
		ln -s ~/dotfiles/polybar ~/.config
	else
		echo "Skipping"
	fi
else
	echo "Creating new config directory"
	# Create new symbolic link from dotfiles directory
	ln -s ~/dotfiles/polybar ~/.config
fi
echo "--------------------"

# hyprland
echo "Checking for hyprland config directory"
if [[ -d ~/.config/hypr ]]; then
	echo "Overwrite exiting directory? (y/n):"
	read input
	if [ $input == 'y' ]; then
		echo "Overwriting existing directory"
		# Remove existing link/directory
		rm -rf ~/.config/hypr
		# Create new symbolic link from dotfiles directory
		ln -s ~/dotfiles/hypr ~/.config
	else
		echo "Skipping"
	fi
else
	echo "Creating new config directory"
	# Create new symbolic link from dotfiles directory
	ln -s ~/dotfiles/hypr ~/.config
fi
echo "--------------------"

# zsh
echo "Checking for zsh config file"
if [[ -f ~/.zshrc ]]; then
	echo "Overwrite exiting file? (y/n):"
	read input
	if [ $input == 'y' ]; then
		echo "Overwriting existing file"
		# Remove existing link/directory
		rm ~/.zshrc
		# Create new symbolic link from dotfiles directory
		ln -s ~/dotfiles/.zshrc ~/
	else
		echo "Skipping"
	fi
else
	echo "Creating new config file"
	# Create new symbolic link from dotfiles directory
	ln -s ~/dotfiles/.zshrc ~/
fi
echo "--------------------"
