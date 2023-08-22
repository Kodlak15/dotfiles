#!/bin/bash

cmd="librewolf --new-tab"

case $1 in
--gh) "$cmd https://github.com" ;;
--reddit) "$cmd https://reddit.com" ;;
esac
