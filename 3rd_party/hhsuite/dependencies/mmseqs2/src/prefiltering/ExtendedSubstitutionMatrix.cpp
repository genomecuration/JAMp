#include "ExtendedSubstitutionMatrix.h"
#include "Indexer.h"
#include "Util.h"
#include "simd.h"

#include <iostream>
#include <iterator>
#include <cmath>

#include <cstdlib>

struct sort_by_score {
    bool operator()(const std::pair<short,unsigned int> left, const std::pair<short,unsigned int> right) {
        return left.first > right.first;
    }
};


ExtendedSubstitutionMatrix::ExtendedSubstitutionMatrix(short ** subMatrix,
                                                       const size_t kmerSize,
                                                       const size_t alphabetSize){
    this->size = pow(alphabetSize, kmerSize);
    size_t row_size = this->size / ALIGN_INT;
    row_size = (row_size + 1) * ALIGN_INT; // for SIMD memory alignment
    // create permutation
    std::vector<std::vector<int> > input(buildInput(kmerSize,alphabetSize));
    
    // score matrix is O(size^2). 64 is added for SSE
    short * score = (short *) mem_align(ALIGN_INT, (this->size * (row_size)) * sizeof(short));
    // index matrix is O(size^2). 64 is added for SSE
    unsigned int * index = (unsigned int *)mem_align(ALIGN_INT, (this->size * (row_size)) * sizeof(unsigned int));


    std::vector<std::vector<int> > permutation;
    std::vector<int> outputTemp;
    createCartesianProduct(permutation, outputTemp, input.begin(), input.end());
#pragma omp parallel
{
    std::pair<short,unsigned int> * tmpScoreMatrix = new std::pair<short, unsigned int> [this->size];
    Indexer indexer( (int) alphabetSize, (int) kmerSize);
    // fill matrix
#pragma omp for schedule(static)
    for(size_t i = 0; i < permutation.size(); i++) {
        const unsigned int i_index=indexer.int2index(&permutation[i][0]);
        
        for(size_t j = 0; j < permutation.size(); j++) {
            const unsigned int j_index=indexer.int2index(&permutation[j][0]);
            const short score=calcScore(&permutation[i][0],&permutation[j][0],kmerSize,subMatrix);
            tmpScoreMatrix[j].first  = score;
            tmpScoreMatrix[j].second = j_index;
        }
        std::stable_sort (tmpScoreMatrix, tmpScoreMatrix + this->size, sort_by_score());
        for (size_t z = 0; z < this->size; z++) {
            score[(i_index * row_size) + z] = tmpScoreMatrix[z].first;
            index[(i_index * row_size) + z] = tmpScoreMatrix[z].second;
        }
        for (size_t z = this->size; z < row_size; z++) {
            score[(i_index * row_size) + z] = -255;
            index[(i_index * row_size) + z] = 0;
        }
    }
    delete [] tmpScoreMatrix;
}
    outputTemp.clear();
    permutation.clear();
    this->scoreMatrix = new ScoreMatrix(score, index, size, row_size);

}


ExtendedSubstitutionMatrix::~ExtendedSubstitutionMatrix(){
    free((void *) scoreMatrix->index);
    free((void *) scoreMatrix->score);
    delete scoreMatrix;
}

short ExtendedSubstitutionMatrix::calcScore(int * i_seq,int * j_seq,size_t seq_size,short **subMatrix){
    short score = 0;
    for(size_t i = 0; i < seq_size; i++){
        score += subMatrix[i_seq[i]][j_seq[i]];
    }
    return score;
}

// Creates the input
std::vector<std::vector<int> > ExtendedSubstitutionMatrix::buildInput(size_t dimension,size_t range) {
    std::vector<std::vector<int> >  dimension_vector;
    
    for(size_t i = 0; i < dimension; i++) {
        std::vector<int> range_vector;
        for(size_t j = 0; j < range; j++) {
            range_vector.push_back(j);
        }
        dimension_vector.push_back(range_vector);
    }
    return dimension_vector;
}

// recursive algorithm to to produce cart. prod.
// At any given moment, "me" points to some Vi in the middle of the
// input data set.
//   for int i in *me:
//      add i to current result
//      recurse on next "me"
//
void ExtendedSubstitutionMatrix::createCartesianProduct(
                                                        std::vector<std::vector<int> > & output,  // final result
                                                        std::vector<int>&  current_result,   // current result
                                                        std::vector<std::vector<int> >::const_iterator current_input, // current input
                                                        std::vector<std::vector<int> >::const_iterator end) // final input
{
    if(current_input == end) {
        // terminal condition of the recursion. We no longer have
        // any input vectors to manipulate. Add the current result (rvi)
        // to the total set of results (rvvvi).
        output.push_back(current_result);
        return;
    }
    
    // need an easy name for my vector-of-ints
    const std::vector<int>& mevi = *current_input;
    for(std::vector<int>::const_iterator it = mevi.begin();it != mevi.end();it++) {
        current_result.push_back(*it);  // add ME
        createCartesianProduct(output, current_result, current_input+1, end);
        current_result.pop_back(); // clean current result off for next round
    }
}



