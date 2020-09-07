#!/bin/bash
gcc -Wall -pthread -o $1 $1.c -lpigpio -lrt
