#!/bin/bash

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
