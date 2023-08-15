#!/bin/bash

battery_remaining() {
	rem="$(acpi -b | awk -F ', ' '{print$2}' | awk -F '%' '{print$1}')"
	echo $rem
}

get_level() {
	batrem=$(acpi -b | awk -F ', ' '{print$2}' | awk -F '%' '{print$1}')
	if [[ $batrem -lt "20" ]]; then
		echo "0"
	elif [[ "$batrem" -lt "40" ]]; then
		echo "1"
	elif [[ "$batrem" -lt "60" ]]; then
		echo "2"
	elif [[ "$batrem" -lt "80" ]]; then
		echo "3"
	else
		echo "4"
	fi
}

is_charging() {
	if [[ -z $(acpi -b | grep Discharging) ]]; then
		echo true
	else
		echo false
	fi
}

is_laptop() {
	if [[ ! -z $(ls /sys/class/power_supply/) ]]; then
		echo true
	else
		echo false
	fi
}

is_low() {
	rem="$(acpi -b | awk -F ', ' '{print $2}')"
	rem="${rem:0:2}"
	if [[ $rem -le 20 ]]; then
		echo true
	else
		echo false
	fi
}

case "$1" in
-r | --remaining) battery_remaining ;;
-l | --level) get_level ;;
-c | --charging) is_charging ;;
-x | --laptop) is_laptop ;;
-w | --low) is_low ;;
*) echo "Invalid command" ;;
esac
