/*
 * hhblits_mpi.cpp
 *
 *  Created on: Apr 1, 2014
 *      Author: Markus Meier (markus.meier@mpibpc.mpg.de)
 */

#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>
#include "hhdecl.h"
#include "hhblits.h"

extern "C" {
    #include <ffindex.h>
    #include <mpq/mpq.h>
}
#ifdef OPENMP
    #include <omp.h>
#endif



struct OutputFFIndex {
    char base[NAMELEN];
    FILE* data_fh;
    FILE* index_fh;
    size_t offset;
    void (*print)(HHblits&, std::stringstream&);

    void close() {
      fclose(data_fh);
      fclose(index_fh);
    }

    void saveOutput(HHblits& hhblits, char* name) {
      std::stringstream out;
      print(hhblits, out);

      std::string tmp = out.str();
      ffindex_insert_memory(data_fh, index_fh, &offset,
          const_cast<char*>(tmp.c_str()), tmp.size(), name);

      fflush(data_fh);
      fflush(index_fh);
    }
};

void makeOutputFFIndex(char* par, const int mpi_rank,
    void (*print)(HHblits&, std::stringstream&),
    std::vector<OutputFFIndex>& outDatabases) {
  if (*par) {
    OutputFFIndex db;

    strcpy(db.base, par);
    db.offset = 0;
    db.print = print;

    char data_filename_out_rank[NAMELEN];
    char index_filename_out_rank[NAMELEN];

    snprintf(data_filename_out_rank, FILENAME_MAX, "%s.ffdata.%d", par,
        mpi_rank);
    snprintf(index_filename_out_rank, FILENAME_MAX, "%s.ffindex.%d", par,
        mpi_rank);

    db.data_fh = fopen(data_filename_out_rank, "w+");
    db.index_fh = fopen(index_filename_out_rank, "w+");

    if (db.data_fh == NULL) {
      HH_LOG(WARNING) << "Could not open datafile " << data_filename_out_rank << std::endl;
      return;
    }

    if (db.index_fh == NULL) {
      HH_LOG(WARNING) << "Could not open indexfile " << index_filename_out_rank << std::endl;
      return;
    }

    outDatabases.push_back(db);
  }
}

void merge_splits(const char* prefix) {
  if (*prefix) {
    char data_filename[FILENAME_MAX];
    char index_filename[FILENAME_MAX];

    snprintf(data_filename, FILENAME_MAX, "%s.ffdata", prefix);
    snprintf(index_filename, FILENAME_MAX, "%s.ffindex", prefix);

    ffmerge_splits(data_filename, index_filename, 1, MPQ_size - 1, true);
  }
}

struct HHblits_MPQ_Wrapper {
  char *data;
  ffindex_index_t* index;
  HHblits* hhblits;
  std::vector<OutputFFIndex>* outputDatabases;

  HHblits_MPQ_Wrapper(char* data, ffindex_index_t* index, HHblits& hhblits, std::vector<OutputFFIndex>& outputDatabases) {
    this->data = data;
    this->index = index;
    this->hhblits = &hhblits;
    this->outputDatabases = &outputDatabases;
  }

  void Payload(const size_t start, const size_t end) {
    // Foreach entry in the input file
    for (size_t entry_index = start; entry_index < end; entry_index++) {
      ffindex_entry_t* entry = ffindex_get_entry_by_index(index, entry_index);
      if (entry == NULL) {
        continue;
      }

      hhblits->Reset();

      FILE* inf = ffindex_fopen_by_entry(data, entry);
      hhblits->run(inf, entry->name);
      fclose(inf);

      for (size_t i = 0; i < outputDatabases->size(); i++) {
        outputDatabases->operator [](i).saveOutput(*hhblits, entry->name);
      }
    }
  }
};

void static payload(void* env, const size_t start, const size_t end) {
  HHblits_MPQ_Wrapper* hhblits_wrapper = (HHblits_MPQ_Wrapper*)env;
  hhblits_wrapper->Payload(start, end);
}

int main(int argc, char **argv) {
  Parameters par;
  HHblits::ProcessAllArguments(argc, argv, par);

  //hhblits_mpi will be parallelized with openmpi, no other parallelization
  par.threads = 1;
  #ifdef OPENMP
    omp_set_num_threads(par.threads);
  #endif

  char data_filename[NAMELEN];
  char index_filename[NAMELEN];

  strcpy(data_filename, par.infile);
  strcat(data_filename, ".ffdata");

  strcpy(index_filename, par.infile);
  strcat(index_filename, ".ffindex");

  FILE *data_file = fopen(data_filename, "r");
  FILE *index_file = fopen(index_filename, "r");

  if (data_file == NULL) {
    HH_LOG(ERROR) << "Input data file " << data_filename << " does not exist!" << std::endl;
    MPI_Finalize();
    exit(EXIT_FAILURE);
  }
  if (index_file == NULL) {
    HH_LOG(ERROR) << "Input index file " << index_filename << " does not exist!" << std::endl;
    MPI_Finalize();
    exit(EXIT_FAILURE);
  }

  //init input ffindex
  size_t data_size;
  char *data = ffindex_mmap_data(data_file, &data_size);

  size_t number_input_index_lines = CountLinesInFile(index_filename);
  ffindex_index_t* index = ffindex_index_parse(index_file, number_input_index_lines);
  if (index == NULL) {
    HH_LOG(ERROR) << "Could not parse index from " << index_filename << std::endl;
    MPI_Finalize();
    exit(EXIT_FAILURE);
  }

  int mpq_status = MPQ_Init(argc, argv, index->n_entries);

  if (mpq_status == MPQ_SUCCESS) {
    if (MPQ_rank == MPQ_MASTER) {
      MPQ_Master(1);
    } else {
      std::vector<OutputFFIndex> outputDatabases;
      makeOutputFFIndex(par.outfile, MPQ_rank, &HHblits::writeHHRFile,
          outputDatabases);
      makeOutputFFIndex(par.scorefile, MPQ_rank, &HHblits::writeScoresFile,
          outputDatabases);
      makeOutputFFIndex(par.pairwisealisfile, MPQ_rank,
          &HHblits::writePairwiseAlisFile, outputDatabases);
      makeOutputFFIndex(par.alitabfile, MPQ_rank, &HHblits::writeAlitabFile,
          outputDatabases);
      makeOutputFFIndex(par.psifile, MPQ_rank, &HHblits::writePsiFile,
          outputDatabases);
      makeOutputFFIndex(par.hhmfile, MPQ_rank, &HHblits::writeHMMFile,
          outputDatabases);
      makeOutputFFIndex(par.alnfile, MPQ_rank, &HHblits::writeA3MFile,
          outputDatabases);
      makeOutputFFIndex(par.matrices_output_file, MPQ_rank, &HHblits::writeMatricesFile,
          outputDatabases);
      makeOutputFFIndex(par.m8file, MPQ_rank, &HHblits::writeM8,
          outputDatabases);

      std::vector<HHblitsDatabase*> databases;
      HHblits::prepareDatabases(par, databases);

      HHblits hhblits(par, databases);

      HHblits_MPQ_Wrapper* wrapper = new HHblits_MPQ_Wrapper(data, index, hhblits, outputDatabases);
      MPQ_Worker(payload, wrapper);
      delete wrapper;

      fclose(data_file);
      fclose(index_file);

      for (size_t i = 0; i < outputDatabases.size(); i++) {
        outputDatabases[i].close();
      }
    }

    MPI_Barrier(MPI_COMM_WORLD);

    if (MPQ_rank == MPQ_MASTER) {
      merge_splits(par.outfile);
      merge_splits(par.scorefile);
      merge_splits(par.pairwisealisfile);
      merge_splits(par.alitabfile);
      merge_splits(par.psifile);
      merge_splits(par.hhmfile);
      merge_splits(par.alnfile);
      merge_splits(par.matrices_output_file);
      merge_splits(par.m8file);
    }
  } else {
    if (mpq_status == MPQ_ERROR_NO_WORKERS) {
      fprintf(stderr, "MPQ_Init: Needs at least one worker process.\n");
      exit(EXIT_FAILURE);
    }
  }

  MPI_Finalize();
  return EXIT_SUCCESS;
}

