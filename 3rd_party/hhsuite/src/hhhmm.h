// hhhmm.h

#ifndef HHHMM_H_
#define HHHMM_H_

#include <iostream>

class HMM;

#include "util.h"
#include "simd.h"

//from cs
#include "pseudocounts.h"
#include "aa.h"
#include "hhdecl.h"
#include "hhutil.h"
#include "log.h"

class CSCounts;

class HMM {
 public:
  HMM(int maxseqdis = MAXSEQDIS, int maxres = MAXRES);
  ~HMM();
  HMM& operator=(HMM&);

  int maxres;
  int maxseqdis;

  int n_display;  // number of sequences stored for display of alignment (INCLUDING >ss_ and >cf_ sequences)
  int n_seqs;  // number of sequences read in (INCLUDING >ss_ and >cf_ sequences)
  char** sname;             // names of stored sequences
  char** seq;               // residues of stored sequences (first at pos 1!)
  int ncons;                // index of consensus sequence
  int nfirst;               // index of first sequence (query sequence of HMM)
  int nss_dssp;             // index of seq[] with secondary structure by dssp
  int nsa_dssp;             // index of seq[] with solvent accessibility by dssp
  int nss_pred;             // index of seq[] with predicted secondary structure
  int nss_conf;  // index of seq[] with confidence values for secondary structure prediction

  int L;  // length of HMM = number of match states; set in declaration of HMM object
  int N_in;                 // number of sequences in alignment
  int N_filtered;           // number of sequences after filtering
  float* Neff_M;  // Neff_M[i] = diversity of subalignment of seqs that have residue in col i
  float* Neff_I;  // Neff_I[i] = diversity of subalignment of seqs that have insert in col i
  float* Neff_D;  // Neff_D[i] = diversity of subalignment of seqs that have delete in col i
  float Neff_HMM;           // average number of Neff over total length of HMM

  HHEntry* entry;
  char* longname;  // Full name of first sequence of original alignment (NAME field)
  char name[NAMELEN];       // HMM name = first word in longname in lower case
  char file[NAMELEN];  // Basename (with path, without extension) of alignment file that was used to construct the HMM
  char fam[NAMELEN];        // family ID (derived from name) (FAM field)
  char sfam[IDLEN];       // superfamily ID (derived from name)
  char fold[IDLEN];       // fold ID (derived from name)
  char cl[IDLEN];         // class ID (derived from name)

  float lamda, mu;  // coefficients for aa score distribution of HMM using parameters in 'Parameters par'
  // ss modes
  const static int NO_SS_INFORMATION = 0;
  const static int PRED_DSSP = 1;
  const static int DSSP_PRED = 2;
  const static int PRED_PRED = 3;
  // Make a flat copy of q
  void FlatCopyTo(HMM* t);

  // Read an HMM from a HHsearch .hhm file and return 0 at end of file
  int Read(FILE* dbf, const int maxcol, const int nseqdis, float* pb,
           char* path = NULL);

  // Read an HMM from a HMMer .hmm file; return 0 at end of file
  int ReadHMMer(FILE* dbf, const char showcons, float* pb,
                char* filestr = NULL);

  // Read an HMM from a HMMer3 .hmm file; return 0 at end of file
  int ReadHMMer3(FILE* dbf, const char showcons, float* pb,
                 char* filestr = NULL);

  // Add transition pseudocounts to HMM
  void AddTransitionPseudocounts(float gapd, float gape, float gapf, float gapg,
                                 float gaph, float gapi, float gapb,
                                 const float par_gapb);

  // Generate an amino acid frequency matrix g[][] with full pseudocount admixture (tau=1)
  void PreparePseudocounts(const float R[20][20]);

  // Add context specific amino acid pseudocounts to HMM
  void AddContextSpecificPseudocounts(cs::Pseudocounts<cs::AA>* pc,
                                      cs::Admix* admix);

  // Fill CountProfile with HMM-counts for CS pseudocount calculation
  void fillCountProfile(cs::CountProfile<cs::AA> *csProfile);

  // Add amino acid pseudocounts to HMM: t.p[i][a] = (1-tau)*f[i][a] + tau*g[i][a]
  void AddAminoAcidPseudocounts(char pcm, float pca, float pcb, float pcc);

  // Calculate amino acid backround frequencies for HMM
  void CalculateAminoAcidBackground(const float* pb);

  // Add no amino acid pseudocounts to HMM: copy  t.p[i][a] = f[i][a]
  void NoAminoAcidPseudocounts() {
    for (int i = 1; i <= L; i++)
      for (int a = 0; a < 20; a++)
        p[i][a] = f[i][a];
  };

  // compute ss scoring mode based on q and t
  static int computeScoreSSMode(HMM *q, HMM *t);

  // Divide aa probabilties by square root of locally averaged background frequencies
  void DivideBySqrtOfLocalBackgroundFreqs(const int D, const float* pb);

  // Factor Null model into HMM t
  void IncludeNullModelInHMM(HMM* q, HMM* t, int columnscore,
                             const int half_window_size_local_aa_bg_freqs,
                             const float* pb);

  // Write HMM to output file
  void WriteToFile(char* outfile, const char append, const int max_seqid,
                   const int coverage, const int qid, const int Ndiff,
                   const float qsc, const int argc, char** argv,
                   const float* pb);
  void WriteToFile(std::stringstream& out, const int max_seqid,
                   const int coverage, const int qid, const int Ndiff,
                   const float qsc, const int argc, char** argv,
                   const float* pb);

  // Transform log to lin transition probs
  void Log2LinTransitionProbs(float beta = 1.0);

  // Set query columns in His-tags etc to Null model distribution
  void NeutralizeTags(const float* pb);

  // Calculate effective number of sequences using profiles INCLUDING pseudocounts
  float CalcNeff();

  // Add secondary structure prediction to HMM
  void AddSSPrediction(char seq_pred[], char seq_conf[]);

  // Initialize f[i][a] with query HMM
  void MergeQueryHMM(HMM* q, float wk[]);

  // Rescale rate matrices P[a][b], R[a][b] according to HMM av. aa composition in pav[a]
  void RescaleMatrix();

  // Needed for SSE2 prefiltering with HHblits with amino acid alphabet
  float** p;  // p[i][a] = prob of finding amino acid a in column i WITH OPTIMUM pseudocounts
  float pav[NAA];  // pav[a] = average freq of amino acids in HMM (including subst matrix pseudocounts)
  bool divided_by_local_bg_freqs;  // avoid dividing p[i]a[] by sqrt(pb[a]) more than once

 private:
  float** f;  // f[i][a] = prob of finding amino acid a in column i WITHOUT pseudocounts
  float** g;  // g[i][a] = prob of finding amino acid a in column i WITH pseudocounts
  float** tr;  // tr[i][X2Y] = log2 of transition probabilities M2M M2I M2D I2M I2I D2M D2D

  char* ss_dssp;  // secondary structure determined by dssp 0:-  1:H  2:E  3:C  4:S  5:T  6:G  7:B
  char* sa_dssp;  // solvent accessibility state determined by dssp 0:-  1:A (absolutely buried) 2:B  3:C  4:D  5:E (exposed)
  char* ss_pred;    // predicted secondary structure          0:-  1:H  2:E  3:C
  char* ss_conf;     // confidence value of prediction         0:-  1:0 ... 10:9
  int* l;                   // l[i] = pos. of j'th match state in aligment
  char trans_lin;  // transition probs are given in log or lin space? (0: p_tr  1: log(p_tr)
  bool dont_delete_seqs;  // set to one if flat copy of seqs and sname was made to a hit object, to avoid deletion
  bool has_pseudocounts;    // set to true if HMM contains pseudocounts

  // Utility for Read()
  int Warning(FILE* dbf, char line[], char name[]) {
    HH_LOG(WARNING) << "Warning in " << __FILE__ << ":" << __LINE__
                              << ": " << __func__ << ":" << std::endl;
    HH_LOG(WARNING) << "\tcould not read line\n\'" << line
                              << "\'\nin HMM " << name << " in " << file
                              << "\n";
    while (fgetline(line, LINELEN, dbf) && !(line[0] == '/' && line[1] == '/'))
      ;
    if (line)
      return 2;  //return status: skip HMM
    return 0;            //return status: end of database file
  }

  friend class Hit;
  friend class Alignment;
  friend class CSCounts;
  friend class Viterbi;
  friend class HMMSimd;
  friend class PosteriorDecoderRunner;
  friend class PosteriorDecoder;
};

#endif
