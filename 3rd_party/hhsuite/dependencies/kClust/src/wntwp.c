/****************************************************************************

COPYRIGHT NOTICE:

  The source code in this directory is provided free of
  charge to anyone who wants it.  It is in the public domain
  and therefore may be used by anybody for any purpose.  It
  is provided "AS IS" with no warranty of any kind
  whatsoever.  For further details see the README files in
  the wnlib parent directory.

AUTHOR:

  Will Naylor

****************************************************************************/

#include "wnlib.h"

#include "wnrndd.h"



wn_bool wn_true_with_probability(double prob)
{
  if(prob >= 1.0)
  {
    return(TRUE);
  }
  else
  {
    return(wn_flat_distribution() < prob);
  }
}


