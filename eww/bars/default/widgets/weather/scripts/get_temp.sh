#!/bin/bash

temp=$($HOME/bin/openweathercli --print temp)
echo "${temp%.*}F"
