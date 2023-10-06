WPMGR="$HOME/Documents/projects/swww_manager"
CMD="$WPMGR/swww_manager.py"

next() {
	dir="$(cat $HOME/Documents/projects/swww_manager/config.yaml | head -n 1 | awk -F '/' '{print $3}')"
	$CMD -d $dir
}

previous() {
	dir="$(cat $HOME/Documents/projects/swww_manager/config.yaml | head -n 1 | awk -F '/' '{print $3}')"
	$CMD -d $dir -p
}

current() {
	# TODO
	# Should handle some of this withing swww_manager
	dir="$(cat $HOME/Documents/projects/swww_manager/config.yaml | head -n 1 | awk -F '/' '{print $3}')"
	img="$(cat $HOME/Documents/projects/swww_manager/config.yaml | awk -F 'img: ' '{print $2}')"
	echo $WPMGR/images/$dir/$img | tr -d ' '
}

case $1 in
-n | --next) next ;;
-p | --previous) previous ;;
-c | --current) current ;;
*) echo "Invalid command: $1" ;;
esac
