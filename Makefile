SHELL := /bin/bash

all: 
	if [ ! -d 3rd_party/bin ]; then mkdir 3rd_party/bin; fi
	cd 3rd_party/cdbtools/cdbfasta && $(MAKE) && cp cdbfasta ../../bin/ && cp cdbyank ../../bin/ && $(MAKE) clean
	cd 3rd_party/parafly && ./configure --prefix=`pwd`/../ && if [ ! -d bin ]; then mkdir bin; fi && $(MAKE) install
	cd 3rd_party/transdecoder && $(MAKE)
	cd databases/hhblits && echo "Uncompressing databases, this may take a while..." find . -name "*tar.bz2" -exec tar -xjf '{}' \;
	chmod -R a+rx 3rd_party/bin
	echo "Installation complete."
clean:
	cd 3rd_party/cdbtools/cdbfasta && $(MAKE) clean
	cd 3rd_party/parafly && $(MAKE) clean
	cd 3rd_party/transdecoder && $(MAKE) clean
	rm -fr 3rd_party/bin

test:
	cd test_suite && bash runme.sh && bash cleanme.sh

###################################################################


