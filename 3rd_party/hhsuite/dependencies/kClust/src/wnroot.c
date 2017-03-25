/****************************************************************************

COPYRIGHT NOTICE:

  The source code in this directory is provided free of
  charge to anyone who wants it.  It is in the public domain
  and therefore may be used by anybody for any purpose.  It
  is provided "AS IS" with no warranty of any kind
  whatsoever.  For further details see the README files in
  the wnlib parent directory.

****************************************************************************/

/********************************************************************

********************************************************************/
#include <stdio.h>
#include <math.h>

#include "wnlib.h"
#include "wnsqr.h"
#include "wnnop.h"
#include "wnabs.h"
#include "wnasrt.h"
#include "wnswap.h"
#include "wnmax.h"
#include "wncmp.h"
#include "wnrnd.h"
#include "wnrndd.h"
#include "wnconj.h"

#include "wnroot.h"


#define DEBUG        FALSE


typedef struct context_type_struct *context_type;
struct context_type_struct
{
  wn_bool bracketed;
  double x0,x2;
  double f0,f2;
};


local wn_bool wn_findroot_stop_flag = FALSE;

local struct context_type_struct context;


local void fill_context
(
  wn_bool bracketed,
  double f0,double f2,
  double x0,double x2
)
{
  if(x0 > x2)
  {
    wn_swap(x0,x2,double);
    wn_swap(f0,f2,double);
  }

  context.bracketed = bracketed;

  context.f0 = f0;
  context.f2 = f2;

  context.x0 = x0;
  context.x2 = x2;
}


local void fill_context_smart
(
  double f0,
  double f1,
  double f2,
  double x0,
  double x1,
  double x2
)
{
  int s0,s1,s2;

  s0 = wn_sign(f0);
  s1 = wn_sign(f1);
  s2 = wn_sign(f2);

  if(s1 == 0)
  {
    fill_context(/*bracketed*/TRUE,f1,f1,x1,x1);
  }
  else
  {
    if(s1 == -s0)
    {
      fill_context(/*bracketed*/TRUE,f0,f1,x0,x1);
    }
    else
    {
      wn_assert(s1 == -s2);

      fill_context(/*bracketed*/TRUE,f1,f2,x1,x2);
    }
  }
}


local wn_bool probe_legal
(
  double xnew,
  double f0,double f1,double f2,
  double x0,double x1,double x2
)
{
  wn_assert(x0 < x1);
  wn_assert(x1 < x2);
  wn_assert(wn_abs(wn_sign(f0)) != 0);
  wn_assert(wn_abs(wn_sign(f1)) != 0);
  wn_assert(wn_abs(wn_sign(f2)) != 0);
  wn_assert(wn_sign(f0) == -wn_sign(f2));

  return((xnew > x0)&&(xnew != x1)&&(xnew < x2));
}


local void secant_projection
(
  double *pf,
  double x,
  double x0,double f0,
  double x1,double f1
)
{
  wn_assert(x0 != x1);
  
  *pf = ((x1-x)*f0 + (x-x0)*f1)/(x1 - x0);
}


local wn_bool bisection_close_to_secant
(
  double f0,double f1,double f2,
  double x0,double x1,double x2
)
{
  double f1_projection;
  double lim1,lim2;

  wn_assert(x0 < x1);
  wn_assert(x1 < x2);

  secant_projection(&f1_projection,x1,x0,f0,x2,f2);

  lim1 = (1.0-0.75)*f1_projection + 0.75*f0;
  lim2 = (1.0-0.75)*f1_projection + 0.75*f2;

  if(lim1 > lim2)
  {
    wn_swap(lim1,lim2,double);
  }

# if DEBUG
  printf("lim1=%lg,f1=%lg,lim2=%lg\n",lim1,f1,lim2);
# endif

  return((lim1 <= f1)&&(f1 <= lim2));
}


local void secant_root
(
  wn_bool *psuccess,
  double *pxnew,
  double x0,double f0,
  double x1,double f1
)
{
  double denom;
  int sign0,sign1;

  wn_assert(x0 != x1);

  if(x0 > x1)
  {
    wn_swap(x0,x1,double);
    wn_swap(f0,f1,double);
  }

  denom = f1-f0;

  *psuccess = (denom != 0.0);

  if(!(*psuccess)) 
  {
    return;
  }

  sign0 = wn_sign(f0);
  sign1 = wn_sign(f1);

  if(sign0 == 0)
  {
    if(sign1 == 0)
    {
      *pxnew = 0.5*(x0+x1);
    }
    else
    {
      *pxnew = x0;
    }
  }
  else if(sign1 == 0)
  {
    wn_assert(sign0 != 0);

    *pxnew = x1;
  }
  else 
  {
    wn_assert(sign0 != 0);
    wn_assert(sign1 != 0);

    *pxnew = (f1*x0-f0*x1)/denom;

    if(sign0 == -sign1)
    {
      if((*pxnew) > x1)
      {
	*pxnew = x1;
      }
      else if((*pxnew) < x0)
      {
	*pxnew = x0;
      }
    }
    else
    {
      wn_assert(sign0 == sign1);

      if(wn_abs(f0) < wn_abs(f1))
      {
	if((*pxnew) > x0)
	{
	  *pxnew = x0;
        }
      }
      else if(wn_abs(f0) > wn_abs(f1))
      {
	if((*pxnew) < x1)
	{
	  *pxnew = x1;
        }
      }
      else
      {
	wn_assert_notreached();
      }
    }
  }
}


local void gen_secant_probe
(
  wn_bool *psuccess,
  double *pxnew,
  double f0,double f1,double f2,
  double x0,double x1,double x2
)
{
  int side;

# if DEBUG
    printf("secant probe.\n");
# endif

  wn_assert(x0 < x1);
  wn_assert(x1 < x2);
  wn_assert(wn_abs(wn_sign(f0)) != 0);
  wn_assert(wn_abs(wn_sign(f1)) != 0);
  wn_assert(wn_abs(wn_sign(f2)) != 0);
  wn_assert(wn_sign(f0) == -wn_sign(f2));

  side = wn_doublecmp(wn_abs(f0),wn_abs(f2));
  if(side == 0)
  {
    side = wn_random_bit()?(1):(-1);
  }

  if(side < 0)
  {
    secant_root(psuccess,pxnew,x0,f0,x1,f1);
    if(*psuccess && probe_legal(*pxnew,f0,f1,f2,x0,x1,x2))
    {
      return;
    }

    secant_root(psuccess,pxnew,x2,f2,x1,f1);
    if(*psuccess)
    {
      *psuccess = probe_legal(*pxnew,f0,f1,f2,x0,x1,x2);
    }
  }
  else if(side > 0)
  {
    secant_root(psuccess,pxnew,x2,f2,x1,f1);
    if(*psuccess && probe_legal(*pxnew,f0,f1,f2,x0,x1,x2))
    {
      return;
    }

    secant_root(psuccess,pxnew,x0,f0,x1,f1);
    if(*psuccess)
    {
      *psuccess = probe_legal(*pxnew,f0,f1,f2,x0,x1,x2);
    }
  }
  else
  {
    wn_assert_notreached();
  }
}


#if 0	/* not used - bchapman 2004-12-17 */
local void gen_inverse_parabola_probe
(
  wn_bool *psuccess,
  double *pxnew,
  double f0,double f1,double f2,
  double x0,double x1,double x2
)
{
  int code;
  double a,b,c;

# if DEBUG
    printf("inverse parabola probe.\n");
# endif

  wn_assert(x0 < x1);
  wn_assert(x1 < x2);
  wn_assert(wn_abs(wn_sign(f0)) != 0);
  wn_assert(wn_abs(wn_sign(f1)) != 0);
  wn_assert(wn_abs(wn_sign(f2)) != 0);
  wn_assert(wn_sign(f0) == -wn_sign(f2));

  if(!(
        ((f0 < f1)&&(f1 < f2))
	  ||
        ((f0 > f1)&&(f1 > f2))
      ))
  {
    *psuccess = FALSE;
    return;
  }

  wn_fit_traditional_parabola_3p(&code,&a,&b,&c,
				 f0,x0,
				 f1,x1,
				 f2,x2);

  if(code != WN_SUCCESS)
  {
    *psuccess = FALSE;
    return;
  }

  *pxnew = c;

  *psuccess = probe_legal(*pxnew,f0,f1,f2,x0,x1,x2);
}
#endif /* 0 */


local void gen_bisection_probe
(
  wn_bool *psuccess,
  double *pxnew,
  double f0,double f1,double f2,
  double x0,double x1,double x2
)
{
# if DEBUG
    printf("bisection probe.\n");
# endif

  wn_assert(x0 < x1);
  wn_assert(x1 < x2);
  wn_assert(wn_abs(wn_sign(f0)) != 0);
  wn_assert(wn_abs(wn_sign(f1)) != 0);
  wn_assert(wn_abs(wn_sign(f2)) != 0);
  wn_assert(wn_sign(f0) == -wn_sign(f2));

  if(wn_sign(f1) != wn_sign(f0))
  {
    *pxnew = 0.5*(x1+x0);
  }
  else if(wn_sign(f1) != wn_sign(f2))
  {
    *pxnew = 0.5*(x2+x1);
  }
  else
  {
    wn_assert_notreached();
  }

  *psuccess = probe_legal(*pxnew,f0,f1,f2,x0,x1,x2);
}


local void insert_new_point
(
  double fnew,double xnew,
  double *pf0,double *pf1,double *pf2,
  double *px0,double *px1,double *px2
)
{
  wn_assert(*px0 < *px1);
  wn_assert(*px1 < *px2);
  wn_assert(wn_abs(wn_sign(*pf0)) != 0);
  wn_assert(wn_abs(wn_sign(*pf1)) != 0);
  wn_assert(wn_abs(wn_sign(*pf2)) != 0);
  wn_assert(wn_sign(*pf0) == -wn_sign(*pf2));
  wn_assert(xnew < *px2);
  wn_assert(xnew > *px0);
  wn_assert(xnew != *px1);

  if(xnew < *px1)
  {
    wn_assert(wn_sign(*pf0) != wn_sign(*pf1));

    if((wn_sign(fnew) == wn_sign(*pf0))&&((*px2)-xnew <= (*px1)-(*px0)))
    {
      *pf0 = fnew;
      *px0 = xnew;
    }
    else
    {
      *pf2 = *pf1;
      *px2 = *px1;

      *pf1 = fnew;
      *px1 = xnew;
    }
  }
  else if(xnew > *px1)
  {
    wn_assert(wn_sign(*pf2) != wn_sign(*pf1));

    if((wn_sign(fnew) == wn_sign(*pf2))&&(xnew-(*px0) <= (*px2)-(*px1)))
    {
      *pf2 = fnew;
      *px2 = xnew;
    }
    else
    {
      *pf0 = *pf1;
      *px0 = *px1;

      *pf1 = fnew;
      *px1 = xnew;
    }
  }
  else
  {
    wn_assert_notreached();
  }
}


#if 0
/* assume *pf0,*pf1,*pf2 already computed */
EXTERN void wn_findroot_raw_bracketed
(
  int *pcode,
  double *pf0,
  double *pf1,
  double *pf2,
  double *px0,
  double *px1,
  double *px2,
  double (*pfunction)(double x),
  int max_iterations
)
{
  int iteration_count;
  double xnew,fnew,abs_f1,last_abs_f1;
  wn_bool success;
  double width1,width2,last_width1,last_width2;
  wn_bool bisect;

  wn_assert(*px0 < *px1);
  wn_assert(*px1 < *px2);
  wn_assert(wn_abs(wn_sign(*pf0)) != 0);
  wn_assert(wn_abs(wn_sign(*pf1)) != 0);
  wn_assert(wn_abs(wn_sign(*pf2)) != 0);
  wn_assert(wn_sign(*pf0) == -wn_sign(*pf2));

  bisect = FALSE;

  last_abs_f1 = WN_FHUGE;
  last_width1 = WN_FHUGE;
  last_width2 = WN_FHUGE;

  iteration_count = 0;

  while(
	 !(
	    (max_iterations < WN_IHUGE)
	      &&
	    (iteration_count >= max_iterations)
	  )
       )
  {
    wn_assert(*px0 < *px1);
    wn_assert(*px1 < *px2);

    if(*pf1 == 0.0)
    {
      *pcode = WN_SUCCESS;
      return;
    }

    abs_f1 = wn_abs(*pf1);
    width1 = (*px1)-(*px0);
    width2 = (*px2)-(*px1);

#   if DEBUG
      printf("iteration_count=%d,x0=%lg,f0=%lg,x1=%lg,f1=%lg,x2=%lg,f2=%lg\n",
	   iteration_count,*px0,*pf0,*px1,*pf1,*px2,*pf2);
      printf("  width1=%lg,width2=%lg,last_width1=%lg,last_width2=%lg,last_abs_f1=%lg\n",
	   width1,width2,last_width1,last_width2,last_abs_f1);
#   endif

    if(bisect)
    {
      bisect = FALSE;
    }
    else /* !bisect */
    {
      if((width1 > 0.75*last_width1)&&(width2 > 0.75*last_width2)&&
	 (abs_f1 > 0.50*last_abs_f1))
      {
	bisect = TRUE;
      }
    }

    if(bisect)
    {
      gen_bisection_probe(&success,&xnew,*pf0,*pf1,*pf2,*px0,*px1,*px2);
    }
    else
    {
      /*
      gen_inverse_parabola_probe(&success,&xnew,*pf0,*pf1,*pf2,*px0,*px1,*px2);
      if(success)
      {
	goto done;
      }
      */
      gen_secant_probe(&success,&xnew,*pf0,*pf1,*pf2,*px0,*px1,*px2);
      if(success)
      {
	goto done;
      }
      gen_bisection_probe(&success,&xnew,*pf0,*pf1,*pf2,*px0,*px1,*px2);

      done: ;
    }

    if((xnew == *px0)||(xnew == *px1)||(xnew == *px2))
    {
      *pcode = WN_SUCCESS;
      return;
    }

    fnew = (*pfunction)(xnew);

    ++iteration_count;

    insert_new_point(fnew,xnew,pf0,pf1,pf2,px0,px1,px2);

    last_abs_f1 = abs_f1;
    last_width1 = width1;
    last_width2 = width2;
  }

  *pcode = WN_SUBOPTIMAL;
}
#endif


#if 1
/* assume *pf0,*pf1,*pf2 already computed */
EXTERN void wn_findroot_raw_bracketed
(
  int *pcode,
  double *pf0,
  double *pf1,
  double *pf2,
  double *px0,
  double *px1,
  double *px2,
  double (*pfunction)(double x),
  int max_iterations
)
{
  int iteration_count;
  double xnew,fnew,abs_f1,last_abs_f1;
  wn_bool success;
  double width1,width2,last_width1,last_width2;
  wn_bool bisect;

  wn_assert(*px0 < *px1);
  wn_assert(*px1 < *px2);
  wn_assert(wn_abs(wn_sign(*pf0)) != 0);
  wn_assert(wn_abs(wn_sign(*pf2)) != 0);
  wn_assert(wn_sign(*pf0) == -wn_sign(*pf2));

  wn_findroot_stop_flag = FALSE;

  bisect = FALSE;

  last_abs_f1 = WN_FHUGE;
  last_width1 = WN_FHUGE;
  last_width2 = WN_FHUGE;

  iteration_count = 0;

  for(;;)
  {
    wn_assert(*px0 < *px1);
    wn_assert(*px1 < *px2);

    fill_context_smart(*pf0,*pf1,*pf2,*px0,*px1,*px2);

    if((max_iterations < WN_IHUGE)&&(iteration_count >= max_iterations))
    {
      break;
    }
    if(wn_findroot_stop_flag)
    {
      break;
    }

    if(*pf1 == 0.0)
    {
      *pcode = WN_SUCCESS;
      return;
    }

    abs_f1 = wn_abs(*pf1);
    width1 = (*px1)-(*px0);
    width2 = (*px2)-(*px1);

#   if DEBUG
      printf("iteration_count=%d,x0=%lg,f0=%lg,x1=%lg,f1=%lg,x2=%lg,f2=%lg\n",
	   iteration_count,*px0,*pf0,*px1,*pf1,*px2,*pf2);
      printf("  width1=%lg,width2=%lg,last_width1=%lg,last_width2=%lg,last_abs_f1=%lg\n",
	   width1,width2,last_width1,last_width2,last_abs_f1);
#   endif

    if(bisect)
    {
      if(bisection_close_to_secant(*pf0,*pf1,*pf2,*px0,*px1,*px2))
      {
	bisect = FALSE;
      }
    }
    else /* !bisect */
    {
      if((width1 > 0.75*last_width1)&&(width2 > 0.75*last_width2)&&
	 (abs_f1 > 0.50*last_abs_f1))
      {
	bisect = TRUE;
      }
    }

    if(bisect)
    {
      gen_bisection_probe(&success,&xnew,*pf0,*pf1,*pf2,*px0,*px1,*px2);
    }
    else
    {
      gen_secant_probe(&success,&xnew,*pf0,*pf1,*pf2,*px0,*px1,*px2);
      if(!success)
      {
        gen_bisection_probe(&success,&xnew,*pf0,*pf1,*pf2,*px0,*px1,*px2);
      }
    }

    if((xnew == *px0)||(xnew == *px1)||(xnew == *px2))
    {
      *pcode = WN_SUCCESS;
      return;
    }

    fnew = (*pfunction)(xnew);

    ++iteration_count;

    insert_new_point(fnew,xnew,pf0,pf1,pf2,px0,px1,px2);

    last_abs_f1 = abs_f1;
    last_width1 = width1;
    last_width2 = width2;
  }

  *pcode = WN_SUBOPTIMAL;
}
#endif


local void extract_best_root
(
  double *pfbest,double *pxbest,
  double f0,double f1,double f2,
  double x0,double x1,double x2
)
{
  *pfbest = WN_FHUGE;  
  *pxbest = 0.0;

  if(wn_abs(f1) < wn_abs(*pfbest))
  {
    *pxbest = x1;
    *pfbest = f1;
  }
  if(wn_abs(f0) < wn_abs(*pfbest))
  {
    *pxbest = x0;
    *pfbest = f0;
  }
  if(wn_abs(f2) < wn_abs(*pfbest))
  {
    *pxbest = x2;
    *pfbest = f2;
  }
}


/* assume f0,f2 already computed */
EXTERN void wn_findroot_bracketed
(
  int *pcode,
  double *px1,
  double *pf1,
  double x0,
  double f0,
  double x2,
  double f2,
  double (*pfunction)(double x),
  int max_iterations
)
{
  wn_bool success;
  double x1, f1;

  if(f0 == 0.0)
  {
    *px1 = x0;
    *pf1 = f0;
    *pcode = WN_SUCCESS;
    return;
  }
  if(f2 == 0.0)
  {
    *px1 = x2;
    *pf1 = f2;
    *pcode = WN_SUCCESS;
    return;
  }
  wn_assert(x0 != x2);
  wn_assert(wn_sign(f0) == -wn_sign(f2));

  if(x0 > x2)
  {
    wn_swap(x0,x2,double);
    wn_swap(f0,f2,double);
  }

  /* Secant method probe */
  secant_root(&success, &x1, x0, f0, x2, f2);
  if(!success || (x1 == x0) || (x1 == x2))
  {
    /* Bisection (robust) probe */
    x1 = 0.5 * (x0 + x2);
  }

#if DEBUG
  printf("wnroot.c: x0 = %20.20lg, x1 = %20.20lg, x2 = %20.20lg\n",
	 x0, x1, x2);
#endif
  fill_context(/*bracketed*/TRUE,f0,f2,x0,x2);
  f1 = (*pfunction)(x1);

  wn_findroot_raw_bracketed(pcode,&f0,&f1,&f2,&x0,&x1,&x2,
			    pfunction,max_iterations);

  extract_best_root(pf1,px1,f0,f1,f2,x0,x1,x2);
}


/* assume f0, f2 already computed */
EXTERN void wn_findroot
(
  int *pcode,
  double *px1,
  double *pf1,
  double x0,
  double f0,
  double x2,
  double f2,
  double (*pfunction)(double x),
  int max_iterations
)
{
  double x2_new;

  if(wn_sign(f0) * wn_sign(f2) <= 0.0)
  {
    wn_findroot_bracketed(pcode, px1, pf1, x0, f0, x2, f2,
			  pfunction, max_iterations);
    return;
  }
  else if(
	  !(x0 >= -WN_FHUGE) || !(x0 <= WN_FHUGE)
	    ||
	  !(x2 >= -WN_FHUGE) || !(x2 <= WN_FHUGE)
	 )
  {
    *pcode = WN_BAD_ARGS;
    return;
  }
  else if(x0 == x2)
  {
    *pcode = WN_BAD_ARGS;
    return;
  }
  else if(wn_abs(f2) > wn_abs(f0))
  {
    wn_swap(x0, x2, double);
    wn_swap(f0, f2, double);
  }
  else if(wn_abs(f2) == wn_abs(f0))
  {
    if(wn_random_bit())
    {
      wn_swap(x0, x2, double);
      wn_swap(f0, f2, double);
    }
  }

  fill_context(/*bracketed*/FALSE,f0,f2,x0,x2);

  x2_new = 3.0*x2 - 2.0*x0;  /* x2 + 2*(x2 - x0) */
  x0 = x2;
  f0 = f2;
  x2 = x2_new;

  if(!(x2 >= -WN_FHUGE) || !(x2 <= WN_FHUGE))
  {
    *pcode = WN_UNBOUNDED;
    return;
  }
  f2 = (*pfunction)(x2);

  wn_findroot(pcode, px1, pf1, x0, f0, x2, f2,
	      pfunction, max_iterations);
}


EXTERN void wn_findroot_stop(void)
{
  wn_findroot_stop_flag = TRUE;
} 


EXTERN void wn_findroot_getrange
(
  wn_bool *pbracketed,
  double *px0,
  double *pf0,
  double *px2,
  double *pf2
)
{
  *pbracketed = context.bracketed;
  *px0 = context.x0;
  *pf0 = context.f0;
  *px2 = context.x2;
  *pf2 = context.f2;
} 

