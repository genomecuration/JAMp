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
  void wn_conj_direction_method
  (pcode, pval_min, vect, num_vars, pfunction, max_func_calls)
********************************************************************/
#include <stdio.h>
#include <math.h>

#include "wnlib.h"
#include "wnasrt.h"
#include "wnmem.h"
#include "wnabs.h"
#include "wnswap.h"
#include "wnrnd.h"
#include "wnrndd.h"

#include "wnvect.h"
#include "wnmat.h"

#include "wntol.h"
#include "wnconjd.h"
#include "wnconj.h"


#define MAX_EXPAND   (100.0)
#define MIN_CONTRACT (1.0/10.0)

int wn_conj_direction_debug = WN_CONJ_DIR_DBG_NONE;

/* local wn_bool show_linesearch=FALSE; ** unused - bchapman 041111 */

local int num_vars;

local double **search_directions;
local int num_search_directions,max_num_search_directions;

local double *coord_x0s,*search_direction_x0s;
local double *coord_as,*search_direction_as;

local int num_func_calls;

local wn_bool last_line_function_x_valid;
local double last_line_function_x,last_line_function_ret;

local double *buffer_vect,*save_vect,*save_direction;
local double (*save_pfunction)(double vect[], void *params);

local wn_bool force_optimize_stop_flag=FALSE;

local double sqrt_tolerance;


local double fract_diff(double n1,double n2)
{
  n1 = wn_abs(n1);
  n2 = wn_abs(n2);

  if(n1 > n2)
  {
    return(1.0-n2/n1);
  }
  else if(n2 > n1)
  {
    return(1.0-n1/n2);
  }
  else if(n1 == n2)
  {
    return(0.0);
  }
  else
  {
    return(1.0);
  }
}


local wn_bool is_valid_number(double x)
{
  return((-WN_FHUGE < x)&&(x < WN_FHUGE));
}


local wn_bool too_close(double x1, double x2)
{
  if((x2 == 0.0) && (wn_abs(x1) < sqrt_tolerance))
  {
    return(TRUE);
  }
  else if((x1 == 0.0) && (wn_abs(x2) < sqrt_tolerance))
  {
    return(TRUE);
  }
  else if(
	  (wn_sign(x1) == wn_sign(x2))
	   &&
	  (fract_diff(x1, x2) < sqrt_tolerance)
	 )
  {
   return(TRUE);
  }
  else if(wn_abs(x1 - x2) < sqrt_tolerance)
  {
   return(TRUE);
  }

  return(FALSE);
}


void wn_force_conj_direction_stop(void)
{
  force_optimize_stop_flag = TRUE;
}


local double line_function(double x, void *params)
{
  double ret;

  if(last_line_function_x_valid)
  {
    if(x == last_line_function_x)
    {
      return(last_line_function_ret);
    }
  }

  wn_copy_vect(save_vect,buffer_vect,num_vars);
  wn_add_scaled_vect(save_vect,save_direction,x,num_vars);

  if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_ALL)
  {
    printf("function call %d at ",num_func_calls);
    wn_print_vect(save_vect,num_vars);
  }

  ++num_func_calls;

  ret = wn_clip_f((*save_pfunction)(save_vect, params));

  if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_ALL)
  {
    printf("function value is %lg\n",ret);
    fflush(stdout);
  }

  last_line_function_x_valid = TRUE;
  last_line_function_x = x;
  last_line_function_ret = ret;

  return(ret);
}


local void fit_parabola_2pa(int *pcode,double *px0,double *pb,
			    double a,
			    double x1,double y1,
			    double x2,double y2)
{
  double b,c;

  if(a <= 0.0)
  {
    *pcode = WN_SINGULAR;
    return;
  }

  wn_fit_traditional_parabola_2pa(pcode,&b,&c,a,x1,y1,x2,y2);

  if(*pcode != WN_SUCCESS)
  {
    return;
  }

  wn_convert_parabola_traditional_to_centered(pcode,px0,pb,a,b,c);
}


local void line_minimize
(
  double vect[],
  double direction[],
  double *pval_min,
  double *psave_x0,
  double *psave_a,
  double (*pfunction)(double vect[], void *params),
  void *params
)
{
  double ax,bx,cx,x0,fa,fb,fc,fx0;
  double a,b;
  double old_x0,old_a;
  int code;

  if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_LINESEARCH)
  {
    printf("start line minimize.\n");
  }

  last_line_function_x_valid = FALSE;

  wn_copy_vect(buffer_vect,vect,num_vars);
  save_vect = vect;
  save_direction = direction;
  save_pfunction = pfunction;

  old_x0 = *psave_x0;
  old_a = *psave_a;

  bx = 0.0;
  fb = *pval_min;
  if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_ALL)
  {
    printf("First point at %lg, function value = %lg\n", bx, fb);
  }

  if(old_x0 == 0.0)
  {
    old_x0 = 1.0;
  }

  ax = old_x0*wn_random_double_between(0.9,1.1);
  if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_ALL)
  {
    printf("Second point at %lg (old_x0 = %lg)\n", ax, old_x0);
  }
  fa = line_function(ax, params);

  if(!(old_a > 0.0))
  {
    goto simple_parabola_fit;
  }

  /* the curvature along a search direction is constant for a 
     quadratic function, therefore, try to use the curvature
     from the last search */
  fit_parabola_2pa(&code,&x0,&b,old_a,ax,fa,bx,fb);
  if(
     (code != WN_SUCCESS)
       ||
     (!(wn_abs(x0)<MAX_EXPAND*wn_abs(old_x0)) && (*psave_x0 != 0.0))
       ||
     too_close(x0, ax) || too_close(x0, bx)
       ||
     !is_valid_number(x0) || !is_valid_number(ax) || !is_valid_number(bx)
    )
  {
    goto simple_parabola_fit;
  }   

  cx = x0;
  if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_ALL)
  {
    printf("Third point at %lg\n", cx);
  }
  fc = line_function(cx, params);

  wn_fit_parabola_3p(&code,&a,&x0,&b,ax,fa,bx,fb,cx,fc);

  if((code != WN_SUCCESS)||(!(a > 0.0))||
     (!(wn_abs(x0)<MAX_EXPAND*wn_abs(old_x0))&&(*psave_x0 != 0.0)))
  {
    goto full_linesearch;
  }   

  if(!(b < fb))
  {
    if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_ALL)
    {
      printf("Doing slow line search (parabola fit returned suspect min value).\n");
    }
    goto full_linesearch;
  }
  if((!(fc < fb))||(!(fc < fa)))
  {
    /* evaluate one more point */
    goto evaluate_x0;
  }

  /* is it economical to evaluate one more point? */
  if((fb-b) <= 1.5*(fb-fc))
  { 
    /* do not evaluate one more point */
    wn_swap(fb,fc,double);
    wn_swap(bx,cx,double);
    goto finish;
  }
  else
  {
    /* evaluate one more point */
    goto evaluate_x0;
  }

simple_parabola_fit:
  if(fa < fb)
  {
    cx = 2.0*ax*wn_random_double_between(0.8,1.2);
  }
  else
  {
    cx = -1.0*ax*wn_random_double_between(0.8,1.2);
  }

  fc = line_function(cx, params);

  wn_fit_parabola_3p(&code,&a,&x0,&b,ax,fa,bx,fb,cx,fc);

  if((code != WN_SUCCESS)||(!(a > 0.0))||
     (!(wn_abs(x0)<MAX_EXPAND*wn_abs(old_x0))&&(*psave_x0 != 0.0)))
  {

    if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_ALL)
    {
      printf("Parabola fit failed. Switching to slow line search mode.\n");
    }
    goto full_linesearch;
  }   

evaluate_x0:
  fx0 = line_function(x0, params);

  if(!(fx0 <= fb))
  {
    if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_ALL)
    {
      printf("Doing a slow line search because f(x0) is too large (x0 = %lg).\n", x0);
    }
    goto full_linesearch;
  }

  fb = fx0;
  bx = x0;

  if(!(fa <= fc))
  {
    wn_swap(fa,fc,double);
    wn_swap(ax,cx,double);
  }
  if(!(fb <= fa))
  {
    wn_swap(fb,fa,double);
    wn_swap(bx,ax,double);
  }

  goto finish;

full_linesearch: ;

  /*
  printf("now.\n");
  */
  do
  {
    if(ax == bx)
    {
      if(wn_random_bit())
      {
        ax += wn_random_double_between(-1.0,1.0);
        fa = line_function(ax, params);
      }
      else
      {
        bx += wn_random_double_between(-1.0,1.0);
        fb = line_function(bx, params);
      }
    }
    if(ax == cx)
    {
      if(wn_random_bit())
      {
        ax += wn_random_double_between(-1.0,1.0);
        fa = line_function(ax, params);
      }
      else
      {
        cx += wn_random_double_between(-1.0,1.0);
        fc = line_function(cx, params);
      }
    }
    if(bx == cx)
    {
      if(wn_random_bit())
      {
        bx += wn_random_double_between(-1.0,1.0);
        fb = line_function(bx, params);
      }
      else
      {
        cx += wn_random_double_between(-1.0,1.0);
        fc = line_function(cx, params);
      }
    }
  } while((ax == bx)||(ax == cx)||(bx == cx));
  wn_minimize_1d_raw(&code,&fa,&fb,&fc,&ax,&bx,&cx,fb,&line_function,1,20, params);
  /*
  printf("l = %lf\n",bx);
  */

finish: ;

  /*
  if(show_linesearch)
  {
    printf("ax=%lg,bx=%lg,cx=%lg,old_x0=%lg\n",ax,bx,cx,old_x0);
  }
  */

  wn_copy_vect(vect,buffer_vect,num_vars);

  /* compute *psave_x0 */
  if(wn_abs(bx) < MIN_CONTRACT*wn_abs(old_x0))
  {
    if(bx < 0.0)
    {
      *psave_x0 = -MIN_CONTRACT*wn_abs(old_x0);
    }
    else
    {
      *psave_x0 = MIN_CONTRACT*wn_abs(old_x0);
    }
  }
  else
  {
    *psave_x0 = bx;
  }

  /* compute *psave_a */
  wn_fit_parabola_3p(&code,&a,&x0,&b,ax,fa,bx,fb,cx,fc);

  if((code != WN_SUCCESS)||(!(a > 0.0)))
  {
    *psave_a = 0.0;
  }   
  else
  {
    *psave_a = a;
  }

  if(*pval_min == fb)
  {
    if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_LINESEARCH)
    {
      printf("finish line minimize.\n");
      fflush(stdout);
    }
    return;  /* do not move if no improvement */
  }

  wn_add_scaled_vect(vect,direction,bx,num_vars);

  *pval_min = fb;

  if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_LINESEARCH)
  {
    printf("finish line minimize.\n");
    fflush(stdout);
  }
}


EXTERN void wn_conj_direction_method
(
  int *pcode,
  double *pval_min,
  double vect[],
  double initial_coord_x0s[],
  int passed_num_vars,
  double (*pfunction)(double vect[], void *params),
  int max_func_calls,
  void *params
)
{
  int i,j,iteration;
  double *old_vect,*coord_direction;
  double *new_search_direction;
  double old_val_min;

  wn_memgp conj_dir_memgp;

  wn_gpmake("no_free");

  force_optimize_stop_flag = FALSE;

  num_vars = passed_num_vars;
  max_num_search_directions = num_vars;

  wn_make_vect(&buffer_vect,num_vars);
  search_directions = (double **)wn_zalloc(
		  max_num_search_directions*sizeof(double *));
  wn_make_vect(&old_vect,num_vars);
  wn_make_vect(&coord_direction,num_vars);
  wn_make_vect(&coord_x0s,num_vars);
  wn_make_vect(&search_direction_x0s,max_num_search_directions);
  wn_make_vect(&coord_as,num_vars);
  wn_make_vect(&search_direction_as,max_num_search_directions);
  if(initial_coord_x0s == NULL)
  {
    wn_zero_vect(coord_x0s,num_vars);
  }
  else
  {
    wn_copy_vect(coord_x0s,initial_coord_x0s,num_vars);
  }
  wn_zero_vect(search_direction_x0s,max_num_search_directions);
  wn_zero_vect(coord_as,num_vars);
  wn_zero_vect(search_direction_as,max_num_search_directions);

  /* name and pop the memory group we created */

  conj_dir_memgp = wn_curgp();
  wn_gppop();

  sqrt_tolerance = sqrt(wn_machine_tolerance());

  num_search_directions = 0;

  num_func_calls = 0;

  last_line_function_x_valid = FALSE;
  *pval_min = wn_clip_f((*pfunction)(vect, params));
  ++num_func_calls;

  for(iteration=0;;++iteration)
  {
    if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_PASSES)
    {
      printf("iteration = %d ********************************\n",iteration);
      printf("ob = %lg\n",*pval_min);
      fflush(stdout);
    }
    /*
    (void)getchar();
    */

    old_val_min = *pval_min;
    wn_copy_vect(old_vect,vect,num_vars);

    /* minimize along acceleration search directions */
    if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_LINESEARCH)
    {
      printf("start acceleration line minimizations ------------------\n");
    }
    for(i=0;i<num_search_directions;++i)
    {
      if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_LINESEARCH)
      {
        printf("acceleration line search %d\n",i);
      }

      line_minimize(vect,search_directions[i],pval_min,
		    &(search_direction_x0s[i]),&(search_direction_as[i]),
		    pfunction, params);

      if(
	  ((max_func_calls < WN_IHUGE)&&(num_func_calls > max_func_calls))
	    ||
          force_optimize_stop_flag
	)
      {
        *pcode = WN_SUBOPTIMAL;
	goto finish;
      }
    }

    /* minimize along coordinate directions */
    if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_LINESEARCH) 
    {
      printf("start coordinate line minimizations ------------------\n");
    }
    for(i=0;i<num_vars;++i)
    {
      if(wn_conj_direction_debug >= WN_CONJ_DIR_DBG_LINESEARCH)
      {
        printf("coord line search %d\n",i);
      }

      coord_direction[i] = 1.0;

      line_minimize(vect,coord_direction,pval_min,
		    &(coord_x0s[i]),&(coord_as[i]),
		    pfunction, params);

      coord_direction[i] = 0.0;

      if(
	  ((max_func_calls < WN_IHUGE)&&(num_func_calls > max_func_calls))
	    ||
          force_optimize_stop_flag
	)
      {
        *pcode = WN_SUBOPTIMAL;
	goto finish;
      }
    }

    if(*pval_min >= old_val_min)
    {
      wn_assert(*pval_min == old_val_min);

      *pcode = WN_SUCCESS;
      break;
    }

    /* compute new acceleration search direction */
    if(num_search_directions < max_num_search_directions)
    {
      wn_gppush(conj_dir_memgp);
      wn_make_vect(&new_search_direction,num_vars);
      wn_gppop();
      for(i=num_search_directions;i>0;--i)
      {
        search_directions[i] = search_directions[i-1];
	search_direction_x0s[i] = search_direction_x0s[i-1];
	search_direction_as[i] = search_direction_as[i-1];
      }
      search_directions[0] = new_search_direction;
      search_direction_x0s[0] = 1.0;
      search_direction_as[0] = 0.0;

      ++num_search_directions;
    }
    else
    {
      new_search_direction = search_directions[max_num_search_directions-1];
      for(i=max_num_search_directions-1;i>0;--i)
      {
        search_directions[i] = search_directions[i-1];
	search_direction_x0s[i] = search_direction_x0s[i-1];
	search_direction_as[i] = search_direction_as[i-1];
      }
      search_directions[0] = new_search_direction;
      search_direction_x0s[0] = 1.0;
      search_direction_as[0] = 0.0;
    }

    for(j=0;j<num_vars;++j)
    {
      new_search_direction[j] = vect[j] - old_vect[j];
    }
  }

finish: ;

  force_optimize_stop_flag = FALSE;
  last_line_function_x_valid = FALSE;

  wn_gppush(conj_dir_memgp);
  wn_gpfree();
}
