//
// Created by mad on 10/26/15.
//
#include <iostream>

#include "SubstitutionMatrix.h"
#include "Sequence.h"
#include "Parameters.h"

int main (int argc, const char * argv[]) {

    const size_t kmer_size = 6;

    Parameters& par = Parameters::getInstance();
    SubstitutionMatrix subMat(par.scoringMatrixFile.c_str(), 8.0, 0);
    std::cout << "Subustitution matrix:\n";
    SubstitutionMatrix::print(subMat.subMatrix, subMat.int2aa, subMat.alphabetSize);

    const char *ref = "GKILII";
    Sequence refSeq(1000, subMat.aa2int, subMat.int2aa, 0,kmer_size, false, true);
    refSeq.mapSequence(0, 0, ref);

    const char *similar = "GKVLYL";
    Sequence similarSeq(1000, subMat.aa2int, subMat.int2aa, 0, kmer_size, false, true);
    similarSeq.mapSequence(0, 1, similar);


    short score = 0;
        for(size_t i = 0; i < kmer_size; i++){
            score += subMat.subMatrix[refSeq.int_sequence[i]][similarSeq.int_sequence[i]];
        }
    std::cout << score << std::endl;

    return 0;
}
