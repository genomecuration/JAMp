/********************************************************************

double wn_penalty(x)
double wn_dpenalty(x)

********************************************************************/
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

#include <math.h>

#include "wnlib.h"

#include "wnconj.h"


double wn_penalty(double x)
{
  if(x >= 0.0)
  {
    return(0.0);
  }
  else 
  {
    return(x*x);
  }
}


double wn_dpenalty(double x)
{
  if(x >= 0.0)
  {
    return(0.0);
  }
  else
  {
    return(2.0*x);
  }
}


double wn_d2penalty(double x)
{
  if(x >= 0.0)
  {
    return(0.0);
  }
  else
  {
    return(2.0);
  }
}
