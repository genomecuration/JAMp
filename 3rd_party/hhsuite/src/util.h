/*
 * util.h
 *
 *  Created on: Mar 28, 2014
 *      Author: meiermark
 */

#ifndef UTIL_H_
#define UTIL_H_

#include <cassert>
#include <fstream>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/time.h>
#include <cstring>
#include <cmath>
#include <climits>
#include <float.h>
#include <vector>
#include <string>
#include <stdint.h>
#include "simd.h"
#include "util-inl.h"

// Round x_int up to nearest multiple of fac_int
#define ICEIL(x_int, fac_int) ((x_int + fac_int - 1) / fac_int) * fac_int


void split(const std::string& s, char c, std::vector<std::string>& v);

char *substr(char* substr, char* str, int a, int b);

// Allocate a memory-aligned matrix as a single block in memory (plus a vector for the pointers).
// This is important for matrices for which fast access is time-critical, as rows of
// the matrix will be consecutive in memory and hence access is relatively local.
// Each row of the matrix, matrix[i][0], is memory-aligned with multiples of ALIGN_FLOAT.
// Usage:
//      float** X = malloc_matrix<float>(400,1000);
//      ...
//      free(X);
template <typename T>
T** malloc_matrix(int dim1, int dim2) {

    // Compute mem sizes rounded up to nearest multiple of ALIGN_FLOAT
    size_t size_pointer_array = ICEIL(dim1*sizeof(T*), ALIGN_FLOAT);
    size_t dim2_padded = ICEIL(dim2*sizeof(T), ALIGN_FLOAT)/sizeof(T);

    T** matrix = (T**) mem_align( ALIGN_FLOAT, size_pointer_array + dim1*dim2_padded*sizeof(T) );
    if (matrix == NULL)
        return matrix;

    T* ptr = (T*) (matrix + (size_pointer_array/sizeof(T*)) );
    for (int i=0; i<dim1; ++i) {
        matrix[i] = ptr;
        for (int j=0; j<dim2; ++j)
            ptr[j] = T(0);
        ptr += dim2_padded;
    }
    return matrix;
}

// Similar to Perl's tr/abc/ABC/: Replaces all chars in str found in one list with characters from the second list
// Returns the number of replaced characters
int strtr(char* str, const char oldchars[], const char newchars[]);

// Similar to Perl's tr/abc//d: deletes all chars in str found in the list
// Returns number of removed characters
int strtrd(char* str, const char chars[]);

// Similar to Perl's tr/a-z//d: deletes all chars in str found in the list
// Returns number of removed characters
int strtrd(char* str, char char1, char char2);

// Counts the number of characters in str that are in range between char1 and char2
int strcount(char* str, char char1, char char2);

// transforms str into an all uppercase string
char* uprstr(char* str);

// transforms str into an all uppercase string
char* lwrstr(char* str);

// Returns leftmost integer in ptr and sets the pointer to first char after
// the integer. If no integer is found, returns INT_MIN and sets pt to NULL
int strint(char*& ptr);

// Same as strint, but interpretes '*' as default
int strinta(char*& ptr, int deflt = 99999);

// Returns leftmost float in ptr and sets the pointer to first char after
// the float. If no float is found, returns FLT_MIN and sets pt to NULL
float strflt(char*& ptr);

// Same as strint, but interpretes '*' as default
float strflta(char*& ptr, float deflt = 99999);

void QSortInt(int v[], int k[], int left, int right, int up = +1);

// QSort sorting routine. time complexity of O(N ln(N)) on average
// Sorts the index array k between elements i='left' and i='right' in such a way that afterwards
// v[k[i]] is sorted downwards (up=-1) or upwards (up=+1)
void QSortFloat(float v[], int k[], int left, int right, int up = +1);

void readU16(char** ptr, uint16_t &result);

void readU32(char** ptr, uint32_t &result);

#endif /* UTIL_H_ */
