#include <iostream>
using namespace std;

int fact(int num){
    int r = 1;
    for(int i = num; i > 0; i--){
        r *= i;
    }
    return r;
}

int main() {
    int num;
    cout << "Enter Number: ";
    cin >>  num;

    if(num < 0) {
       cout << "Invalid number" << endl;
       return 0;
    }

    cout << "Factorial of " << num << " is " << fact(num);

    return 0;
}
