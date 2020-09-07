#include<softPwm.h>
#include<stdio.h>
#include<ctype.h>
#include<stdlib.h>
#include<wiringPi.h>

#define DIFF 27 // 25 pulses for differential mesuerement
#define TEMP 26 // 26 pulsesn for IC-temp
#define MS_PAUSE 500 // 500 ms pause between mesuerements

void puls(int pin, int us_delay)
{
//	int i;
	digitalWrite(pin, HIGH);
	delayMicroseconds(us_delay);
	digitalWrite(pin, LOW);
	delayMicroseconds(us_delay);
}




int main (int argc, char* args[])
{

        int i, j;
        int GPIO[argc-1];

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


        // Setup of wiringPi (before using pinMode), return if setup goes wrong
        if(wiringPiSetup())
        {
                printf("wiringPiSetup Error\n\n");
                return 1;
        }

        // Check for invalid pinnummers
        for(i=1; i<argc; i++)
        {
                GPIO[i-1] = atoi(args[i]);
                if(GPIO[i-1]==30||GPIO[i-1]==31)
                {
                        printf("Pinnumber %d not supported\n\n", GPIO[i-1]);
                        return 1;
                }
	}

	// Code starts here //



	// assign pinMode
	for(i=0; i<sizeof(GPIO)/sizeof(int); i++)
	{
  		pinMode(GPIO[i], OUTPUT);
//		softPwmCreate(GPIO[i], 1, 100);
	}


	while(TRUE)
	{
		// start high
		digitalWrite(GPIO[0], LOW);
		delay(MS_PAUSE);
		for(i=0; i<DIFF; i++)
			puls(GPIO[0], 10);
	}
	return 0;
}
