#!/bin/bash

rm -rf build/ && mkdir build && cd build

cmake -DHAVE_SSE4_1=1 -DCMAKE_BUILD_TYPE=RELEASE -DCMAKE_INSTALL_PREFIX=. ..

make && make install
