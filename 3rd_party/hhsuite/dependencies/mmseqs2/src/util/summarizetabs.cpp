#include "Parameters.h"
#include "Util.h"
#include "Debug.h"
#include "DBReader.h"
#include "DBWriter.h"
#include "CompressedA3M.h"
#include "Alignment.h"
#include "MathUtil.h"
#include "Domain.h"

#include <fstream>
#include <iomanip>

#ifdef OPENMP
#include <omp.h>
#endif

static inline float getOverlap(const std::vector<bool>& covered, unsigned int qStart, unsigned int qEnd) {
    size_t counter = 0;
    for (size_t i = qStart; i < qEnd; ++i) {
        counter += covered[i];
    }
    return static_cast<float>(counter) / static_cast<float>(qEnd - qStart + 1);
}


std::vector<Domain> mapDomains(const std::vector<Domain> &input, float overlap, float minCoverage,
                               double eValThreshold) {
    std::vector<Domain> result;
    if(input.size() == 0) {
        return result;
    }

    std::vector<bool> covered(input[0].qLength, false);
    for (size_t i = 0; i  < input.size(); i++) {
        Domain domain = input[i];
        if(domain.qStart > domain.qLength || domain.qEnd > domain.qLength){
            Debug(Debug::WARNING) << "Query alignment start or end is greater than query length in set "
            << domain.query << "! Skipping line.\n";
            continue;
        }
        if(domain.qStart > domain.qEnd){
            Debug(Debug::WARNING) << "Query alignment end is greater than start in set "
            << domain.query << "! Skipping line.\n";
            continue;
        }
        float percentageOverlap = getOverlap(covered, domain.qStart, domain.qEnd);
        if(domain.tStart > domain.tEnd){
            Debug(Debug::WARNING) << "Target alignment end is greater than start in set "
            << domain.query << "! Skipping line.\n";
            continue;
        }
        if(domain.tStart > domain.tLength || domain.tEnd > domain.tLength){
            Debug(Debug::WARNING) << "Target alignment start or end is greater than target length in set "
            << domain.query << "! Skipping line.\n";
            continue;
        }
        float targetCov = MathUtil::getCoverage(domain.tStart, domain.tEnd, domain.tLength);
        if (percentageOverlap <= overlap && targetCov > minCoverage && domain.eValue < eValThreshold) {
            for (unsigned int j = domain.qStart; j < domain.qEnd; ++j) {
                covered[j] = true;
            }
            result.push_back(domain);
        }
    }
    return result;
}

std::map<std::string, unsigned int> readLength(const std::string &file) {
    std::fstream mappingStream(file);
    if (mappingStream.fail()) {
        Debug(Debug::ERROR) << "File " << file << " not found!\n";
        EXIT(EXIT_FAILURE);
    }
    std::map<std::string, unsigned int> mapping;
    std::string line;
    while (std::getline(mappingStream, line)) {
        std::vector<std::string> split = Util::split(line, "\t");
        unsigned int length = static_cast<unsigned int>(strtoul(split[1].c_str(), NULL, 10));
        mapping.emplace(split[0], length);
    }
    return mapping;
}

std::vector<Domain> getEntries(unsigned int queryId, char *data, size_t length, const std::map<std::string, unsigned int> &lengths) {
    std::vector<Domain> result;

    std::string query = SSTR(queryId);

    std::string line;
    std::istringstream iss(std::string(data, length));
    while (std::getline(iss, line)) {
        std::vector<std::string> fields = Util::split(line.c_str(), "\t");

        unsigned int qStart = static_cast<unsigned int>(strtoul(fields[6].c_str(), NULL, 10)) - 1;
        unsigned int qEnd = static_cast<unsigned int>(strtoul(fields[7].c_str(), NULL, 10)) - 1;

        std::map<std::string, unsigned int>::const_iterator it = lengths.lower_bound(query);
        unsigned int qLength;
        if(it != lengths.end()) {
            qLength = (*it).second;
        } else {
            Debug(Debug::WARNING) << "Missing query length! Skipping line.\n";
            continue;
        }

        unsigned int tStart = static_cast<unsigned int>(strtoul(fields[8].c_str(), NULL, 10)) - 1;
        unsigned int tEnd = static_cast<unsigned int>(strtoul(fields[9].c_str(), NULL, 10)) - 1;
        it = lengths.lower_bound(fields[1]);
        unsigned int tLength;
        if(it != lengths.end()) {
            tLength = (*it).second;
        } else {
            Debug(Debug::WARNING) << "Missing target length! Skipping line.\n";
            continue;
        }

        double eValue = strtod(fields[10].c_str(), NULL);

        result.push_back(Domain(query, qStart, qEnd, qLength, fields[1], tStart, tEnd, tLength, eValue));
    }

    std::stable_sort(result.begin(), result.end());

    return result;
}

int doAnnotate(Parameters &par, DBReader<unsigned int> &blastTabReader,
               const std::pair<std::string, std::string>& resultdb,
               const size_t dbFrom, const size_t dbSize) {
#ifdef OPENMP
    omp_set_num_threads(par.threads);
#endif

    DBWriter writer(resultdb.first.c_str(), resultdb.second.c_str(), static_cast<unsigned int>(par.threads));
    writer.open();

    std::map<std::string, unsigned int> lengths = readLength(par.db2);

    Debug(Debug::INFO) << "Start writing to file " << par.db3 << "\n";

#pragma omp parallel for schedule(dynamic, 100)
    for (size_t i = dbFrom; i < dbFrom + dbSize; ++i) {
        unsigned int thread_idx = 0;
#ifdef OPENMP
        thread_idx = static_cast<unsigned int>(omp_get_thread_num());
#endif

        unsigned int id = blastTabReader.getDbKey(i);

        char* tabData = blastTabReader.getData(i);
        size_t tabLength = blastTabReader.getSeqLens(i) - 1;
        const std::vector<Domain> entries = getEntries(id, tabData, tabLength, lengths);
        if (entries.size() == 0) {
            Debug(Debug::WARNING) << "Could not map any entries for entry " << id << "!\n";
            continue;
        }

        std::vector<Domain> result = mapDomains(entries, par.overlap, par.cov, par.evalThr);
        if (result.size() == 0) {
            Debug(Debug::WARNING) << "Could not map any domains for entry " << id << "!\n";
            continue;
        }

        std::ostringstream oss;
        oss << std::setprecision(std::numeric_limits<float>::digits10);

        for (size_t j = 0; j < result.size(); j++) {
            Domain d = result[j];
            d.writeResult(oss);
            oss << "\n";
        }

        std::string annotation = oss.str();
        writer.writeData(annotation.c_str(), annotation.length(), SSTR(id).c_str(), thread_idx);
    }

    writer.close();

    return EXIT_SUCCESS;
}

int doAnnotate(Parameters &par, const unsigned int mpiRank, const unsigned int mpiNumProc) {
    DBReader<unsigned int> reader(par.db1.c_str(), par.db1Index.c_str());
    reader.open(DBReader<unsigned int>::LINEAR_ACCCESS);

    size_t dbFrom = 0;
    size_t dbSize = 0;
    Util::decomposeDomainByAminoAcid(reader.getAminoAcidDBSize(), reader.getSeqLens(), reader.getSize(),
                                     mpiRank, mpiNumProc, &dbFrom, &dbSize);
    std::pair<std::string, std::string> tmpOutput = Util::createTmpFileNames(par.db3, par.db3Index, mpiRank);

    int status = doAnnotate(par, reader, tmpOutput, dbFrom, dbSize);

    reader.close();

#ifdef HAVE_MPI
    MPI_Barrier(MPI_COMM_WORLD);
#endif
    // master reduces results
    if(mpiRank == 0) {
        std::vector<std::pair<std::string, std::string>> splitFiles;
        for(unsigned int proc = 0; proc < mpiNumProc; ++proc){
            std::pair<std::string, std::string> tmpFile = Util::createTmpFileNames(par.db3, par.db3Index, proc);
            splitFiles.push_back(std::make_pair(tmpFile.first,  tmpFile.second));
        }
        Alignment::mergeAndRemoveTmpDatabases(par.db3, par.db3 + ".index", splitFiles);
    }
    return status;
}

int doAnnotate(Parameters &par) {
    DBReader<unsigned int> reader(par.db1.c_str(), par.db1Index.c_str());
    reader.open(DBReader<std::string>::LINEAR_ACCCESS);
    size_t resultSize = reader.getSize();
    int status = doAnnotate(par, reader, std::make_pair(par.db3, par.db3Index), 0, resultSize);
    reader.close();
    return status;
}

int summarizetabs(int argc, const char **argv, const Command& command) {
    Parameters& par = Parameters::getInstance();
    par.parseParameters(argc, argv, command, 3);

    MMseqsMPI::init(argc, argv);

#ifdef HAVE_MPI
    int status = doAnnotate(par, MMseqsMPI::rank, MMseqsMPI::numProc);
#else
    int status = doAnnotate(par);
#endif

#ifdef HAVE_MPI
    MPI_Finalize();
#endif
    return status;
}
