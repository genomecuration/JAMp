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

#include "wnsll.h"



wn_bool wn_sllempty(wn_sll list)
{
  return(list == NULL);
}


int wn_sllcount(register wn_sll list)
{
  register int ret;

  ret = 0;

  for(;list != NULL;list = list->next)
  {
    ++ret;
  }

  return(ret);
}



