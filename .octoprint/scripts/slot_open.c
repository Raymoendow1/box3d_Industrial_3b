#include<stdio.h>
#include<ctype.h>
#include<stdlib.h>
#include<wiringPi.h>

#define DEBUG
#define SLOT_PIN 0
#define LATCH_PIN 1


int main(int argc, char *args[])
{
	unsigned int i, j, milsec;
	int GPIO=SLOT_PIN;

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


	// Setup of wiringPi (before using pinMode), return if setup goes wrong
	if(wiringPiSetup())
	{
		printf("wiringPiSetup Error\n\n");
		return 1;
	}

	// Check for invalid pinnummers
	if(argc>1)
		for(i=1; i<argc; i++)
		{
			GPIO = atoi(args[i]);
			if(GPIO==30||GPIO==31)
			{
				printf("Pinnumber %d not supported\n\n", GPIO);
				return 1;
			}
		}

	pinMode(GPIO, OUTPUT);
	pinMode(LATCH_PIN, INPUT);
	pullUpDnControl (LATCH_PIN, PUD_UP);

	printf("Latch state = %d\n\n",digitalRead(LATCH_PIN));
	digitalWrite(GPIO, HIGH);
	// als millis overflowt, gebruik een andere waarde
	milsec= (millis()<(millis()+5000))? millis(): millis()-5000;
	while(digitalRead(LATCH_PIN)&&(milsec+5000 > millis()))
	{
		printf("ms = %d\n", millis());
		delay(500);
	};
	digitalWrite(GPIO, LOW);
	printf("Latch state = %d\n\n",digitalRead(LATCH_PIN));
	return 0;
}

