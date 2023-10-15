#!/bin/bash

mynvim() {
	ln -snf $HOME/dotfiles/nvim/mynvim/ $HOME/.config/nvim
}

lazyvim() {
	ln -snf $HOME/dotfiles/nvim/lazyvim/ $HOME/.config/nvim
}

case $1 in
-m | --mynvim) mynvim ;;
-l | --lazyvim) lazyvim ;;
*) echo "Invalid command..." ;;
esac
