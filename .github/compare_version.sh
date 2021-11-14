#!/bin/bash

TARGET=(${1//./ })
SOURCE=(${2//./ })

if [ "${SOURCE[0]}" -gt "${TARGET[0]}" ]; then
    exit 0
elif [ "${SOURCE[1]}" -gt "${TARGET[1]}" ]; then
    exit 0
elif [ "${SOURCE[2]}" -gt "${TARGET[2]}" ]; then
    exit 0
fi

exit 1
