#include<stdio.h>
#include<ctype.h>
#include<stdlib.h>
#include<pigpio.h>

/*
*  Takes all pin numbers and set them all
*  to the same pwm value. This code only works
*  on pins, capable on hardware PWM like:
*  BCM (wPi):
     PWM0: 12 (26) & 18 (1)
     PWM1: 13 (23)
*  Last argument is pwm_val( 0 (full on) - 1000000 (off) )
*/

int main (int argc, char* args[])
{

        int i, j, val;
        int GPIO[argc-2];

#ifdef DEBUG
        printf("Argcounter = %d\n\n",argc);
#endif

// Check: input is a number - atleast more then 1 argument
        if(argc>1)
	{
                for(j=1; j<argc; j++)
                        for(i=0; i<sizeof(args[j]);i++)
                                if(!isdigit(args[j][0]))
                                {
                                        printf("arg %d is not a digit\n\n", j);
                                        return 1;
                                }
	}
        else return 1;

	if(gpioInitialise()<0)
	{
		printf("\nInitialization error\b ABORT!\n\n");
		return 1;
	}

        // Check for invalid pinnummers
        for(i=1; i<argc-1; i++)
        {
                GPIO[i-1] = atoi(args[i]);
                if(GPIO[i-1]==0||GPIO[i-1]==1)
                {
                        printf("Pinnumber %d not supported\n\n", GPIO[i-1]);
                        return 1;
                }
	}
	val = atoi(args[i]);


	for(i=0; i<sizeof(GPIO)/sizeof(int); i++)
	{
  		gpioHardwarePWM(GPIO[i], 25000, val);
	}
	return 0;
}
