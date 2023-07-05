#!/bin/bash

# Get the main css file
CSS="/home/cody/dotfiles/laptop/gentoo/eww/eww.scss"
CURRENT_THEME=$1
NEW_THEME=$2


# Replace the theme
sed -i "s/$CURRENT_THEME.\$alert/$NEW_THEME.\$alert/g" $CSS
sed -i "s/$CURRENT_THEME.\$accent/$NEW_THEME.\$accent/g" $CSS
sed -i "s/$CURRENT_THEME.\$accent-dark/$NEW_THEME.\$accent-dark/g" $CSS
