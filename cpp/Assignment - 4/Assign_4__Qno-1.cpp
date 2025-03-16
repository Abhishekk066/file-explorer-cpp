#include <iostream>
using namespace std;

void evenOdd(int num){
    if(num % 2 == 0) {
       cout << num << " is Even Number" << endl;
    } else {
       cout << num << " is Odd Number" << endl;
    }
    cout << endl;
}

void factorial(int num) {
    int fact = 1;
    for(int i = num; i > 0; i--) {
        fact *= i;
    }
    cout << "Factorial of " << num << " is " << fact << endl << endl;
}

int main() {
    int choice, num;
    while(1){
        cout << "1. Find Even Odd" << endl;
        cout << "2. Find Factorial" << endl;
        cout << "3. Exit" << endl;
        cout << "Enter your choice: ";
        cin >> choice;
        cout << endl;

        switch(choice) {
        case 1:
            cout << "Enter Number: ";
            cin >> num;
            evenOdd(num);
            break;
        case 2:
            cout << "Enter Number: ";
            cin >> num;
            factorial(num);
            break;
        case 3:
            return 0;
            break;
        default:
            cout << "Invalid Choice, try again" << endl;
        }
    }

    return 0;
}
