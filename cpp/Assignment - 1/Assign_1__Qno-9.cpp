#include <iostream>
using namespace std;

int main() {
    int num, fact = 1;
    double sum = 0.0;

    cout << "Enter Number: ";
    cin >>  num;

    cout << "Sum Series of " << num << "th term is: " << endl;

    for(int i = 1; i <= num; i++){
       fact *= i;
       sum += 1.0/fact;
    }

    cout << sum;
    return 0;
}


