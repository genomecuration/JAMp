#ifndef MMSEQS_COMMAND_H
#define MMSEQS_COMMAND_H

#include <vector>

const int CITATION_MMSEQS2  = 1 << 0;
const int CITATION_MMSEQS1  = 1 << 1;
const int CITATION_UNICLUST = 1 << 2;

struct MMseqsParameter;

enum CommandMode {
    COMMAND_MAIN = 0,
    COMMAND_FORMAT_CONVERSION,
    COMMAND_CLUSTER,
    COMMAND_DB,
    COMMAND_EXPERT,
    COMMAND_SPECIAL,
    COMMAND_HIDDEN
};

struct Command {
    const char *cmd;
    int (*commandFunction)(int, const char **, const Command&);
    std::vector<MMseqsParameter>* params;
    CommandMode mode;
    const char *shortDescription;
    const char *longDescription;
    const char *author;
    const char *usage;
    int citations;
};

#endif
