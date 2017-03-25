/****************************************************************************

COPYRIGHT NOTICE:

  The source code in this directory is provided free of
  charge to anyone who wants it.  It is in the public domain
  and therefore may be used by anybody for any purpose.  It
  is provided "AS IS" with no warranty of any kind
  whatsoever.  For further details see the README files in
  the wnlib parent directory.

AUTHOR:

  Will Naylor, Bill Chapman

****************************************************************************/
#ifndef wnasrtH
#define wnasrtH


#include <stdio.h>
#include "wnlib.h"


#if defined(linux) || defined(__linux__)
# define wn_assert_get_string(expr)	__STRING(expr)
#else
# if defined(__STDC__) || defined(WN_WINDOWS)
    /*   the || WN_WINDOWS is because MSVC++ 4.0 doesn't define __STDC__,
    ** yet the preprocessor behaves like __STDC__ */
#   define wn_assert_get_string(expr)	#expr
# else
#   define wn_assert_get_string(expr)	"expr"
# endif
#endif


#if defined(linux) || defined(__linux__)
# if defined(__cplusplus) ? __GNUC_PREREQ (2, 6) : __GNUC_PREREQ (2, 4)
#   define   wn_assert_function_name	__PRETTY_FUNCTION__
# else
#   if defined __STDC_VERSION__ && __STDC_VERSION__ >= 199901L
#     define wn_assert_function_name	__func__
#   else
#     define wn_assert_function_name	NULL
#   endif
# endif
#else
# define     wn_assert_function_name	NULL
#endif


#define wn_assert(_cond) \
  ((void) ((_cond) ? (void)0 : wn_assert_routine_func_exp(__FILE__, \
  /**/	__LINE__, wn_assert_function_name, wn_assert_get_string(_cond))))

#define wn_assert_notreached()  wn_assert_notreached_routine_func(__FILE__, \
/**/					__LINE__, wn_assert_function_name)

#define wn_assert_warn(_cond) \
  ((void) ((_cond) ? (void) 0 : wn_assert_warn_routine_func_exp(__FILE__, \
  /**/	__LINE__, wn_assert_function_name, wn_assert_get_string(_cond))))

#define wn_assert_warn_notreached() \
  wn_assert_warn_notreached_r_func(__FILE__, __LINE__, \
  /**/						wn_assert_function_name)

#ifdef WN_FAST
# define wn_fast_assert(_cond)			((void) TRUE)
# define wn_fast_assert_notreached()		((void) TRUE)
# define wn_fast_assert_warn(_cond)		((void) TRUE)
# define wn_fast_assert_warn_notreached()	((void) TRUE)
#else
# define wn_fast_assert(_cond)			wn_assert(_cond)
# define wn_fast_assert_notreached()		wn_assert_notreached()
# define wn_fast_assert_warn(_cond)		wn_assert_warn(_cond)
# define wn_fast_assert_warn_notreached()	wn_assert_warn_notreached()
#endif


WN_EXTERN_BEGIN

extern void wn_abort(void) WN_NORETURN;

extern void wn_set_assert_print
(
  void (*passert_print)(const char string[])
);
extern void wn_default_assert_print(const char string[]);

extern void wn_set_assert_custom_print
(
 void (*passert_custom_print)(const char file_name[], int line_num,
			      const char *func_name, const char *exp_string,
			      wn_bool warn_only, wn_bool notreached)
);
extern void wn_default_assert_custom_print(const char file_name[], 
			      int line_num, const char *func_name, 
                              const char *exp_string,
			      wn_bool warn_only, wn_bool notreached);

extern void wn_set_assert_crash
(
  void (*passert_crash)(void)
);
extern void wn_default_assert_crash(void);

extern void wn_assert_routine(const char file_name[],int line_num) WN_NORETURN;

extern void wn_assert_notreached_routine(const char file_name[],
/**/						int line_num) WN_NORETURN;

extern void wn_assert_warn_routine(const char file_name[], int line_num);

extern void wn_assert_warn_notreached_r(const char file_name[],int line_num);


extern void wn_assert_routine_func_exp(const char file_name[], int line_num,
/**/		const char *func_name, const char *exp_string) WN_NORETURN;

extern void wn_assert_notreached_routine_func(const char *file_name,
/**/			int line_num, const char *func_name) WN_NORETURN;

extern void wn_assert_warn_routine_func_exp(const char file_name[],
/**/	int line_num, const char *func_name, const char *exp_string);

extern void wn_assert_warn_notreached_r_func(const char file_name[],
/**/				int line_num, const char *func_name);

extern void wn_get_assert_override_string(char *output_buffer,
/**/				const char *file_name, int line_num);

WN_EXTERN_END

#endif
