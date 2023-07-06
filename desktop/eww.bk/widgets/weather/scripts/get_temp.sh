#!/bin/bash

temp=$($HOME/bin/openweathercli --key $(pass openweather) --print temp)
echo "${temp%.*}F"
