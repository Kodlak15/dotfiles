time_elapsed() {
	res="$($HOME/Documents/projects/sptfycli/sptfy.py -e)"
	if [[ ! -z $res ]]; then
		echo $res
	else
		echo "0"
	fi
}

case $1 in
-e | --e) time_elapsed ;;
*) echo "Invalid command" ;;
esac
